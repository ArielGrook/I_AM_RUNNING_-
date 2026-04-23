/**
 * GET  /api/admin/operator/staging/list?client_id=X
 *   → { files: StagedFile[] }
 *
 * GET  /api/admin/operator/staging/list?client_id=X&path=rel/to/file
 *   → { content, encoding, size } — single file content
 *
 * DELETE /api/admin/operator/staging/list?client_id=X
 *   → discard ALL staged files for client
 *
 * DELETE /api/admin/operator/staging/list?client_id=X&path=rel
 *   → discard a single staged file
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import {
  listStagedFiles, readStagedFile, discardStagedFile, discardAllForClient,
} from '@/lib/admin/iam-clients-os/operator-store';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const path = url.searchParams.get('path');

  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  const client = findClient(clientId);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  if (path) {
    const result = readStagedFile(client.id, path);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({
      success: true,
      path,
      content: result.content,
      encoding: result.encoding,
      size: result.size,
    });
  }

  const files = listStagedFiles(client.id);
  return NextResponse.json({
    success: true,
    client_id: client.id,
    files,
    count: files.length,
  });
}

export async function DELETE(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const path = url.searchParams.get('path');

  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  const client = findClient(clientId);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  if (path) {
    const result = discardStagedFile(client.id, path);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, removed: result.removed });
  }

  const result = discardAllForClient(client.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, removed_count: result.removed_count });
}
