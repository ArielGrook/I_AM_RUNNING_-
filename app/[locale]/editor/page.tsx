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
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Download, Upload, Save, Check, MessageSquare, Eye, Monitor, Tablet, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GrapeEditor, type GrapeEditorRef } from '@/components/editor/GrapeEditor';
import { ProjectNameForm } from '@/components/editor/ProjectNameForm';
import { ImportProgressDialog } from '@/components/editor/ImportProgressDialog';
import { useProjectStore } from '@/lib/store/project-store';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { componentCatalog, getAllCategories } from '@/lib/components/catalog';
import { getComponentCatalog, type SupabaseComponent } from '@/lib/components/supabase-catalog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ParseProgress, ZipParseError } from '@/lib/parser/types';
import { SaveComponentDialog } from '@/components/editor/SaveComponentDialog';
import { SearchInput } from '@/components/ui/search-input';
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
import { shouldApplyWatermark } from '@/lib/utils/watermark';
import dynamic from 'next/dynamic';
import JSZip from 'jszip';

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
  const isRTL = locale === 'he' || locale === 'ar';
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<import('@/lib/parser/types').ParseProgress | null>(null);
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
  const grapeEditorRef = useRef<GrapeEditorRef>(null);
  
  // Check demo mode
  const isDemo = isDemoMode();
  const canCreate = canCreateProject();
  const canSave = canSaveOrExport();
  
  const { 
    currentProject, 
    saveStatus, 
    lastSaved,
    createProject,
    updateProject,
    loadProject,
  } = useProjectStore();
  
  // Auto-save hook (60s debounce)
  useAutoSave(!!currentProject);
  
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
  
  // Handle import with client-side ZIP parsing (browser-only, no server)
  const handleImport = async () => {
    console.log('[ZIP Import] 🚀 handleImport() called - CLIENT-SIDE MODE');
    
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
        stage: 'loading',
        progress: 0,
        message: 'Loading ZIP file...',
      });
      
      try {
        // Clear canvas before import
        console.log('[ZIP Import] 🧹 Clearing canvas...');
        if (grapeEditorRef.current) {
          grapeEditorRef.current.clear();
        }
        
        // Ensure editor is ready
        const editor = grapeEditorRef.current?.getEditor();
        if (!editor) {
          throw new Error('Editor not ready. Please wait for editor to initialize.');
        }
        
        setImportProgress({
          stage: 'parsing',
          progress: 10,
          message: 'Parsing ZIP file...',
        });
        
        // CLIENT-SIDE: Load ZIP with JSZip (browser-only)
        console.log('[ZIP Import] 📦 Loading ZIP with JSZip (client-side)...');
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        console.log('[ZIP Import] ✅ ZIP loaded, files count:', Object.keys(zipContent.files).length);
        
        setImportProgress({
          stage: 'parsing',
          progress: 30,
          message: 'Extracting HTML and CSS...',
        });
        
        // Extract HTML files
        const htmlFiles: Array<{ filename: string; content: string; pageName: string }> = [];
        let globalCss = '';
        const assets: Array<{ original: string; data: string }> = [];
        
        // Process all files in ZIP
        for (const [filename, zipFile] of Object.entries(zipContent.files)) {
          if (zipFile.dir) continue;
          
          if (filename.endsWith('.html') || filename.endsWith('.htm')) {
            console.log('[ZIP Import] 📄 Found HTML file:', filename);
            const content = await zipFile.async('string');
            const pageName = filename.replace(/\.html?$/, '').replace(/^.*\//, '');
            htmlFiles.push({ filename, content, pageName });
            
          } else if (filename.endsWith('.css')) {
            console.log('[ZIP Import] 🎨 Found CSS file:', filename);
            const content = await zipFile.async('string');
            globalCss += `\n/* From ${filename} */\n${content}\n`;
            
          } else if (filename.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
            console.log('[ZIP Import] 🖼️ Found image file:', filename);
            // Process image with FileReader in browser
            const blob = await zipFile.async('blob');
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            
            assets.push({
              original: filename,
              data: base64
            });
          }
        }
        
        if (htmlFiles.length === 0) {
          throw new Error('No HTML files found in ZIP archive');
        }
        
        console.log('[ZIP Import] ✅ Extracted:', {
          htmlFiles: htmlFiles.length,
          cssLength: globalCss.length,
          images: assets.length
        });
        
        setImportProgress({
          stage: 'processing',
          progress: 60,
          message: 'Processing HTML content...',
        });
        
        // Sort HTML files (index.html first)
        htmlFiles.sort((a, b) => a.filename.includes('index') ? -1 : 1);
        
        // Process first HTML file (main page)
        const mainHtmlFile = htmlFiles[0];
        console.log('[ZIP Import] 📄 Processing main HTML:', mainHtmlFile.pageName);
        
        // Extract body content
        let pageHtml = '';
        const bodyMatch = mainHtmlFile.content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          pageHtml = bodyMatch[1]
            // Remove script tags (we'll handle JS separately if needed)
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        } else {
          // No body tag, use entire content
          pageHtml = mainHtmlFile.content
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
        }
        
        // Replace image paths with base64 data URLs
        console.log('[ZIP Import] 🔄 Replacing image paths with base64...');
        assets.forEach(asset => {
          const fileName = asset.original.split('/').pop() || asset.original;
          const patterns = [
            new RegExp(`src=["']([^"']*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})["']`, 'gi'),
            new RegExp(`href=["']([^"']*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})["']`, 'gi'),
            new RegExp(`url\\(["']?([^"')]*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})["']?\\)`, 'gi')
          ];
          
          patterns.forEach(pattern => {
            pageHtml = pageHtml.replace(pattern, (match) => {
              if (match.includes('url(')) {
                return `url("${asset.data}")`;
              } else if (match.includes('src=')) {
                return `src="${asset.data}"`;
              } else {
                return `href="${asset.data}"`;
              }
            });
            globalCss = globalCss.replace(pattern, `url("${asset.data}")`);
          });
        });
        
        console.log('[ZIP Import] ✅ HTML processed, length:', pageHtml.length);
        
        setImportProgress({
          stage: 'loading',
          progress: 90,
          message: 'Loading into editor...',
        });
        
        // DIRECT EDITOR SET: No project store, no loadProject()
        console.log('[ZIP Import] 🎯 Setting components directly in editor...');
        console.log('[ZIP Import] HTML preview (first 500 chars):', pageHtml.substring(0, 500));
        
        // Wait a bit for canvas to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set HTML directly in editor
        grapeEditorRef.current?.setComponents(pageHtml);
        
        // Set CSS directly in editor
        if (globalCss.trim()) {
          grapeEditorRef.current?.setStyle(globalCss);
        }
        
        console.log('[ZIP Import] ✅ Components and styles set in editor');
        
          setImportProgress({
          stage: 'complete',
          progress: 100,
          message: `✅ Imported ${htmlFiles.length} page(s), ${assets.length} image(s)!`,
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
          stack: error instanceof Error ? error.stack : undefined
        });
        setImportProgress({
          stage: 'error',
          progress: 0,
          message: error instanceof Error ? error.message : 'Import failed',
        });
        setTimeout(() => {
          setShowImportProgress(false);
          setImportProgress(null);
        }, 3000);
      }
    };
    input.click();
  };
  
  // Handle preview generation
  const handlePreview = async () => {
    if (!currentProject) return;
    
    try {
      // Check if watermark should be applied
      const applyWatermark = await shouldApplyWatermark();
      setPreviewWatermarked(applyWatermark);
      
      // Generate preview via API
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: currentProject,
          pageIndex: 0,
          locale,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }
      
      const data = await response.json();
      if (data.html) {
        // Create blob URL from HTML on client side
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewWatermarked(data.watermarked || false);
        setShowPreview(true);
      }
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
    if (!canCreate) {
      alert('Demo mode limit reached. You can only create 1 project in demo mode.');
      return;
    }
    
    createProject(name, description);
    incrementDemoProjectCount();
  };
  
  // Get save status display
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="text-sm text-yellow-600">● {t('saving')}</span>;
      case 'saved':
        return (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" />
            {t('saved')}
            {lastSaved && (
              <span className="text-xs text-gray-400">
                ({new Date(lastSaved).toLocaleTimeString()})
              </span>
            )}
          </span>
        );
      case 'error':
        return <span className="text-sm text-red-600">● {t('error')}</span>;
      default:
        return <span className="text-sm text-gray-500">● {t('unsaved')}</span>;
    }
  };
  
  return (
    <ErrorBoundary>
      <div 
        className="h-screen flex flex-col bg-gray-50"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('dashboard')}
              </Link>
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="font-semibold text-lg">
              {currentProject?.name || t('newProject')}
            </h1>
            {getSaveStatusDisplay()}
            {isDemo && !userPackage && (
              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                Demo: {demoRemainingTime} left
              </div>
            )}
            {userPackage && (
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                {userPackage.package_type} Package
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device Selector Buttons */}
            {currentProject && (
              <>
                <div className="h-6 w-px bg-gray-300 mx-1" />
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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
                    className="h-8 px-3"
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
                    className="h-8 px-3"
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
                    className="h-8 px-3"
                    title="Mobile View"
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-6 w-px bg-gray-300 mx-1" />
              </>
            )}
            <LanguageSwitcher />
            {(!userPackage && isDemo) && (
              <Button 
                size="sm" 
                variant="default"
                onClick={() => setShowPackageSelector(true)}
              >
                {t('upgrade')}
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('chat')}
            </Button>
            {currentProject && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handlePreview}
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('preview') || 'Preview'}
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleImport}
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
                      console.log('Canvas cleared');
                    }
                  }}
                  title="Clear Canvas"
                >
                  🗑️ Clear
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleSaveComponent}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('saveComponent')}
                </Button>
              </>
            )}
            <Button 
              size="sm"
              onClick={() => setShowProjectForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {currentProject ? t('rename') : t('newProject')}
            </Button>
          </div>
        </header>
        
        {/* Main Editor Area */}
        {currentProject ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Components */}
            <div className={`transition-all duration-300 ${leftPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
              <div className="h-full bg-white border-r flex flex-col">
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
                            {component.thumbnail ? (
                              <img 
                                src={component.thumbnail} 
                                alt={component.name}
                                className="w-full h-full object-cover rounded"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-gray-400 capitalize">{component.category}</span>
                            )}
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
              className="w-6 bg-white border-y border-r hover:bg-gray-50 flex items-center justify-center z-10"
              aria-label={leftPanelOpen ? 'Hide panel' : 'Show panel'}
            >
              {isRTL ? (leftPanelOpen ? '→' : '←') : (leftPanelOpen ? '←' : '→')}
            </button>
            
            {/* Center - Canvas with Grape.js */}
            <div className="flex-1 bg-gray-100 overflow-hidden relative">
              <GrapeEditor
                ref={grapeEditorRef}
                onUpdate={handleEditorUpdate}
                initialHtml={currentProject.pages[0]?.components?.[0]?.props?.html || ''}
                initialCss={currentProject.pages[0]?.styles || ''}
                isRTL={isRTL}
                components={components}
              />
            </div>
            
            {/* Toggle Right Panel */}
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="w-6 bg-white border-y border-l hover:bg-gray-50 flex items-center justify-center z-10"
              aria-label={rightPanelOpen ? 'Hide panel' : 'Show panel'}
            >
              {isRTL ? (rightPanelOpen ? '←' : '→') : (rightPanelOpen ? '→' : '←')}
            </button>
            
            {/* Right Panel - Properties (Grape.js will handle this) */}
            <div className={`transition-all duration-300 ${rightPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
              <div className="h-full bg-white border-l">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg">{t('properties')}</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-500">
                    {t('selectElement')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('startBuilding')}</h3>
              <p className="text-gray-600 mb-4">{t('dragComponents')}</p>
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
          isRTL={isRTL}
          watermarked={previewWatermarked}
          projectName={currentProject?.name || 'Preview'}
        />
      </div>
    </ErrorBoundary>
  );
}
