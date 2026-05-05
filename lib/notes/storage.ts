import matter from 'gray-matter';
import path from 'path';
import { promises as fs } from 'fs';
import slugify from 'slugify';
import { randomUUID } from 'crypto';
import type { NoteColorName, NoteFrontmatter, NoteRecord } from '@/types/notes';
import { NOTE_COLOR_ORDER, NOTE_TOTAL_SIZE_LIMIT } from '@/lib/notes/constants';

const DEFAULT_NOTES_ROOT = '/var/www/i_am_running/storage/notes';
const TENANT_NOTES_ROOT = '/workspace/notes';

function nowIso() {
  return new Date().toISOString();
}

function normalizeColor(color: unknown): NoteColorName {
  if (typeof color === 'string' && NOTE_COLOR_ORDER.includes(color as NoteColorName)) {
    return color as NoteColorName;
  }
  return 'blue';
}

function normalizeFrontmatter(data: Partial<NoteFrontmatter>, fallbackId: string): NoteFrontmatter {
  const created = typeof data.created === 'string' ? data.created : nowIso();
  return {
    id: typeof data.id === 'string' && data.id ? data.id : fallbackId,
    title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Untitled note',
    color: normalizeColor(data.color),
    tags: Array.isArray(data.tags) ? data.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean) : [],
    pinned: Boolean(data.pinned),
    created,
    updated: typeof data.updated === 'string' ? data.updated : created,
    attachments: Array.isArray(data.attachments)
      ? data.attachments.filter((attachment) => typeof attachment === 'string')
      : [],
  };
}

export function getNotesRoot(useTenantMode = false): string {
  const explicit = process.env.NOTES_STORAGE_ROOT?.trim();
  if (explicit) return explicit;
  return useTenantMode ? TENANT_NOTES_ROOT : DEFAULT_NOTES_ROOT;
}

function getUserDir(userId: string, useTenantMode = false) {
  const root = getNotesRoot(useTenantMode);
  return path.join(root, userId);
}

function getNotesDir(userId: string, useTenantMode = false) {
  return path.join(getUserDir(userId, useTenantMode), 'notes');
}

export function getAttachmentsDir(userId: string, useTenantMode = false) {
  return path.join(getUserDir(userId, useTenantMode), 'attachments');
}

function getNotePath(userId: string, noteId: string, useTenantMode = false) {
  return path.join(getNotesDir(userId, useTenantMode), `${noteId}.md`);
}

export async function ensureUserDirs(userId: string, useTenantMode = false) {
  await fs.mkdir(getNotesDir(userId, useTenantMode), { recursive: true });
  await fs.mkdir(getAttachmentsDir(userId, useTenantMode), { recursive: true });
}

function parseMarkdownNote(raw: string, fallbackId: string): NoteRecord {
  const parsed = matter(raw);
  const normalized = normalizeFrontmatter((parsed.data ?? {}) as Partial<NoteFrontmatter>, fallbackId);
  return { ...normalized, content: parsed.content.trimStart() };
}

function toMarkdown(note: NoteRecord): string {
  const normalized = normalizeFrontmatter(note, note.id);
  return matter.stringify(`${note.content ?? ''}\n`, normalized);
}

export async function listNotes(userId: string, useTenantMode = false): Promise<NoteRecord[]> {
  await ensureUserDirs(userId, useTenantMode);
  const notesDir = getNotesDir(userId, useTenantMode);
  const files = await fs.readdir(notesDir);
  const noteFiles = files.filter((file) => file.endsWith('.md'));

  const notes = await Promise.all(
    noteFiles.map(async (fileName) => {
      const noteId = fileName.replace(/\.md$/i, '');
      const filePath = path.join(notesDir, fileName);
      const raw = await fs.readFile(filePath, 'utf8');
      const note = parseMarkdownNote(raw, noteId);
      if (!raw.startsWith('---')) {
        await fs.writeFile(filePath, toMarkdown(note), 'utf8');
      }
      return note;
    })
  );

  return notes.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated.localeCompare(a.updated));
}

export async function readNote(userId: string, noteId: string, useTenantMode = false): Promise<NoteRecord | null> {
  await ensureUserDirs(userId, useTenantMode);
  const filePath = getNotePath(userId, noteId, useTenantMode);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const note = parseMarkdownNote(raw, noteId);
    if (!raw.startsWith('---')) {
      await fs.writeFile(filePath, toMarkdown(note), 'utf8');
    }
    return note;
  } catch {
    return null;
  }
}

