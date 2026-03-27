import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientDomain = process.env.CLIENT_DOMAIN || process.env.NEXT_PUBLIC_CLIENT_DOMAIN || '';
  const forwardedHost = request.headers.get('x-forwarded-host');
  const hostHeader = request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';

  let base: string;
  if (clientDomain) {
    base = clientDomain.replace(/\/$/, '');
  } else if (forwardedHost) {
    base = `${proto}://${forwardedHost}`;
  } else if (hostHeader && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1')) {
    base = `https://${hostHeader}`;
  } else {
    base = new URL(request.url).origin;
  }

  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || '';
  const state = searchParams.get('state') || '';
  const token = process.env.MCP_AUTH_TOKEN || '';

  // Auto-approve: redirect back to Claude with token as code
  const callback = new URL(redirectUri);
  callback.searchParams.set('code', token);
  callback.searchParams.set('state', state);

  return NextResponse.redirect(callback.toString());
}
