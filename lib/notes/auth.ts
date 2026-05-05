import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';

export function requireNotesAuth(request: NextRequest): NextResponse | null {
  return checkAdminAuth(request);
}

