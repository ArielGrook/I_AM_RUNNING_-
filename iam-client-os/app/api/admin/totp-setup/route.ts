import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require('@otplib/preset-default');

export async function GET() {
  const secret = process.env.TOTP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'TOTP not configured' }, { status: 500 });
  }

  const clientName = process.env.NEXT_PUBLIC_CLIENT_NAME || 'IAM-OS';
  const label = `IAM-OS (${clientName})`;
  const otpauthUri = authenticator.keyuri(clientName, 'I AM RUNNING', secret);

  // Generate QR code as SVG using Google Charts API URL
  // Client-side will render this via an img tag pointing to QR API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}`;

  return NextResponse.json({
    qrUrl,
    secret, // Show secret for manual entry
    label,
  });
}
