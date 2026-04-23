/**
 * POST /api/admin/iam-clients-os/installer/generate
 *
 * Generates a personalised bootstrap.sh for a new IAM Client OS installation.
 * The bootstrap script is tiny (~15 lines): it downloads the current
 * iam-client.sh from https://iamrunning.online/installer/iam-client.sh and
 * runs it with pre-filled flags.
 *
 * Why not generate a self-contained iam-client.sh?
 *  1. Self-contained = ~700 lines of shell, hard to regenerate when the
 *     installer improves — you'd have to re-send fresh scripts to every client.
 *  2. Bootstrap = always fetches the latest installer, so bugfixes and
 *     improvements propagate automatically.
 *  3. Bootstrap keeps the sensitive token injection local — the curl'd
 *     installer never carries the PAT in its body.
 *
 * The endpoint:
 *  - If clientId is provided: loads that client from the registry and uses
 *    its fields as defaults (domain, name, mode, port, install path).
 *    If githubToken isn't explicitly given, and the client already has
 *    one stored (future field), we'd use that — right now PAT is always
 *    taken from the request body for security.
 *  - Otherwise: builds from raw body fields.
 *
 * Returns shell script body with Content-Disposition: attachment, so
 * browsers download it as a file.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';

export const runtime = 'nodejs';

// ── Source of truth for installer URL — kept as a constant so it shows up
// in logs and can be swapped for a CDN/mirror in one place.
const INSTALLER_URL = 'https://iamrunning.online/installer/iam-client.sh';

interface GenerateInput {
  clientId?: string;              // or domain — looked up via findClient
  domain?: string;
  name?: string;
  mode?: 'team' | 'solo';
  port?: number;
  installPath?: string;
  githubToken?: string;           // NEVER stored; injected into bootstrap only
  adminPath?: string;             // default /iam.admin
  skipSecurity?: boolean;
  skipNginx?: boolean;
  noLanding?: boolean;
  projectPath?: string;            // Integration mode: path to customer's app (becomes PROJECT_ROOT)
  clientAppPm2Name?: string;       // Integration mode: customer's existing pm2 process name
  dryRun?: boolean;                // adds --dry-run to the generated command
}

function shellEscape(value: string): string {
  // Single-quote the value. Any embedded single quote becomes '\''
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function validateDomain(d: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}$/.test(d) && d.length <= 253;
}

function validatePath(p: string): boolean {
  return /^\/[A-Za-z0-9._/-]+$/.test(p) && !p.includes('..');
}

function validatePort(p: number): boolean {
  return Number.isInteger(p) && p > 0 && p < 65536;
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body: GenerateInput = await request.json().catch(() => ({}));

    // Resolve base fields — client record overrides body for unset values.
    let domain = body.domain?.trim();
    let name = body.name?.trim();
    let mode: 'team' | 'solo' = body.mode || 'team';
    let port = body.port;
    let installPath = body.installPath?.trim();

    if (body.clientId) {
      const client = findClient(body.clientId);
      if (!client) {
        return NextResponse.json({ error: `Client not found: ${body.clientId}` }, { status: 404 });
      }
      domain = domain || client.domain;
      name = name || client.name;
      mode = body.mode ?? client.mode;
      port = port ?? client.port;
      installPath = installPath || client.installPath;
    }

    // Hard requirements
    if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    if (!validateDomain(domain)) return NextResponse.json({ error: `Invalid domain: ${domain}` }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    port = port || 4742;
    if (!validatePort(port)) return NextResponse.json({ error: `Invalid port: ${port}` }, { status: 400 });

    installPath = installPath || '/var/www/iam';
    if (!validatePath(installPath)) return NextResponse.json({ error: `Invalid installPath: ${installPath}` }, { status: 400 });

    const adminPath = body.adminPath || '/iam.admin';
    if (!adminPath.startsWith('/')) {
      return NextResponse.json({ error: 'adminPath must start with /' }, { status: 400 });
    }

    // Optional flags assembled into bash args
    const extraFlags: string[] = [];
    // Mode: always pass explicitly. Default is 'team' for web-generated
    // installs since web version should never default to solo.
    extraFlags.push(`--mode=${mode}`);
    if (body.skipSecurity) extraFlags.push('--skip-security');
    if (body.skipNginx) extraFlags.push('--skip-nginx');
    if (body.noLanding) extraFlags.push('--no-landing');
    if (body.dryRun) extraFlags.push('--dry-run');
    if (body.projectPath) extraFlags.push(`--project-path=${body.projectPath}`);
    if (body.clientAppPm2Name) extraFlags.push(`--client-app-pm2-name=${body.clientAppPm2Name}`);

    // Build the bootstrap script.
    //
    // Design decisions:
    //  - `set -euo pipefail` — fail fast on any error.
    //  - The GitHub PAT is taken from the env var `IAM_GITHUB_TOKEN` OR from
    //    the --github-token flag on bootstrap itself. If provided in the
    //    generator body, we bake it in. If not, the script prompts for it.
    //  - Generated timestamp + domain are in the header for traceability
    //    when clients forward the script back asking for help.
    //  - `curl --proto =https` prevents redirect-to-http attacks.
    //  - Temporary file uses `mktemp` so concurrent runs don't collide.

    const embeddedToken = body.githubToken?.trim();
    const tokenLine = embeddedToken
      ? `TOKEN=${shellEscape(embeddedToken)}`
      : `TOKEN="\${IAM_GITHUB_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  read -r -s -p "GitHub PAT (Contents: Read-only on skeleton repo): " TOKEN
  echo
fi
[ -n "$TOKEN" ] || { echo "GitHub PAT is required."; exit 1; }`;

    const bootstrap = `#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# IAM Client OS bootstrap installer
#
# Generated for:   ${name}
# Target domain:   ${domain}
# Install mode:    ${mode}
# Port:            ${port}
# Install path:    ${installPath}
# Generated at:    ${new Date().toISOString()}
# Source:          ${INSTALLER_URL}
#
# This bootstrap downloads the latest iam-client.sh and runs it with your
# pre-filled settings. To customise further, edit the flags below before
# running.
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

${tokenLine}

TMP="$(mktemp -t iam-client-XXXXXX.sh)"
trap 'rm -f "$TMP"' EXIT

echo "→ Downloading installer from ${INSTALLER_URL}"
curl --proto '=https' --tlsv1.2 -fsSL "${INSTALLER_URL}" -o "$TMP"

chmod +x "$TMP"

echo "→ Running installer"
bash "$TMP" \\
  --domain=${shellEscape(domain)} \\
  --name=${shellEscape(name)} \\
  --github-token="$TOKEN" \\
  --port=${port} \\
  --path=${shellEscape(installPath)} \\
  --admin-path=${shellEscape(adminPath)}${extraFlags.length ? ' \\\n  ' + extraFlags.map(shellEscape).join(' \\\n  ') : ''}
`;

    const safeFileName = `iam-install-${domain.replace(/[^A-Za-z0-9._-]/g, '_')}.sh`;
    const asText = request.headers.get('x-format') === 'text' ||
                   new URL(request.url).searchParams.get('format') === 'text';

    if (asText) {
      // Plain text response — for API tools that want the script body
      // inline rather than as a download (e.g. MCP tool, curl | bash).
      return new NextResponse(bootstrap, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-shellscript; charset=utf-8',
          'Content-Disposition': `inline; filename="${safeFileName}"`,
        },
      });
    }

    // Default: JSON with metadata + script text. UI decides whether to
    // download or show inline.
    return NextResponse.json({
      filename: safeFileName,
      script: bootstrap,
      generated: {
        at: new Date().toISOString(),
        domain,
        name,
        port,
        mode,
        installPath,
        adminPath,
        skipSecurity: !!body.skipSecurity,
        skipNginx: !!body.skipNginx,
        noLanding: !!body.noLanding,
        dryRun: !!body.dryRun,
        tokenEmbedded: !!embeddedToken,
        installerUrl: INSTALLER_URL,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
