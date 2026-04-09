import { appendFileSync } from 'fs';
import { NextRequest } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { loadConfig } from '@/lib/dev-agent/config';
import { createMcpServer } from '@/lib/mcp-server/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Auth ──────────────────────────────────────────────────────────────────
function authLog(msg: string) {
  try { appendFileSync("/var/www/i_am_running/logs/oauth-debug.log", `[${new Date().toISOString()}] ${msg}\n`); } catch {}
}
async function checkAuth(request: NextRequest): Promise<boolean> {
  const config = await loadConfig();
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const expected = config.mcpAuthToken || "";
  const match = token === expected;
  authLog(`CHECK_AUTH token=${token.slice(0,8)}...(${token.length}) expected=${expected.slice(0,8)}...(${expected.length}) match=${match} method=${request.method}`);
  if (!expected) return false;
  return match;
}

// ── Shared handler: create transport + server for each request ────────────
async function handleMcp(request: NextRequest): Promise<Response> {
  if (!(await checkAuth(request))) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer resource_metadata="https://iamrunning.online/.well-known/oauth-protected-resource/api/mcp"' } }
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session IDs
    enableJsonResponse: true,      // return JSON instead of SSE stream for simple requests
  });

  const clientSlug = request.headers.get('x-client-slug') || undefined;
  const server = createMcpServer(clientSlug);
  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    // Clean up after each stateless request
    await server.close().catch(() => {});
  }
}

// ── POST: main MCP protocol handler ──────────────────────────────────────
export async function POST(request: NextRequest): Promise<Response> {
  console.log("[MCP] POST request received", new Date().toISOString());
  return handleMcp(request);
}

// ── GET: SSE stream endpoint (required by MCP Streamable HTTP spec) ────────
export async function GET(request: NextRequest): Promise<Response> {
  console.log("[MCP] GET request received", new Date().toISOString());
  return handleMcp(request);
}

// ── DELETE: terminate session (stateless — just return 200) ──────────────
export async function DELETE(request: NextRequest): Promise<Response> {
  if (!(await checkAuth(request))) {
    return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Bearer resource_metadata="https://iamrunning.online/.well-known/oauth-protected-resource/api/mcp"' } });
  }
  return new Response(null, { status: 200 });
}
