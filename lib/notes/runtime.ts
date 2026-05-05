import { promises as fs } from 'fs';
import path from 'path';
import { getNotesRoot } from '@/lib/notes/storage';

interface RuntimeNotesConfig {
  enabledForUsers: boolean;
  tenantMode: boolean;
}

const DEFAULT_CONFIG: RuntimeNotesConfig = {
  enabledForUsers: false,
  tenantMode: false,
};

export async function getRuntimeNotesConfig(): Promise<RuntimeNotesConfig> {
  const settingsPath = path.join(getNotesRoot(false), '_settings.json');
  try {
    const raw = await fs.readFile(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      enabledForUsers: Boolean(parsed.enabledForUsers),
      tenantMode: Boolean(parsed.tenantMode),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

