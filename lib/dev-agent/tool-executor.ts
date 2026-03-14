import { readFile as fsReadFile, writeFile as fsWriteFile, mkdir } from 'fs/promises';
import { resolve, relative, dirname } from 'path';
import { execSync, spawnSync } from 'child_process';

// ─────────────────────────────────────────────
// КОНФИГУРАЦИЯ
// ─────────────────────────────────────────────

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';

// Файлы/папки которые ЗАПРЕЩЕНО модифицировать (write/patch)
const BLOCKED_WRITE_PATHS = [
  'app/api/dev-agent',
  'middleware.ts',
  '.env',
  '.env.local',
  '.env.production',
  '.git',
  'node_modules',
  '.next',
  'package-lock.json',
];

// Файлы/папки которые ЗАПРЕЩЕНО читать
const BLOCKED_READ_PATHS = [
  '.env',
  '.env.local',
  '.env.production',
  '.git/objects',
];

// Папки которые исключаются из list_directory и search_files
const EXCLUDED_DIRS = [
  'node_modules',
  '.next',
  '.git',
  '.idea',
  '.cursor',
  '.continue',
];

// ─────────────────────────────────────────────
// ТИПЫ
// ─────────────────────────────────────────────

export interface ToolResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// БЕЗОПАСНОСТЬ: ВАЛИДАЦИЯ ПУТЕЙ
// ─────────────────────────────────────────────

/**
 * Резолвит относительный путь в абсолютный внутри PROJECT_ROOT.
 * Выбрасывает ошибку если путь выходит за пределы проекта.
 */
function resolveSafePath(relativePath: string): string {
  // Убрать начальный слеш если есть
  const cleaned = relativePath.replace(/^\/+/, '');
  const absolute = resolve(PROJECT_ROOT, cleaned);

  // Защита от path traversal (../../etc/passwd)
  if (!absolute.startsWith(PROJECT_ROOT)) {
    throw new Error(`Path traversal blocked: ${relativePath}`);
  }

  return absolute;
}

/**
 * Проверяет что путь не в списке заблокированных.
 * blockedList — массив путей для проверки.
 */
function checkBlocked(relativePath: string, blockedList: string[]): void {
  const cleaned = relativePath.replace(/^\/+/, '');
  for (const blocked of blockedList) {
    if (cleaned === blocked || cleaned.startsWith(blocked + '/')) {
      throw new Error(`Access denied: ${relativePath} is protected`);
    }
  }
}

// ─────────────────────────────────────────────
// ИНСТРУМЕНТЫ
// ─────────────────────────────────────────────

/**
 * Прочитать файл из проекта.
 */
async function readFile(path: string): Promise<ToolResult> {
  try {
    checkBlocked(path, BLOCKED_READ_PATHS);
    const absolute = resolveSafePath(path);
    const content = await fsReadFile(absolute, 'utf-8');
    return { success: true, data: content };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `read_file failed: ${message}` };
  }
}

/**
 * Записать содержимое в файл (создать или перезаписать).
 * Создаёт промежуточные директории если их нет.
 */
async function writeFile(path: string, content: string): Promise<ToolResult> {
  try {
    checkBlocked(path, BLOCKED_WRITE_PATHS);
    const absolute = resolveSafePath(path);

    // Создать директории если не существуют
    const dir = dirname(absolute);
    await mkdir(dir, { recursive: true });

    await fsWriteFile(absolute, content, 'utf-8');
    return { success: true, data: `Written: ${path}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `write_file failed: ${message}` };
  }
}

/**
 * Точечная замена текста в файле.
 * old_text должен быть уникальным в файле.
 * Предпочтительный способ редактирования — экономит токены.
 */
async function patchFile(
  path: string,
  oldText: string,
  newText: string
): Promise<ToolResult> {
  try {
    checkBlocked(path, BLOCKED_WRITE_PATHS);
    const absolute = resolveSafePath(path);
    const content = await fsReadFile(absolute, 'utf-8');

    // Проверить что old_text существует и уникален
    const occurrences = content.split(oldText).length - 1;
    if (occurrences === 0) {
      return { success: false, error: `patch_file: old_text not found in ${path}` };
    }
    if (occurrences > 1) {
      return {
        success: false,
        error: `patch_file: old_text found ${occurrences} times in ${path}, must be unique`,
      };
    }

    const updated = content.replace(oldText, newText);
    await fsWriteFile(absolute, updated, 'utf-8');
    return { success: true, data: `Patched: ${path}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `patch_file failed: ${message}` };
  }
}

/**
 * Показать структуру директории.
 * Исключает node_modules, .next, .git и другие служебные папки.
 */
async function listDirectory(path: string, depth: number = 2): Promise<ToolResult> {
  try {
    const absolute = resolveSafePath(path || '.');

    // Используем find с ограничением глубины и исключениями
    const excludeArgs = EXCLUDED_DIRS.map(d => `-name "${d}" -prune`).join(' -o ');
    const cmd = `find "${absolute}" -maxdepth ${depth} \\( ${excludeArgs} \\) -o -print | sort`;

    const output = execSync(cmd, {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      timeout: 10000,
    });

    // Превратить абсолютные пути в относительные
    const lines = output
      .trim()
      .split('\n')
      .map(line => relative(PROJECT_ROOT, line))
      .filter(line => line.length > 0);

    return { success: true, data: lines.join('\n') };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `list_directory failed: ${message}` };
  }
}

