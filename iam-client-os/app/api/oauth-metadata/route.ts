import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // ── Determine base URL ──────────────────────────────────────────
  // Priority: CLIENT_DOMAIN env > x-forwarded-host header > Host header > request.url
  // This handles both Vercel (x-forwarded-host) and VPS (Host header from Nginx)
  
  const clientDomain = process.env.CLIENT_DOMAIN || process.env.NEXT_PUBLIC_CLIENT_DOMAIN || '';
  const forwardedHost = request.headers.get('x-forwarded-host');
  const hostHeader = request.headers.get('host'); // Nginx always sends this
  const proto = request.headers.get('x-forwarded-proto') || 'https';

  let base: string;

  if (clientDomain) {
    // Explicit env variable — highest priority
    base = clientDomain.replace(/\/$/, '');
  } else if (forwardedHost) {
    // Vercel or reverse proxy with x-forwarded-host
    base = `${proto}://${forwardedHost}`;
  } else if (hostHeader && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1')) {
    // Nginx sends Host: test.lego-base.online
    base = `https://${hostHeader}`;
  } else {
    // Last resort — request.url (will be localhost on VPS, but at least won't crash)
    base = new URL(request.url).origin;
  }

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
