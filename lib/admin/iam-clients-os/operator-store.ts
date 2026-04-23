/**
 * Operator Staging Store — iamrunning side.
 *
 * Holds pending file edits for each client, destined for atomic push.
 * Workflow:
 *
 *   1. Ariel edits files in the Files badge on iamrunning admin UI.
 *   2. Each save POSTs to /api/admin/operator/staging/save which calls
 *      saveStagedFile() here. File content lands in
 *      data/operator/staging/{client_id}/{path/to/file}.
 *   3. Review via listStagedFiles() + diff via diffStagedFile() (which
 *      fetches the current production version through the admin files
 *      read proxy — see /api/admin/operator/staging/diff).
 *   4. "Push to client" triggers:
 *        a. snapshotProduction() — pull current production copies of all
 *           staged files, save to data/operator/snapshots/{client_id}/{snap_id}/.
 *        b. iterate staged files, PUT each to client /api/operator/files.
 *        c. POST /api/operator/deploy on client.
 *        d. on deploy failure: rollbackFromSnapshot(snap_id) — restore
 *           each file from snapshot back onto client.
 *   5. History: each push appends a line to data/operator/history/{client_id}.jsonl.
 *
 * The store is file-system-backed. Scale: single-user, a few tens of
 * clients, hundreds of staged files per push max — far from any disk
 * concerns. If that changes, migrate to SQLite.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ── Paths ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const OP_DIR = path.join(PROJECT_ROOT, 'iam-clients-os', 'data', 'operator');
const STAGING_DIR = path.join(OP_DIR, 'staging');
const SNAPSHOTS_DIR = path.join(OP_DIR, 'snapshots');
const HISTORY_DIR = path.join(OP_DIR, 'history');

function ensureDir(p: string): void {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Per-client staging root — validated so client_id can't escape OP_DIR.
function stagingRoot(clientId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(clientId)) throw new Error('Invalid client_id');
  return path.join(STAGING_DIR, clientId);
}

function snapshotRoot(clientId: string, snapId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(clientId)) throw new Error('Invalid client_id');
  if (!/^[A-Za-z0-9_-]+$/.test(snapId)) throw new Error('Invalid snap_id');
  return path.join(SNAPSHOTS_DIR, clientId, snapId);
}

function historyFile(clientId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(clientId)) throw new Error('Invalid client_id');
  return path.join(HISTORY_DIR, `${clientId}.jsonl`);
}

// Validate relative path (must not escape staging root)
function resolveSafe(base: string, rel: string): string | null {
  const cleaned = rel.replace(/^\/+/, '').trim();
  if (!cleaned) return null;
  const abs = path.resolve(base, cleaned);
  const relFromBase = path.relative(base, abs);
  if (relFromBase.startsWith('..') || path.isAbsolute(relFromBase)) return null;
  return abs;
}

// ── Staging API ────────────────────────────────────────────────────────────

export interface StagedFile {
  path: string;              // relative path under the install tree
  size: number;
  savedAt: string;           // ISO timestamp of last save
  encoding: 'text' | 'base64';
}

export interface SaveResult {
  ok: true;
  file: StagedFile;
}
export interface ErrResult {
  ok: false;
  error: string;
  status: number;
}

export function saveStagedFile(
  clientId: string,
  relPath: string,
  content: string,
  encoding: 'text' | 'base64' = 'text',
): SaveResult | ErrResult {
  let root: string;
  try { root = stagingRoot(clientId); } catch (e) {
    return { ok: false, error: (e as Error).message, status: 400 };
  }

  const abs = resolveSafe(root, relPath);
  if (!abs) return { ok: false, error: 'Invalid path', status: 400 };

  try {
    ensureDir(path.dirname(abs));
    const buf = encoding === 'base64' ? Buffer.from(content, 'base64') : Buffer.from(content, 'utf8');
    fs.writeFileSync(abs, buf);

    // Also track encoding via a sidecar .meta file. Tiny JSON, one per file.
    fs.writeFileSync(abs + '.meta.json', JSON.stringify({ encoding, savedAt: new Date().toISOString() }), 'utf8');

    const stat = fs.statSync(abs);
    return {
      ok: true,
      file: {
        path: relPath.replace(/^\/+/, ''),
        size: stat.size,
        savedAt: stat.mtime.toISOString(),
        encoding,
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 500 };
  }
}

export function listStagedFiles(clientId: string): StagedFile[] {
  let root: string;
  try { root = stagingRoot(clientId); } catch { return []; }
  if (!fs.existsSync(root)) return [];

  const out: StagedFile[] = [];
  const walk = (dir: string, prefix: string) => {
    let entries: string[];
    try { entries = fs.readdirSync(dir); } catch { return; }
    for (const name of entries) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full, prefix ? `${prefix}/${name}` : name);
      } else if (stat.isFile() && !name.endsWith('.meta.json')) {
        // encoding from sidecar if present
        let encoding: 'text' | 'base64' = 'text';
        let savedAt = stat.mtime.toISOString();
        try {
          const metaRaw = fs.readFileSync(full + '.meta.json', 'utf8');
          const meta = JSON.parse(metaRaw) as { encoding?: string; savedAt?: string };
          if (meta.encoding === 'base64') encoding = 'base64';
          if (meta.savedAt) savedAt = meta.savedAt;
        } catch { /* no sidecar — OK */ }
        out.push({
          path: prefix ? `${prefix}/${name}` : name,
          size: stat.size,
          savedAt,
          encoding,
        });
      }
    }
  };
  walk(root, '');
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export function readStagedFile(clientId: string, relPath: string): { ok: true; content: string; encoding: 'text' | 'base64'; size: number } | ErrResult {
  let root: string;
  try { root = stagingRoot(clientId); } catch (e) {
    return { ok: false, error: (e as Error).message, status: 400 };
  }
  const abs = resolveSafe(root, relPath);
  if (!abs) return { ok: false, error: 'Invalid path', status: 400 };
  if (!fs.existsSync(abs)) return { ok: false, error: 'Not found in staging', status: 404 };

  let encoding: 'text' | 'base64' = 'text';
  try {
    const metaRaw = fs.readFileSync(abs + '.meta.json', 'utf8');
    const meta = JSON.parse(metaRaw) as { encoding?: string };
    if (meta.encoding === 'base64') encoding = 'base64';
  } catch { /* default text */ }

  const buf = fs.readFileSync(abs);
  return {
    ok: true,
    content: encoding === 'base64' ? buf.toString('base64') : buf.toString('utf8'),
    encoding,
    size: buf.length,
  };
}

