/**
 * GET /api/admin/operator/files/read?client_id=<id-or-domain>&path=<rel>
 *
 * Admin-authenticated proxy for reading a single file from a client install.
 * Passes through to client's /api/operator/files/read.
 *
 * Same auth model as /api/admin/operator/files — admin session on the
 * browser side, bearer OPERATOR_TOKEN server-to-server.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import { decryptString } from '@/lib/admin/iam-clients-os/crypto';

export const runtime = 'nodejs';

const UPSTREAM_TIMEOUT_MS = 20_000;

function resolveOperatorUrl(client: { domain: string; operatorUrl?: string }): string {
  if (client.operatorUrl && client.operatorUrl.startsWith('http')) return client.operatorUrl;
  return `https://${client.domain}/api/operator`;
}

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const path = url.searchParams.get('path');

  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

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

  const upstreamUrl = `${resolveOperatorUrl(client)}/files/read?path=${encodeURIComponent(path)}`;
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
