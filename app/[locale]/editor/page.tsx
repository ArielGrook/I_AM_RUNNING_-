/**
 * Craft.js Editor - toolbar, toolbox, viewport, settings. Multi-page, Supabase sync.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import lz from 'lzutf8';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  loadProjectFromSupabase,
  saveProjectToSupabase,
  type LoadedProject,
} from '@/lib/store/supabase-sync';
import {
  Container,
  Text,
  Hero,
  Button,
  Image,
  Header,
  CTA,
  Features,
  Footer,
} from '@/lib/craft/components';
import { Toolbox } from '@/components/craft/Toolbox';
import { LayersPanel } from '@/components/craft/LayersPanel';
import { SettingsPanel } from '@/components/craft/SettingsPanel';
import { Viewport } from '@/components/craft/Viewport';
import { Toolbar } from '@/components/craft/Toolbar';
import { PreviewModal } from '@/components/craft/PreviewModal';
import { RenderNode } from '@/components/craft/RenderNode';

type PageState = {
  id: string;
  name: string;
  data: string | null;
};

const defaultPage: PageState = {
  id: '1',
  name: 'Page 1',
  data: null,
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');

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

      const pd = project.projectData as {
        craft?: { pages?: PageState[]; activePageId?: string };
      };
      const craftPages = pd?.craft?.pages;
      if (craftPages && Array.isArray(craftPages) && craftPages.length > 0) {
        setPages(
          craftPages.map((p) => ({
            id: p.id || String(Math.random()),
            name: p.name || 'Page',
            data: p.data ?? null,
          }))
        );
        setActivePageId(pd?.craft?.activePageId || craftPages[0].id || '1');
      }
    };

    load();
  }, [projectId, isAuthenticated, locale, router]);

  const handleSaveFromEditor = useCallback(
    async (serializedJson: string) => {
      if (!projectId || !loadedProject || isSaving) return;

      setIsSaving(true);
      try {
        const compressed = lz.compress(serializedJson, { outputEncoding: 'Base64' });
        const updatedPages = pages.map((p) =>
          p.id === activePageId ? { ...p, data: compressed } : p
        );

        const project = {
          id: loadedProject.id,
          name: loadedProject.name,
          description: loadedProject.description,
          pages: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0.0',
          },
        } as Parameters<typeof saveProjectToSupabase>[0];

        const { error } = await saveProjectToSupabase(
          project,
          null,
          { craft: { pages: updatedPages, activePageId } },
          null,
          loadedProject.version
        );

        if (error) {
          console.error('Save failed:', error);
          alert('Save failed');
          return;
        }
        setPages(updatedPages);
        alert('Saved!');
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, loadedProject, pages, activePageId, isSaving]
  );

  const handlePreview = () => {
    setPreviewHTML(
      '<div style="padding:40px;text-align:center;">Preview - HTML serializer coming soon</div>'
    );
    setPreviewOpen(true);
  };

  const handlePageChange = useCallback(
    (targetId: string, currentPageJson: string) => {
      const compressed =
        currentPageJson &&
        lz.compress(currentPageJson, { outputEncoding: 'Base64' });
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId ? { ...p, data: compressed } : p
        )
      );
      setActivePageId(targetId);
    },
    [activePageId]
  );

  const handleAddPage = () => {
    const newId = String(Date.now());
    setPages((prev) => [
      ...prev,
      { id: newId, name: `Page ${prev.length + 1}`, data: null },
    ]);
    setActivePageId(newId);
  };

  const getInitialData = useCallback((): string | undefined => {
    if (!activePage?.data) return undefined;
    try {
      return lz.decompress(activePage.data, { inputEncoding: 'Base64' }) as string;
    } catch {
      return undefined;
    }
  }, [activePage?.data]);

  if (authLoading || !isAuthenticated || !projectId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-gray-400">
        Loading...
      </div>
    );
  }

  const initialData = getInitialData();

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Editor
        resolver={{
          Container,
          Text,
          Hero,
          Button,
          Image,
          Header,
          CTA,
          Features,
          Footer,
        }}
        onRender={RenderNode}
      >
        <Toolbar
          onSave={handleSaveFromEditor}
          onPreview={handlePreview}
          onAddPage={handleAddPage}
          pages={pages}
          activePageId={activePageId}
          onPageChange={handlePageChange}
          locale={locale}
          router={router}
          isSaving={isSaving}
        />
        <div className="flex-1 flex min-h-0">
          <Toolbox />
          <LayersPanel />
          <Viewport>
            <Frame key={activePageId} data={initialData}>
              {!initialData && (
                <Element
                  is={Container}
                  canvas
                  background="#f5f5f5"
                  padding={40}
                >
                  <Element
                    is={Text}
                    text="Добро пожаловать в редактор!"
                    fontSize={32}
                  />
                  <Element
                    is={Text}
                    text="Перетащите компоненты слева или редактируйте этот текст"
                    fontSize={16}
                  />
                </Element>
              )}
            </Frame>
          </Viewport>
          <SettingsPanel />
        </div>
        <PreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          data={previewHTML}
        />
      </Editor>
    </div>
  );
}