export async function createNote(
  userId: string,
  payload: Partial<Pick<NoteRecord, 'title' | 'content' | 'tags' | 'color'>>,
  useTenantMode = false
): Promise<NoteRecord> {
  await ensureUserDirs(userId, useTenantMode);
  const id = randomUUID();
  const base: NoteRecord = {
    id,
    title: payload.title?.trim() || 'Untitled note',
    color: normalizeColor(payload.color),
    tags: Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : [],
    pinned: false,
    created: nowIso(),
    updated: nowIso(),
    attachments: [],
    content: payload.content ?? '',
  };

  await fs.writeFile(getNotePath(userId, id, useTenantMode), toMarkdown(base), 'utf8');
  return base;
}

export async function updateNote(
  userId: string,
  noteId: string,
  payload: Partial<NoteRecord>,
  expectedUpdated: string | null = null,
  useTenantMode = false
): Promise<NoteRecord | null | { conflict: true; remoteUpdated: string }> {
  const current = await readNote(userId, noteId, useTenantMode);
  if (!current) return null;

  if (expectedUpdated && current.updated !== expectedUpdated) {
    return { conflict: true, remoteUpdated: current.updated };
  }

  const next: NoteRecord = {
    ...current,
    title: typeof payload.title === 'string' ? payload.title : current.title,
    color: payload.color ? normalizeColor(payload.color) : current.color,
    tags: Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : current.tags,
    pinned: typeof payload.pinned === 'boolean' ? payload.pinned : current.pinned,
    content: typeof payload.content === 'string' ? payload.content : current.content,
    attachments: Array.isArray(payload.attachments) ? payload.attachments : current.attachments,
    updated: nowIso(),
  };

  await fs.writeFile(getNotePath(userId, noteId, useTenantMode), toMarkdown(next), 'utf8');
  return next;
}

export async function deleteNote(userId: string, noteId: string, useTenantMode = false): Promise<boolean> {
  const existing = await readNote(userId, noteId, useTenantMode);
  if (!existing) return false;

  const notePath = getNotePath(userId, noteId, useTenantMode);
  await fs.unlink(notePath).catch(() => undefined);

  const attachmentsDir = getAttachmentsDir(userId, useTenantMode);
  const files = await fs.readdir(attachmentsDir).catch(() => []);
  await Promise.all(
    files
      .filter((name) => name.startsWith(`${noteId}__`))
      .map((name) => fs.unlink(path.join(attachmentsDir, name)).catch(() => undefined))
  );

  return true;
}

export function sanitizeAttachmentName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, ext);
  const normalized = slugify(base, { lower: true, strict: true }) || 'attachment';
  return `${normalized}${ext}`;
}

export async function saveAttachment(
  userId: string,
  noteId: string,
  fileName: string,
  bytes: Buffer,
  useTenantMode = false
): Promise<string> {
  await ensureUserDirs(userId, useTenantMode);
  const safeName = sanitizeAttachmentName(fileName);
  const fullName = `${noteId}__${safeName}`;
  const targetPath = path.join(getAttachmentsDir(userId, useTenantMode), fullName);
  await fs.writeFile(targetPath, bytes);
  return fullName;
}

export async function getNoteTotalBytes(userId: string, noteId: string, useTenantMode = false): Promise<number> {
  const notePath = getNotePath(userId, noteId, useTenantMode);
  const noteStat = await fs.stat(notePath).catch(() => ({ size: 0 }));
  const attachmentsDir = getAttachmentsDir(userId, useTenantMode);
  const files = await fs.readdir(attachmentsDir).catch(() => []);
  const attachmentSizes = await Promise.all(
    files
      .filter((name) => name.startsWith(`${noteId}__`))
      .map(async (name) => {
        const stat = await fs.stat(path.join(attachmentsDir, name));
        return stat.size;
      })
  );
  return noteStat.size + attachmentSizes.reduce((sum, n) => sum + n, 0);
}

export async function ensureWithinNoteQuota(userId: string, noteId: string, incomingBytes: number, useTenantMode = false) {
  const currentBytes = await getNoteTotalBytes(userId, noteId, useTenantMode);
  if (currentBytes + incomingBytes > NOTE_TOTAL_SIZE_LIMIT) {
    throw new Error('NOTE_TOTAL_SIZE_LIMIT_EXCEEDED');
  }
}

