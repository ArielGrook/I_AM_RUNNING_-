import { NextResponse } from 'next/server';

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://iamrunning.online').replace(/\/$/, '');

export async function GET() {
  return NextResponse.json({
    issuer: BASE,
    authorization_endpoint: `${BASE}/api/mcp-gpt/authorize`,
    token_endpoint: `${BASE}/api/mcp-gpt/token`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['mcp:read', 'mcp:write:context-core'],
  });
}
