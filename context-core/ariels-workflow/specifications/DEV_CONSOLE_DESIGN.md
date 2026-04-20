# DEV CONSOLE — ДИЗАЙН-ДОКУМЕНТ
## Полная архитектура файлового доступа и Dev Console для всех ролей

**Дата:** 03.04.2026
**Статус:** DESIGN — обсуждение перед реализацией
**Связано с:** D5 (Phase 7), F1, WORKFLOW_BRAINSTORM P2+P3

---

## 1. ПРИНЦИП: КАСКАД ВИДИМОСТИ

```
OPERATOR (SSH) — видит ВСЁ
    │
    │ конфигурирует SYSTEM_HIDDEN_PATHS
    │ (скрытые от всех в Dev Console)
    │
    ▼
SUPER ADMIN (TOTP /admin) — видит всё кроме SYSTEM_HIDDEN
    │
    │ назначает Admin'ам:
    │ - capability: dev_console (доступ к табу)
    │ - path presets (какие директории видит Admin)
    │
    ▼
ADMIN (token /dashboard) — видит файлы по своим read_paths
    │
    │ назначает Worker'ам:
    │ - read_paths (что worker видит)
    │ - write_paths (что worker может редактировать)
    │
    ▼
WORKER (token /dashboard) — видит ТОЛЬКО свои read_paths
    Редактирует ТОЛЬКО write_paths → ВСЕ writes → pull-pool PR
```

**Ключевой принцип:** "No access = doesn't exist"
Если у тебя нет доступа к директории — ты не знаешь что она существует.
File tree рендерит ТОЛЬКО то, что `matchesGlob(path, role.read_paths)` возвращает true.

---

## 2. УРОВНИ СКРЫТЫХ ПУТЕЙ

### Level 0: ALWAYS HIDDEN (все роли в Dev Console, включая Super Admin)
Эти пути НИКОГДА не показываются в Dev Console. Доступ только через SSH.

```typescript
const ALWAYS_HIDDEN = [
  'node_modules',
  '.next',
  '.git',
  '.env',
  '.env.local',
  '.env.production',
  'ecosystem.config.js',    // PM2 config содержит парсинг .env.local
  '.iam/',                   // будущее — operator-only конфиг
  'package-lock.json',       // не нужен в Dev Console
];
```

### Level 1: SYSTEM PATHS (видит Super Admin, скрыт от Admin/Worker если нет explicit access)
Эти пути видны Super Admin по дефолту, но Admin/Worker видят только если явно указаны в read_paths.

```typescript
const SYSTEM_PATHS = [
  'memory/TEAM_ROLES.md',     // содержит token hashes
  'memory/RULES.md',          // locked by system
  'scripts/',                  // deployment scripts
  'bootstrap-prompts/',        // system prompts
  'logs/',                     // показываются через Logs tab, не через file tree
  'data/',                     // structured data, managed by system
];
```

### Level 2: CONFIGURABLE (Super Admin → Admin через presets)
Super Admin выбирает preset для Admin'а, определяющий его read_paths:

```
PRESET: "Full Dev"
  read_paths: ["app/*", "lib/*", "src/*", "public/*", "memory/*", "goals.json"]
  write_paths: ["app/*", "lib/*", "src/*", "public/*"]

PRESET: "Frontend Only"
  read_paths: ["app/*", "public/*", "styles/*"]
  write_paths: ["app/components/*", "app/styles/*", "public/*"]

PRESET: "Content Manager"
  read_paths: ["content/*", "public/images/*", "memory/SYSTEM_IDENTITY.md"]
  write_paths: ["content/*", "public/images/*"]

PRESET: "Read Only"
  read_paths: ["app/*", "memory/*"]
  write_paths: []  // всё через pull-pool
```

### Level 3: PER-USER (Admin → Worker)
Admin назначает worker'у конкретные paths через Team tab.
Текущая реализация уже работает через TEAM_ROLES.md.

---

## 3. ГДЕ ХРАНИТСЯ КОНФИГУРАЦИЯ СКРЫТЫХ ПУТЕЙ

### Вариант A: В коде (constants)
```typescript
// app/api/dashboard/lib/dev-console-config.ts
export const ALWAYS_HIDDEN = [...];
export const SYSTEM_PATHS = [...];
export const PATH_PRESETS = {...};
```
**Плюс:** Простота, нет лишних файлов.
**Минус:** Operator не может менять без деплоя.

