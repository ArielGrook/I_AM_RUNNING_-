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
import { ArrowLeft, Plus, Download, Upload, Save, Check, MessageSquare, Eye, Monitor, Tablet, Smartphone, Undo2, Redo2, LayoutTemplate, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PuckEditor, type PuckData } from '@/components/editor/PuckEditor';
import { LayersPanelPuck } from '@/components/editor/LayersPanelPuck';
import { puckConfig } from '@/lib/editor/puck-config';
import { ProjectNameForm } from '@/components/editor/ProjectNameForm';
import { ImportProgressDialog } from '@/components/editor/ImportProgressDialog';
import { useProjectStore } from '@/lib/store/project-store';
// Manual save replaces auto-save - see handleManualSave function
import { componentCatalog, getAllCategories } from '@/lib/components/catalog';
import { getComponentCatalog, type SupabaseComponent } from '@/lib/components/supabase-catalog';
import { getPremiumComponents } from '@/components/library/premium-catalog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { parseTemplate } from '@/lib/parser/simple-parser';
import { uploadParsedImages } from '@/lib/parser/upload-images';
import type { ParseProgress } from '@/lib/parser/v2/types';
import { SaveComponentDialog } from '@/components/editor/SaveComponentDialog';
import { SearchInput } from '@/components/ui/search-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [leftPanelTab, setLeftPanelTab] = useState<'components' | 'layers'>('components');
  
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
  const [dbVersion, setDbVersion] = useState<number>(0); // Tracks the DB version for correct increment
  const supabaseLoadedProjectIdRef = useRef<string | null>(null);
  const loadedProjectDataRef = useRef<{ projectData: Record<string, unknown>; loadedFrom: 'data' | 'contract' } | null>(null);
  const searchParams = useSearchParams();

  // Puck editor state (replaces GrapesJS)
  const [puckPages, setPuckPages] = useState<Array<{ name: string; data: PuckData }>>([{ name: 'Home', data: {} }]);
  const [activePuckPage, setActivePuckPage] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [showClearCanvasConfirm, setShowClearCanvasConfirm] = useState(false);

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
  
  // Manual save: persist Puck data to Supabase (One-Way Ejection)
  const handleManualSave = useCallback(async () => {
    if (!currentProject || isSaving) return;

    if (!canSave) {
      setShowPackageSelector(true);
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveStatus('saving');
    setStoreSaveStatus('saving');

    try {
      updateProject({
        metadata: {
          ...currentProject.metadata,
          updatedAt: new Date().toISOString(),
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      const currentData = puckPages[activePuckPage]?.data ?? {};
      const fullProjectData: Record<string, unknown> =
        puckPages.length > 1
          ? { puck: currentData, pages: puckPages.map((p) => ({ name: p.name, data: p.data })) }
          : { puck: currentData };

      console.log(`💾 Saving Puck project to Supabase (version: ${dbVersion})...`);
      const result = await saveProjectToSupabase(currentProject, null, fullProjectData, null, dbVersion);

      if (result.error) {
        console.error('❌ Save failed:', result.error);
        setSaveStatus('error');
        setStoreSaveStatus('error');
        return;
      }

      if (result.data?.version) {
        setDbVersion(result.data.version);
        console.log(`[Manual Save] ✅ Project saved (version: ${result.data.version})`);
      } else {
        console.log('[Manual Save] ✅ Project saved to Supabase');
      }

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
  }, [currentProject, isSaving, canSave, setStoreSaveStatus, updateProject, locale, puckPages, activePuckPage, dbVersion]);

  // Handle project name update
  const handleUpdateProjectName = useCallback(async (newName: string) => {
    if (!currentProject?.id || !newName.trim()) return;
    
    try {
      await supabase
        .from('projects')
        .update({ name: newName.trim() })
        .eq('id', currentProject.id);
      
      // Update local state
      updateProject({ name: newName.trim() });
      console.log('[Editor] ✅ Project name updated:', newName.trim());
    } catch (error) {
      console.error('[Editor] ❌ Failed to update project name:', error);
    }
  }, [currentProject?.id, updateProject]);

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

        console.log('✅ Found project:', loaded.name, `(loaded from ${loaded.loadedFrom}, version: ${loaded.version ?? 0})`);

        // Store the DB version for correct increment on save
        setDbVersion(loaded.version ?? 0);

        const projectData = loaded.projectData as Record<string, unknown>;
        loadedProjectDataRef.current = {
          projectData,
          loadedFrom: loaded.loadedFrom,
        };
        supabaseLoadedProjectIdRef.current = loaded.id;

        // Initialize Puck pages from saved data
        const puckData = projectData?.puck;
        const puckPagesArray = projectData?.pages as Array<{ name?: string; data?: PuckData }> | undefined;
        if (Array.isArray(puckPagesArray) && puckPagesArray.length > 0) {
          setPuckPages(
            puckPagesArray.map((p) => ({
              name: (p.name as string) || 'Page',
              data: (p.data && typeof p.data === 'object' ? p.data : {}) as PuckData,
            }))
          );
          setActivePuckPage(0);
        } else if (puckData && typeof puckData === 'object' && Object.keys(puckData).length > 0) {
          setPuckPages([{ name: 'Home', data: puckData as PuckData }]);
          setActivePuckPage(0);
        } else {
          setPuckPages([{ name: 'Home', data: {} }]);
          setActivePuckPage(0);
        }

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

  // Clear loaded ref after Puck state was set from loadInitialProject
  useEffect(() => {
    if (loadedFromSupabase && loadedProjectDataRef.current) {
      loadedProjectDataRef.current = null;
      supabaseLoadedProjectIdRef.current = null;
    }
  }, [loadedFromSupabase]);

  // Check for chat query parameter on mount
  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam === 'open') {
      setChatOpen(true);
    }
  }, [searchParams]);

  // Undo/redo: Puck has built-in history in its UI; toolbar buttons disabled for now
  const handleUndo = useCallback(() => {}, []);
  const handleRedo = useCallback(() => {}, []);

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
        const premium = getPremiumComponents();
        const catalog = await getComponentCatalog(false);
        const premiumIds = new Set(premium.map(c => c.id));
        const dbOnly = catalog.filter(c => !premiumIds.has(c.id));
        const merged = [...premium, ...dbOnly];
        setComponents(merged);
        setFilteredComponents(merged);
      } catch (error) {
        console.error('Failed to load components:', error);
        const fallback = getPremiumComponents();
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
  
  // Handle JSON contract application (Phase 3/4: apply to Puck data)
  const handleApplyContract = async (_contract: JsonContract) => {
    console.warn('Contract application not yet implemented for Puck editor');
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
  
  // Puck data change: keep current page in sync
  const handlePuckChange = useCallback(
    (data: PuckData) => {
      setPuckPages((prev) =>
        prev.map((p, i) => (i === activePuckPage ? { ...p, data } : p))
      );
    },
    [activePuckPage]
  );
  
  // Handle import: parse ZIP, upload images, inject first page as ImportedHTML block (Phase 4)
  const handleImport = async () => {
    if (!canSave) {
      setShowPackageSelector(true);
      return;
    }
    if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
      alert('Import requires browser environment.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File too large (max ${(maxSize / 1024 / 1024).toFixed(0)}MB).`);
        return;
      }
      setShowImportProgress(true);
      setImportProgress({ stage: 'reading', progress: 0, message: 'Reading ZIP...' });
      try {
        setImportProgress({ stage: 'html', progress: 50, message: 'Parsing ZIP...' });
        const result = await parseTemplate(file, true);
        let pagesToUse = result.pages;
        let cssToUse = result.css;
        if (currentProject?.id) {
          setImportProgress({ stage: 'upload', progress: 52, message: 'Uploading images...' });
          const uploaded = await uploadParsedImages(
            currentProject.id,
            result.pages,
            result.css,
            (uploadedCount, total) => {
              setImportProgress({
                stage: 'upload',
                progress: 50 + Math.round((uploadedCount / total) * 40),
                message: `Uploading images ${uploadedCount}/${total}...`,
              });
            },
          );
          pagesToUse = uploaded.pages;
          cssToUse = uploaded.css;
        }
        const first = pagesToUse[0];
        const fullHtml = first
          ? `<style>${cssToUse}${first.css ? `\n${first.css}` : ''}</style>${first.html}`
          : '';
        const newBlock = {
          type: 'ImportedHTML',
          props: { html: fullHtml },
          id: `imported-${Date.now()}`,
        };
        setPuckPages((prev) =>
          prev.map((p, i) =>
            i === activePuckPage
              ? {
                  ...p,
                  data: {
                    ...p.data,
                    content: Array.isArray(p.data?.content) ? [...(p.data.content as unknown[]), newBlock] : [newBlock],
                  },
                }
              : p
          )
        );
        setImportProgress({
          stage: 'complete',
          progress: 100,
          message: `Imported ${pagesToUse.length} page(s) as block.`,
        });
        setTimeout(() => {
          setShowImportProgress(false);
          setImportProgress(null);
        }, 2000);
      } catch (err) {
        console.error('Import failed:', err);
        setImportProgress({
          stage: 'complete',
          progress: 0,
          message: `Error: ${err instanceof Error ? err.message : 'Import failed'}`,
        });
        setTimeout(() => {
          setShowImportProgress(false);
          setImportProgress(null);
        }, 4000);
      }
    };
    input.click();
  };
  
  // Switch between Puck pages
  const switchPuckPage = useCallback((pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= puckPages.length) return;
    setActivePuckPage(pageIndex);
  }, [puckPages.length]);
  
  // Handle preview: render current Puck page with Puck's Render component
  const handlePreview = async () => {
    try {
      const data = puckPages[activePuckPage]?.data ?? {};
      const { Render } = await import('@puckeditor/core');
      const { createRoot } = await import('react-dom/client');
      const React = await import('react');
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(
        React.createElement(Render, { config: puckConfig, data })
      );
      await new Promise((r) => setTimeout(r, 150));
      const html = container.innerHTML;
      root.unmount();
      document.body.removeChild(container);

      const baseResponsiveCss = `
        html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; overflow-x: hidden; }
        img, video, iframe, canvas { max-width: 100%; height: auto; display: block; }
        section, div, header, footer { max-width: 100%; }
      `;
      const doc = `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${baseResponsiveCss}</style>
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
  
  // Handle save component (Phase 3: save selected Puck block as component)
  const handleSaveComponent = () => {
    if (!canSave) {
      setShowPackageSelector(true);
      return;
    }
    alert('Save component will be available in Phase 3.');
  };
  
  // Save project name on blur/Enter (double-click edit)
  const saveProjectName = useCallback(() => {
    if (!currentProject) return;
    const name = projectNameInput.trim();
    if (name) {
      updateProject({ ...currentProject, name });
    }
    setIsEditingProjectName(false);
    setProjectNameInput('');
  }, [currentProject, projectNameInput, updateProject]);

  const handleConfirmClearCanvas = useCallback(() => {
    setPuckPages([{ name: 'Home', data: {} }]);
    setActivePuckPage(0);
    setShowClearCanvasConfirm(false);
    console.log('[Editor] 🗑️ Cleared canvas (Puck)');
  }, []);

  // Handle create project with demo limits
  const handleCreateProject = (name: string, description?: string) => {
    setPuckPages([{ name: 'Home', data: {} }]);
    setActivePuckPage(0);
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
        <header className="bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-[#404040] px-4 py-3 w-full transition-colors duration-200">
          <div className="flex items-center justify-between gap-2 w-full min-w-0 flex-wrap">
            {/* Group 1: Dashboard */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" asChild className="text-gray-700 dark:text-gray-300 hover:text-[#FF6B35] hover:bg-orange-50 dark:hover:bg-[#3a3a3a]">
                <Link href={`/${locale}/dashboard`}>
                  <ArrowLeft className="w-4 h-4" />
                  <span className="ml-1.5">{t('dashboard')}</span>
                </Link>
              </Button>
            </div>
            <div className="h-6 w-px bg-gray-300 dark:bg-[#404040] shrink-0" aria-hidden />

            {/* Group 2: Project name + Save */}
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              {currentProject ? (
                isEditingProjectName ? (
                  <input
                    type="text"
                    value={projectNameInput}
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    onBlur={saveProjectName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveProjectName();
                      if (e.key === 'Escape') {
                        setProjectNameInput(currentProject?.name ?? '');
                        setIsEditingProjectName(false);
                      }
                    }}
                    className="h-8 px-2 text-base font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-[#3a3a3a] border border-gray-300 dark:border-[#404040] rounded focus:outline-none focus:ring-2 focus:ring-[#FF6B35] min-w-[120px]"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onDoubleClick={() => {
                      setProjectNameInput(currentProject?.name ?? '');
                      setIsEditingProjectName(true);
                    }}
                    className="font-semibold text-lg text-gray-900 dark:text-white hover:text-[#FF6B35] truncate max-w-[200px] md:max-w-[280px] text-left"
                    title="Double-click to rename"
                  >
                    {currentProject.name || t('newProject')}
                  </button>
                )
              ) : (
                <span className="font-semibold text-lg text-gray-500 dark:text-gray-400">{t('newProject')}</span>
              )}
              {currentProject && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="h-8 w-8 p-0 border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:bg-[#FF6B35] hover:border-[#FF6B35] hover:text-white"
                  title={isSaving ? t('saving') : saveSuccess ? t('saved') : 'Save Project'}
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin block" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            {userPackage && currentProject && (
              <div className="hidden sm:inline-flex text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded shrink-0 ml-1">
                {userPackage.package_type} Package
              </div>
            )}
            <div className="h-6 w-px bg-gray-300 dark:bg-[#404040] shrink-0" aria-hidden />

            {/* Group 3: Theme + Language + Chat */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={toggleDarkMode}
                className="h-8 w-8 p-0 border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-[#3a3a3a] hover:border-[#FF6B35]"
                title={darkMode ? t('lightTheme') : t('darkTheme')}
              >
                {darkMode ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </Button>
              <LanguageSwitcher iconOnly triggerClassName="border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-[#3a3a3a] hover:border-[#FF6B35]" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setChatOpen(!chatOpen)}
                className="h-8 w-8 p-0 border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-[#3a3a3a] hover:border-[#FF6B35]"
                title={t('chat')}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-[#404040] shrink-0 hidden md:block" aria-hidden />

            {/* Group 4: Undo/Redo + Scale (devices) + Preview + Add page */}
            {currentProject ? (
              <div className="hidden md:flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className={`h-8 w-8 p-0 ${canUndo ? 'border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35]' : 'border-gray-200 dark:border-[#404040] text-gray-300 cursor-not-allowed'}`}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className={`h-8 w-8 p-0 ${canRedo ? 'border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35]' : 'border-gray-200 dark:border-[#404040] text-gray-300 cursor-not-allowed'}`}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#3a3a3a] rounded p-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCurrentDevice('desktop')}
                      className={`h-8 w-8 p-0 ${currentDevice === 'desktop' ? 'bg-[#FF6B35] text-white' : 'text-gray-600 dark:text-gray-400'}`}
                      title="Desktop"
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCurrentDevice('tablet')}
                      className={`h-8 w-8 p-0 ${currentDevice === 'tablet' ? 'bg-[#FF6B35] text-white' : 'text-gray-600 dark:text-gray-400'}`}
                      title="Tablet"
                    >
                      <Tablet className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCurrentDevice('mobile')}
                      className={`h-8 w-8 p-0 ${currentDevice === 'mobile' ? 'bg-[#FF6B35] text-white' : 'text-gray-600 dark:text-gray-400'}`}
                      title="Mobile"
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePreview}
                    className="h-8 w-8 p-0 border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35]"
                    title={t('preview')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPuckPages((prev) => {
                        const next = [...prev, { name: `Page ${prev.length + 1}`, data: {} }];
                        setActivePuckPage(next.length - 1);
                        return next;
                      });
                    }}
                    className="h-8 px-2 border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35]"
                    title={t('addPage')}
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    <span className="ml-1.5 text-sm">{t('addPage')}</span>
                  </Button>
                </div>
            ) : null}
            <div className="h-6 w-px bg-gray-300 dark:bg-[#404040] shrink-0 hidden md:block" aria-hidden />

            {/* Group 5: Import + Export + Clear canvas + Save component */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleImport}
                className="h-8 w-8 p-0 border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35]"
                title={t('import')}
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={!currentProject || !canSave}
                className="h-8 w-8 p-0 border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('export')}
              >
                <Download className="w-4 h-4" />
              </Button>
              {currentProject && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowClearCanvasConfirm(true)}
                    className="h-8 px-2 border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:border-red-500 hover:text-red-500"
                    title={t('clearCanvas')}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="ml-1.5 text-sm hidden sm:inline">{t('clearCanvas')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveComponent}
                    className="h-8 px-2 border-gray-300 dark:border-[#404040] text-gray-700 dark:text-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35]"
                    title={t('saveComponent')}
                  >
                    <Save className="w-4 h-4" />
                    <span className="ml-1.5 text-sm">{t('saveComponent')}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Clear canvas confirmation */}
        <Dialog open={showClearCanvasConfirm} onOpenChange={setShowClearCanvasConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('clearCanvasConfirmTitle')}</DialogTitle>
              <DialogDescription>{t('clearCanvasConfirmDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowClearCanvasConfirm(false)}>
                {t('clearCanvasConfirmCancel')}
              </Button>
              <Button variant="destructive" onClick={handleConfirmClearCanvas}>
                {t('clearCanvasConfirmYes')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
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
              ${leftPanelOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-0 md:translate-x-0'}
              overflow-hidden
            `}>
              <div className="h-full bg-white dark:bg-[#2d2d2d] border-r border-gray-200 dark:border-[#404040] flex flex-col shadow-lg md:shadow-none editor-left-panel">
                {/* Tabs: Components | Layers */}
                <div className="flex border-b border-gray-200 dark:border-[#404040] shrink-0">
                  <button
                    type="button"
                    onClick={() => setLeftPanelTab('components')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      leftPanelTab === 'components'
                        ? 'bg-[#FF6B35] text-white border-b-2 border-[#FF6B35]'
                        : 'text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-100 dark:hover:bg-[#3a3a3a] border-b-2 border-transparent'
                    }`}
                  >
                    {t('components')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftPanelTab('layers')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      leftPanelTab === 'layers'
                        ? 'bg-[#FF6B35] text-white border-b-2 border-[#FF6B35]'
                        : 'text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-100 dark:hover:bg-[#3a3a3a] border-b-2 border-transparent'
                    }`}
                  >
                    {t('layers')}
                  </button>
                </div>

                {leftPanelTab === 'layers' ? (
                  <LayersPanelPuck
                    data={puckPages[activePuckPage]?.data ?? {}}
                    className="flex-1 min-h-0"
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>Add blocks from the editor canvas. Use the component list in the center area to drag and drop blocks.</p>
                  </div>
                )}
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
              {puckPages.length > 1 && (
                <div className="bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-[#404040] px-4 py-2 flex items-center gap-2 overflow-x-auto">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Pages:</span>
                  {puckPages.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => switchPuckPage(index)}
                      className={`
                        px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                        ${activePuckPage === index
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 dark:bg-[#3a3a3a] text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-200 dark:hover:bg-[#4a4a4a]'
                        }
                      `}
                    >
                      {page.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <PuckEditor
                  data={puckPages[activePuckPage]?.data ?? {}}
                  onChange={handlePuckChange}
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
            
            {/* Right Panel - Puck has its own properties in the canvas; this panel is collapsed by default */}
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
                <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-500 dark:text-gray-400">
                  Select a block in the canvas to edit its properties in the editor.
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
          editorRef={undefined}
          initialCategory={selectedCategory || 'custom'}
          onSaved={() => {
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
