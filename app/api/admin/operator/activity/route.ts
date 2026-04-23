/**
 * GET /api/admin/operator/activity?client_id=X&limit=100&since_ts=ISO
 *
 * Read activity events for a client from the local JSONL store
 * (ingested via POST /api/monitor/activity).
 *
 * Returns reverse-chronological, most recent first.
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const ACTIVITY_DIR = path.join(PROJECT_ROOT, 'iam-clients-os', 'data', 'operator', 'activity');

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const limitRaw = url.searchParams.get('limit');
  const sinceTsRaw = url.searchParams.get('since_ts');
  const limit = Math.min(Math.max(parseInt(limitRaw || '100', 10) || 100, 1), 1000);

  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  const client = findClient(clientId);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const file = path.join(ACTIVITY_DIR, `${client.id}.jsonl`);
  if (!fs.existsSync(file)) return NextResponse.json({ success: true, events: [], count: 0 });

  let lines: string[];
  try {
    const raw = fs.readFileSync(file, 'utf8');
    lines = raw.trimEnd().split('\n').filter(Boolean);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Read failed: ${msg}` }, { status: 500 });
  }

  const sinceMs = sinceTsRaw ? new Date(sinceTsRaw).getTime() : 0;
  const events: Record<string, unknown>[] = [];

  // Iterate from the end (latest first). Parse each line as JSON.
  for (let i = lines.length - 1; i >= 0 && events.length < limit; i--) {
    try {
      const ev = JSON.parse(lines[i]) as Record<string, unknown>;
      if (sinceMs && ev.ts) {
        const evMs = new Date(ev.ts as string).getTime();
        if (evMs < sinceMs) break; // events are appended in order — can break
      }
      events.push(ev);
    } catch {
      // skip malformed line
    }
  }

  return NextResponse.json({ success: true, client_id: client.id, events, count: events.length });
}
