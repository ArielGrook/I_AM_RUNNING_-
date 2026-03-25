import { NextResponse } from 'next/server';

// MCP discovery endpoint — tells Claude where auth endpoints are
export async function GET() {
  const base = process.env.NEXT_PUBLIC_CLIENT_DOMAIN || '';
  return NextResponse.json({
    issuer: base,
    authorization_endpoint: `${base}/api/mcp/authorize`,
    token_endpoint: `${base}/api/mcp/token`,
    scopes_supported: ['mcp'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
  });
}
