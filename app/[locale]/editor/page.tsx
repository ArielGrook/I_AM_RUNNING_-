/**
 * Craft.js Editor - toolbar, toolbox, viewport, settings. Multi-page, Supabase sync.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
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
  Testimonials,
  Pricing,
  FAQ,
  Divider,
  Video,
  HtmlBlock,
} from '@/lib/craft/components';
import { Toolbox } from '@/components/craft/Toolbox';
import { LayersPanel } from '@/components/craft/LayersPanel';
import { SettingsPanel } from '@/components/craft/SettingsPanel';
import { Viewport } from '@/components/craft/Viewport';
import { Toolbar } from '@/components/craft/Toolbar';
import { PreviewModal } from '@/components/craft/PreviewModal';
import { RenderNode } from '@/components/craft/RenderNode';
import { KeyboardShortcuts } from '@/components/craft/KeyboardShortcuts';
import { EditorThemeProvider, useEditorTheme } from '@/components/craft/EditorThemeContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Layout with theme-aware background and sidebar toggles (must be inside EditorThemeProvider). */
function EditorLayout({
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen,
  previewMode,
  outlines,
  children,
}: {
  leftPanelOpen: boolean;
  setLeftPanelOpen: (v: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (v: boolean) => void;
  previewMode: boolean;
  outlines: boolean;
  children: React.ReactNode;
}) {
  const { theme } = useEditorTheme();
  const isDark = theme === 'dark';
  const areaBg = isDark ? '#0f172a' : '#e2e8f0';
  const btnBase = isDark
    ? { background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }
    : { background: 'rgba(248, 250, 252, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#64748b' };

  return (
    <div
      className={`flex-1 flex min-h-0 relative ${outlines ? 'craft-outlines-mode' : ''} ${previewMode ? 'craft-preview-mode' : ''}`}
      style={{ background: areaBg }}
    >
      {!previewMode && (
        <div
          className="flex transition-all duration-200 shrink-0 overflow-visible relative"
          style={{
            width: leftPanelOpen ? '30rem' : 0,
            minWidth: leftPanelOpen ? undefined : 0,
          }}
        >
          <div className="flex min-w-0 flex-1 overflow-hidden">
            <Toolbox />
            <LayersPanel />
          </div>
          {leftPanelOpen && (
            <button
              type="button"
              onClick={() => setLeftPanelOpen(false)}
              title="Close left panel"
              style={{
                position: 'absolute',
                right: -14,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                ...btnBase,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                e.currentTarget.style.color = '#FF6B35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = btnBase.background;
                e.currentTarget.style.color = btnBase.color;
              }}
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>
      )}
      {!previewMode && !leftPanelOpen && (
        <button
          type="button"
          onClick={() => setLeftPanelOpen(true)}
          title="Open left panel"
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 28,
            height: 28,
            borderRadius: '0 50% 50% 0',
            ...btnBase,
            borderLeft: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
            e.currentTarget.style.color = '#FF6B35';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = btnBase.background;
            e.currentTarget.style.color = btnBase.color;
          }}
        >
          <ChevronRight size={14} />
        </button>
      )}
      {children}
      {!previewMode && (
        <div
          className="flex transition-all duration-200 shrink-0 overflow-visible relative"
          style={{
            width: rightPanelOpen ? '19rem' : 0,
            minWidth: rightPanelOpen ? undefined : 0,
          }}
        >
          {rightPanelOpen && (
            <button
              type="button"
              onClick={() => setRightPanelOpen(false)}
              title="Close right panel"
              style={{
                position: 'absolute',
                left: -14,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                ...btnBase,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                e.currentTarget.style.color = '#FF6B35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = btnBase.background;
                e.currentTarget.style.color = btnBase.color;
              }}
            >
              <ChevronRight size={14} />
            </button>
          )}
          <div className="min-w-0 flex-1 overflow-hidden">
            <SettingsPanel />
          </div>
        </div>
      )}
      {!previewMode && !rightPanelOpen && (
        <button
          type="button"
          onClick={() => setRightPanelOpen(true)}
          title="Open right panel"
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 28,
            height: 28,
            borderRadius: '50% 0 0 50%',
            ...btnBase,
            borderRight: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
            e.currentTarget.style.color = '#FF6B35';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = btnBase.background;
            e.currentTarget.style.color = btnBase.color;
          }}
        >
          <ChevronLeft size={14} />
        </button>
      )}
    </div>
  );
}

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

