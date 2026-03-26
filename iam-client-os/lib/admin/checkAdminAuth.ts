/**
 * Server-side admin auth check for iam-client-os.
 * Ported from I AM RUNNING, simplified.
 *
 * Flow:
 *   1. User submits TOTP → verify-totp sets httpOnly cookie `admin_token`
 *   2. Every admin API route calls checkAdminAuth(request)
 *   3. If cookie missing or invalid → 401
 */
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN_COOKIE = 'admin_token';
const ADMIN_TOKEN_MAX_AGE = 60 * 60 * 8; // 8 hours

function getExpectedToken(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET;
}

export function setAdminSessionCookie(response: NextResponse): NextResponse {
  const secret = getExpectedToken();
  if (!secret) return response;

  response.cookies.set(ADMIN_TOKEN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_TOKEN_MAX_AGE,
    path: '/',
  });
  return response;
}

export function clearAdminSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}

export function checkAdminAuth(request: NextRequest): NextResponse | null {
  const expected = getExpectedToken();
  if (!expected) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
  }

  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
