import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = `client-${Date.now()}`;
    return NextResponse.json({
      client_id: clientId,
      client_name: body.client_name || 'claude',
      redirect_uris: body.redirect_uris || [],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    });
  } catch {
    return NextResponse.json(
      { error: 'invalid_request' },
      { status: 400 }
    );
  }
}
