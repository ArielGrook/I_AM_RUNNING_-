import { NextRequest } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createGptSafeMcpServer } from '@/lib/mcp-server/gpt-safe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GPT_MCP_SECRET = process.env.GPT_MCP_SECRET ?? '';

async function checkAuth(request: NextRequest): Promise<boolean> {
  if (!GPT_MCP_SECRET) return false;
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return token === GPT_MCP_SECRET;
}

async function handleMcp(request: NextRequest): Promise<Response> {
  if (!(await checkAuth(request))) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. ChatGPT MCP requires valid Bearer token.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createGptSafeMcpServer();
  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close().catch(() => {});
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  console.log('[MCP-GPT] POST', new Date().toISOString());
  return handleMcp(request);
}

export async function GET(request: NextRequest): Promise<Response> {
  console.log('[MCP-GPT] GET', new Date().toISOString());
  return handleMcp(request);
}

export async function DELETE(request: NextRequest): Promise<Response> {
  if (!(await checkAuth(request))) return new Response('Unauthorized', { status: 401 });
  return new Response(null, { status: 200 });
}
