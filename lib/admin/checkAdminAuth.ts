/**
 * Server-side admin auth check.
 * All /api/admin/* routes must call this before doing anything.
 *
 * Flow:
 *   1. User submits TOTP → verify-totp sets httpOnly cookie `admin_token`
 *   2. Every admin API route calls checkAdminAuth(request)
 *   3. If cookie missing or invalid → 401
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_TOKEN_COOKIE = 'admin_token';
const ADMIN_TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours — operator doesn't want to re-enter TOTP on every browser session

/** Returns the expected token value from env */
function getExpectedToken(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET;
}

/**
 * Sets the admin session cookie after successful TOTP.
 * Call this from verify-totp route on success.
 */
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

/**
 * Clears the admin session cookie on logout.
 */
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

/**
 * Checks if the incoming request has a valid admin session cookie.
 * Returns null if valid, or a 401 NextResponse if not.
 *
 * Usage in any admin API route:
 *   const authError = checkAdminAuth(request);
 *   if (authError) return authError;
 */
export function checkAdminAuth(request: NextRequest): NextResponse | null {
  const expected = getExpectedToken();
  if (!expected) {
    // ADMIN_SESSION_SECRET not configured → block all access
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
  }

  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // auth OK
}