export function discardStagedFile(clientId: string, relPath: string): { ok: true; removed: string } | ErrResult {
  let root: string;
  try { root = stagingRoot(clientId); } catch (e) {
    return { ok: false, error: (e as Error).message, status: 400 };
  }
  const abs = resolveSafe(root, relPath);
  if (!abs) return { ok: false, error: 'Invalid path', status: 400 };

  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    if (fs.existsSync(abs + '.meta.json')) fs.unlinkSync(abs + '.meta.json');
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 500 };
  }
  return { ok: true, removed: relPath };
}

export function discardAllForClient(clientId: string): { ok: true; removed_count: number } | ErrResult {
  let root: string;
  try { root = stagingRoot(clientId); } catch (e) {
    return { ok: false, error: (e as Error).message, status: 400 };
  }
  if (!fs.existsSync(root)) return { ok: true, removed_count: 0 };

  const count = listStagedFiles(clientId).length;
  try {
    fs.rmSync(root, { recursive: true, force: true });
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 500 };
  }
  return { ok: true, removed_count: count };
}

// ── Snapshot API (used by push endpoint for rollback) ──────────────────────

export interface SnapshotMeta {
  snap_id: string;
  client_id: string;
  ts: string;
  files: string[];
  push_message?: string;
}

export function createSnapshot(clientId: string, pushMessage?: string): { ok: true; snap_id: string; root: string } | ErrResult {
  const snapId = `${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')}-${crypto.randomBytes(3).toString('hex')}`;
  try {
    const root = snapshotRoot(clientId, snapId);
    ensureDir(root);

    // Write meta stub (files filled in by the caller as it fetches upstream copies)
    const meta: SnapshotMeta = {
      snap_id: snapId,
      client_id: clientId,
      ts: new Date().toISOString(),
      files: [],
      push_message: pushMessage,
    };
    fs.writeFileSync(path.join(root, '.meta.json'), JSON.stringify(meta, null, 2), 'utf8');

    return { ok: true, snap_id: snapId, root };
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 500 };
  }
}

