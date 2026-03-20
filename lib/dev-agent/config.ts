import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const CONFIG_PATH = join(PROJECT_ROOT, '.dev-agent-config.json');

export interface DevAgentConfig {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  deepseekApiKey?: string;
  githubToken?: string;
  githubRepo?: string;
  developerUserId?: string;
  mcpAuthToken?: string;
}

const DEFAULT_CONFIG: DevAgentConfig = {
  anthropicApiKey: '',
  openaiApiKey: '',
  geminiApiKey: '',
  deepseekApiKey: '',
  githubToken: '',
  githubRepo: '',
  developerUserId: '',
  mcpAuthToken: '',
};

export async function loadConfig(): Promise<DevAgentConfig> {
  try {
    const content = await readFile(CONFIG_PATH, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: Partial<DevAgentConfig>): Promise<DevAgentConfig> {
  const current = await loadConfig();
  const updated = { ...current, ...config };

  // Не сохранять пустые строки поверх существующих значений
  // (если поле пришло как пустая строка и уже есть значение — не затирать)
  for (const key of Object.keys(config) as (keyof DevAgentConfig)[]) {
    if (config[key] === '' && current[key] && current[key] !== '') {
      updated[key] = current[key];
    }
  }

  await writeFile(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

/**
 * Возвращает конфиг с замаскированными ключами для отображения в UI.
 * Показывает только последние 8 символов.
 */
export function maskConfig(config: DevAgentConfig): DevAgentConfig {
  const mask = (val?: string): string => {
    if (!val || val.length < 12) return val ? '••••' : '';
    return '••••••••' + val.slice(-8);
  };

  return {
    anthropicApiKey: mask(config.anthropicApiKey),
    openaiApiKey: mask(config.openaiApiKey),
    geminiApiKey: mask(config.geminiApiKey),
    deepseekApiKey: mask(config.deepseekApiKey),
    githubToken: mask(config.githubToken),
    githubRepo: config.githubRepo, // repo URL не секретный
    developerUserId: config.developerUserId, // UUID не секретный
  };
}
