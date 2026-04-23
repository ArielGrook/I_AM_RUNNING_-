/**
 * POST /api/monitor/heartbeat
 *
 * Inbound endpoint from IAM Client OS installations. Called every ~5 minutes
 * by a cron set up in iam-client.sh step_crons. Combines registration and
 * liveness updates in a single upsert.
 *
 * Auth model — no separate MONITOR_SECRET:
 *   The client sends its OPERATOR_TOKEN (generated at install time in
 *   step_secrets, stored in its .env.local) as Bearer auth. We match that
 *   token against the encrypted operatorToken field of a client record.
 *   One credential per client, naturally rotatable via the Access badge UI
 *   when we wire it. First-heartbeat case: no existing record has this
 *   token yet → we trust the body (this is the one moment we do), create
 *   the record, and the token becomes THE credential from then on.
 *
 * Request body:
 *   {
 *     instance_id: string,          // hex, generated client-side at install
 *     domain: string,
 *     client_name?: string,         // used on first heartbeat only
 *     operator_url?: string,        // https://<domain>/api/operator
 *     operator_token?: string,      // required on first heartbeat only
 *     version: string,              // client's productVersion
 *     uptime_sec: number,
 *     status: 'ok' | 'degraded' | 'starting'
 *   }
 *
 * Response: { ok, client_id, server_ts, created }
 *
 * Rate limiting: 20 req/min per matched client (in-memory, per-process).
 * Acceptable because heartbeat cron is 5min — any client exceeding 20/min
 * is misbehaving. Returns 429.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  findClientByOperatorToken,
  upsertByHeartbeat,
  type HeartbeatBody,
} from '@/lib/admin/iam-clients-os/store';

export const runtime = 'nodejs';

// ── In-memory rate limiter (per-process; acceptable for single-instance PM2) ─
// For multi-process we'd move this to Redis or an LRU shared via PM2 cluster.
const RATE_LIMIT_PER_MIN = 20;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimitAllow(key: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_PER_MIN) return false;
  bucket.count += 1;
  return true;
}

// Periodic cleanup of expired buckets (tolerates long-running process)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitBuckets.entries()) {
    if (v.resetAt <= now) rateLimitBuckets.delete(k);
  }
}, 60_000).unref?.();

function extractBearer(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearer(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Missing Authorization: Bearer <operator_token>' },
        { status: 401 }
      );
    }

    // Rate limit key is the token itself — one bucket per client
    if (!rateLimitAllow(token)) {
      return NextResponse.json(
        { error: 'Too many heartbeats', retry_after_sec: 60 },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as HeartbeatBody;

    // Try to match the token against an existing client.
    // On FIRST heartbeat no record has this token yet → caller is null,
    // upsertByHeartbeat handles creation using body.operator_token.
    const caller = findClientByOperatorToken(token);

    // If caller exists, body.operator_token is ignored.
    // If caller is null, body.operator_token MUST match the bearer —
    // otherwise the client is trying to register one token while bearing
    // another, which is suspicious.
    if (!caller) {
      if (!body.operator_token || body.operator_token !== token) {
        return NextResponse.json(
          {
            error:
              'Unknown operator_token. For first heartbeat, include operator_token in body matching the bearer header.',
          },
          { status: 401 }
        );
      }
    }

    const result = upsertByHeartbeat(caller, body, 'monitor-heartbeat');
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      client_id: result.client_id,
      server_ts: result.server_ts,
      created: result.created,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}

// Reject non-POST explicitly so smoke tests see a clean 405, not a 404
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed. POST only.',
      hint: 'This endpoint accepts heartbeats from IAM Client OS installations.',
    },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
