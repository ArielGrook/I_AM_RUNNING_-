import { NextResponse } from 'next/server';

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://iamrunning.online').replace(/\/$/, '');

export async function GET() {
  return NextResponse.json({
    resource: `${BASE}/api/mcp`,
    authorization_servers: [BASE],
    bearer_methods_supported: ['header'],
    scopes_supported: ['mcp:tools'],
  });
}
