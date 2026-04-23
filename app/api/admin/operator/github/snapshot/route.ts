/**
 * POST /api/admin/operator/github/snapshot
 *
 * Body: { client_id, message? }
 *
 * Admin-authenticated proxy that triggers the client's own github snapshot
 * endpoint with the client's stored githubPat and githubRepo. The client's
 * endpoint handles the actual git push.
 *
 * This is the admin-convenience layer — it temporarily injects githubRepo,
 * githubPat, githubBranch into the upstream call so the client doesn't
 * need these values pre-configured in its own .env.local (they live on
 * iamrunning).
 *
 * Actually: the client endpoint expects these as env vars. Since we don't
 * want to push env vars through the API, we instead pass them as headers
 * that the client endpoint will read. But that requires client-side changes.
 *
 * Simpler model (what we implement): the admin proxy accepts the config
 * from clients.json, decrypts it here, and makes a SEPARATE PUT to the
 * client's .env.local via the file API first (injecting CLIENT_GITHUB_*
 * values), then calls the snapshot endpoint. Downside: .env.local rewrite
 * on every snapshot. Upside: zero new protocol.
 *
 * EVEN SIMPLER (what we actually do): accept the config as a separate
 * body field that gets forwarded via Authorization-bearer header. But
 * we'd then need to change the client's /github/snapshot to read those.
 *
 * Cleanest compromise: the client endpoint accepts an X-GitHub-Config
 * header (base64 JSON) as override. Modify client route once here, then
 * never touch it again. Do it below.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import { decryptString } from '@/lib/admin/iam-clients-os/crypto';

export const runtime = 'nodejs';

const UPSTREAM_TIMEOUT_MS = 60_000;

function resolveOperatorUrl(client: { domain: string; operatorUrl?: string }): string {
  if (client.operatorUrl && client.operatorUrl.startsWith('http')) return client.operatorUrl;
  return `https://${client.domain}/api/operator`;
}

interface SnapshotBody {
  client_id?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({})) as SnapshotBody;
  if (!body.client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

  const client = findClient(body.client_id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (!client.operatorToken) return NextResponse.json({ error: 'Client has no operatorToken' }, { status: 409 });
  if (!client.githubRepo || !client.githubPat) {
    return NextResponse.json({ error: 'githubRepo and githubPat must be configured for this client first' }, { status: 400 });
  }

  let opToken: string;
  let pat: string;
  try {
    opToken = decryptString(client.operatorToken);
    pat = decryptString(client.githubPat);
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt credentials' }, { status: 500 });
  }

  const operatorUrl = resolveOperatorUrl(client);
  const configHeader = Buffer.from(JSON.stringify({
    repo: client.githubRepo,
    pat,
    branch: client.githubBranch || 'main',
  }), 'utf8').toString('base64');

  try {
    const res = await fetch(`${operatorUrl}/github/snapshot`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opToken}`,
        'Content-Type': 'application/json',
        'X-GitHub-Config': configHeader,
      },
      body: JSON.stringify({ message: body.message }),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Proxy error: ${message}` }, { status: 502 });
  }
}