### Вариант B: В конфиг-файле
```
// .iam/console-config.yaml (или memory/CONSOLE_CONFIG.md)
always_hidden: [...]
system_paths: [...]
presets: {...}
```
**Плюс:** Operator может менять через SSH.
**Минус:** Ещё один файл для парсинга.

### ✅ РЕКОМЕНДАЦИЯ: Вариант A на первом этапе
ALWAYS_HIDDEN и SYSTEM_PATHS — это security, менять их на лету опасно.
PATH_PRESETS — тоже вначале статичные, потом через Capabilities Editor.

---

## 4. КАК ФИЛЬТРУЕТСЯ FILE TREE

Текущий `list-dir` в admin GET handler возвращает ВСЁ (только скрывает `.`, `node_modules`, `.next`).
Нужен новый handler `dev-list-dir` в dashboard API, который:

```typescript
async function handleDevListDir(body: RequestBody, role: ResolvedRole) {
  const dirPath = String(body.path || '.');
  
  // 1. Check: имеет ли role право видеть этот путь?
  if (!canAccessPath(dirPath, role)) {
    return json({ error: 'Access denied' }, 403);
  }
  
  // 2. Читаем реальную файловую систему
  const items = await readdir(safePath(dirPath), { withFileTypes: true });
  
  // 3. Фильтруем по правам
  const filtered = items
    .filter(item => {
      const fullPath = dirPath === '.' ? item.name : `${dirPath}/${item.name}`;
      
      // Always hidden
      if (ALWAYS_HIDDEN.some(h => item.name === h || fullPath.startsWith(h))) return false;
      if (item.name.startsWith('.')) return false;
      
      // System paths: видит только Super Admin
      if (!role.isSuperAdmin && SYSTEM_PATHS.some(sp => fullPath.startsWith(sp))) {
        // Admin/Worker: видит только если явно в read_paths
        return matchesGlob(fullPath + (item.isDirectory() ? '/' : ''), role.read_paths);
      }
      
      // Для директории: есть ли хоть один read_path внутри неё?
      if (item.isDirectory()) {
        return hasAnyAccessInside(fullPath, role.read_paths);
      }
      
      // Для файла: прямая проверка read_paths
      return matchesGlob(fullPath, role.read_paths);
    })
    .map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'dir' : 'file',
      path: dirPath === '.' ? item.name : `${dirPath}/${item.name}`,
      canEdit: canEditPath(
        dirPath === '.' ? item.name : `${dirPath}/${item.name}`, 
        role
      ),
    }));
  
  return json({ items: filtered, path: dirPath });
}

// Проверяет есть ли ЛЮБОЙ допустимый путь внутри директории
function hasAnyAccessInside(dirPath: string, readPaths: string[]): boolean {
  for (const pattern of readPaths) {
    if (pattern === '*') return true;
    if (pattern.startsWith(dirPath + '/') || pattern.startsWith(dirPath + '/*')) return true;
    // "app/*" даёт доступ к app/ и всему внутри
    const patternDir = pattern.endsWith('/*') ? pattern.slice(0, -2) : pattern;
    if (patternDir.startsWith(dirPath) || dirPath.startsWith(patternDir)) return true;
  }
  return false;
}

function canEditPath(path: string, role: ResolvedRole): boolean {
  if (role.isSuperAdmin) return !isProtectedFile(path);
  return matchesGlob(path, role.write_paths) && !isProtectedFile(path);
}

function isProtectedFile(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.includes('.env') || lower === 'memory/rules.md' || lower === 'ecosystem.config.js';
}
```

### Визуализация что видит каждая роль:

