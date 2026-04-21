/**
 * GET    /api/admin/iam-clients-os/clients         → list all
 * POST   /api/admin/iam-clients-os/clients         → create new
 *
 * Backed by lib/admin/iam-clients-os/store.ts (shared with MCP tools).
 * Storage at iam-clients-os/data/clients.json (gitignored).
 * Sensitive fields are encrypted at rest; never returned in plaintext here.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { listClients, createClient } from '@/lib/admin/iam-clients-os/store';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const clients = listClients();
    return NextResponse.json({ clients, count: clients.length });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => ({}));
    const result = createClient(body, 'http');
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ client: result.client, created: true }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
