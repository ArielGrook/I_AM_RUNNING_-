import { NextRequest, NextResponse } from 'next/server';
import { deleteNote, readNote, updateNote } from '@/lib/notes/storage';
import { requireNotesAuth } from '@/lib/notes/auth';
import { getRuntimeNotesConfig } from '@/lib/notes/runtime';

const OPERATOR_USER_ID = process.env.NOTES_OPERATOR_USER_ID || 'operator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireNotesAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const config = await getRuntimeNotesConfig();
  const note = await readNote(OPERATOR_USER_ID, id, config.tenantMode);
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  return NextResponse.json({ note });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireNotesAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const config = await getRuntimeNotesConfig();
    const expectedUpdated = typeof body.expectedUpdated === 'string' ? body.expectedUpdated : null;
    const updated = await updateNote(OPERATOR_USER_ID, id, body, expectedUpdated, config.tenantMode);

    if (!updated) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    if ('conflict' in updated && updated.conflict) {
      return NextResponse.json(updated, { status: 409 });
    }
    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error('[api/notes/[id]] update error', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireNotesAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const config = await getRuntimeNotesConfig();
  const ok = await deleteNote(OPERATOR_USER_ID, id, config.tenantMode);
  if (!ok) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

