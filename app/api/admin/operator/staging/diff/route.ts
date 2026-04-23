/**
 * GET /api/admin/operator/staging/diff?client_id=X&path=rel
 *
 * Returns side-by-side content for:
 *   - current (production): fetched from client via the existing admin
 *     files proxy (bearer operatorToken).
 *   - staged: from local staging store.
 *
 * Response:
 *   {
 *     success, path,
 *     production: { content, encoding, exists } | { exists: false, error? }
 *     staged:     { content, encoding, size }
 *   }
 *
 * The UI computes the actual line-diff — this endpoint just delivers both
 * sides verbatim.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import { readStagedFile } from '@/lib/admin/iam-clients-os/operator-store';
import { decryptString } from '@/lib/admin/iam-clients-os/crypto';

export const runtime = 'nodejs';

function resolveOperatorUrl(client: { domain: string; operatorUrl?: string }): string {
  if (client.operatorUrl && client.operatorUrl.startsWith('http')) return client.operatorUrl;
  return `https://${client.domain}/api/operator`;
}

async function fetchProduction(client: { domain: string; operatorUrl?: string; operatorToken?: string }, path: string):
  Promise<{ content: string; encoding: 'text' | 'base64'; exists: true } | { exists: false; error?: string }> {
  if (!client.operatorToken) return { exists: false, error: 'Client has no operatorToken' };
  let token: string;
  try { token = decryptString(client.operatorToken); } catch { return { exists: false, error: 'decrypt failed' }; }

  const url = `${resolveOperatorUrl(client)}/files/read?path=${encodeURIComponent(path)}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404) return { exists: false };
    if (!res.ok) return { exists: false, error: `upstream ${res.status}` };
    const data = await res.json() as { content?: string; encoding?: string };
    return {
      exists: true,
      content: data.content || '',
      encoding: data.encoding === 'base64' ? 'base64' : 'text',
    };
  } catch (err) {
    return { exists: false, error: err instanceof Error ? err.message : String(err) };
  }
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

  const staged = readStagedFile(client.id, path);
  if (!staged.ok) return NextResponse.json({ error: staged.error }, { status: staged.status });

  const production = await fetchProduction(client, path);

  return NextResponse.json({
    success: true,
    path,
    production,
    staged: {
      content: staged.content,
      encoding: staged.encoding,
      size: staged.size,
    },
  });
}