```
Реальная структура:          Super Admin видит:       Developer видит:
.                            .                        .
├── .env.local              (скрыто)                 (скрыто)
├── .git/                   (скрыто)                 (скрыто)  
├── .next/                  (скрыто)                 (скрыто)
├── ecosystem.config.js     (скрыто)                 (скрыто)
├── node_modules/           (скрыто)                 (скрыто)
├── app/                     app/                     app/
│   ├── admin/               ├── admin/              (скрыто — нет в read_paths)
│   ├── api/                 ├── api/                 ├── api/
│   ├── dashboard/           ├── dashboard/           ├── dashboard/
│   └── page.tsx             └── page.tsx             └── page.tsx
├── memory/                  memory/                  memory/
│   ├── RULES.md             ├── RULES.md 🔒          ├── RULES.md 🔒
│   ├── TEAM_ROLES.md        ├── TEAM_ROLES.md        (скрыто — SYSTEM_PATH)
│   ├── ARCHITECTURE.md      ├── ARCHITECTURE.md      ├── ARCHITECTURE.md
│   └── workers/             └── workers/             (скрыто)
├── data/                    data/                    (скрыто — SYSTEM_PATH)
├── scripts/                 scripts/                 (скрыто — SYSTEM_PATH)
├── pull-pool/              (через Pull Pool tab)    (через Pull Pool tab)
├── logs/                   (через Logs tab)         (скрыто)
├── goals.json               goals.json               goals.json
└── IDEAS/                   IDEAS/                   (если в read_paths)
```

---

## 5. UI КОМПОНЕНТ: DashboardDevConsoleTab.tsx

### Копируем из AdminDevConsoleTab.tsx, адаптируем:

**Что остаётся как есть:**
- CodeMirror editor (все imports, setup, key bindings)
- File tree recursive rendering
- Resizable panels (left drag, git resize)
- Context menu base structure

**Что меняется:**

| Фича | Admin | Worker |
|-------|-------|--------|
| File tree | Всё кроме ALWAYS_HIDDEN | Только read_paths |
| Edit mode | Прямой write | → pull-pool PR |
| Save button | 💾 Save (direct) | 📤 Submit as PR |
| Delete | ✅ (кроме protected) | ❌ нет |
| Git History | Полный + Rollback | Только просмотр (если есть capability) |
| Git Snapshot | ✅ | ❌ |
| Context menu: New File | ✅ | ❌ |
| Context menu: Delete | ✅ | ❌ |
| Code Reference | ✅ (опционально) | ✅ (основная фича) |
| Deploy button | ✅ (если capability) | ❌ |

### Новая фича: Code Reference

**Когда юзер выделяет строки в CodeMirror:**
Появляется floating toolbar с опциями:

```
┌─────────────────────────────────────────────┐
│  📎 Reference lines 45-62 of route.ts       │
│                                              │
│  [📨 Message Admin]  [📋 Copy Prompt]        │
│  [📝 Add to PR]                              │
└─────────────────────────────────────────────┘
```

**1. "📨 Message Admin":**
Открывает inline textarea → отправляет structured message:
```json
{
  "to": "admin",
  "topic": "Code Reference: app/api/mcp/route.ts:45-62",
  "body": "📎 File: app/api/mcp/route.ts, lines 45-62\n[code snippet preview — первые 10 строк]\n\n💬 {user comment}",
  "type": "code-reference"
}
```

**2. "📋 Copy AI Prompt":**
Копирует в clipboard:
```
Read file app/api/mcp/route.ts, focus on lines 45-62.
Context: {user comment}

Current code (lines 45-62):
```typescript
{selected code}
```

Task: {user fills in or leaves empty}
```

**3. "📝 Add to PR":**
Если worker уже редактирует файл, добавляет reference в PR description.

---

## 6. API ENDPOINTS (Dashboard)

### Новые actions для dashboard route:

```typescript
// capability-gate.ts additions:
'dev-list-dir':       'dev_console',   // новая capability
'dev-read-file':      'dev_console',
'dev-save-file':      'dev_console',   // admin: direct, worker: → PR
'dev-git-log':        'dev_console',
'dev-code-reference': 'dev_console',   // отправка code reference message
```

### Новая capability: `dev_console`
Добавляется в систему capabilities. Super Admin назначает Admin'ам.
Worker'ы: если у worker'а есть `dev_console` capability — он видит таб.
По дефолту: developer = да, marketer = нет, reviewer = read-only.

### Handler pseudo-code:

