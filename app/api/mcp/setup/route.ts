import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig, saveConfig } from '@/lib/dev-agent/config';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;

export async function GET(): Promise<NextResponse> {
  try {
    // Authenticate via Supabase session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const config = await loadConfig();
    const devUserId = DEVELOPER_USER_ID || config.developerUserId;

    if (devUserId && user.id !== devUserId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate token if not yet set
    let token = config.mcpAuthToken;
    if (!token) {
      token = randomBytes(32).toString('hex');
      await saveConfig({ mcpAuthToken: token });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iamrunning.online';
    const mcpUrl = `${baseUrl}/api/mcp`;

    return NextResponse.json({
      token,
      url: mcpUrl,
      instructions: [
        '1. Go to claude.ai → Settings → Integrations → Add Integration',
        `2. Set URL: ${mcpUrl}`,
        `3. Authorization header: Bearer ${token}`,
        '4. Save. Claude can now read, write, and deploy your project directly.',
      ],
      tools: [
        'read_file', 'write_file', 'patch_file', 'delete_file',
        'list_directory', 'search_files',
        'git_snapshot', 'git_log', 'git_push',
        'deploy', 'run_command', 'read_multiple_files',
      ],
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
