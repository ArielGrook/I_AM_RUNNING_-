/**
 * GET    /api/admin/iam-clients-os/clients/[id]              → public view
 * GET    /api/admin/iam-clients-os/clients/[id]?reveal=field → decrypt one sensitive field
 * PATCH  /api/admin/iam-clients-os/clients/[id]              → update
 * DELETE /api/admin/iam-clients-os/clients/[id]              → delete
 *
 * Backed by lib/admin/iam-clients-os/store.ts (shared with MCP tools).
 * The [id] segment also accepts a domain (handled in store.ts).
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { getClientPublic, updateClient, deleteClient, revealField } from '@/lib/admin/iam-clients-os/store';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const reveal = new URL(request.url).searchParams.get('reveal');

    if (reveal) {
      const result = revealField(id, reveal, 'http');
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ id: result.id, field: result.field, plaintext: result.plaintext });
    }

    const client = getClientPublic(id);
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ client });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const result = updateClient(id, body, 'http');
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ client: result.client, updated: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const result = deleteClient(id, 'http');
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ deleted: true, id: result.id, domain: result.domain });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
