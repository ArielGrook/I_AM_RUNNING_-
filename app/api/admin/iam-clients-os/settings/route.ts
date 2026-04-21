/**
 * GET/POST /api/admin/iam-clients-os/settings
 *
 * Stores IAM Client OS product-level configuration as JSON at
 * `iam-clients-os/data/settings.json` (git-ignored — contains per-instance
 * data that must never enter the iamrunning.online public repo history).
 *
 * Guarded by checkAdminAuth — only admins with a valid TOTP session can
 * read or write settings.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DATA_DIR = path.join(PROJECT_ROOT, 'iam-clients-os', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// ── Defaults ────────────────────────────────────────────────────────────────
// Shape is intentionally small and additive. New fields can be appended
// without breaking existing stored files (missing fields fall back to defaults).
interface Settings {
  productVersion: string;            // e.g. "1.0.0-beta"
  defaultInstallerPort: number;      // default port written into install.sh
  defaultInstallPath: string;        // default target path on client VPS
  defaultMode: 'team' | 'solo';      // default TEAM_MODE value in .env.local
  skeletonRepo: string;              // github repo to clone on install
  operatorContactEmail: string;      // shown in client-facing READMEs
}

const DEFAULTS: Settings = {
  productVersion: '1.0.0-beta',
  defaultInstallerPort: 4742,
  defaultInstallPath: '/var/www/iam',
  defaultMode: 'team',
  skeletonRepo: 'ArielGrook/iam-client-skeleton',
  operatorContactEmail: 'iamrunning.online@gmail.com',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readSettings(): Settings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULTS };
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<Settings>;
    // Merge with defaults so missing keys fall back correctly
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeSettings(next: Settings): void {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2) + '\n', 'utf-8');
}

// Narrow + sanitize a partial payload from the client.
// Unknown fields are ignored. Types are coerced where obvious.
function sanitize(input: unknown): Partial<Settings> {
  if (!input || typeof input !== 'object') return {};
  const i = input as Record<string, unknown>;
  const out: Partial<Settings> = {};

  if (typeof i.productVersion === 'string') out.productVersion = i.productVersion.trim();
  if (typeof i.defaultInstallerPort === 'number' && Number.isFinite(i.defaultInstallerPort)) {
    const p = Math.floor(i.defaultInstallerPort);
    if (p > 0 && p < 65536) out.defaultInstallerPort = p;
  }
  if (typeof i.defaultInstallPath === 'string') out.defaultInstallPath = i.defaultInstallPath.trim();
  if (i.defaultMode === 'team' || i.defaultMode === 'solo') out.defaultMode = i.defaultMode;
  if (typeof i.skeletonRepo === 'string') out.skeletonRepo = i.skeletonRepo.trim();
  if (typeof i.operatorContactEmail === 'string') out.operatorContactEmail = i.operatorContactEmail.trim();

  return out;
}

// ── Handlers ────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const settings = readSettings();
    return NextResponse.json({ settings, defaults: DEFAULTS });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const patch = sanitize(body);
    const current = readSettings();
    const next: Settings = { ...current, ...patch };
    writeSettings(next);
    return NextResponse.json({ settings: next, saved: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
