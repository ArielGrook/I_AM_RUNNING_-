/**
 * Minimal Puck Editor - clean slate.
 * Toolbar + Puck built-in UI. Multi-page, Supabase sync.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import '@puckeditor/core/puck.css';
import config from '@/lib/puck/config';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { loadProjectFromSupabase, saveProjectToSupabase, type LoadedProject } from '@/lib/store/supabase-sync';
import dynamic from 'next/dynamic';

const PuckEditor = dynamic(
  () => import('@puckeditor/core').then((mod) => mod.Puck),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-gray-500">Loading editor...</div> }
);

type PuckData = Record<string, unknown>;

type PageState = {
  id: string;
  name: string;
  data: PuckData;
};

const defaultPage: PageState = {
  id: '1',
  name: 'Page 1',
  data: { content: [], root: {} },
};

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const projectId = searchParams.get('id');

  const [pages, setPages] = useState<PageState[]>([defaultPage]);
  const [activePageId, setActivePageId] = useState('1');
  const [loadedProject, setLoadedProject] = useState<LoadedProject | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activePage = pages.find((p) => p.id === activePageId);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
      return;
    }
    if (!projectId) {
      router.replace(`/${locale}/dashboard`);
      return;
    }
  }, [authLoading, isAuthenticated, projectId, locale, router]);

  // Load project
  useEffect(() => {
    if (!projectId || !isAuthenticated) return;

    const load = async () => {
      const project = await loadProjectFromSupabase(projectId);
      if (!project) {
        router.replace(`/${locale}/dashboard`);
        return;
      }
      setLoadedProject(project);

      const pd = project.projectData as { puck?: { pages?: PageState[]; activePageId?: string } };
      const puckPages = pd?.puck?.pages;
      if (puckPages && Array.isArray(puckPages) && puckPages.length > 0) {
        setPages(
          puckPages.map((p) => ({
            id: p.id || String(Math.random()),
            name: p.name || 'Page',
            data: (p.data && typeof p.data === 'object' ? p.data : { content: [], root: {} }) as PuckData,
          }))
        );
        setActivePageId(pd.puck.activePageId || puckPages[0].id || '1');
      }
    };

    load();
  }, [projectId, isAuthenticated, locale, router]);

  const handleSave = useCallback(async () => {
    if (!projectId || !loadedProject || isSaving) return;

    setIsSaving(true);
    const { error } = await saveProjectToSupabase(
      { id: loadedProject.id, name: loadedProject.name, description: loadedProject.description, pages: [] },
      null,
      { puck: { pages, activePageId } },
      null,
      loadedProject.version
    );
    setIsSaving(false);

    if (error) {
      console.error('Save failed:', error);
      alert('Save failed');
      return;
    }
    alert('Saved!');
  }, [projectId, loadedProject, pages, activePageId, isSaving]);

  const handlePreview = () => {
    console.log('Preview:', activePage?.data);
    // TODO: Open preview modal
  };

  const handleAddPage = () => {
    const newId = String(Date.now());
    setPages((prev) => [
      ...prev,
      { id: newId, name: `Page ${prev.length + 1}`, data: { content: [], root: {} } },
    ]);
    setActivePageId(newId);
  };

  const handlePuckChange = useCallback(
    (newData: PuckData) => {
      setPages((prev) =>
        prev.map((p) => (p.id === activePageId ? { ...p, data: newData } : p))
      );
    },
    [activePageId]
  );

  if (authLoading || !isAuthenticated || !projectId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* TOOLBAR */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4 shrink-0">
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          ← Dashboard
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-[#FF6B35] hover:bg-[#ff8555] rounded text-white disabled:opacity-50"
        >
          {isSaving ? '…' : '💾 Save'}
        </button>

        <button
          onClick={handlePreview}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          👁 Preview
        </button>

        <button
          onClick={handleAddPage}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          + Page
        </button>

        <div className="flex gap-2 ml-auto">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePageId(page.id)}
              className={`px-3 py-1 rounded ${
                page.id === activePageId
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>
      </div>

      {/* PUCK EDITOR */}
      <div className="flex-1 min-h-0">
        {activePage && (
          <PuckEditor
            config={config}
            data={activePage.data}
            onChange={handlePuckChange}
          />
        )}
      </div>
    </div>
  );
}
