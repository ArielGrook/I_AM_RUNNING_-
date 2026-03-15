/**
 * Craft.js Editor - toolbar, toolbox, viewport, settings. Multi-page, Supabase sync.
 */

'use client';

import { useState, useEffect, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
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
import { injectSupabaseCredentialsIntoCraftJson } from '@/lib/craft/injectSupabaseCredentials';
import {
  Container,
  HeroTron,
  HeroTronHeading,
  HeroTronSubheading,
  HeroTronButton,
  HeaderTron,
  TronFeatures,
  FeatureCard,
  TronStats,
  StatItem,
  TronPortfolio,
  TronTestimonials,
  TestimonialCard,
  TronPricing,
  PricingCard,
  TronFAQ,
  FAQItem,
  TronFooter,
  FooterColumn,
  TronContact,
  TronShowcase,
  TronLogin,
  TronRegister,
  TronHub,
  HtmlBlock,
} from '@/lib/craft/components';
import { PagesProvider, PagesContext } from '@/lib/craft/context/PagesContext';
import { SiteContext } from '@/lib/craft/context/SiteContext';
import { ThemeProvider } from '@/lib/craft/context/ThemeContext';
import { Toolbox } from '@/components/craft/Toolbox';
import { SettingsPanel } from '@/components/craft/SettingsPanel';
import { Viewport } from '@/components/craft/Viewport';
import { BackendCanvas } from '@/components/craft/BackendCanvas';
import { Toolbar } from '@/components/craft/Toolbar';
import { PreviewModal } from '@/components/craft/PreviewModal';
import { RenderNode } from '@/components/craft/RenderNode';
import { KeyboardShortcuts } from '@/components/craft/KeyboardShortcuts';
import { EditorThemeProvider, useEditorTheme } from '@/components/craft/EditorThemeContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ToastContainer } from '@/components/ui/Toast';

/** Provides SiteContext in the editor so "Another page" links use PagesContext.navigateTo in Preview. */
function EditorSiteContextBridge({ children }: { children: ReactNode }) {
  const { pages, currentPage, navigateTo } = useContext(PagesContext);
  const activePageSlug = pages.find((p) => p.id === currentPage)?.slug ?? '';
  const value = useMemo(
    () => ({
      colorScheme: 'dark' as const,
      toggleTheme: () => {},
      showThemeToggle: false,
      language: 'en',
      setLanguage: () => {},
      availableLanguages: ['en'],
      showLanguageToggle: false,
      navigateToPage: navigateTo,
      pages,
      activePageSlug,
    }),
    [pages, currentPage, navigateTo, activePageSlug]
  );
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

/** Root wrapper: applies .dark class when editor theme is dark (for Settings/mini toolbar CSS). */
function EditorRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useEditorTheme();
  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      {children}
    </div>
  );
}

