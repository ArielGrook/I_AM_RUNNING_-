import { NextRequest, NextResponse } from 'next/server';

// MCP OAuth — token exchange endpoint
export async function POST(request: NextRequest) {
  const token = process.env.MCP_AUTH_TOKEN || '';
  return NextResponse.json({
    access_token: token,
    token_type: 'bearer',
  });
}
