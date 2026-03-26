import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { readFile, readdir, writeFile, mkdir, stat } from 'fs/promises';
import { join, dirname, basename, resolve } from 'path';
import { execSync } from 'child_process';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const MEMORY_DIR = process.env.MEMORY_DIR || join(PROJECT_ROOT, 'memory');

function safePath(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const absolute = resolve(PROJECT_ROOT, clean);
  if (!absolute.startsWith(PROJECT_ROOT)) {
    throw new Error('Path traversal blocked');
  }
  return absolute;
}

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const action = request.nextUrl.searchParams.get('action');

  try {
    switch (action) {
      // ── List memory files ──────────────────────────────────
      case 'list': {
        const entries = await readdir(MEMORY_DIR, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.md')) {
            const filePath = join(MEMORY_DIR, entry.name);
            const s = await stat(filePath);
            files.push({
              name: entry.name,
              size: s.size,
              modified: s.mtime.toISOString(),
            });
          }
        }
        return NextResponse.json({ files });
      }

      // ── Read a file ────────────────────────────────────────
      case 'read': {
        const filePath = request.nextUrl.searchParams.get('file');
        if (!filePath) return NextResponse.json({ error: 'file param required' }, { status: 400 });
        const absolute = safePath(filePath);
        const content = await readFile(absolute, 'utf-8');
        return NextResponse.json({ content, file: filePath });
      }

      // ── YAML frontmatter dashboard ─────────────────────────
      case 'dashboard': {
        const entries = await readdir(MEMORY_DIR);
        const dashboard: Record<string, Record<string, unknown>> = {};

        for (const name of entries.filter(f => f.endsWith('.md'))) {
          const content = await readFile(join(MEMORY_DIR, name), 'utf-8');
          // Parse YAML frontmatter between ---
          const match = content.match(/^---\n([\s\S]*?)\n---/);
          if (match) {
            const yaml: Record<string, unknown> = {};
            for (const line of match[1].split('\n')) {
              const colonIdx = line.indexOf(':');
              if (colonIdx > 0) {
                const key = line.slice(0, colonIdx).trim();
                let val: unknown = line.slice(colonIdx + 1).trim();
                // Clean quotes
                if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
                  val = val.slice(1, -1);
                }
                // Parse numbers
                if (typeof val === 'string' && /^\d+$/.test(val)) {
                  val = parseInt(val, 10);
                }
                // Parse booleans
                if (val === 'true') val = true;
                if (val === 'false') val = false;
                yaml[key] = val;
              }
            }
            dashboard[name] = yaml;
          }
        }

        return NextResponse.json({ dashboard });
      }

      // ── Git log ────────────────────────────────────────────
      case 'git-log': {
        const log = execSync(
          'git log --oneline -20 --format="%h|%s|%ai"',
          { cwd: PROJECT_ROOT, encoding: 'utf-8' }
        );
        const commits = log.trim().split('\n').filter(Boolean).map(line => {
          const [hash, message, date] = line.split('|');
          return { hash, message, date };
        });
        return NextResponse.json({ commits });
      }

      default:
        return NextResponse.json({ error: 'Unknown action. Use: list, read, dashboard, git-log' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { action, file, content } = await request.json();

  try {
    switch (action) {
      // ── Save a file ────────────────────────────────────────
      case 'save': {
        if (!file || content === undefined) {
          return NextResponse.json({ error: 'file and content required' }, { status: 400 });
        }
        // Block RULES.md modification
        if (basename(file).toUpperCase() === 'RULES.MD') {
          return NextResponse.json({ error: 'RULES.md is locked and cannot be modified' }, { status: 403 });
        }
        const absolute = safePath(file);
        await mkdir(dirname(absolute), { recursive: true });
        await writeFile(absolute, content, 'utf-8');
        return NextResponse.json({ success: true, file });
      }

      // ── Deploy (restart PM2) ───────────────────────────────
      case 'deploy': {
        // nohup pattern to avoid self-kill
        execSync(
          'nohup bash -c "sleep 2 && cd ' + PROJECT_ROOT + ' && git pull && npm run build && pm2 restart iam-os" &',
          { cwd: PROJECT_ROOT }
        );
        return NextResponse.json({ success: true, message: 'Deploy started. Server will restart in ~30s.' });
      }

      // ── Git snapshot ───────────────────────────────────────
      case 'git-snapshot': {
        const msg = (typeof content === 'string' && content) ? content : `Admin snapshot ${new Date().toISOString()}`;
        execSync(`git add -A && git commit -m "${msg.replace(/"/g, '\\"')}" || true`, {
          cwd: PROJECT_ROOT, encoding: 'utf-8'
        });
        return NextResponse.json({ success: true, message: `Snapshot: ${msg}` });
      }

      default:
        return NextResponse.json({ error: 'Unknown action. Use: save, deploy, git-snapshot' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
