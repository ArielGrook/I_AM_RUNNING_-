import { NextRequest, NextResponse } from 'next/server';
import { consumeAuthCode } from '@/lib/mcp-gpt-oauth-codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GPT_MCP_SECRET = process.env.GPT_MCP_SECRET ?? '';

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  let code: string | undefined;

  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { code?: string };
      code = body.code;
    } else {
      const fd = await request.formData();
      const c = fd.get('code');
      code = typeof c === 'string' ? c : undefined;
    }
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  if (!code) return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });

  const consumed = consumeAuthCode(code);
  if (!consumed) return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });

  if (!GPT_MCP_SECRET) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'GPT_MCP_SECRET not configured in .env' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    access_token: GPT_MCP_SECRET,
    token_type: 'Bearer',
    expires_in: 86400 * 365,
    scope: 'mcp:read mcp:write:context-core',
  });
}
