/**
 * POST /api/admin/operator/staging/save
 *
 * Body: { client_id, path, content, encoding? }
 *
 * Saves a file into the operator staging area for this client.
 * The file is NOT pushed to the client — that happens later via
 * POST /api/admin/operator/push.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import { saveStagedFile } from '@/lib/admin/iam-clients-os/operator-store';

export const runtime = 'nodejs';

interface SaveBody {
  client_id?: string;
  path?: string;
  content?: string;
  encoding?: 'text' | 'base64';
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({})) as SaveBody;
  if (!body.client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  if (!body.path) return NextResponse.json({ error: 'path required' }, { status: 400 });
  if (typeof body.content !== 'string') return NextResponse.json({ error: 'content required (string)' }, { status: 400 });

  const client = findClient(body.client_id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const result = saveStagedFile(client.id, body.path, body.content, body.encoding || 'text');
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ success: true, file: result.file });
}
