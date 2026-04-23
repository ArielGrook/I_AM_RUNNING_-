/**
 * GET /api/admin/operator/history?client_id=X&limit=50
 *
 * Returns reverse-chronological push/rollback history for a client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import { readHistory } from '@/lib/admin/iam-clients-os/operator-store';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const limitRaw = url.searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitRaw || '50', 10) || 50, 1), 500);

  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  const client = findClient(clientId);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const entries = readHistory(client.id, limit);
  return NextResponse.json({ success: true, client_id: client.id, entries, count: entries.length });
}
