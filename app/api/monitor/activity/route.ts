/**
 * POST /api/monitor/activity
 *
 * Periodic push of recent activity events from client install → iamrunning.
 * Called by cron every 5 min from scripts/iam-activity.sh.
 *
 * Auth: Bearer OPERATOR_TOKEN (same as heartbeat).
 *
 * Body:
 *   {
 *     instance_id, domain,
 *     since_ts?: ISO string (we persist per-client cursor, optional hint)
 *     events: [{ ts, user, role, action, detail?, ... }]
 *   }
 *
 * Storage: iam-clients-os/data/operator/activity/{client_id}.jsonl
 * Append-only, one JSON per line. Admin UI filters & reads via
 * /api/admin/operator/activity.
 *
 * Rate limit: 10/min per token (activity can be chatty with backfill).
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findClientByOperatorToken } from '@/lib/admin/iam-clients-os/store';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const ACTIVITY_DIR = path.join(PROJECT_ROOT, 'iam-clients-os', 'data', 'operator', 'activity');

// Same shape pattern as heartbeat rate limiter
const RATE_LIMIT_PER_MIN = 10;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimitAllow(key: string): boolean {
  const now = Date.now();
  const b = rateLimitBuckets.get(key);
  if (!b || b.resetAt <= now) { rateLimitBuckets.set(key, { count: 1, resetAt: now + 60_000 }); return true; }
  if (b.count >= RATE_LIMIT_PER_MIN) return false;
  b.count += 1; return true;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of rateLimitBuckets.entries()) if (v.resetAt <= now) rateLimitBuckets.delete(k); }, 60_000).unref?.();

function extractBearer(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? m[1].trim() : null;
}

interface ActivityEvent {
  ts?: string;
  user?: string;
  role?: string;
  action?: string;
  detail?: string;
  [k: string]: unknown;
}

interface ActivityBody {
  instance_id?: string;
  domain?: string;
  since_ts?: string;
  events?: ActivityEvent[];
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearer(request);
    if (!token) return NextResponse.json({ error: 'Missing Bearer token' }, { status: 401 });

    if (!rateLimitAllow(token)) {
      return NextResponse.json({ error: 'Too many activity uploads', retry_after_sec: 60 }, { status: 429 });
    }

    const caller = findClientByOperatorToken(token);
    if (!caller) return NextResponse.json({ error: 'Unknown operator_token' }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as ActivityBody;
    const events = Array.isArray(body.events) ? body.events : [];
    if (events.length === 0) {
      return NextResponse.json({ ok: true, written: 0 });
    }

    // Append each event as JSONL line to per-client file
    if (!fs.existsSync(ACTIVITY_DIR)) fs.mkdirSync(ACTIVITY_DIR, { recursive: true });
    const file = path.join(ACTIVITY_DIR, `${caller.id}.jsonl`);

    const now = new Date().toISOString();
    let written = 0;
    const lines: string[] = [];
    for (const ev of events) {
      // Stamp received_at and normalize minimal fields
      lines.push(JSON.stringify({
        ...ev,
        ts: ev.ts || now,
        received_at: now,
      }));
      written++;
    }
    fs.appendFileSync(file, lines.join('\n') + '\n', 'utf8');

    return NextResponse.json({ ok: true, written, client_id: caller.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. POST only.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