```typescript
// dev-handlers.ts (новый файл)

async function handleDevListDir(body, role) {
  // filter by role.read_paths + ALWAYS_HIDDEN + SYSTEM_PATHS
  // return { items: [...], path: '.' }
}

async function handleDevReadFile(body, role) {
  const path = body.path;
  if (!matchesGlob(path, role.read_paths)) return error('Access denied');
  if (isAlwaysHidden(path)) return error('Access denied');
  const content = await readFile(safePath(path), 'utf-8');
  return json({ content, path, canEdit: canEditPath(path, role) });
}

async function handleDevSaveFile(body, role) {
  const { path, content } = body;
  
  if (role.isSuperAdmin || role.isAdmin) {
    // Direct write (same as admin panel)
    if (!matchesGlob(path, role.write_paths)) return error('Write access denied');
    await writeFile(safePath(path), content);
    return json({ ok: true, method: 'direct' });
  } else {
    // Worker → create PR in pull-pool
    const prId = createPullPoolEntry(role, path, content, body.description || '');
    return json({ ok: true, method: 'pull-pool', prId });
  }
}

async function handleDevGitLog(body, role) {
  // Same as admin git-log, but no rollback for workers
  const commits = getGitLog(20);
  return json({ 
    commits, 
    canRollback: role.isSuperAdmin || role.capabilities.includes('deploy')
  });
}
```

---

## 7. CAPABILITY PRESETS UPDATE

Обновить ROLE_PRESETS чтобы включить dev_console:

```typescript
const ROLE_PRESETS = {
  developer: {
    tools: ['read_file', 'write_file', 'patch_file', 'list_directory', 
            'read_memory', 'search_files', 'my_workspace', 'create_pr', 
            'onboard', 'list_goals', 'send_message', 'add_comment'],
    capabilities: ['dev_console'],  // ← NEW
    read_paths: ['memory/*', 'tasks/*', 'messages/*', 'pull-pool/*', 
                 'app/*', 'lib/*', 'src/*'],
    write_paths: ['pull-pool/*'],
  },
  marketer: {
    tools: ['read_file', 'write_file', 'list_directory', 'read_memory',
            'my_workspace', 'create_pr', 'onboard', 'list_goals', 'send_message'],
    capabilities: [],  // no dev_console by default
    read_paths: ['memory/*', 'tasks/*', 'messages/*', 'content/*'],
    write_paths: ['pull-pool/*'],
  },
  reviewer: {
    tools: ['read_file', 'list_directory', 'read_memory', 'my_workspace',
            'onboard', 'list_goals', 'send_message', 'add_comment'],
    capabilities: ['dev_console'],  // read-only console
    read_paths: ['memory/*', 'tasks/*', 'pull-pool/*', 'app/*'],
    write_paths: [],  // reviewer can't write
  },
  admin: {
    tools: ['read_file', 'write_file', 'patch_file', 'list_directory',
            'read_memory', 'search_files', 'delete_file', 'git_snapshot',
            'git_log', 'deploy', 'create_task', 'send_message', 'list_goals',
            'add_comment', 'create_goal', 'update_roadmap', 'update_subgoal',
            'my_workspace', 'create_pr', 'onboard'],
    capabilities: ['manage_team', 'assign_tasks', 'review_prs', 'manage_goals',
                   'view_activity', 'view_logs', 'deploy', 'dev_console'],
    read_paths: ['*'],
    write_paths: ['*'],
  },
};
```

---

## 8. ПОРЯДОК РЕАЛИЗАЦИИ

### Этап 1: Backend (API handlers) — ~1 сессия
1. Создать `app/api/dashboard/lib/dev-console-config.ts` с ALWAYS_HIDDEN, SYSTEM_PATHS
2. Создать `app/api/dashboard/lib/dev-handlers.ts` с handlers:
   - `dev-list-dir` (filtered by paths)
   - `dev-read-file` (check access)
   - `dev-save-file` (admin: direct / worker: PR)
   - `dev-git-log` (read-only for workers)
3. Подключить handlers в dashboard route.ts
4. Добавить `dev_console` в capability-gate.ts
5. git_snapshot + deploy + test

### Этап 2: Frontend (DashboardDevConsoleTab.tsx) — ~1-2 сессии
1. Скопировать AdminDevConsoleTab.tsx → DashboardDevConsoleTab.tsx
2. Заменить api/apiPost calls на dashboard API
3. Добавить permission-aware rendering:
   - File tree: items filtered by backend, canEdit badge
   - Edit button: показывать только если canEdit
   - Save → "Submit as PR" для non-admin
   - Git: hide rollback/snapshot для workers
   - Context menu: filter by permissions
4. Подключить в dashboard page.tsx как новый таб
5. Добавить capability gate: таб видим только с `dev_console`
6. git_snapshot + deploy + test

### Этап 3: Code Reference System — ~1 сессия
1. Добавить selection tracking в CodeMirror (onSelectionChange)
2. Floating toolbar: detect selection → show options
3. "Message Admin" → structured message через dashboard API
4. "Copy AI Prompt" → clipboard с formatted prompt
5. "Add to PR" → integrate с PR submission flow
6. git_snapshot + deploy + test

