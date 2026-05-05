'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Document, Page, pdfjs } from 'react-pdf';
import type { NoteRecord, NoteColorName } from '@/types/notes';
import { NOTE_COLOR_HEX, NOTE_COLOR_ORDER } from '@/lib/notes/constants';

type ViewerMode = 'preview' | 'split';

function previewLines(content: string) {
  return content.split('\n').filter(Boolean).slice(0, 3).join(' ');
}

function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

export function NotesClient() {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [active, setActive] = useState<NoteRecord | null>(null);
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewerMode>('split');
  const [draft, setDraft] = useState('');
  const [touch, setTouch] = useState(false);

  async function refresh() {
    const res = await fetch('/api/notes', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setNotes(data.notes || []);
  }

  useEffect(() => {
    setTouch(isTouchDevice());
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    refresh();
  }, []);

  useEffect(() => {
    if (!active) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKeydown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeydown);
    };
  }, [active]);

  useEffect(() => {
    setDraft(active?.content ?? '');
  }, [active?.id]);

  const tags = useMemo(() => {
    return [...new Set(notes.flatMap((n) => n.tags))].sort();
  }, [notes]);

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      const passTag = tagFilter ? note.tags.includes(tagFilter) : true;
      const q = query.trim().toLowerCase();
      const passQuery = q
        ? note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)
        : true;
      return passTag && passQuery;
    });
  }, [notes, query, tagFilter]);

  async function createNew() {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New note', content: '# New note\n\nWrite here.' }),
    });
    if (!res.ok) return;
    await refresh();
    const payload = await res.json();
    setActive(payload.note);
  }

  async function saveNote(next: Partial<NoteRecord>) {
    if (!active) return;
    const res = await fetch(`/api/notes/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...next,
        expectedUpdated: active.updated,
      }),
    });

    if (res.status === 409) {
      alert('This note was changed in another tab. Please reload.');
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setActive(data.note);
    setNotes((prev) => prev.map((note) => (note.id === data.note.id ? data.note : note)));
  }

  async function removeActive() {
    if (!active) return;
    if (!confirm('Delete this note?')) return;
    const res = await fetch(`/api/notes/${active.id}`, { method: 'DELETE' });
    if (!res.ok) return;
    setActive(null);
    await refresh();
  }

  async function onUploadFiles(files: FileList | null) {
    if (!files || files.length === 0 || !active) return;
    const formData = new FormData();
    formData.append('file', files[0]);
    const res = await fetch(`/api/notes/${active.id}/attachments`, { method: 'POST', body: formData });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error.error || 'Upload failed');
      return;
    }
    const data = await res.json();
    setActive(data.note);
    await refresh();
  }

  async function onImport(files: FileList | null) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));
    const res = await fetch('/api/notes/import', { method: 'POST', body: formData });
    if (!res.ok) return;
    await refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold" onClick={createNew}>Create note</button>
          <label className="rounded-lg border border-white/20 px-4 py-2 text-sm cursor-pointer">
            Import
            <input className="hidden" type="file" multiple accept=".md,.txt,.pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => onImport(e.target.files)} />
          </label>
          <input
            className="ml-auto min-w-56 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"
            placeholder="Search title/content"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            className={`rounded-full px-3 py-1 text-xs ${tagFilter === null ? 'bg-white text-black' : 'bg-white/10'}`}
            onClick={() => setTagFilter(null)}
          >
            All tags
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              className={`rounded-full px-3 py-1 text-xs ${tagFilter === tag ? 'bg-white text-black' : 'bg-white/10'}`}
              onClick={() => setTagFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((note) => (
            <motion.button
              layoutId={`note-${note.id}`}
              key={note.id}
              onClick={() => setActive(note)}
              onMouseMove={(event) => {
                if (touch) return;
                const target = event.currentTarget;
                const rect = target.getBoundingClientRect();
                const x = event.clientX - rect.left - rect.width / 2;
                const y = event.clientY - rect.top - rect.height / 2;
                const rx = (-y / rect.height) * 8;
                const ry = (x / rect.width) * 8;
                target.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
                target.style.boxShadow = `${-ry * 2}px ${-rx * 2}px 32px rgba(0,0,0,0.35)`;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
                event.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
              }}
              className="relative overflow-hidden rounded-2xl border border-white/20 p-4 text-left transition-transform duration-150"
              style={{
                background: `${NOTE_COLOR_HEX[note.color]}30`,
                backdropFilter: 'blur(8px) saturate(140%)',
              }}
            >
              <div className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: NOTE_COLOR_HEX[note.color] }} />
              {note.pinned && <span className="absolute right-3 top-3 text-xs">📌</span>}
              <h3 className="line-clamp-2 text-lg font-bold">{note.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm text-white/80">{previewLines(note.content)}</p>
              <div className="mt-4 flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-black/30 px-2 py-0.5 text-xs">{tag}</span>
                ))}
              </div>
              <div className="mt-3 text-xs text-white/60">{new Date(note.updated).toLocaleString()}</div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {active && (
            <motion.div className="fixed inset-0 z-50 bg-black/60 p-2 md:p-6" onClick={() => setActive(null)}>
              <motion.div
                layoutId={`note-${active.id}`}
                className="mx-auto h-full max-w-6xl overflow-hidden rounded-2xl border border-white/20 bg-slate-900"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-2 border-b border-white/10 p-3">
                  <input
                    value={active.title}
                    onChange={(e) => setActive({ ...active, title: e.target.value })}
                    className="flex-1 rounded bg-white/10 px-3 py-2 text-sm"
                  />
                  <button className="rounded bg-green-600 px-3 py-2 text-sm" onClick={() => saveNote({ ...active, content: draft })}>Save</button>
                  <button className="rounded bg-red-600 px-3 py-2 text-sm" onClick={removeActive}>Delete</button>
                  <button className="rounded bg-white/10 px-3 py-2 text-sm" onClick={() => setActive(null)}>Close</button>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
                  {NOTE_COLOR_ORDER.map((color) => (
                    <button
                      key={color}
                      className={`h-7 w-7 rounded-full border-2 ${active.color === color ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: NOTE_COLOR_HEX[color] }}
                      onClick={() => setActive({ ...active, color: color as NoteColorName })}
                    />
                  ))}
                  <input
                    className="ml-3 rounded bg-white/10 px-2 py-1 text-xs"
                    value={active.tags.join(', ')}
                    onChange={(e) => setActive({ ...active, tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })}
                    placeholder="tags: a, b"
                  />
                  <label className="rounded border border-white/20 px-2 py-1 text-xs cursor-pointer">
                    Attachment
                    <input className="hidden" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => onUploadFiles(e.target.files)} />
                  </label>
                  <button className="rounded bg-white/10 px-2 py-1 text-xs" onClick={() => setMode(mode === 'split' ? 'preview' : 'split')}>
                    {mode === 'split' ? 'Preview only' : 'Split'}
                  </button>
                </div>

                <div className={`grid h-[calc(100%-104px)] ${mode === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                  <textarea
                    className={`h-full w-full resize-none bg-slate-950 p-4 text-sm leading-relaxed ${mode === 'preview' ? 'hidden' : ''}`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <div className="h-full overflow-auto p-4 prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      components={{
                        img: ({ src, alt }) => {
                          if (typeof src === 'string' && src.endsWith('.pdf')) {
                            return (
                              <div className="my-4 overflow-x-auto rounded border border-white/20 bg-black/20 p-3">
                                <div className="mb-2 text-xs text-white/70">{alt ?? 'PDF'}</div>
                                <Document file={src} loading={<div className="text-sm text-white/70">Loading PDF...</div>}>
                                  <Page pageNumber={1} width={520} />
                                </Document>
                              </div>
                            );
                          }
                          return <img src={src} alt={alt || ''} className="max-h-[360px] rounded-lg object-contain" />;
                        },
                      }}
                    >
                      {mode === 'preview' ? draft || active.content : draft}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

