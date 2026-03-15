import { NextRequest, NextResponse } from 'next/server';
import * as OTPLib from 'otplib';
const authenticator = OTPLib.authenticator || (OTPLib as any).default?.authenticator;

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

// In-memory store (resets on server restart)
const attempts: Record<string, { count: number; lockUntil?: number }> = {};

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token required' }, { status: 400 });
  }

  // Check lockout
  const record = attempts[ip] || { count: 0 };
  if (record.lockUntil && Date.now() < record.lockUntil) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, error: 'TOTP not configured' }, { status: 500 });
  }

  const isValid = authenticator.verify({ token, secret });

  if (isValid) {
    attempts[ip] = { count: 0 };
    return NextResponse.json({ success: true });
  }

  record.count = (record.count || 0) + 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockUntil = Date.now() + LOCK_DURATION;
  }
  attempts[ip] = record;

  return NextResponse.json({
    success: false,
    error: `Invalid code. ${MAX_ATTEMPTS - record.count} attempts remaining.`
  }, { status: 401 });
}
