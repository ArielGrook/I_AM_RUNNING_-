import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/admin/checkAdminAuth';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });
  return clearAdminSessionCookie(response);
}
