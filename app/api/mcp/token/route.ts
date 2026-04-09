import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync } from 'fs';
import { loadConfig } from '@/lib/dev-agent/config';
import { consumeAuthCode } from '@/lib/mcp-oauth-codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function debugLog(msg: string) {
  try { appendFileSync('/var/www/i_am_running/logs/oauth-debug.log', `[${new Date().toISOString()}] TOKEN: ${msg}\n`); } catch {}
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  let code: string | undefined;
  let codeVerifier: string | undefined;
  let allParams: Record<string, string> = {};

  try {
    if (contentType.includes('application/json')) {
      const body = await request.json();
      allParams = body;
      code = body.code;
      codeVerifier = body.code_verifier;
    } else {
      const fd = await request.formData();
      fd.forEach((v, k) => { allParams[k] = String(v); });
      code = allParams.code;
      codeVerifier = allParams.code_verifier;
    }
  } catch (e) {
    debugLog(`PARSE_ERROR: ${e}`);
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  debugLog(`params: ${JSON.stringify(allParams)}`);

  if (!code) {
    debugLog('NO_CODE');
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
  }

  const consumed = consumeAuthCode(code);
  if (!consumed) {
    debugLog(`CODE_NOT_FOUND code=${code.slice(0,8)}...`);
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
  }

  if (consumed.codeChallenge && codeVerifier) {
    const { createHash } = await import('crypto');
    const computed = createHash('sha256').update(codeVerifier).digest('base64url');
    debugLog(`PKCE: computed=${computed} expected=${consumed.codeChallenge} match=${computed === consumed.codeChallenge}`);
    if (computed !== consumed.codeChallenge) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }
  }

  const config = await loadConfig();
  if (!config.mcpAuthToken) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  const resp = {
    access_token: config.mcpAuthToken,
    token_type: 'bearer',
    scope: 'mcp:tools',
  };
  debugLog(`SUCCESS: ${JSON.stringify(resp).slice(0,80)}`);
  return NextResponse.json(resp);
}
