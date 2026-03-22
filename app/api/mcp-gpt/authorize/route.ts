import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { saveAuthCode } from '@/lib/mcp-gpt-oauth-codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fixed client_id for ChatGPT app — put this in ChatGPT UI "OAuth Client ID" field
export const GPT_CLIENT_ID = 'iamrunning-chatgpt-mcp';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');
  const codeChallenge = url.searchParams.get('code_challenge');

  if (!redirectUri || !state) {
    return new Response('Missing redirect_uri or state', { status: 400 });
  }

  // Validate client_id if provided
  if (clientId && clientId !== GPT_CLIENT_ID) {
    return new Response('Invalid client_id', { status: 401 });
  }

  const code = randomBytes(32).toString('hex');
  saveAuthCode(code, codeChallenge);

  const redirect = new URL(redirectUri);
  redirect.searchParams.set('code', code);
  redirect.searchParams.set('state', state);

  return Response.redirect(redirect.toString(), 302);
}