/**
 * Поиск текста по файлам проекта (grep).
 * Исключает node_modules, .next, .git.
 */
async function searchFiles(
  query: string,
  filePattern?: string
): Promise<ToolResult> {
  try {
    // Build grep arguments safely without shell interpolation
    const args = ['-rn'];
    
    // Add exclude directories
    for (const dir of EXCLUDED_DIRS) {
      args.push(`--exclude-dir=${dir}`);
    }
    
    // Add file pattern if provided
    if (filePattern) {
      args.push(`--include=${filePattern}`);
    }
    
    // Add query and path (no shell escaping needed with spawnSync)
    args.push(query);
    args.push(PROJECT_ROOT);

    const result = spawnSync('grep', args, {
      encoding: 'utf-8',
      timeout: 15000,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    // Handle grep output
    if (result.error) {
      throw result.error;
    }

    // grep exit code 1 means no matches found (not an error)
    if (result.status === 1 || !result.stdout) {
      return { success: true, data: 'No matches found' };
    }

    // Limit to first 50 lines and convert absolute paths to relative
    const lines = result.stdout
      .trim()
      .split('\n')
      .slice(0, 50)
      .map(line => line.replace(PROJECT_ROOT + '/', ''))
      .filter(line => line.length > 0);

    return { success: true, data: lines.join('\n') || 'No matches found' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `search_files failed: ${message}` };
  }
}

/**
 * Создать git snapshot (коммит) перед изменениями.
 * Модель ДОЛЖНА вызвать это перед первым write_file/patch_file.
 */
async function gitSnapshot(message: string): Promise<ToolResult> {
  try {
    execSync('git add -A', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 });

    // Проверить есть ли изменения для коммита
    try {
      execSync('git diff --cached --quiet', { cwd: PROJECT_ROOT, timeout: 5000 });
      // Если не выбросил ошибку — изменений нет
      return { success: true, data: 'No changes to snapshot' };
    } catch {
      // Есть изменения — коммитим
    }

    execSync(
      `git commit -m "snapshot: ${message.replace(/"/g, '\\"')}"`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 }
    );

    // Получить hash коммита
    const hash = execSync('git rev-parse --short HEAD', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();

    return { success: true, data: `Snapshot created: ${hash} — ${message}` };
  } catch (err: unknown) {
    const message_err = err instanceof Error ? err.message : String(err);
    return { success: false, error: `git_snapshot failed: ${message_err}` };
  }
}

// ─────────────────────────────────────────────
// ИСПОЛНИТЕЛЬ
// ─────────────────────────────────────────────

/**
 * Принимает имя инструмента и аргументы, вызывает соответствующую функцию.
 * Используется в цикле tool calls API route.
 */
export async function executeTool(call: ToolCall): Promise<ToolResult> {
  switch (call.name) {
    case 'read_file':
      return readFile(call.args.path as string);

    case 'write_file':
      return writeFile(call.args.path as string, call.args.content as string);

    case 'patch_file':
      return patchFile(
        call.args.path as string,
        call.args.old_text as string,
        call.args.new_text as string
      );

    case 'list_directory':
      return listDirectory(
        (call.args.path as string) || '.',
        (call.args.depth as number) || 2
      );

    case 'search_files':
      return searchFiles(
        call.args.query as string,
        call.args.file_pattern as string | undefined
      );

    case 'git_snapshot':
      return gitSnapshot(call.args.message as string);

    default:
      return { success: false, error: `Unknown tool: ${call.name}` };
  }
}

// ─────────────────────────────────────────────
// ОПРЕДЕЛЕНИЯ ИНСТРУМЕНТОВ ДЛЯ AI API
// Унифицированный формат — адаптеры переведут
// в формат конкретного провайдера (Claude/OpenAI)
// ─────────────────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    name: 'read_file',
    description: 'Read file contents from the project. Use relative paths from project root.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative path from project root, e.g. "lib/craft/components/HeroTron.tsx"',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description:
      'Write content to a file (create or overwrite). Prefer patch_file for small changes. Creates directories if needed.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative path from project root',
        },
        content: {
          type: 'string',
          description: 'Full file content to write',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'patch_file',
    description:
      'Replace a specific text fragment in a file. PREFERRED over write_file for edits — saves tokens. old_text must be unique in the file.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative path from project root',
        },
        old_text: {
          type: 'string',
          description: 'Exact text to find and replace (must be unique in file)',
        },
        new_text: {
          type: 'string',
          description: 'Text to replace with',
        },
      },
      required: ['path', 'old_text', 'new_text'],
    },
  },
  {
    name: 'list_directory',
    description: 'List files and folders in a directory. Excludes node_modules, .next, .git.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative path from project root. Use "." for root.',
        },
        depth: {
          type: 'number',
          description: 'Directory depth (default 2)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_files',
    description: 'Search for text across project files (grep). Returns matching lines with file paths.',
    parameters: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for',
        },
        file_pattern: {
          type: 'string',
          description: 'Optional glob pattern, e.g. "*.tsx" or "*.ts"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'git_snapshot',
    description:
      'Create a git commit snapshot of current state. MUST be called before the first write_file or patch_file to enable rollback.',
    parameters: {
      type: 'object' as const,
      properties: {
        message: {
          type: 'string',
          description: 'Short description of current state, e.g. "before: add hero component"',
        },
      },
      required: ['message'],
    },
  },
];