export function writeSnapshotFile(
  clientId: string, snapId: string, relPath: string,
  content: string, encoding: 'text' | 'base64' = 'text',
): { ok: true } | ErrResult {
  let root: string;
  try { root = snapshotRoot(clientId, snapId); } catch (e) {
    return { ok: false, error: (e as Error).message, status: 400 };
  }
  const abs = resolveSafe(root, relPath);
  if (!abs) return { ok: false, error: 'Invalid path', status: 400 };

  try {
    ensureDir(path.dirname(abs));
    const buf = encoding === 'base64' ? Buffer.from(content, 'base64') : Buffer.from(content, 'utf8');
    fs.writeFileSync(abs, buf);

    // Update meta.files list
    const metaPath = path.join(root, '.meta.json');
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as SnapshotMeta;
      if (!meta.files.includes(relPath)) meta.files.push(relPath);
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    } catch {
      // meta missing — best effort
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 500 };
  }
}

// For a snapshot, store encoding per file via sidecar like staging does
export function writeSnapshotFileEncoding(
  clientId: string, snapId: string, relPath: string, encoding: 'text' | 'base64',
): void {
  try {
    const root = snapshotRoot(clientId, snapId);
    const abs = resolveSafe(root, relPath);
    if (!abs) return;
    fs.writeFileSync(abs + '.meta.json', JSON.stringify({ encoding }), 'utf8');
  } catch {
    // best effort
  }
}

export function readSnapshotFile(clientId: string, snapId: string, relPath: string):
  { ok: true; content: string; encoding: 'text' | 'base64' } | ErrResult {
  let root: string;
  try { root = snapshotRoot(clientId, snapId); } catch (e) {
    return { ok: false, error: (e as Error).message, status: 400 };
  }
  const abs = resolveSafe(root, relPath);
  if (!abs) return { ok: false, error: 'Invalid path', status: 400 };
  if (!fs.existsSync(abs)) return { ok: false, error: 'Not found in snapshot', status: 404 };

  let encoding: 'text' | 'base64' = 'text';
  try {
    const metaRaw = fs.readFileSync(abs + '.meta.json', 'utf8');
    const meta = JSON.parse(metaRaw) as { encoding?: string };
    if (meta.encoding === 'base64') encoding = 'base64';
  } catch { /* default text */ }

  const buf = fs.readFileSync(abs);
  return {
    ok: true,
    content: encoding === 'base64' ? buf.toString('base64') : buf.toString('utf8'),
    encoding,
  };
}

export function getSnapshotMeta(clientId: string, snapId: string): SnapshotMeta | null {
  try {
    const root = snapshotRoot(clientId, snapId);
    const metaPath = path.join(root, '.meta.json');
    if (!fs.existsSync(metaPath)) return null;
    return JSON.parse(fs.readFileSync(metaPath, 'utf8')) as SnapshotMeta;
  } catch {
    return null;
  }
}

// ── History API ────────────────────────────────────────────────────────────

export interface HistoryEntry {
  ts: string;
  type: 'push' | 'rollback' | 'snapshot';
  snap_id?: string;
  message?: string;
  files?: string[];
  deploy_ok?: boolean;
  deploy_http?: number;
  note?: string;
}

export function appendHistory(clientId: string, entry: HistoryEntry): void {
  try {
    ensureDir(HISTORY_DIR);
    const file = historyFile(clientId);
    fs.appendFileSync(file, JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // best effort — never throw
  }
}

export function readHistory(clientId: string, limit = 50): HistoryEntry[] {
  try {
    const file = historyFile(clientId);
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    const lines = raw.trimEnd().split('\n').filter(Boolean);
    const entries: HistoryEntry[] = [];
    for (const line of lines.slice(-limit).reverse()) {
      try {
        entries.push(JSON.parse(line) as HistoryEntry);
      } catch {
        // skip malformed lines
      }
    }
    return entries;
  } catch {
    return [];
  }
}

// Convenience: prune snapshots older than N (default 50) per client
export function pruneOldSnapshots(clientId: string, keep = 50): number {
  try {
    const dir = path.join(SNAPSHOTS_DIR, clientId);
    if (!fs.existsSync(dir)) return 0;
    const entries = fs.readdirSync(dir)
      .map(name => ({
        name,
        full: path.join(dir, name),
        mtime: fs.statSync(path.join(dir, name)).mtime.getTime(),
      }))
      .filter(x => fs.statSync(x.full).isDirectory())
      .sort((a, b) => b.mtime - a.mtime);

    const toPrune = entries.slice(keep);
    for (const x of toPrune) {
      fs.rmSync(x.full, { recursive: true, force: true });
    }
    return toPrune.length;
  } catch {
    return 0;
  }
}
