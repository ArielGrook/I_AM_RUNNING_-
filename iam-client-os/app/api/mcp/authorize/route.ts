import { NextRequest, NextResponse } from 'next/server';

// MCP OAuth — authorize endpoint
// Claude hits this to start the OAuth flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || '';
  const state = searchParams.get('state') || '';
  const token = process.env.MCP_AUTH_TOKEN || '';

  // Auto-approve: redirect back with token as code
  const url = new URL(redirectUri);
  url.searchParams.set('code', token);
  url.searchParams.set('state', state);

  return NextResponse.redirect(url.toString());
}