### Этап 4: Path Presets UI (Capabilities Editor extension) — future
1. Super Admin: preset dropdown в Team tab → admin card
2. Admin: preset dropdown в Team tab → worker card  
3. Custom path editor (textarea для read_paths / write_paths)
4. Live preview: "this user will see: [tree preview]"

---

## 9. ЗАВИСИМОСТИ И РИСКИ

**Зависимости:**
- CodeMirror уже установлен (используется в AdminDevConsoleTab) — ✅ ок
- matchesGlob() уже в shared.ts — ✅ ок
- capability-gate.ts уже работает — ✅ ок
- createPullPoolEntry() уже в memory.ts — ✅ ок

**Риски:**
1. **Размер файлов:** DashboardDevConsoleTab может вырасти >500 строк → планируем write_file сразу
2. **hasAnyAccessInside() performance:** Рекурсивная проверка на каждый node → кэшировать на уровне запроса
3. **CodeMirror bundle size:** Уже загружается в /admin, нужно проверить что работает и на /dashboard
4. **TEAM_ROLES.md read_paths:** Сейчас `memory/*` не означает `memory/TEAM_ROLES.md` — проверить matchesGlob edge cases

**Решённые вопросы:**
- ✅ Права на запись non-admin → pull-pool: уже работает в MCP
- ✅ Protected files: isProtected() уже в styles.ts
- ✅ Git log: execSync уже работает в admin

---

## 10. РЕШЁННЫЕ ВОПРОСЫ (03.04.2026, обсуждение с Ariel)

### Q1: Worker write_paths в Dev Console
**РЕШЕНИЕ:** Worker ВСЕГДА пишет через pull-pool, без исключений. Кнопка "Save" = "📤 Submit as PR". Это не ограничение — это архитектурный принцип: все изменения проходят ревью.

### Q2: Бинарные файлы
**РЕШЕНИЕ:** Image preview для .png/.jpg/.gif/.webp/.svg. Для остальных бинарных — placeholder "Binary file, {size}".

### Q3: admin/components/ видимость
**ЖДЁТ АУДИТА.** Нужен полный системный аудит чтобы определить кристально чёткую матрицу "файл → кто видит → кто пишет". Промт для аудита готов.

### Q4: Git rollback
**РЕШЕНИЕ:** Rollback привязан к capability `deploy`. Кто может деплоить — может делать rollback. Это логично: rollback = откат деплоя.

**НОВОЕ ПРАВИЛО: Deploy requires fresh snapshot.**
Deploy разрешён ТОЛЬКО если последний git_snapshot не старше 5 минут. Это страховка от потери работы.
```
deploy() {
  const lastSnapshot = getLastSnapshotTime();
  if (Date.now() - lastSnapshot > 5 * 60 * 1000) {
    return error('Deploy blocked: no recent git snapshot. Run git_snapshot first.');
  }
  // proceed with deploy
}
```
Связка: git_snapshot → deploy → (если проблема) → rollback. Все три требуют одну capability.

### Q5: Лимит размера файла
**РЕШЕНИЕ:** Не обрезать файл! Если можно — lazy-load (подгружать чанками). CodeMirror поддерживает виртуализацию строк. Если файл > 1MB — показать предупреждение "Large file ({size}), may be slow" но открыть. Если файл > 5MB — отказать с предложением "Open in terminal via SSH".

### Q6: Live file updates
**РЕШЕНИЕ:** Да, файл должен обновляться автоматически. На первом этапе: polling (30 сек, как в dashboard). На будущее: SSE (Server-Sent Events).

---

## 11. СЛЕДУЮЩИЙ ШАГ: ПОЛНЫЙ СИСТЕМНЫЙ АУДИТ

Перед реализацией Dev Console нужен полный аудит проекта другим инстансом Claude Opus.
Цели:
1. Карта КАЖДОГО файла/директории с классификацией доступа
2. Баги и security holes
3. Что работает хорошо, что плохо
4. Матрица "файл → видимость → редактирование" по ролям
5. Рекомендации по hidden paths

Промт для аудита: см. отдельный документ (артефакт в чате).

---

*Design document v1.1. Обновлён 03.04.2026 после обсуждения.*
*Автор: Claude session 03.04.2026*
