import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // SERVER-SIDE env (no NEXT_PUBLIC_ prefix) — reads at runtime, not inlined at build time
  // This fixes the localhost:3000 bug on VPS where NEXT_PUBLIC_* gets inlined as empty string
  const clientDomain =
    process.env.CLIENT_DOMAIN ||
    process.env.NEXT_PUBLIC_CLIENT_DOMAIN ||
    '';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';

  const base = clientDomain
    ? clientDomain.replace(/\/$/, '')
    : forwardedHost
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
