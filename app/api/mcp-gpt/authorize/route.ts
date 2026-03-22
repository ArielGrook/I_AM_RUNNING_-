import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { saveAuthCode } from '@/lib/mcp-gpt-oauth-codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');
  const codeChallenge = url.searchParams.get('code_challenge');

  if (!redirectUri || !state) {
    return new Response('Missing redirect_uri or state', { status: 400 });
  }

  const code = randomBytes(32).toString('hex');
  saveAuthCode(code, codeChallenge);

  const redirect = new URL(redirectUri);
  redirect.searchParams.set('code', code);
  redirect.searchParams.set('state', state);

  return Response.redirect(redirect.toString(), 302);
}
