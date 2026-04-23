/**
 * GET /api/admin/operator/files?client_id=<id-or-domain>&path=<rel>
 *
 * Admin-authenticated proxy that reaches through to the client install's
 * /api/operator/files endpoint. iamrunning admin user browses client file
 * system without exposing the client's OPERATOR_TOKEN to the browser.
 *
 * Auth:
 *   - client (browser → iamrunning): admin session cookie (checkAdminAuth)
 *   - iamrunning → client (server-to-server): Bearer <operatorToken>
 *     where operatorToken is decrypted from clients.json via revealField
 *
 * On the client record we need: domain, operatorUrl, operatorToken.
 * If operatorUrl is missing we construct it as https://<domain>/api/operator.
 *
 * Returns the client's response verbatim (same shape), with one extra
 * field: proxy_latency_ms for debugging.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import { decryptString } from '@/lib/admin/iam-clients-os/crypto';

export const runtime = 'nodejs';

const UPSTREAM_TIMEOUT_MS = 15_000;

function resolveOperatorUrl(client: { domain: string; operatorUrl?: string }): string {
  if (client.operatorUrl && client.operatorUrl.startsWith('http')) return client.operatorUrl;
  return `https://${client.domain}/api/operator`;
}

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const path = url.searchParams.get('path') || '.';

  if (!clientId) {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  }

  const client = findClient(clientId);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (!client.operatorToken) {
    return NextResponse.json(
      { error: 'Client has no operatorToken yet — waiting for first heartbeat' },
      { status: 409 }
    );
  }

  let plaintextToken: string;
  try {
    plaintextToken = decryptString(client.operatorToken);
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt operator token' }, { status: 500 });
  }

  const upstreamUrl = `${resolveOperatorUrl(client)}/files?path=${encodeURIComponent(path)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${plaintextToken}`,
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    const latency = Date.now() - startedAt;
    const text = await upstream.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        {
          error: 'Upstream returned non-JSON',
          upstream_status: upstream.status,
          upstream_body_preview: text.slice(0, 200),
          proxy_latency_ms: latency,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { ...(json as Record<string, unknown>), proxy_latency_ms: latency },
      { status: upstream.status }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const aborted = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      {
        error: aborted ? 'Upstream timeout' : `Proxy error: ${message}`,
        upstream_url: upstreamUrl,
      },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
