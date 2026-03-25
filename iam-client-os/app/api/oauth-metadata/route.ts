import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Vercel rewrites request.url — use x-forwarded-host for real hostname
  const forwardedHost = request.headers.get('x-forwarded-host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const base = forwardedHost
    ? `${proto}://${forwardedHost}`
    : new URL(request.url).origin;

  return NextResponse.json({
    issuer: base,
    authorization_endpoint: `${base}/authorize`,
    token_endpoint: `${base}/api/mcp/token`,
    scopes_supported: ['mcp'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
  });
}
