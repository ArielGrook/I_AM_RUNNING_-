/**
 * GET /installer/<name>
 *
 * Serves installer-related shell scripts as downloads.
 * Currently handles: iam-client.sh
 *
 * This is the canonical endpoint the Web Installer's bootstrap scripts
 * fetch via curl. Making it a route (vs static file) lets us version it,
 * rotate it without editing every saved bootstrap, and log downloads.
 *
 * Source file lives in iam-clients-os/installer/ (populated after the
 * Step 4 source migration from lego-base).
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';

// Allowlist of filenames that can be requested. Prevents path traversal
// and accidental exposure of other files under iam-clients-os/installer/.
const ALLOWED_FILES: Record<string, string[]> = {
  'iam-client.sh': [
    'iam-clients-os/installer/iam-client.sh',
    'iam-clients-os/source/scripts/iam-client.sh', // fallback during migration
  ],
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const candidates = ALLOWED_FILES[file];

  if (!candidates) {
    return new NextResponse(`Unknown installer file: ${file}`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  for (const relPath of candidates) {
    const abs = path.join(PROJECT_ROOT, relPath);
    if (fs.existsSync(abs)) {
      const content = fs.readFileSync(abs, 'utf-8');
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-shellscript; charset=utf-8',
          'Content-Disposition': `inline; filename="${file}"`,
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
  }

  // Not yet available — return a helpful error script (exit 1 keeps
  // bash -c from proceeding silently).
  const stubScript = `#!/bin/bash
# ${file} — NOT YET AVAILABLE
#
# This installer has not yet been published to iamrunning.online.
# The IAM Client OS source has not been migrated into iam-clients-os/
# on the platform server yet (Step 4 of the platform migration).
#
# For now, get the installer directly from GitHub:
#   git clone https://github.com/ArielGrook/iam-client-skeleton ~/iam-install
# Then run:
#   bash ~/iam-install/scripts/${file} --help
#
echo "Installer '${file}' not yet published on iamrunning.online." >&2
echo "See script comments for manual install steps." >&2
exit 1
`;
  return new NextResponse(stubScript, {
    status: 404,
    headers: {
      'Content-Type': 'application/x-shellscript; charset=utf-8',
      'Content-Disposition': `inline; filename="${file}-not-published"`,
    },
  });
}
