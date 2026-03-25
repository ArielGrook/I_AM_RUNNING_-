import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const token = process.env.MCP_AUTH_TOKEN || '';
  // Accept any code exchange — token is the auth mechanism
  return NextResponse.json({
    access_token: token,
    token_type: 'bearer',
    expires_in: 86400,
  });
}