/** Syncs preview mode with Craft.js: when previewMode is true, editing is disabled. */
function PreviewController({ previewMode }: { previewMode: boolean }) {
  const { actions } = useEditor();
  useEffect(() => {
    actions.setOptions((opts) => { opts.enabled = !previewMode; });
  }, [previewMode, actions]);
  return null;
}

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
  const [outlines, setOutlines] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [frameData, setFrameData] = useState<string | null>(null);
  const [frameReady, setFrameReady] = useState(false);

  const activePage = pages.find((p) => p.id === activePageId);

  const handleRenameProject = useCallback(
    async (newName: string) => {
      if (!projectId) return;
      const supabase = getSupabaseClient();
      await supabase.from('projects').update({ name: newName }).eq('id', projectId);
      setLoadedProject((prev) => (prev ? { ...prev, name: newName } : null));
    },
    [projectId]
  );

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

  // Load project — set pages, activePageId, then frameData so Frame mounts with correct data
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
        const mappedPages = craftPages.map((p) => ({
          id: p.id || String(Math.random()),
          name: p.name || 'Page',
          data: p.data ?? null,
        }));
        setPages(mappedPages);
        const activeId = pd?.craft?.activePageId || craftPages[0].id || '1';
        setActivePageId(activeId);

        const activePage = mappedPages.find((p) => p.id === activeId);
        if (activePage?.data) {
          try {
            const json = lz.decompress(activePage.data, { inputEncoding: 'Base64' }) as string;
            setFrameData(json);
          } catch {
            setFrameData(null);
          }
        } else {
          setFrameData(null);
        }
      } else {
        setFrameData(null);
      }
      setFrameReady(true);
    };

    load();
  }, [projectId, isAuthenticated, locale, router]);

  // GSAP animations in preview mode (data-animate + ScrollTrigger)
  useEffect(() => {
    if (!previewMode) return;
    const timer = setTimeout(async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        const elements = document.querySelectorAll('[data-animate]');
        elements.forEach((el) => {
          const type = el.getAttribute('data-animate');
          const delay = parseFloat(el.getAttribute('data-animate-delay') || '0');
          if (!type || type === 'none') return;

          const fromMap: Record<string, object> = {
            'fade-in': { opacity: 0 },
            'slide-up': { opacity: 0, y: 50 },
            'slide-left': { opacity: 0, x: -50 },
            'scale-in': { opacity: 0, scale: 0.9 },
            'blur-in': { opacity: 0, filter: 'blur(16px)' },
          };
          const vars = fromMap[type];
          if (!vars) return;

          gsap.from(el, {
            ...vars,
            duration: 0.8,
            delay,
            ease: 'power3.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
            },
          });
        });
      } catch (e) {
        console.warn('GSAP animation error:', e);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      });
    };
  }, [previewMode]);

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
      const targetPage = pages.find((p) => p.id === targetId);
      if (targetPage?.data) {
        try {
          const json = lz.decompress(targetPage.data, { inputEncoding: 'Base64' }) as string;
          setFrameData(json);
        } catch {
          setFrameData(null);
        }
      } else {
        setFrameData(null);
      }
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId ? { ...p, data: compressed } : p
        )
      );
      setActivePageId(targetId);
    },
    [activePageId, pages]
  );

  const handleAddPage = () => {
    const newId = String(Date.now());
    setPages((prev) => [
      ...prev,
      { id: newId, name: `Page ${prev.length + 1}`, data: null },
    ]);
    setActivePageId(newId);
    setFrameData(null); // new page is empty
  };

  // Wait for project load before mounting Editor so Frame gets correct data on first paint
  if (authLoading || !isAuthenticated || !projectId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-gray-400">
        Loading...
      </div>
    );
  }
  if (loadedProject === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-gray-400">
        Loading project...
      </div>
    );
  }

  return (
    <EditorThemeProvider>
    <div className="h-screen flex flex-col">
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
          Testimonials,
          Pricing,
          FAQ,
          Divider,
          Video,
          HtmlBlock,
        }}
        onRender={RenderNode}
        indicator={{
          success: '#FF6B35',
          error: '#ef4444',
          thickness: 3,
          transition: 'none',
        }}
      >
        <PreviewController previewMode={previewMode} />
        <Toolbar
          onSave={handleSaveFromEditor}
          onPreview={handlePreview}
          onAddPage={handleAddPage}
          pages={pages}
          setPages={setPages}
          activePageId={activePageId}
          onPageChange={handlePageChange}
          locale={locale}
          router={router}
          isSaving={isSaving}
          outlines={outlines}
          onToggleOutlines={() => setOutlines((o) => !o)}
          previewMode={previewMode}
          onTogglePreview={() => setPreviewMode((p) => !p)}
          projectId={projectId}
          projectName={loadedProject?.name}
          onRenameProject={handleRenameProject}
        />
        <EditorLayout
          leftPanelOpen={leftPanelOpen}
          setLeftPanelOpen={setLeftPanelOpen}
          rightPanelOpen={rightPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
          previewMode={previewMode}
          outlines={outlines}
        >
          <Viewport>
            {frameReady && (
              <Frame key={activePageId} data={frameData ?? undefined}>
                {!frameData && (
                  <Element
                    is={Container}
                    canvas
                    background="#ffffff"
                    padding={0}
                    gap={0}
                    flexDirection="column"
                    alignItems="stretch"
                    style={{ minHeight: '100vh' }}
                  >
                  </Element>
                )}
              </Frame>
            )}
          </Viewport>
        </EditorLayout>
        <KeyboardShortcuts onSave={() => {
          try {
            // Toolbar handles serialize internally, but shortcut needs a ref-free approach
            // The Toolbar's handleSave is not accessible here, so we trigger save via DOM
            const saveBtn = document.querySelector('[data-save-btn]') as HTMLButtonElement;
            if (saveBtn) saveBtn.click();
          } catch { /* noop */ }
        }} />
        <PreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          data={previewHTML}
        />
      </Editor>
    </div>
    </EditorThemeProvider>
  );
}
