import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const base = forwardedHost
    ? `${proto}://${forwardedHost}`
    : new URL(request.url).origin;

  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || '';
  const state = searchParams.get('state') || '';
  const token = process.env.MCP_AUTH_TOKEN || '';

  // Forward to our API authorize endpoint
  const apiUrl = new URL(`${base}/api/mcp/authorize`);
  searchParams.forEach((value, key) => apiUrl.searchParams.set(key, value));

  // Auto-approve: redirect back to Claude with token as code
  const callback = new URL(redirectUri);
  callback.searchParams.set('code', token);
  callback.searchParams.set('state', state);

  return NextResponse.redirect(callback.toString());
}