/** Layout with theme-aware background and sidebar toggles (must be inside EditorThemeProvider). */
function EditorLayout({
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen,
  previewMode,
  outlines,
  editorMode,
  onAddPageNamed,
  children,
}: {
  leftPanelOpen: boolean;
  setLeftPanelOpen: (v: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (v: boolean) => void;
  previewMode: boolean;
  outlines: boolean;
  editorMode: 'frontend' | 'backend';
  onAddPageNamed?: (name: string) => void;
  children: React.ReactNode;
}) {
  const { theme } = useEditorTheme();
  const isDark = theme === 'dark';
  const areaBg = isDark ? '#141414' : '#e2e8f0';
  const btnBase = isDark
    ? { background: '#2a2a2a', border: '1px solid #383838', color: '#71717a' }
    : { background: 'rgba(248, 250, 252, 0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#64748b' };

  return (
    <div
      className={`flex-1 flex min-h-0 relative ${previewMode ? 'craft-preview-mode' : ''}`}
      data-outlines={outlines ? 'true' : 'false'}
      style={{ background: areaBg }}
    >
      {!previewMode && editorMode === 'frontend' && (
        <div
          className="flex transition-all duration-200 shrink-0 overflow-visible relative"
          style={{
            width: leftPanelOpen ? '15rem' : 0,
            minWidth: leftPanelOpen ? undefined : 0,
          }}
        >
          <div className="flex min-w-0 flex-1 overflow-hidden">
            <Toolbox onAddPageNamed={onAddPageNamed} />
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
      {!previewMode && editorMode === 'frontend' && !leftPanelOpen && (
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
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {children}
      </div>
      {!previewMode && editorMode === 'frontend' && (
        <div
          className="flex transition-all duration-200 overflow-visible relative"
          style={{
            width: rightPanelOpen ? '21rem' : 0,
            minWidth: rightPanelOpen ? undefined : 0,
            flexShrink: 0,
            marginLeft: 'auto',
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
      {!previewMode && editorMode === 'frontend' && !rightPanelOpen && (
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
  slug?: string;
  data: string | null;
  desktopData?: string | null;
  mobileData?: string | null;
};

const defaultPage: PageState = {
  id: '1',
  name: 'Page 1',
  data: null,
  desktopData: null,
  mobileData: null,
};

/** Syncs preview mode with Craft.js: when previewMode is true, editing is disabled. */
function PreviewController({ previewMode }: { previewMode: boolean }) {
  const { actions } = useEditor();
  useEffect(() => {
    actions.setOptions((opts) => { opts.enabled = !previewMode; });
  }, [previewMode, actions]);
  return null;
}

/** Applies color preset to all nodes in the current Frame via Craft.js actions. */
function ColorPresetSync() {
  const { actions, query } = useEditor();

  useEffect(() => {
    const handler = (e: Event) => {
      const { accentColor, darkBg, lightBg } = (e as CustomEvent).detail;
      try {
        const json = query.serialize();
        const nodes = JSON.parse(json) as Record<string, { props?: Record<string, unknown> }>;
        Object.entries(nodes).forEach(([id, node]) => {
          const props = node.props as Record<string, unknown>;
          if (!props) return;
          if ('accentColor' in props) {
            actions.history.ignore().setProp(id, (p: Record<string, unknown>) => {
              p.accentColor = accentColor;
            });
          }
          if ('darkBg' in props) {
            actions.history.ignore().setProp(id, (p: Record<string, unknown>) => {
              p.darkBg = darkBg;
            });
          }
          if ('lightBg' in props) {
            actions.history.ignore().setProp(id, (p: Record<string, unknown>) => {
              p.lightBg = lightBg;
            });
          }
        });
      } catch (err) {
        console.error('[ColorPresetSync] failed:', err);
      }
    };
    window.addEventListener('iam_color_preset_changed', handler);
    return () => window.removeEventListener('iam_color_preset_changed', handler);
  }, [actions, query]);

  return null;
}

/** Syncs desktop canvas to mobile in real-time when mobileData is empty. */
function DesktopToMobileSync({
  viewport,
  mobileData,
  setMobileData,
}: {
  viewport: 'desktop' | 'tablet' | 'mobile';
  mobileData: string | null;
  setMobileData: (v: string | null) => void;
}) {
  const { query, nodes } = useEditor((state) => ({ nodes: state.nodes }));

  useEffect(() => {
    if (viewport === 'desktop' && !mobileData) {
      try {
        const json = query.serialize();
        const compressed = lz.compress(json, { outputEncoding: 'Base64' });
        setMobileData(compressed);
      } catch {
        // noop
      }
    }
  }, [nodes, viewport, mobileData, setMobileData, query]);

  return null;
}

/** Applies color preset (accentColor, darkBg, lightBg) to all pages */
function applyColorPresetToAllPages(
  pages: PageState[],
  accentColor: string,
  darkBg: string,
  lightBg: string
): PageState[] {
  return pages.map((page) => {
    const applyToData = (compressed: string | null | undefined): string | null => {
      if (!compressed) return compressed ?? null;
      try {
        const json = lz.decompress(compressed, { inputEncoding: 'Base64' }) as string;
        const parsed = JSON.parse(json);
        Object.values(parsed).forEach((node: unknown) => {
          const n = node as { props?: Record<string, unknown> };
          if (!n?.props) return;
          if ('accentColor' in n.props) n.props.accentColor = accentColor;
          if ('darkBg' in n.props) n.props.darkBg = darkBg;
          if ('lightBg' in n.props) n.props.lightBg = lightBg;
        });
        return lz.compress(JSON.stringify(parsed), { outputEncoding: 'Base64' }) as string;
      } catch {
        return compressed;
      }
    };
    return {
      ...page,
      desktopData: applyToData(page.desktopData),
      mobileData: applyToData(page.mobileData),
      data: applyToData(page.data),
    };
  });
}

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const projectId = searchParams.get('id');

  const [pages, setPages] = useState<PageState[]>([defaultPage]);
  const pagesRef = useRef<PageState[]>(pages);
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);
  const [activePageId, setActivePageId] = useState('1');
  const activePageIdRef = useRef<string>(activePageId);
  useEffect(() => {
    activePageIdRef.current = activePageId;
  }, [activePageId]);
  const [loadedProject, setLoadedProject] = useState<LoadedProject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');
  const [outlines, setOutlines] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewScheme, setPreviewScheme] = useState<'dark' | 'light'>('dark');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [frameData, setFrameData] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState<number>(0);
  const [frameReady, setFrameReady] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [desktopData, setDesktopData] = useState<string | null>(null);
  const [mobileData, setMobileData] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorMode, setEditorMode] = useState<'frontend' | 'backend'>('frontend');

  const activePage = pages.find((p) => p.id === activePageId);

  // Prevent landing dark mode from leaking into editor (toolbar, Settings Panel use Tailwind dark:)
  useEffect(() => {
    const wasDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');

    return () => {
      if (wasDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      }
    };
  }, []);

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
      router.replace(`/${locale}/auth/login`);
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
        const mappedPages = craftPages.map((p: { id?: string; name?: string; slug?: string; data?: string | null; desktopData?: string | null; mobileData?: string | null }) => {
          const name = p.name || 'Page';
          const slug = p.slug ?? (name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'page');
          return {
            id: p.id || String(Math.random()),
            name,
            slug,
            data: p.data ?? null,
            desktopData: p.desktopData ?? p.data ?? null,
            mobileData: p.mobileData ?? null,
          };
        });
        setPages(mappedPages);
        const activeId = pd?.craft?.activePageId || craftPages[0].id || '1';
        setActivePageId(activeId);

        const activePage = mappedPages.find((p) => p.id === activeId);
        const dataToLoad = activePage?.desktopData ?? activePage?.data ?? null;
        if (dataToLoad) {
          try {
            const json = lz.decompress(dataToLoad, { inputEncoding: 'Base64' }) as string;
            setFrameData(json);
          } catch {
            setFrameData(null);
          }
        } else {
          setFrameData(null);
        }
        setDesktopData(activePage?.desktopData ?? activePage?.data ?? null);
        setMobileData(activePage?.mobileData ?? null);
        setViewport('desktop');
      } else {
        setFrameData(null);
      }
      setFrameReady(true);
    };

    load();
  }, [projectId, isAuthenticated, locale, router]);

  // GSAP animations in preview mode (Replay button); uses same fromTo + inViewport logic as useEffect
  const runAnimations = useCallback(async () => {
    try {
      const gsapModule = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      const gsap = (gsapModule as { gsap?: unknown; default?: unknown }).gsap || (gsapModule as { default: unknown }).default;
      (gsap as { registerPlugin: (p: unknown) => void }).registerPlugin(ScrollTrigger);
      (ScrollTrigger as { getAll: () => { kill: () => void }[] }).getAll().forEach((t) => t.kill());

      const elements = document.querySelectorAll('[data-animate]');

      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const animationType = htmlEl.getAttribute('data-animate') || '';
        if (!animationType || animationType === 'none') return;

        const delay = parseFloat(htmlEl.getAttribute('data-animate-delay') || '0');
        const fromVars: Record<string, unknown> = { immediateRender: false };
        const toVars: Record<string, unknown> = { duration: 0.8, delay, ease: 'power2.out' };

        switch (animationType) {
          case 'fade-in':
            fromVars.opacity = 0;
            toVars.opacity = 1;
            break;
          case 'slide-up':
            fromVars.opacity = 0;
            fromVars.y = 60;
            toVars.opacity = 1;
            toVars.y = 0;
            break;
          case 'slide-down':
            fromVars.opacity = 0;
            fromVars.y = -60;
            toVars.opacity = 1;
            toVars.y = 0;
            break;
          case 'slide-left':
            fromVars.opacity = 0;
            fromVars.x = -60;
            toVars.opacity = 1;
            toVars.x = 0;
            break;
          case 'blur-in':
            fromVars.opacity = 0;
            fromVars.filter = 'blur(12px)';
            toVars.opacity = 1;
            toVars.filter = 'blur(0px)';
            break;
          case 'scale-in':
            fromVars.opacity = 0;
            fromVars.scale = 0.85;
            toVars.opacity = 1;
            toVars.scale = 1;
            break;
          default:
            fromVars.opacity = 0;
            toVars.opacity = 1;
        }

        const rect = htmlEl.getBoundingClientRect();
        const inViewport = rect.top < window.innerHeight * 0.95;

        if (inViewport) {
          (gsap as { fromTo: (target: Element, from: object, to: object) => void }).fromTo(htmlEl, fromVars, { ...toVars, delay: 0.2 });
        } else {
          (gsap as { fromTo: (target: Element, from: object, to: object) => void }).fromTo(htmlEl, fromVars, {
            ...toVars,
            scrollTrigger: {
              trigger: htmlEl,
              start: 'top 85%',
              end: 'bottom 20%',
              toggleActions: 'play none none none',
              once: true,
            },
          });
        }
      });

      const cardEls = document.querySelectorAll('[data-animate-from]');
      cardEls.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const from = htmlEl.getAttribute('data-animate-from');
        if (!from || from === 'none') return;
        const fromY = from === 'slide-top' ? -80 : 80;
        (gsap as { fromTo: (target: Element, from: object, to: object) => void }).fromTo(htmlEl, { opacity: 0, y: fromY, immediateRender: false }, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: htmlEl, start: 'top 88%', once: true },
        });
      });

      (ScrollTrigger as { refresh: () => void }).refresh();
    } catch (e) {
      console.error('[GSAP] Error:', e);
    }
  }, []);

  useEffect(() => {
    if (!previewMode) {
      import('gsap/ScrollTrigger').then((m: { ScrollTrigger?: { getAll: () => { kill: () => void }[] } }) => {
        m.ScrollTrigger?.getAll?.().forEach((t) => t.kill());
      });
      return;
    }

    let timerId: ReturnType<typeof setTimeout>;

    const initPreviewAnimations = async () => {
      const gsapModule = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      const gsap = (gsapModule as { gsap?: unknown; default?: unknown }).gsap || (gsapModule as { default: unknown }).default;
      (gsap as { registerPlugin: (p: unknown) => void }).registerPlugin(ScrollTrigger);
      (ScrollTrigger as { getAll: () => { kill: () => void }[] }).getAll().forEach((t) => t.kill());

      const elements = document.querySelectorAll('[data-animate]');

      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const animationType = htmlEl.getAttribute('data-animate') || '';
        if (!animationType || animationType === 'none') return;

        const delay = parseFloat(htmlEl.getAttribute('data-animate-delay') || '0');

        const fromVars: Record<string, unknown> = { immediateRender: false };
        const toVars: Record<string, unknown> = { duration: 0.8, delay, ease: 'power2.out' };

        switch (animationType) {
          case 'fade-in':
            fromVars.opacity = 0;
            toVars.opacity = 1;
            break;
          case 'slide-up':
            fromVars.opacity = 0;
            fromVars.y = 60;
            toVars.opacity = 1;
            toVars.y = 0;
            break;
          case 'slide-down':
            fromVars.opacity = 0;
            fromVars.y = -60;
            toVars.opacity = 1;
            toVars.y = 0;
            break;
          case 'slide-left':
            fromVars.opacity = 0;
            fromVars.x = -60;
            toVars.opacity = 1;
            toVars.x = 0;
            break;
          case 'blur-in':
            fromVars.opacity = 0;
            fromVars.filter = 'blur(12px)';
            toVars.opacity = 1;
            toVars.filter = 'blur(0px)';
            break;
          case 'scale-in':
            fromVars.opacity = 0;
            fromVars.scale = 0.85;
            toVars.opacity = 1;
            toVars.scale = 1;
            break;
          default:
            fromVars.opacity = 0;
            toVars.opacity = 1;
        }

        const rect = htmlEl.getBoundingClientRect();
        const inViewport = rect.top < window.innerHeight * 0.95;

        if (inViewport) {
          (gsap as { fromTo: (target: Element, from: object, to: object) => void }).fromTo(htmlEl, fromVars, { ...toVars, delay: 0.2 });
        } else {
          (gsap as { fromTo: (target: Element, from: object, to: object) => void }).fromTo(htmlEl, fromVars, {
            ...toVars,
            scrollTrigger: {
              trigger: htmlEl,
              start: 'top 85%',
              end: 'bottom 20%',
              toggleActions: 'play none none none',
              once: true,
            },
          });
        }
      });

      const cardEls = document.querySelectorAll('[data-animate-from]');
      cardEls.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const from = htmlEl.getAttribute('data-animate-from');
        if (!from || from === 'none') return;
        const fromY = from === 'slide-top' ? -80 : 80;
        (gsap as { fromTo: (target: Element, from: object, to: object) => void }).fromTo(htmlEl, { opacity: 0, y: fromY, immediateRender: false }, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: htmlEl,
            start: 'top 88%',
            once: true,
          },
        });
      });

      (ScrollTrigger as { refresh: () => void }).refresh();
    };

    timerId = setTimeout(() => {
      initPreviewAnimations().catch((e) => console.error('[GSAP] Error:', e));
    }, 100);

    return () => {
      clearTimeout(timerId);
      import('gsap/ScrollTrigger').then((m: { ScrollTrigger?: { getAll: () => { kill: () => void }[] } }) => {
        m.ScrollTrigger?.getAll?.().forEach((t) => t.kill());
      });
    };
  }, [previewMode]);

  const handleSaveFromEditor = useCallback(
    async (serializedJson: string) => {
      if (!projectId || !loadedProject || isSaving) return;

      setIsSaving(true);
      try {
        const compressed = lz.compress(serializedJson, { outputEncoding: 'Base64' });
        const latestDesktop = viewport === 'desktop' ? compressed : (desktopData ?? compressed);
        const latestMobile = viewport !== 'desktop' ? compressed : (mobileData ?? null);
        const updatedPages = pages.map((p) =>
          p.id === activePageId
            ? { ...p, data: latestDesktop, desktopData: latestDesktop, mobileData: latestMobile }
            : p
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
          { craft: { schemaVersion: 2, pages: updatedPages, activePageId } },
          null,
          loadedProject.version
        );

        if (error) {
          console.error('Save failed:', error);
          return;
        }
        setPages(updatedPages);
        setDesktopData(latestDesktop);
        setMobileData(latestMobile);
        setHasUnsavedChanges(false);
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, loadedProject, pages, activePageId, isSaving, viewport, desktopData, mobileData]
  );

  const handleBackendAuthSuccess = useCallback(
    async (url: string, anonKey: string) => {
      if (!loadedProject || !url || !anonKey) return;
      // Use ref so we always inject into ALL current pages (avoid stale closure)
      const currentPages = pagesRef.current;
      const inject = (raw: string) => injectSupabaseCredentialsIntoCraftJson(raw, url, anonKey);
      const updatedPages = currentPages.map((p) => {
        const rawDesktop = p.desktopData ?? p.data ?? null;
        const rawMobile = p.mobileData ?? null;
        const updatedDesktop =
          rawDesktop
            ? lz.compress(inject(lz.decompress(rawDesktop, { inputEncoding: 'Base64' }) as string), { outputEncoding: 'Base64' })
            : rawDesktop;
        const updatedMobile =
          rawMobile
            ? lz.compress(inject(lz.decompress(rawMobile, { inputEncoding: 'Base64' }) as string), { outputEncoding: 'Base64' })
            : rawMobile;
        return {
          ...p,
          data: updatedDesktop ?? p.data,
          desktopData: updatedDesktop ?? p.desktopData,
          mobileData: updatedMobile ?? p.mobileData,
        };
      });
      setPages(updatedPages);
      const project = {
        id: loadedProject.id,
        name: loadedProject.name,
        description: loadedProject.description,
        pages: [],
        metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0.0' },
      } as Parameters<typeof saveProjectToSupabase>[0];
      await saveProjectToSupabase(
        project,
        null,
        { craft: { schemaVersion: 2, pages: updatedPages, activePageId } },
        null,
        loadedProject.version
      );
    },
    [loadedProject, activePageId]
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
        currentPageJson && lz.compress(currentPageJson, { outputEncoding: 'Base64' });
      const latestDesktop = viewport === 'desktop' ? compressed : (desktopData ?? compressed);
      const latestMobile = viewport !== 'desktop' ? compressed : (mobileData ?? null);
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId
            ? { ...p, data: latestDesktop, desktopData: latestDesktop, mobileData: latestMobile }
            : p
        )
      );
      const targetPage = pages.find((p) => p.id === targetId);
      const dataToLoad = targetPage?.desktopData ?? targetPage?.data ?? null;
      if (dataToLoad) {
        try {
          const json = lz.decompress(dataToLoad, { inputEncoding: 'Base64' }) as string;
          setFrameData(json);
        } catch {
          setFrameData(null);
        }
      } else {
        setFrameData(null);
      }
      setDesktopData(targetPage?.desktopData ?? targetPage?.data ?? null);
      setMobileData(targetPage?.mobileData ?? null);
      setViewport('desktop');
      setActivePageId(targetId);
    },
    [activePageId, pages, viewport, desktopData, mobileData]
  );

  const handleAddPage = () => {
    const newId = String(Date.now());
    const name = `Page ${pages.length + 1}`;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'page';
    setPages((prev) => [
      ...prev,
      { id: newId, name, slug, data: null, desktopData: null, mobileData: null },
    ]);
    setActivePageId(newId);
    setFrameData(null);
    setDesktopData(null);
    setMobileData(null);
  };

  const handleDeletePage = useCallback(
    async (pageId: string) => {
      if (pages.length <= 1 || !loadedProject) return;
      const newPages = pages.filter((p) => p.id !== pageId);
      setPages(newPages);
      const newActiveId = activePageId === pageId ? newPages[0].id : activePageId;
      if (activePageId === pageId) {
        setActivePageId(newPages[0].id);
        const first = newPages[0];
        const dataToLoad = first.desktopData ?? first.data ?? null;
        if (dataToLoad) {
          try {
            const json = lz.decompress(dataToLoad, { inputEncoding: 'Base64' }) as string;
            setFrameData(json);
          } catch {
            setFrameData(null);
          }
        } else {
          setFrameData(null);
        }
        setDesktopData(first.desktopData ?? first.data ?? null);
        setMobileData(first.mobileData ?? null);
        setViewport('desktop');
      }
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
        { craft: { schemaVersion: 2, pages: newPages, activePageId: newActiveId } },
        null,
        loadedProject.version
      );
      if (error) console.error('Delete page save failed:', error);
    },
    [pages, activePageId, loadedProject]
  );

  // Listen for color preset changes and apply to all pages
  useEffect(() => {
    const handler = (e: Event) => {
      const { accentColor, darkBg, lightBg } = (e as CustomEvent).detail;
      setPages((prev) => {
        const updated = applyColorPresetToAllPages(prev, accentColor, darkBg, lightBg);
        // Schedule Frame reload AFTER state update completes
        const currentPage = updated.find((p) => p.id === activePageId);
        if (currentPage) {
          const dataToLoad = viewport === 'desktop'
            ? (currentPage.desktopData ?? currentPage.data)
            : (currentPage.mobileData ?? currentPage.desktopData ?? currentPage.data);
          if (dataToLoad) {
            try {
              const json = lz.decompress(dataToLoad, { inputEncoding: 'Base64' }) as string;
              setTimeout(() => {
                setFrameData(json);
                setFrameKey((k) => k + 1);
              }, 0);
            } catch {
              // ignore
            }
          }
        }
        return updated;
      });
      setHasUnsavedChanges(true);
    };
    window.addEventListener('iam_color_preset_changed', handler);
    return () => window.removeEventListener('iam_color_preset_changed', handler);
  }, [activePageId, viewport]);

  // Listen for color scheme changes and apply to all pages
  useEffect(() => {
    const handler = (e: Event) => {
      const { colorScheme, accentColor, darkBg, lightBg } = (e as CustomEvent).detail;
      setPages((prev) => {
        const updated = prev.map((page) => {
          const applyToData = (compressed: string | null | undefined): string | null => {
            if (!compressed) return compressed ?? null;
            try {
              const json = lz.decompress(compressed, { inputEncoding: 'Base64' }) as string;
              const parsed = JSON.parse(json);
              Object.values(parsed).forEach((node: unknown) => {
                const n = node as { props?: Record<string, unknown> };
                if (!n?.props) return;
                if ('colorScheme' in n.props) n.props.colorScheme = colorScheme;
                if ('accentColor' in n.props) n.props.accentColor = accentColor;
                if ('darkBg' in n.props) n.props.darkBg = darkBg;
                if ('lightBg' in n.props) n.props.lightBg = lightBg;
              });
              return lz.compress(JSON.stringify(parsed), { outputEncoding: 'Base64' }) as string;
            } catch {
              return compressed;
            }
          };
          return {
            ...page,
            desktopData: applyToData(page.desktopData),
            mobileData: applyToData(page.mobileData),
            data: applyToData(page.data),
          };
        });
        const currentPage = updated.find((p) => p.id === activePageId);
        if (currentPage) {
          const dataToLoad = viewport === 'desktop'
            ? (currentPage.desktopData ?? currentPage.data)
            : (currentPage.mobileData ?? currentPage.desktopData ?? currentPage.data);
          if (dataToLoad) {
            try {
              const json = lz.decompress(dataToLoad, { inputEncoding: 'Base64' }) as string;
              setTimeout(() => {
                setFrameData(json);
                setFrameKey((k) => k + 1);
              }, 0);
            } catch {
              // ignore
            }
          }
        }
        return updated;
      });
      setHasUnsavedChanges(true);
    };
    window.addEventListener('iam_color_scheme_changed', handler);
    return () => window.removeEventListener('iam_color_scheme_changed', handler);
  }, [activePageId, viewport]);

  // Warn on browser close/reload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Wait for project load before mounting Editor so Frame gets correct data on first paint
  if (authLoading || !isAuthenticated || !projectId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#141414] text-gray-400">
        Loading...
      </div>
    );
  }
  if (loadedProject === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#141414] text-gray-400">
        Loading project...
      </div>
    );
  }

  return (
    <EditorThemeProvider>
      <EditorRoot>
      <Editor
        resolver={{
          Container,
          HeroTron,
          HeroTronHeading,
          HeroTronSubheading,
          HeroTronButton,
          HeaderTron,
          TronFeatures,
          FeatureCard,
          TronStats,
          StatItem,
          TronPortfolio,
          TronTestimonials,
          TestimonialCard,
          TronPricing,
          PricingCard,
          TronFAQ,
          FAQItem,
          TronFooter,
          FooterColumn,
          TronContact,
          TronShowcase,
          TronLogin,
          TronRegister,
          TronHub,
          HtmlBlock,
        }}
        onRender={RenderNode}
        indicator={{
          success: '#3b82f6',
          error: 'transparent',
          transition: 'none',
          thickness: 3,
        }}
        onNodesChange={() => setHasUnsavedChanges(true)}
      >
        <ThemeProvider>
        <PagesProvider
          pages={pages}
          activePageId={activePageId}
          onPageChange={handlePageChange}
        >
        <EditorSiteContextBridge>
        <PreviewController previewMode={previewMode} />
        <ColorPresetSync />
        <DesktopToMobileSync
          viewport={viewport}
          mobileData={mobileData}
          setMobileData={setMobileData}
        />
        <Toolbar
          onSave={handleSaveFromEditor}
          onPreview={handlePreview}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
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
          previewScheme={previewScheme}
          setPreviewScheme={setPreviewScheme}
          onReplayAnimations={runAnimations}
          projectId={projectId}
          projectName={loadedProject?.name}
          onRenameProject={handleRenameProject}
          hasUnsavedChanges={hasUnsavedChanges}
          editorMode={editorMode}
          onModeChange={setEditorMode}
        />
        <EditorLayout
          leftPanelOpen={leftPanelOpen}
          setLeftPanelOpen={setLeftPanelOpen}
          rightPanelOpen={rightPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
          previewMode={previewMode}
          outlines={outlines}
          editorMode={editorMode}
          onAddPageNamed={(name: string) => {
            const newId = String(Date.now());
            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'page';
            setPages((prev) => [...prev, { id: newId, name, slug, data: null, desktopData: null, mobileData: null }]);
            setActivePageId(newId);
            setFrameData(null);
            setDesktopData(null);
            setMobileData(null);
          }}
        >
          {editorMode === 'frontend' ? (
          <Viewport
            viewport={viewport}
            setViewport={setViewport}
            desktopData={desktopData}
            setDesktopData={setDesktopData}
            mobileData={mobileData}
            setMobileData={setMobileData}
            previewMode={previewMode}
          >
            {frameReady && (
              <div style={{ width: '100%', minHeight: '100vh', background: '#ffffff' }}>
                <Frame key={`${activePageId}-${frameKey}`} data={frameData ?? undefined}>
                  <Element
                    is={Container}
                    canvas
                    style={{
                      minHeight: '100vh',
                      display: 'flex',
                      flexDirection: 'column',
                      paddingBottom: '120px',
                    }}
                  >
                  </Element>
                </Frame>
              </div>
            )}
          </Viewport>
          ) : (
            <BackendCanvas
              projectId={projectId ?? null}
              onConnectSuccess={handleBackendAuthSuccess}
            />
          )}
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
        </EditorSiteContextBridge>
        </PagesProvider>
        </ThemeProvider>
      </Editor>
      <ToastContainer />
      </EditorRoot>
    </EditorThemeProvider>
  );
}
