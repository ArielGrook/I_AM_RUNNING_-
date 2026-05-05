import { NextRequest, NextResponse } from 'next/server';
import { createNote, listNotes } from '@/lib/notes/storage';
import { requireNotesAuth } from '@/lib/notes/auth';
import { getRuntimeNotesConfig } from '@/lib/notes/runtime';

const OPERATOR_USER_ID = process.env.NOTES_OPERATOR_USER_ID || 'operator';

export async function GET(request: NextRequest) {
  const authError = requireNotesAuth(request);
  if (authError) return authError;

  try {
    const config = await getRuntimeNotesConfig();
    const notes = await listNotes(OPERATOR_USER_ID, config.tenantMode);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('[api/notes] list error', error);
    return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireNotesAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const config = await getRuntimeNotesConfig();
    const note = await createNote(OPERATOR_USER_ID, body ?? {}, config.tenantMode);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('[api/notes] create error', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

