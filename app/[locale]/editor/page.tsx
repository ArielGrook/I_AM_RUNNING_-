/**
 * Editor Page
 * 
 * Main editor interface with Grape.js, project management, and component catalog.
 * 
 * Stage 1 Integration:
 * - Project System (store, auto-save, name form)
 * - Editor Structure (Grape.js with custom blocks)
 * - Error Boundary for stability
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { ArrowLeft, Plus, Download, Upload, Save, Check, MessageSquare, Eye, Monitor, Tablet, Smartphone, Undo2, Redo2 } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GrapeEditor, type GrapeEditorRef } from '@/components/editor/GrapeEditor';
import { ProjectNameForm } from '@/components/editor/ProjectNameForm';
import { ImportProgressDialog } from '@/components/editor/ImportProgressDialog';
import { useProjectStore } from '@/lib/store/project-store';
// Manual save replaces auto-save - see handleManualSave function
import { componentCatalog, getAllCategories } from '@/lib/components/catalog';
import { getComponentCatalog, type SupabaseComponent } from '@/lib/components/supabase-catalog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { parseTemplate } from '@/lib/parser/simple-parser';
import type { ParseProgress } from '@/lib/parser/v2/types';
import { SaveComponentDialog } from '@/components/editor/SaveComponentDialog';
import { SearchInput } from '@/components/ui/search-input';
import { StyleManager } from '@/components/editor/StyleManager';
import { Category } from '@/lib/types/project';
import { supabase } from '@/lib/supabase/client';
import { JsonContract } from '@/lib/types/chat';
import { applyContractToEditor } from '@/lib/utils/apply-contract';
import { 
  isDemoMode, 
  canCreateProject, 
  canSaveOrExport,
  getRemainingDemoTimeFormatted,
  incrementDemoProjectCount,
} from '@/lib/utils/demo-mode';
import { getUserPackage, hasFeatureAccess } from '@/lib/utils/user-package';
import { saveProjectToSupabase, loadProjectFromSupabase, listProjectsFromSupabase, type LoadedProject } from '@/lib/store/supabase-sync';
import dynamic from 'next/dynamic';
import './editor-dark-mode.css';

// Lazy load heavy components for better performance
const ChatPanel = dynamic(() => import('@/components/editor/ChatPanel').then(mod => ({ default: mod.ChatPanel })), {
  loading: () => <div className="text-center p-4">Loading chat...</div>,
  ssr: false,
});

const PackageSelector = dynamic(() => import('@/components/payment/PackageSelector').then(mod => ({ default: mod.PackageSelector })), {
  loading: () => <div className="text-center p-4">Loading packages...</div>,
  ssr: false,
});

const PreviewModal = dynamic(() => import('@/components/editor/PreviewModal').then(mod => ({ default: mod.PreviewModal })), {
  loading: () => null,
  ssr: false,
});

export default function EditorPage() {
  const t = useTranslations('EditorPage');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, canAccessEditor, role } = useAuth();
  
  // Guard: Redirect if not authenticated or no editor access
  useEffect(() => {
    console.log('🔍 Editor guard check:', {
      isAuthenticated,
      canAccessEditor,
      role,
      loading: authLoading,
    });
    
    if (authLoading) {
      console.log('⏳ Editor: Auth still loading, waiting...');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('🚫 Editor: Not authenticated, redirecting to login');
      router.push(`/${locale}/auth/login?redirect=/${locale}/dashboard`);
      return;
    }
    
    if (!canAccessEditor) {
      console.log(`🚫 Editor: Access denied (role: ${role}), redirecting to subscription`);
      router.push(`/${locale}/subscription?reason=editor_access&current_role=${role}`);
      return;
    }
    
    console.log(`✅ Editor: Access granted (role: ${role})`);
  }, [isAuthenticated, canAccessEditor, role, authLoading, router]);
  
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }
  
  // Don't render if no access (redirect will happen)
  if (!isAuthenticated || !canAccessEditor) {
    return null;
  }
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  
  // Close sidebars on mobile by default
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  }, []); // Only run on mount
  
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<ParseProgress | null>(null);
  const [showImportProgress, setShowImportProgress] = useState(false);
  
  // Multi-page template support
  const [pages, setPages] = useState<Array<{ name: string; html: string; css: string }>>([]);
  const [activePage, setActivePage] = useState(0);
  const [showSaveComponent, setShowSaveComponent] = useState(false);
  const [components, setComponents] = useState<SupabaseComponent[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<SupabaseComponent[]>([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [demoRemainingTime, setDemoRemainingTime] = useState<string>('');
  const [showPackageSelector, setShowPackageSelector] = useState(false);
  const [userPackage, setUserPackage] = useState<import('@/lib/utils/user-package').UserPackage | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewWatermarked, setPreviewWatermarked] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [loadedFromSupabase, setLoadedFromSupabase] = useState(false);
  const supabaseLoadedProjectIdRef = useRef<string | null>(null);
  const loadedProjectDataRef = useRef<{ projectData: Record<string, unknown>; loadedFrom: 'data' | 'contract' } | null>(null);
  const grapeEditorRef = useRef<GrapeEditorRef>(null);
  const searchParams = useSearchParams();
  const [darkMode, setDarkMode] = useState(false);

  // Sync dark mode with dashboard preference (localStorage + document class)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkNow = document.documentElement.classList.contains('dark');
          setDarkMode(isDarkNow);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', next.toString());
    }
  };

  // Check demo mode
  const isDemo = isDemoMode();
  const canCreate = canCreateProject();
  const canSave = canSaveOrExport();
  
  const { 
    currentProject, 
    createProject,
    updateProject,
    loadProject,
    setSaveStatus: setStoreSaveStatus,
  } = useProjectStore();
  
  // Manual save state
  const [saveStatus, setSaveStatus] = useState<import('@/lib/types/project').SaveStatus>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Manual save function (localStorage + Supabase) - One-Way Ejection
  // Multi-page: when pages.length > 0, builds full projectData with ALL pages before save
  const handleManualSave = useCallback(async () => {
    if (!currentProject || isSaving) return;

    if (!canSave) {
      setShowPackageSelector(true);
      return;
    }

    const grapesEditor = grapeEditorRef.current?.getEditor();
    if (!grapesEditor) {
      console.error('❌ Cannot save: editor not initialized');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveStatus('saving');
    setStoreSaveStatus('saving');

    try {
      // Force Zustand to persist by updating timestamp (localStorage backup)
      updateProject({
        metadata: {
          ...currentProject.metadata,
          updatedAt: new Date().toISOString(),
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log('💾 Saving project to Supabase...');

      let result: { data?: { id: string }; error?: unknown };

      if (pages.length > 0) {
        // Multi-page: sync active page from editor, build full projectData with ALL pages
        const pagesCopy = pages.map((p, i) =>
          i === activePage
            ? { ...p, html: grapesEditor.getHtml?.() ?? p.html, css: grapesEditor.getCss?.() ?? p.css }
            : p
        );
        const fullProjectData = {
          ...grapesEditor.getProjectData?.(),
          pages: pagesCopy.map((p) => ({
            component: p.html,
            styles: p.css,
            name: p.name,
          })),
        };
        result = await saveProjectToSupabase(currentProject, null, fullProjectData);
      } else {
        result = await saveProjectToSupabase(currentProject, grapesEditor);
      }

      if (result.error) {
        console.error('❌ Save failed:', result.error);
        setSaveStatus('error');
        setStoreSaveStatus('error');
        return;
      }

      console.log('[Manual Save] ✅ Project saved to Supabase');

      if (currentProject.id) {
        const newUrl = `/${locale}/editor?id=${currentProject.id}`;
        window.history.replaceState({}, '', newUrl);
      }

      setSaveStatus('saved');
      setStoreSaveStatus('saved');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('[Manual Save] ❌ Failed:', error);
      setSaveStatus('error');
      setStoreSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [currentProject, isSaving, canSave, setStoreSaveStatus, updateProject, locale, pages, activePage]);

  // Load project from Supabase when editor opens - One-Way Ejection
  // No project ID → redirect to dashboard (user must choose project there)
  useEffect(() => {
    if (!isAuthenticated || loadedFromSupabase) return;

    async function loadInitialProject() {
      try {
        const projectId = searchParams.get('id');

        if (!projectId) {
          console.log('⚠️ No project ID, redirecting to dashboard');
          router.push(`/${locale}/dashboard`);
          setLoadedFromSupabase(true);
          return;
        }

        console.log('📂 Loading project from Supabase:', projectId);
        const loaded = await loadProjectFromSupabase(projectId);
        if (!loaded) {
          console.log('⚠️ Project not found, redirecting to dashboard');
          router.push(`/${locale}/dashboard`);
          setLoadedFromSupabase(true);
          return;
        }

        console.log('✅ Found project:', loaded.name, `(loaded from ${loaded.loadedFrom})`);

        loadedProjectDataRef.current = {
          projectData: loaded.projectData as Record<string, unknown>,
          loadedFrom: loaded.loadedFrom,
        };
        supabaseLoadedProjectIdRef.current = loaded.id;

        const now = new Date().toISOString();
        loadProject({
          id: loaded.id,
          name: loaded.name,
          description: loaded.description ?? '',
          pages: [{ id: '1', name: 'Home', slug: 'index', components: [], styles: '' }],
          metadata: { createdAt: now, updatedAt: now, version: '1.0.0' },
        });
      } catch (error) {
        console.error('❌ Error loading from Supabase:', error);
      } finally {
        setLoadedFromSupabase(true);
      }
    }

    loadInitialProject();
  }, [isAuthenticated, loadedFromSupabase, searchParams, loadProject, router, locale]);

  // Push projectData into GrapesJS editor - One-Way Ejection
  // Multi-page: restores all pages to state and loads first page into canvas
  useEffect(() => {
    const payload = loadedProjectDataRef.current;
    if (!payload || !grapeEditorRef.current) return;

    const grapesEditor = grapeEditorRef.current.getEditor();
    if (!grapesEditor) return;

    const pushToEditor = () => {
      if (!grapeEditorRef.current) return;
      const editor = grapeEditorRef.current.getEditor();
      if (!editor) return;

      const { projectData, loadedFrom } = payload;
      try {
        console.log('🎨 Loading project data into GrapesJS...');

        const rawPages = projectData?.pages as Array<{ component?: string; styles?: string; name?: string }> | undefined;
        const pagesCount = rawPages?.length ?? 0;

        if (pagesCount > 1) {
          // Multi-page: restore all pages to state, load first into canvas
          const restoredPages = rawPages!.map((p) => ({
            name: p.name || 'Page',
            html: typeof p.component === 'string' ? p.component : '',
            css: typeof p.styles === 'string' ? p.styles : '',
          }));
          setPages(restoredPages);
          setActivePage(0);
          const first = restoredPages[0];
          if (first?.html) editor.setComponents(first.html);
          if (first?.css) editor.setStyle(first.css);
          setImportResult({ css: '' }); // Each page has its own full styles
          console.log(`✅ Loaded ${pagesCount} page(s) into editor`);
          restoredPages.forEach((p, idx) => {
            console.log(`  Page ${idx + 1}:`, p.name || 'Untitled');
          });
        } else if (loadedFrom === 'data' && projectData && typeof projectData === 'object') {
          try {
            editor.loadProjectData(projectData);
            const wrapper = editor.getWrapper?.();
            const count = wrapper?.components?.()?.length ?? 0;
            console.log('✅ Project loaded into editor (GrapesJS native)');
            console.log('📊 Components in editor:', count);
          } catch {
            fallbackSetComponents(editor, projectData);
          }
        } else {
          fallbackSetComponents(editor, projectData);
        }
      } catch (error) {
        console.error('❌ Failed to load into editor:', error);
      } finally {
        loadedProjectDataRef.current = null;
        supabaseLoadedProjectIdRef.current = null;
      }
    };

    function fallbackSetComponents(ed: ReturnType<typeof grapeEditorRef.current.getEditor>, pd: Record<string, unknown>) {
      const pdPages = pd?.pages as Array<{ component?: string; components?: unknown; styles?: string }> | undefined;
      const first = pdPages?.[0];
      let html = '';
      let css = '';

      if (first?.component && typeof first.component === 'string') {
        html = first.component;
      } else if (Array.isArray(first?.components)) {
        html = (first!.components as Array<{ props?: { html?: string } }>)
          .map((c) => c?.props?.html || '')
          .filter(Boolean)
          .join('\n');
      }
      if (first?.styles) css = String(first.styles);
      else if (pd?.globalStyles) css = String(pd.globalStyles);

      if (html) grapeEditorRef.current!.setComponents(html);
      if (css) grapeEditorRef.current!.setStyle(css);
      console.log('✅ Project loaded into editor (fallback setComponents)');
    }

    const t = setTimeout(pushToEditor, 500);
    return () => clearTimeout(t);
  }, [currentProject]);

  // Check for chat query parameter on mount
  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam === 'open') {
      setChatOpen(true);
    }
  }, [searchParams]);

  // Sync undo/redo state from editor
  useEffect(() => {
    if (!currentProject || !grapeEditorRef.current) {
      setCanUndo(false);
      setCanRedo(false);
      return;
    }
    
    const updateUndoRedoState = () => {
      if (grapeEditorRef.current) {
        setCanUndo(grapeEditorRef.current.canUndo || false);
        setCanRedo(grapeEditorRef.current.canRedo || false);
      }
    };
    
    // Update immediately
    updateUndoRedoState();
    
    // Set up interval to check state periodically (editor updates state internally)
    // Reduced frequency to 200ms for better performance
    const interval = setInterval(updateUndoRedoState, 200);
    
    return () => clearInterval(interval);
  }, [currentProject]);
  
  // Update state after undo/redo operations
  const handleUndo = useCallback(() => {
    grapeEditorRef.current?.undo();
    // Small delay to allow editor state to update
    setTimeout(() => {
      if (grapeEditorRef.current) {
        setCanUndo(grapeEditorRef.current.canUndo || false);
        setCanRedo(grapeEditorRef.current.canRedo || false);
      }
    }, 50);
  }, []);
  
  const handleRedo = useCallback(() => {
    grapeEditorRef.current?.redo();
    // Small delay to allow editor state to update
    setTimeout(() => {
      if (grapeEditorRef.current) {
        setCanUndo(grapeEditorRef.current.canUndo || false);
        setCanRedo(grapeEditorRef.current.canRedo || false);
      }
    }, 50);
  }, []);
  
  // Load user package on mount
  useEffect(() => {
    const loadPackage = async () => {
      const pkg = await getUserPackage();
      setUserPackage(pkg);
    };
    loadPackage();
  }, []);
  
  // Load components from Supabase on mount
  useEffect(() => {
    const loadComponents = async () => {
      setIsLoadingComponents(true);
      try {
        const catalog = await getComponentCatalog(false); // Public components only for now
        setComponents(catalog);
        setFilteredComponents(catalog);
      } catch (error) {
        console.error('Failed to load components:', error);
        // Fallback to static catalog
        const fallback = convertStaticCatalogToSupabase();
        setComponents(fallback);
        setFilteredComponents(fallback);
      } finally {
        setIsLoadingComponents(false);
      }
    };
    
    loadComponents();
  }, []);
  
  // Filter components by category and search query
  useEffect(() => {
    let filtered = components;
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredComponents(filtered);
  }, [components, selectedCategory, searchQuery]);
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Handle JSON contract application
  const handleApplyContract = async (contract: JsonContract) => {
    if (!grapeEditorRef.current) {
      console.error('Editor not available');
      return;
    }
    
    const editor = grapeEditorRef.current.getEditor();
    if (!editor) {
      console.error('Grape.js editor not initialized');
      return;
    }
    
    try {
      await applyContractToEditor(editor, contract);
      // Show success message
      console.log('Contract applied successfully');
    } catch (error) {
      console.error('Failed to apply contract:', error);
      alert('Failed to apply changes. Please try again.');
    }
  };
  
  // Convert static catalog to Supabase format (fallback)
  const convertStaticCatalogToSupabase = (): SupabaseComponent[] => {
    return componentCatalog.flatMap(template => 
      Object.entries(template.variants).map(([style, html]) => ({
        id: `${template.id}-${style}`,
        name: `${template.name} (${style})`,
        category: template.category,
        style: style as import('@/lib/types/project').StyleVariant,
        html: html.trim(),
        description: template.description,
        thumbnail: template.thumbnail,
        tags: [template.category, style],
        is_public: true,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );
  };
  
  // Update demo remaining time
  useEffect(() => {
    if (isDemo) {
      const updateTime = () => {
        setDemoRemainingTime(getRemainingDemoTimeFormatted());
      };
      updateTime();
      const interval = setInterval(updateTime, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [isDemo]);
  
  // Check for saved project on mount
  useEffect(() => {
    if (!currentProject) {
      // Check demo mode limits
      if (isDemo && !canCreate) {
        // Demo limit reached
        return;
      }
      
      // Check localStorage for saved project
      const saved = localStorage.getItem('project-storage');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.state?.currentProject) {
            loadProject(parsed.state.currentProject);
          } else if (canCreate) {
            setShowProjectForm(true);
          }
        } catch {
          if (canCreate) {
            setShowProjectForm(true);
          }
        }
      } else if (canCreate) {
        setShowProjectForm(true);
      }
    }
  }, [currentProject, loadProject, isDemo, canCreate]);
  
  // Handle Grape.js editor updates
  const handleEditorUpdate = useCallback((html: string, css: string) => {
    if (!currentProject) return;
    
    const currentPage = currentProject.pages[0];
    if (currentPage) {
      updateProject({
        pages: [
          {
            ...currentPage,
            styles: css,
            // TODO: Parse HTML to components for better structure
          },
        ],
      });
    }
  }, [currentProject, updateProject]);
  
  // Handle import with SimpleParser V3 (converts images to base64, injects CSS properly)
  const handleImport = async () => {
    console.log('[ZIP Import] 🚀 handleImport() called');
    
    if (!canSave) {
      console.warn('[ZIP Import] ❌ Demo mode limit reached');
      alert('Demo mode limit reached. Please upgrade to import projects.');
      return;
    }
    
    // Check if FileReader is available (browser-only API)
    if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
      console.error('[ZIP Import] ❌ FileReader not available - must run in browser');
      alert('Import requires browser environment. FileReader API not available.');
      return;
    }
    
    console.log('[ZIP Import] ✅ Creating file input dialog...');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        console.warn('[ZIP Import] ❌ No file selected');
        return;
      }
      
      console.log('[ZIP Import] ✅ File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Check file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        console.error('[ZIP Import] ❌ File size exceeded:', file.size);
        alert(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
        return;
      }
      
      console.log('[ZIP Import] 📊 Showing progress dialog...');
      setShowImportProgress(true);
      setImportProgress({
        stage: 'reading',
        progress: 0,
        message: 'Reading ZIP file...',
      });
      
      try {
        // Clear canvas FIRST
        console.log('[ZIP Import] 🧹 Clearing canvas...');
        if (grapeEditorRef.current) {
          grapeEditorRef.current.clear();
        }
        // Clear pages state
        setPages([]);
        setActivePage(0);
        setImportResult(null);
        
        // Wait for GrapesJS to create localStorage keys, then clear them
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Clear ALL localStorage keys starting with 'gjs-' AFTER clearing canvas
        console.log('[ZIP Import] 🗑️ Clearing ALL localStorage...');
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('gjs-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[ZIP Import] ✅ Cleared ${keysToRemove.length} localStorage keys`);
        
        // Also clear project-storage
        localStorage.removeItem('project-storage');
        
        // Ensure editor is ready
        const grapesEditor = grapeEditorRef.current?.getEditor();
        if (!grapesEditor) {
          throw new Error('Editor not ready. Please wait for editor to initialize.');
        }
        
        // Use SimpleParser V3 to parse the ZIP file
        console.log('[ZIP Import] 📦 Starting SimpleParser V3...');
        
        // Update progress
        setImportProgress({
          stage: 'html',
          progress: 50,
          message: 'Parsing ZIP file with SimpleParser V3...',
        });
        
        const result = await parseTemplate(file, true); // true = debug mode
        
        console.log('[ZIP Import] ✅ SimpleParser V3 complete:', {
          pagesCount: result.pages.length,
          cssLength: result.css.length,
          stats: result.stats,
        });
        
        // Store all pages for tab navigation
        setPages(result.pages);
        setActivePage(0);
        setImportResult({ css: result.css }); // Store CSS for page switching
        
        // Set content directly in editor (first page)
        console.log('[ZIP Import] 🎯 Setting components in editor...');
        
        // Wait a bit for canvas to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set HTML from first page
        const firstPage = result.pages[0];
        
        // Count elements in original HTML
        const countElements = (html: string) => {
          const divs = (html.match(/<div/gi) || []).length;
          const spans = (html.match(/<span/gi) || []).length;
          const imgs = (html.match(/<img/gi) || []).length;
          const scripts = (html.match(/<script/gi) || []).length;
          const links = (html.match(/<a\s/gi) || []).length;
          const buttons = (html.match(/<button/gi) || []).length;
          const inputs = (html.match(/<input/gi) || []).length;
          const tables = (html.match(/<table/gi) || []).length;
          const sections = (html.match(/<section/gi) || []).length;
          return { divs, spans, imgs, scripts, links, buttons, inputs, tables, sections };
        };
        
        const originalStats = countElements(firstPage.html);
        console.log('[ZIP Import] 📊 Original HTML statistics:', originalStats);
        console.log(`[ZIP Import] 📏 Original HTML length: ${firstPage.html.length} chars`);
        
        // Set components in editor
        // КРИТИЧЕСКИ ВАЖНО: Передаем HTML БЕЗ обработки - GrapesJS должен сохранить все элементы
        console.log('[ZIP Import] 🎯 Setting components in editor (preserving all elements)...');
        console.log('[ZIP Import] 📋 HTML preview (first 1000 chars):', firstPage.html.substring(0, 1000));
        
        grapeEditorRef.current?.setComponents(firstPage.html);
        
        // Set CSS (shared CSS + first page CSS)
        // КРИТИЧЕСКИ ВАЖНО: CSS уже в HTML как <style> тег из парсера
        // setStyle добавляет CSS в canvas.styles, но основной CSS уже в HTML
        const allCss = result.css + (firstPage.css ? '\n' + firstPage.css : '');
        if (allCss.trim()) {
          console.log('[ZIP Import] 🎨 Setting additional CSS via setStyle (length:', allCss.length, 'chars)');
          grapeEditorRef.current?.setStyle(allCss);
        } else {
          console.log('[ZIP Import] ℹ️ No additional CSS to set (CSS already in HTML <style> tag)');
        }
        
        // Проверить что <style> тег присутствует в HTML
        if (firstPage.html.includes('<style')) {
          console.log('[ZIP Import] ✅ HTML contains <style> tag - CSS preserved in HTML');
        } else {
          console.warn('[ZIP Import] ⚠️ HTML does NOT contain <style> tag - CSS may be missing!');
        }
        
        // Wait a bit for GrapesJS to process
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Count elements in editor after setComponents
        // Reuse grapesEditor variable declared earlier (line 508)
        if (grapesEditor) {
          const components = grapesEditor.getComponents();
          
          // Recursively count all nested components
          const countNestedComponents = (component: any): { divs: number; spans: number; imgs: number; total: number } => {
            let divs = 0;
            let spans = 0;
            let imgs = 0;
            let total = 1;
            
            const tagName = component.get?.('tagName')?.toLowerCase() || '';
            if (tagName === 'div') divs = 1;
            if (tagName === 'span') spans = 1;
            if (tagName === 'img') imgs = 1;
            
            const children = component.components?.() || [];
            children.forEach((child: any) => {
              const childCount = countNestedComponents(child);
              divs += childCount.divs;
              spans += childCount.spans;
              imgs += childCount.imgs;
              total += childCount.total;
            });
            
            return { divs, spans, imgs, total };
          };
          
          const editorStats = components.reduce((acc: any, comp: any) => {
            const stats = countNestedComponents(comp);
            return {
              divs: acc.divs + stats.divs,
              spans: acc.spans + stats.spans,
              imgs: acc.imgs + stats.imgs,
              total: acc.total + stats.total,
            };
          }, { divs: 0, spans: 0, imgs: 0, total: 0 });
          
          console.log('[ZIP Import] 📊 Editor components statistics:', editorStats);
          console.log(`[ZIP Import] 📏 Total components in editor: ${editorStats.total}`);
          
          // Compare original vs editor
          const divDiff = originalStats.divs - editorStats.divs;
          const spanDiff = originalStats.spans - editorStats.spans;
          const imgDiff = originalStats.imgs - editorStats.imgs;
          
          if (divDiff > 0 || spanDiff > 0 || imgDiff > 0) {
            console.warn(`[ZIP Import] ⚠️ ELEMENTS LOST:`, {
              divs: `${originalStats.divs} → ${editorStats.divs} (lost: ${divDiff})`,
              spans: `${originalStats.spans} → ${editorStats.spans} (lost: ${spanDiff})`,
              imgs: `${originalStats.imgs} → ${editorStats.imgs} (lost: ${imgDiff})`,
            });
          } else {
            console.log('[ZIP Import] ✅ All elements preserved!');
          }
        }
        
        console.log('[ZIP Import] ✅ Components and styles set in editor');
        console.log(`[ZIP Import] 📄 Loaded ${result.pages.length} page(s):`, result.pages.map((p: { name: string }) => p.name));
        
        // Update progress to complete
        const totalHtmlSize = result.pages.reduce((sum: number, p: { html: string }) => sum + p.html.length, 0);
        setImportProgress({
          stage: 'complete',
          progress: 100,
          message: `✅ Import complete! ${result.pages.length} page(s), ${(totalHtmlSize / 1024).toFixed(1)}KB HTML, ${(result.css.length / 1024).toFixed(1)}KB CSS`,
        });
        
        // Close progress dialog after a delay
        setTimeout(() => {
          setShowImportProgress(false);
          setImportProgress(null);
          console.log('[ZIP Import] ✅ Import workflow complete!');
        }, 2000);
        
      } catch (error) {
        console.error('[ZIP Import] ❌ Import failed:', error);
        console.error('[ZIP Import] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        
        // Show error in progress dialog
        setImportProgress({
          stage: 'complete', // Use 'complete' stage to show error state
          progress: 0,
          message: `❌ ${error instanceof Error ? error.message : 'Import failed'}`,
        });
        
        setTimeout(() => {
          setShowImportProgress(false);
          setImportProgress(null);
        }, 4000);
      }
    };
    input.click();
  };
  
  // Store result for CSS access
  const [importResult, setImportResult] = useState<{ css: string } | null>(null);
  
  // Switch between pages in multi-page template
  const switchPage = useCallback((pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    
    const page = pages[pageIndex];
    if (!page || !grapeEditorRef.current) return;
    
    console.log(`[Page Switch] Switching to page ${pageIndex}: ${page.name}`);
    
    setActivePage(pageIndex);
    
    // Update editor content
    grapeEditorRef.current.setComponents(page.html);
    
    // Set CSS (shared CSS + page-specific CSS)
    const allCss = importResult?.css || '';
    const pageCss = page.css || '';
    const combinedCss = (allCss + '\n' + pageCss).trim();
    if (combinedCss) {
      grapeEditorRef.current.setStyle(combinedCss);
    }
  }, [pages, importResult]);
  
  // Handle preview generation
  const handlePreview = async () => {
    try {
      const editor = grapeEditorRef.current?.getEditor();
      if (!editor) throw new Error('Editor not ready');

      const html = editor.getHtml();
      const css = editor.getCss();

      const baseResponsiveCss = `
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow-x: hidden; }
        img, video, iframe, canvas { max-width: 100%; height: auto; display: block; }
        section, div, header, footer { max-width: 100%; }
        @media (max-width: 1199px) { .gjs-row, .row { flex-wrap: wrap; } }
        @media (max-width: 767px) { .gjs-row > *, .row > * { width: 100% !important; } }
      `;

      const doc = `<!doctype html>
      <html lang=\"${locale}\">
      <head>
        <meta charset=\"UTF-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
        <style>${baseResponsiveCss}${css}</style>
      </head>
      <body>${html}</body>
      </html>`;

      const blob = new Blob([doc], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewWatermarked(false);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview generation failed:', error);
      alert('Failed to generate preview. Please try again.');
    }
  };
  
  // Handle export with demo limits
  const handleExport = async () => {
    if (!currentProject) return;
    
    if (!canSave) {
      alert('Demo mode limit reached. Please upgrade to export projects.');
      return;
    }
    
    try {
      const response = await fetch('/api/parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: currentProject }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProject.name.replace(/[^a-z0-9]/gi, '_')}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  // Get unique categories from loaded components
  const categories = Array.from(new Set(components.map(c => c.category))) as Category[];
  
  // Handle save component (get HTML from Grape.js editor)
  const handleSaveComponent = () => {
    if (!canSave) {
      alert('Demo mode limit reached. Please upgrade to save components.');
      return;
    }
    
    if (!grapeEditorRef.current) {
      alert('Editor not ready');
      return;
    }
    
    const editor = grapeEditorRef.current.getEditor();
    if (!editor) {
      alert('Editor not available');
      return;
    }
    
    // Check if a component is selected
    const selected = editor.getSelected();
    if (!selected) {
      alert('Please select a component in the editor to save it.');
      return;
    }
    
    setShowSaveComponent(true);
  };
  
  // Handle create project with demo limits
  const handleCreateProject = (name: string, description?: string) => {
    // Clear pages state when creating new project
    setPages([]);
    setActivePage(0);
    setImportResult(null);
    if (!canCreate) {
      alert('Demo mode limit reached. You can only create 1 project in demo mode.');
      return;
    }
    
    createProject(name, description);
    incrementDemoProjectCount();
  };
  
  
  return (
    <ErrorBoundary>
      <div 
        className="h-screen flex flex-col bg-gray-50 dark:bg-[#1a1a1a] transition-colors duration-200"
      >
        {/* Header */}
        <header className="bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-[#404040] px-4 py-3 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
              <Link href={`/${locale}/dashboard`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span>{t('dashboard')}</span>
              </Link>
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-[#404040]" />
            <h1 className="font-semibold text-lg text-gray-900 dark:text-white">
              {currentProject?.name || t('newProject')}
            </h1>
            {currentProject && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSave}
                disabled={isSaving}
                data-status={saveStatus}
                className={`h-8 px-3 transition-all ${
                  saveSuccess 
                    ? 'bg-green-50 border-green-400 text-green-700' 
                    : isSaving 
                      ? 'bg-orange-50 border-orange-300 text-orange-600'
                      : 'border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="w-3 h-3 mr-2 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save Project
                  </>
                )}
              </Button>
            )}
            {userPackage && (
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                {userPackage.package_type} Package
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Undo/Redo Buttons */}
            {currentProject && (
              <>
                <div className="hidden md:flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className={`h-8 px-2 transition-colors ${
                      canUndo 
                        ? 'text-gray-700 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 border-gray-300' 
                        : 'text-gray-300 cursor-not-allowed border-gray-200'
                    }`}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className={`h-8 px-2 transition-colors ${
                      canRedo 
                        ? 'text-gray-700 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 border-gray-300' 
                        : 'text-gray-300 cursor-not-allowed border-gray-200'
                    }`}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="hidden md:block h-6 w-px bg-gray-300 mx-1" />
              </>
            )}
            {/* Device Selector Buttons */}
            {currentProject && (
              <>
                <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={currentDevice === 'desktop' ? 'default' : 'ghost'}
                    onClick={() => {
                      const editor = grapeEditorRef.current?.getEditor();
                      if (editor) {
                        editor.setDevice('Desktop');
                        setCurrentDevice('desktop');
                      }
                    }}
                    className={`h-8 px-3 ${currentDevice === 'desktop' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-gray-700 hover:bg-gray-200'}`}
                    title="Desktop View"
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={currentDevice === 'tablet' ? 'default' : 'ghost'}
                    onClick={() => {
                      const editor = grapeEditorRef.current?.getEditor();
                      if (editor) {
                        editor.setDevice('Tablet');
                        setCurrentDevice('tablet');
                      }
                    }}
                    className={`h-8 px-3 ${currentDevice === 'tablet' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-gray-700 hover:bg-gray-200'}`}
                    title="Tablet View"
                  >
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={currentDevice === 'mobile' ? 'default' : 'ghost'}
                    onClick={() => {
                      const editor = grapeEditorRef.current?.getEditor();
                      if (editor) {
                        editor.setDevice('Mobile');
                        setCurrentDevice('mobile');
                      }
                    }}
                    className={`h-8 px-3 ${currentDevice === 'mobile' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-gray-700 hover:bg-gray-200'}`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
                <div className="hidden md:block h-6 w-px bg-gray-300 mx-1" />
              </>
            )}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-[#3a3a3a] hover:bg-gray-300 dark:hover:bg-[#4a4a4a] transition-colors duration-200"
              title={darkMode ? t('lightTheme') || 'Светлая тема' : t('darkTheme') || 'Тёмная тема'}
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <LanguageSwitcher />
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setChatOpen(!chatOpen)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('chat')}
            </Button>
            {currentProject && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handlePreview}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('preview') || 'Preview'}
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleImport}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('import')}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleExport}
              disabled={!currentProject || !canSave}
              title={!canSave ? 'Demo mode limit reached' : ''}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:text-gray-400 disabled:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('export')}
            </Button>
            {currentProject && (
              <>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const editor = grapeEditorRef.current?.getEditor();
                    if (editor) {
                      editor.setComponents('');
                      editor.setStyle('');
                      // Clear pages and reset active page
                      setPages([]);
                      setActivePage(0);
                      setImportResult(null);
                      console.log('[Editor] 🗑️ Cleared canvas and page tabs');
                    }
                  }}
                  title="Clear Canvas"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  🗑️ Clear
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleSaveComponent}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('saveComponent')}
                </Button>
              </>
            )}
            <Button 
              size="sm"
              onClick={() => setShowProjectForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {currentProject ? t('rename') : t('newProject')}
            </Button>
          </div>
        </header>
        
        {/* Main Editor Area */}
        {currentProject ? (
          <div className="flex-1 flex overflow-hidden relative">
            {/* Mobile Overlay */}
            {(leftPanelOpen || rightPanelOpen) && (
              <div 
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
                onClick={() => {
                  setLeftPanelOpen(false);
                  setRightPanelOpen(false);
                }}
              />
            )}
            
            {/* Left Panel - Components */}
            <div className={`
              fixed md:relative 
              inset-y-0 left-0 
              z-40 md:z-auto
              transition-all duration-300
              ${leftPanelOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full md:w-0 md:translate-x-0'}
              overflow-hidden
            `}>
              <div className="h-full bg-white dark:bg-[#2d2d2d] border-r border-gray-200 dark:border-[#404040] flex flex-col shadow-lg md:shadow-none">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg mb-3">{t('components')}</h3>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1 text-xs rounded-full transition ${
                        selectedCategory === null
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {t('all')}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 text-xs rounded-full transition capitalize ${
                          selectedCategory === cat
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Search Input */}
                  <SearchInput
                    placeholder="Search components..."
                    onSearch={handleSearch}
                    debounceMs={300}
                  />
                  
                  {isLoadingComponents ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500">Loading components...</div>
                    </div>
                  ) : filteredComponents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? 'No components found matching your search.' : 'No components found in this category.'}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {filteredComponents.map((component) => (
                        <div
                          key={component.id}
                          className="border rounded-lg p-3 hover:border-primary cursor-move transition group"
                          draggable
                          onDragStart={(e) => {
                            // CRITICAL: Provide actual HTML to GrapesJS, not JSON
                            // Previous implementation set JSON which rendered as text on canvas
                            const htmlContent = typeof component.html === 'string' ? component.html : String(component.html || '');
                            const cssContent = component.css || '';
                            const payload = cssContent
                              ? `<style>${cssContent}</style>\n${htmlContent}`
                              : htmlContent;
                            // Set both text/html and text/plain so GrapesJS can pick up the HTML
                            e.dataTransfer.setData('text/html', payload);
                            e.dataTransfer.setData('text/plain', payload);
                          }}
                        >
                          <div className="aspect-video bg-gray-50 rounded mb-2 flex items-center justify-center overflow-hidden relative">
                            {(() => {
                              const htmlContent = typeof component.html === 'string' ? component.html : String(component.html || '');
                              const cssContent = component.css || '';
                              const previewHtml = htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                              const previewSrcDoc = `<!doctype html><html><head><style>${cssContent}</style></head><body>${previewHtml}</body></html>`;

                              if (component.thumbnail) {
                                return (
                                  <img
                                    src={component.thumbnail}
                                    alt={component.name}
                                    className="w-full h-full object-cover rounded"
                                    loading="lazy"
                                  />
                                );
                              }

                              if (!previewHtml.trim()) {
                                return <span className="text-gray-400 capitalize">{component.category}</span>;
                              }

                              return (
                                <iframe
                                  title={`Preview of ${component.name}`}
                                  srcDoc={previewSrcDoc}
                                  className="w-full h-full border-0 rounded"
                                  sandbox=""
                                />
                              );
                            })()}
                          </div>
                          <h4 className="font-medium text-sm">{component.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {component.description || `${component.category} component`}
                          </p>
                          {component.style && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 rounded capitalize">
                              {component.style}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Toggle Left Panel */}
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="w-6 bg-white dark:bg-[#2d2d2d] border-y border-r border-gray-200 dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] flex items-center justify-center z-10 md:z-auto transition-colors duration-200"
              aria-label={leftPanelOpen ? 'Hide panel' : 'Show panel'}
            >
              {leftPanelOpen ? '←' : '→'}
            </button>
            
            {/* Center - Canvas with Grape.js */}
            <div className="flex-1 bg-gray-100 dark:bg-[#1a1a1a] overflow-hidden relative flex flex-col transition-colors duration-200">
              {/* Page Tabs (only show if multiple pages) */}
              {pages.length > 1 && (
                <div className="bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-[#404040] px-4 py-2 flex items-center gap-2 overflow-x-auto">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Pages:</span>
                  {pages.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => switchPage(index)}
                      className={`
                        px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                        ${activePage === index
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 dark:bg-[#3a3a3a] text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-200 dark:hover:bg-[#4a4a4a]'
                        }
                      `}
                    >
                      {page.name.replace('.html', '').replace('.htm', '')}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <GrapeEditor
                ref={grapeEditorRef}
                onUpdate={handleEditorUpdate}
                initialHtml={currentProject.pages[0]?.components?.[0]?.props?.html || ''}
                initialCss={currentProject.pages[0]?.styles || ''}
                components={components}
                darkMode={darkMode}
              />
              </div>
            </div>
            
            {/* Toggle Right Panel */}
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="w-6 bg-white dark:bg-[#2d2d2d] border-y border-l border-gray-200 dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] flex items-center justify-center z-10 md:z-auto transition-colors duration-200"
              aria-label={rightPanelOpen ? 'Hide panel' : 'Show panel'}
            >
              {rightPanelOpen ? '→' : '←'}
            </button>
            
            {/* Right Panel - Style Manager */}
            <div className={`
              fixed md:relative 
              inset-y-0 right-0 
              z-40 md:z-auto
              transition-all duration-300
              ${rightPanelOpen ? 'w-80 translate-x-0' : 'w-80 translate-x-full md:w-0 md:translate-x-0'}
              overflow-hidden
            `}>
              <div className="h-full bg-white dark:bg-[#2d2d2d] border-l border-gray-200 dark:border-[#404040] flex flex-col shadow-lg md:shadow-none">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-[#e5e5e5]">{t('properties')}</h3>
                </div>
                <div className="flex-1 overflow-hidden">
                  <StyleManager 
                    editor={grapeEditorRef.current?.getEditor()} 
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('startBuilding')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('dragComponents')}</p>
              <Button onClick={() => setShowProjectForm(true)}>
                {t('createProject')}
              </Button>
            </div>
          </div>
        )}
        
        {/* Project Name Form Modal */}
        <ProjectNameForm
          open={showProjectForm}
          onOpenChange={setShowProjectForm}
          initialName={currentProject?.name}
          initialDescription={currentProject?.description}
          onCreateProject={handleCreateProject}
        />
        
        {/* Import Progress Dialog */}
        <ImportProgressDialog
          open={showImportProgress}
          progress={importProgress}
        />
        
        {/* Save Component Dialog */}
        <SaveComponentDialog
          open={showSaveComponent}
          onOpenChange={setShowSaveComponent}
          editorRef={grapeEditorRef}
          initialCategory={selectedCategory || 'custom'}
          onSaved={() => {
            // Reload components after saving
            getComponentCatalog(false).then(setComponents).catch(console.error);
          }}
        />
        
        {/* Chat Panel */}
        <ChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          onApplyContract={handleApplyContract}
        />
        
        {/* Package Selector */}
        <PackageSelector
          open={showPackageSelector}
          onOpenChange={setShowPackageSelector}
          onSuccess={async (packageType) => {
            // Reload package
            const pkg = await getUserPackage();
            setUserPackage(pkg);
          }}
        />
        
        {/* Preview Modal */}
        <PreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          previewUrl={previewUrl}
          watermarked={previewWatermarked}
          projectName={currentProject?.name || 'Preview'}
        />
      </div>
    </ErrorBoundary>
  );
}
