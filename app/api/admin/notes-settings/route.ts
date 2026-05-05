import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { getNotesRoot } from '@/lib/notes/storage';

interface NotesSettings {
  enabledForUsers: boolean;
  tenantMode: boolean;
}

const DEFAULT_SETTINGS: NotesSettings = {
  enabledForUsers: false,
  tenantMode: false,
};

function getSettingsPath() {
  return path.join(getNotesRoot(false), '_settings.json');
}

async function readSettings(): Promise<NotesSettings> {
  try {
    const raw = await fs.readFile(getSettingsPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      enabledForUsers: Boolean(parsed.enabledForUsers),
      tenantMode: Boolean(parsed.tenantMode),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const settings = await readSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const settings: NotesSettings = {
      enabledForUsers: Boolean(body.enabledForUsers),
      tenantMode: Boolean(body.tenantMode),
    };

    const settingsPath = getSettingsPath();
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[api/admin/notes-settings] update error', error);
    return NextResponse.json({ error: 'Failed to update notes settings' }, { status: 500 });
  }
}

