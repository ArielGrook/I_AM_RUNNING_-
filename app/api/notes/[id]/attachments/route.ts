import { NextRequest, NextResponse } from 'next/server';
import { NOTE_FILE_SIZE_LIMIT } from '@/lib/notes/constants';
import { ensureWithinNoteQuota, readNote, saveAttachment, updateNote } from '@/lib/notes/storage';
import { requireNotesAuth } from '@/lib/notes/auth';
import { getRuntimeNotesConfig } from '@/lib/notes/runtime';

const OPERATOR_USER_ID = process.env.NOTES_OPERATOR_USER_ID || 'operator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireNotesAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const config = await getRuntimeNotesConfig();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    if (file.size > NOTE_FILE_SIZE_LIMIT) {
      return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 413 });
    }

    const note = await readNote(OPERATOR_USER_ID, id, config.tenantMode);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await ensureWithinNoteQuota(OPERATOR_USER_ID, id, file.size, config.tenantMode);
    const bytes = Buffer.from(await file.arrayBuffer());
    const storedName = await saveAttachment(OPERATOR_USER_ID, id, file.name, bytes, config.tenantMode);

    const ext = storedName.split('.').pop()?.toLowerCase();
    let append = '';
    if (ext === 'pdf') {
      append = `\n\n![PDF: ${storedName}](/api/notes/attachments/${storedName})`;
    } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      append = `\n\n![${storedName}](/api/notes/attachments/${storedName})`;
    }

    const updated = await updateNote(
      OPERATOR_USER_ID,
      id,
      {
        attachments: [...note.attachments, storedName],
        content: `${note.content}${append}`,
      },
      null,
      config.tenantMode
    );

    return NextResponse.json({ note: updated, attachment: storedName }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOTE_TOTAL_SIZE_LIMIT_EXCEEDED') {
      return NextResponse.json({ error: 'Note exceeds 200MB limit' }, { status: 413 });
    }
    console.error('[api/notes/[id]/attachments] error', error);
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
}

