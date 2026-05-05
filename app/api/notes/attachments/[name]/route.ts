import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { requireNotesAuth } from '@/lib/notes/auth';
import { getAttachmentsDir } from '@/lib/notes/storage';
import { getRuntimeNotesConfig } from '@/lib/notes/runtime';

const OPERATOR_USER_ID = process.env.NOTES_OPERATOR_USER_ID || 'operator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const authError = requireNotesAuth(request);
  if (authError) return authError;

  try {
    const { name } = await params;
    const config = await getRuntimeNotesConfig();
    const base = getAttachmentsDir(OPERATOR_USER_ID, config.tenantMode);
    const filePath = path.join(base, name);
    const bytes = await fs.readFile(filePath);
    const ext = name.split('.').pop()?.toLowerCase();
    const contentType =
      ext === 'pdf'
        ? 'application/pdf'
        : ext === 'png'
          ? 'image/png'
          : ext === 'jpg' || ext === 'jpeg'
            ? 'image/jpeg'
            : ext === 'webp'
              ? 'image/webp'
              : 'application/octet-stream';

    return new NextResponse(bytes, {
      headers: { 'Content-Type': contentType },
    });
  } catch {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }
}

