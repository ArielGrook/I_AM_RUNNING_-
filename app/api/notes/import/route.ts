import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { NOTE_FILE_SIZE_LIMIT } from '@/lib/notes/constants';
import { createNote, saveAttachment, updateNote, readNote } from '@/lib/notes/storage';
import { requireNotesAuth } from '@/lib/notes/auth';
import { getRuntimeNotesConfig } from '@/lib/notes/runtime';

const OPERATOR_USER_ID = process.env.NOTES_OPERATOR_USER_ID || 'operator';

function textToMarkdown(name: string, text: string) {
  return `# ${name}\n\n${text}`;
}

export async function POST(request: NextRequest) {
  const authError = requireNotesAuth(request);
  if (authError) return authError;

  try {
    const config = await getRuntimeNotesConfig();
    const formData = await request.formData();
    const files = formData.getAll('files');
    const imported = [];

    for (const item of files) {
      if (!(item instanceof File)) continue;
      if (item.size > NOTE_FILE_SIZE_LIMIT) {
        return NextResponse.json({ error: `File ${item.name} exceeds 50MB limit` }, { status: 413 });
      }

      const ext = item.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'md') {
        const content = await item.text();
        const note = await createNote(
          OPERATOR_USER_ID,
          { title: item.name.replace(/\.md$/i, ''), content },
          config.tenantMode
        );
        imported.push(note.id);
      } else if (ext === 'txt') {
        const text = await item.text();
        const markdown = textToMarkdown(item.name, text);
        const note = await createNote(
          OPERATOR_USER_ID,
          { title: item.name.replace(/\.txt$/i, ''), content: markdown },
          config.tenantMode
        );
        imported.push(note.id);
      } else if (ext === 'pdf' || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        const note = await createNote(
          OPERATOR_USER_ID,
          { title: item.name.replace(/\.[^.]+$/i, ''), content: `# ${item.name}` },
          config.tenantMode
        );
        const bytes = Buffer.from(await item.arrayBuffer());
        const stored = await saveAttachment(OPERATOR_USER_ID, note.id, item.name, bytes, config.tenantMode);
        const current = await readNote(OPERATOR_USER_ID, note.id, config.tenantMode);
        await updateNote(
          OPERATOR_USER_ID,
          note.id,
          {
            attachments: [stored],
            content: `${current?.content ?? ''}\n\n![${ext === 'pdf' ? `PDF: ${stored}` : stored}](/api/notes/attachments/${stored})`,
          },
          null,
          config.tenantMode
        );
        imported.push(note.id);
      } else {
        const fallback = await createNote(
          OPERATOR_USER_ID,
          { title: item.name, content: `# Imported file\n\n${randomUUID()}` },
          config.tenantMode
        );
        imported.push(fallback.id);
      }
    }

    return NextResponse.json({ imported });
  } catch (error) {
    console.error('[api/notes/import] error', error);
    return NextResponse.json({ error: 'Failed to import files' }, { status: 500 });
  }
}

