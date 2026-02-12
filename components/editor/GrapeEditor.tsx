/**
 * Grape.js Editor Component
 * 
 * Wraps Grape.js editor with React integration.
 * 
 * Stage 1 Module 2: Editor Structure
 * Fixes Critical Error #4 from BIG REVIEW.md
 */

'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import 'grapesjs-blocks-basic';
import 'grapesjs-preset-webpage';
import { useProjectStore } from '@/lib/store/project-store';
import { useTheme } from 'next-themes';
import { getAllCatalogBlockDefinitions, getSupabaseBlockDefinitions, type BlockDefinition } from '@/lib/grapesjs/catalog-blocks';
import { type SupabaseComponent } from '@/lib/components/supabase-catalog';
import { convertCssToInlineStyles } from '@/lib/utils/css-to-inline';

export interface GrapeEditorRef {
  clear: () => void;
  getEditor: () => grapesjs.Editor | null;
  setComponents: (html: string) => void;
  setStyle: (css: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface GrapeEditorProps {
  onUpdate?: (html: string, css: string) => void;
  initialHtml?: string;
  initialCss?: string;
  components?: SupabaseComponent[]; // Supabase components to register as blocks
  darkMode?: boolean; // Sync with dashboard/editor dark mode (document.documentElement.classList 'dark')
}

/**
 * Sanitizes HTML to fix malformed attributes that cause GrapesJS parsing errors.
 * Fixes issues like:
 * - Double quotes in values: class="border-gray-200"" → class="border-gray-200"
 * - Quotes in attribute names: border-gray-200"= → border-gray-200=
 * - Missing spaces: widthclass= → width class=
 * - Invalid attribute patterns
 */
/**
 * CRITICAL FIX: Simplified sanitization - only fix truly broken HTML
 * The previous aggressive sanitization was CORRUPTING valid HTML attributes
 * Reference implementation (lsb-redactor-fixed.js) doesn't sanitize at all
 * 
 * This function now only fixes:
 * 1. Unclosed tags (basic safety)
 * 2. Truly malformed attributes (quotes in attribute names)
 * 
 * It does NOT modify valid HTML attributes with spaces (like viewBox="0 0 40 40")
 */
function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return html;

  let sanitized = html;

  // ONLY fix quotes in attribute NAMES (this is a real error that breaks parsing)
  // Pattern: attribute-name-with-quote"=value
  // Example: hero-btn-order"="" → hero-btn-order=""
  sanitized = sanitized.replace(/([a-zA-Z0-9_-]+)["']=/g, '$1=');

  // ONLY fix double quotes at the end of attribute values (real corruption)
  // Pattern: class="value"" → class="value"
  sanitized = sanitized.replace(/(\w+)=(["'])([^"']*?)\2\2/gi, '$1=$2$3$2');

  // REMOVED: All other aggressive sanitization that was corrupting valid HTML
  // GrapesJS can handle clean HTML without aggressive sanitization
  // The reference implementation doesn't sanitize at all

  return sanitized;
}

// Apply basic responsive defaults to any component tree
function addResponsiveClasses(component: any) {
  if (!component || typeof component.addClass !== 'function') return;

  const ensureClass = (cls: string) => {
    const classes = component.getClasses?.() || [];
    if (!classes.includes(cls)) {
      component.addClass(cls);
    }
  };

  // Base responsive width
  ensureClass('w-full');
  ensureClass('max-w-full');

  const tag = component.get?.('tagName');
  if (tag === 'img' || tag === 'video' || tag === 'iframe' || tag === 'canvas') {
    component.setStyle?.({
      width: '100%',
      maxWidth: '100%',
      height: 'auto',
      display: 'block',
    });
  }

  // Recurse into children
  const children = component.components?.();
  if (children && typeof children.forEach === 'function') {
    children.forEach((child: any) => addResponsiveClasses(child));
  }
}

export const GrapeEditor = forwardRef<GrapeEditorRef, GrapeEditorProps>(
  ({ onUpdate, initialHtml = '', initialCss = '', components, darkMode: darkModeProp }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const grapesEditorRef = useRef<grapesjs.Editor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastSyncedProjectRef = useRef<string | null>(null);
  const { currentProject, updateProject } = useProjectStore();
  const { theme } = useTheme();
  // Prefer darkMode prop (syncs with dashboard/editor toggle) over next-themes
  const isDark = darkModeProp !== undefined ? darkModeProp : theme === 'dark';

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const editor = grapesEditorRef.current;
    if (editor) {
      const um = editor.UndoManager;
      if (um.hasUndo()) {
        um.undo();
      }
    }
  }, []);

  const handleRedo = useCallback(() => {
    const editor = grapesEditorRef.current;
    if (editor) {
      const um = editor.UndoManager;
      if (um.hasRedo()) {
        um.redo();
      }
    }
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    if (!editorRef.current) return;

    console.log('1. Starting GrapesJS editor initialization');

    // CRITICAL: Get block definitions BEFORE init (matching legacy pattern)
    // Blocks must be defined IN the init config, not added after
    let blockDefinitions: BlockDefinition[] = [];
    
    if (components && components.length > 0) {
      console.log('2. Getting Supabase block definitions, count:', components.length);
      blockDefinitions = getSupabaseBlockDefinitions(components);
    } else {
      console.log('2. Getting static catalog block definitions');
      blockDefinitions = getAllCatalogBlockDefinitions();
    }
    
    console.log('3. Block definitions prepared, count:', blockDefinitions.length);
    
    // Debug: Check container
    console.log('4. Container element:', editorRef.current);
    console.log('5. Is container in DOM?', editorRef.current ? document.body.contains(editorRef.current) : 'NO CONTAINER');
    console.log('6. Block definitions sample (first 2):', JSON.stringify(blockDefinitions.slice(0, 2), null, 2));
    
    // STEP 1: Test with ABSOLUTE MINIMUM config (no blocks first)
    console.log('7. Initializing GrapesJS with MINIMAL config (no blocks)...');
    
    let editor: grapesjs.Editor;
    
    try {
      // Initialize with minimal config + critical settings from legacy
      editor = grapesjs.init({
        container: editorRef.current!,
        height: '100%',
        width: 'auto',
        fromElement: false,
        storageManager: false,
        
        // Critical settings from legacy code for ZIP import compatibility
        allowScripts: true,
        dragMode: 'translate', // simpler, stable drag mode
        dragAutoScroll: true,
        dragMultipleComponent: true,
        showOffsets: true,
        
        // Parser configuration - CRITICAL: Don't sanitize HTML to preserve all elements
        // Note: GrapesJS parser options may vary by version
        // We rely on allowScripts: true at root level and minimal sanitization
        // The parser will preserve HTML structure as much as possible
        resizer: {
          tl: 1,
          tr: 1,
          bl: 1,
          br: 1,
          tc: 1,
          bc: 1,
          cl: 1,
          cr: 1,
          ratioDefault: false,
          preserveAspectRatio: false,
        },

        deviceManager: {
          devices: [
            { name: 'Desktop', width: '1200px', widthMedia: '' },
            { name: 'Tablet', width: '768px', widthMedia: '991px' },
            { name: 'Mobile', width: '320px', widthMedia: '767px' },
          ],
        },
        
        // UndoManager configuration for undo/redo functionality
        undoManager: {
          trackSelection: false,
        },
        
        // Canvas configuration - CRITICAL: Load Tailwind CSS so components render properly
        canvas: {
          styles: [
            'https://cdn.tailwindcss.com', // Tailwind CSS for component styling
          ],
          scripts: [
            'https://code.jquery.com/jquery-3.6.0.min.js',
            'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
          ],
          frameStyle: `
            body {
              min-height: 5000px;
              position: relative;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              transform: translateZ(0);
            }
            * {
              box-sizing: border-box;
            }
            img, video, iframe, canvas { max-width: 100%; height: auto; display: block; }
            section, div, header, footer { max-width: 100%; }
            @media (max-width: 1199px) {
              .gjs-row, .row { flex-wrap: wrap; }
            }
            @media (max-width: 767px) {
              .gjs-row > * { width: 100% !important; }
              section, div { padding-left: 12px; padding-right: 12px; }
            }
          `
        },
        
        blockManager: {
          appendTo: '#blocks-container',
          blocks: [], // EMPTY - blocks added after init succeeds
        },
      });
      
      console.log('8. ✅ GrapesJS init SUCCEEDED with minimal config!');
      
      // STEP 2: Now add blocks AFTER init succeeds
      console.log('9. Adding blocks after init...');
      if (blockDefinitions.length > 0) {
        const blocks = editor.BlockManager;
        blockDefinitions.forEach((def, index) => {
          try {
            blocks.add(def.id, {
              label: def.label,
              category: def.category,
              content: def.content,
              media: def.media,
              activate: def.activate,
              select: def.select,
            });
            if (index < 3) {
              console.log(`10. Added block ${index + 1}: ${def.id}`);
            }
          } catch (blockError) {
            console.error(`Failed to add block ${def.id}:`, blockError);
          }
        });
        console.log(`11. ✅ All ${blockDefinitions.length} blocks added successfully`);
      }
      
      console.log('12. GrapesJS editor initialized successfully');
      
      // CRITICAL: Add event listener to inject CSS when blocks are added
      // This handles CSS injection for components dragged from sidebar
      editor.on('block:drag:stop', (block: any) => {
        try {
          const blockModel = block;
          if (blockModel && blockModel.get) {
            const attributes = blockModel.get('attributes') || {};
            const componentCss = attributes['data-component-css'];
            const componentId = attributes['data-component-id'];
            
            if (componentCss && typeof componentCss === 'string') {
              const currentCss = editor.getCss() || '';
              const cssPreview = componentCss.substring(0, 50).trim();
              
              // Only add CSS if it's not already present
              if (cssPreview && !currentCss.includes(cssPreview)) {
                const newCss = currentCss ? currentCss + '\n\n/* Component: ' + (componentId || 'unknown') + ' */\n' + componentCss : componentCss;
                editor.setStyle(newCss);
                console.log('[GrapeEditor] Injected CSS for component:', componentId);
              }
            }
          }
        } catch (cssError) {
          console.warn('[GrapeEditor] Failed to inject CSS on block drag:', cssError);
        }
        // Remove drag ghost if any
        const ghost = document.querySelector('.drag-ghost');
        if (ghost) ghost.remove();
      });
      
      // Also listen for component:add event (when block is actually added to canvas)
      editor.on('component:add', (component: any) => {
        try {
          const attributes = component.getAttributes() || {};
          const componentCss = attributes['data-component-css'];
          const componentId = attributes['data-component-id'];
          
          if (componentCss && typeof componentCss === 'string') {
            const currentCss = editor.getCss() || '';
            const cssPreview = componentCss.substring(0, 50).trim();
            
            // Only add CSS if it's not already present
            if (cssPreview && !currentCss.includes(cssPreview)) {
              const newCss = currentCss ? currentCss + '\n\n/* Component: ' + (componentId || 'unknown') + ' */\n' + componentCss : componentCss;
              editor.setStyle(newCss);
              console.log('[GrapeEditor] Injected CSS for component on add:', componentId);
            }
          }

          // Apply responsive defaults to the newly added component
          addResponsiveClasses(component);

          const tag = component.get?.('tagName')?.toLowerCase();
          
          // Special handling for images - proper resize constraints
          if (tag === 'img') {
            component.set({
              draggable: true,
              droppable: false,
              selectable: true,
              hoverable: true,
              removable: true,
              copyable: true,
              resizable: {
                tl: 1, tc: 0, tr: 1,
                cl: 1, cr: 1,
                bl: 1, bc: 0, br: 1,
                ratioDefault: true, // Preserve aspect ratio by default for images
                keepAutoHeight: false,
                keepAutoWidth: false,
                minDim: 50,
                maxDim: 2000,
                step: 1,
                currentUnit: 1,
                unitWidth: 'px',
                unitHeight: 'px',
              },
            });
            // Set reasonable default styles for images
            component.setStyle({
              'max-width': '100%',
              'height': 'auto',
              'display': 'block',
            });
          } else {
            // Default resizable settings for other components
            component.set({
              draggable: true,
              droppable: true,
              selectable: true,
              hoverable: true,
              removable: true,
              copyable: true,
              resizable: {
                tl: 0, tc: 0, tr: 0,
                cl: 1, cr: 1,
                bl: 0, bc: 0, br: 1,
                ratioDefault: false,
                preserveAspectRatio: false,
              },
            });
          }
        } catch (cssError) {
          console.warn('[GrapeEditor] Failed to inject CSS on component add:', cssError);
        }
      });
      
      // Set default device to Desktop for consistent preview
      editor.setDevice('Desktop');

      // CRITICAL: Initialize UndoManager immediately so undo/redo buttons work from start
      const um = editor.UndoManager;
      if (um && typeof um.start === 'function') {
        um.start();
      }

      // Update undo/redo state whenever changes occur
      const updateUndoRedoState = () => {
        setCanUndo(um.hasUndo());
        setCanRedo(um.hasRedo());
      };

      // Initial state check
      updateUndoRedoState();

      // Listen to undo manager changes
      editor.on('change:canUndo', updateUndoRedoState);
      editor.on('change:canRedo', updateUndoRedoState);
      editor.on('undo', updateUndoRedoState);
      editor.on('redo', updateUndoRedoState);
      editor.on('component:add', updateUndoRedoState);
      editor.on('component:remove', updateUndoRedoState);

      // Ensure existing components are draggable/selectable after load
      editor.on('load', () => {
        try {
          editor.getComponents().each((cmp: any) => {
            cmp.set({
              draggable: true,
              droppable: true,
              selectable: true,
              hoverable: true,
              removable: true,
              copyable: true,
            });
          });
        } catch (e) {
          console.warn('Failed to set draggable defaults on load', e);
        }
      });

      // Resizer options for functional handles
      const resizerOpts = {
        ratioDefault: false,
        keyHeight: 'min-height',
        keyWidth: 'min-width',
        currentUnit: 1,
        unit: 'px',
        step: 1,
        minDim: 20,
        maxDim: '',
        updateTarget: function (el: HTMLElement, rect: any) {
          el.style.width = rect.w + 'px';
          el.style.height = rect.h + 'px';
          const wrapper = editor.getWrapper();
          const target = wrapper && wrapper.find?.('#' + el.id)?.[0];
          if (target) {
            target.addStyle({
              width: rect.w + 'px',
              height: rect.h + 'px',
            });
          }
        },
        onEnd: function () {
          try {
            editor.store();
          } catch (e) {
            console.warn('Store after resize failed:', e);
          }
        },
      };

      editor.setCustomRte?.(null);
      editor.getConfig().resizerOpts = resizerOpts;

      // Save editor reference (matching legacy pattern)
      grapesEditorRef.current = editor;

      // CRITICAL: Enable dropping HTML from external sources (sidebar components)
      // Listen for external drop events on the canvas
      const canvasEl = editor.Canvas.getElement();
      if (canvasEl) {
        canvasEl.addEventListener('dragover', (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
          }
        });

        canvasEl.addEventListener('drop', (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          const htmlData = e.dataTransfer?.getData('text/html') || e.dataTransfer?.getData('text/plain');
          
          if (htmlData && htmlData.trim()) {
            console.log('[GrapeEditor] External drop detected, HTML length:', htmlData.length);
            
            // Add the component to the canvas
            try {
              const wrapper = editor.getWrapper();
              if (wrapper) {
                // Extract style tag if present
                const styleMatch = htmlData.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
                let componentHtml = htmlData;
                
                if (styleMatch) {
                  // Inject CSS separately
                  const cssContent = styleMatch[1];
                  componentHtml = htmlData.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                  
                  const currentCss = editor.getCss() || '';
                  if (!currentCss.includes(cssContent.substring(0, 50))) {
                    editor.setStyle(currentCss + '\n' + cssContent);
                  }
                }
                
                // Append component HTML
                wrapper.append(componentHtml);
                console.log('[GrapeEditor] ✅ Component added from external drop');
              }
            } catch (dropError) {
              console.error('[GrapeEditor] Failed to add component from drop:', dropError);
            }
          }
        });
      }

      // Use canvas:frame:loaded event to handle canvas styling and mark as ready
      let readySet = false;
      
      editor.on('canvas:frame:loaded', () => {
        console.log('13. Canvas frame loaded event fired');
        
        // Canvas frame is now fully loaded and ready
        const canvasWrapper = editor.Canvas.getWrapperEl();
        if (canvasWrapper) {
          // Center canvas horizontally
          canvasWrapper.style.display = 'flex';
          canvasWrapper.style.justifyContent = 'center';
          canvasWrapper.style.alignItems = 'flex-start';
          canvasWrapper.style.minHeight = '100%';
          canvasWrapper.style.paddingTop = '20px';
          console.log('14. Canvas wrapper styled');
        }
        
        // Mark editor as ready after canvas frame is confirmed loaded
        if (!readySet) {
          setIsReady(true);
          readySet = true;
          console.log('15. Editor marked as ready');
        }
      });

      // Fallback: if canvas:frame:loaded doesn't fire, set ready after a delay
      setTimeout(() => {
        if (!readySet) {
          console.log('16. Fallback: Setting editor ready (canvas:frame:loaded did not fire)');
          setIsReady(true);
          readySet = true;
        }
      }, 2000);

      // Load initial content if provided
      // CRITICAL: Don't sanitize initialHtml - it should already be clean
      // Sanitization was corrupting valid HTML attributes
      if (initialHtml || initialCss) {
        try {
          editor.setComponents(initialHtml || '');
          editor.setStyle(initialCss);
        } catch (error) {
          console.error('Failed to set initial content:', error);
          // Only sanitize if setComponents fails (truly broken HTML)
          try {
            if (initialHtml) {
              const sanitizedHtml = sanitizeHtml(initialHtml);
              editor.setComponents(sanitizedHtml);
              addResponsiveClasses(editor.getWrapper());
            }
          } catch (retryError) {
            console.error('Failed even after sanitization:', retryError);
          }
        }
      } else {
        // Ensure base wrapper is responsive even if empty to start
        addResponsiveClasses(editor.getWrapper());
      }

      // Listen for changes and trigger auto-save
      editor.on('update', () => {
        const html = editor.getHtml();
        const css = editor.getCss();
        
        // Update project store - CRITICAL: persist HTML in components so load works
        if (currentProject) {
          const currentPage = currentProject.pages[0];
          if (currentPage) {
            updateProject({
              pages: [
                {
                  ...currentPage,
                  components: html ? [{ id: 'main', type: 'wrapper', category: 'custom', props: { html } }] : [],
                  styles: css,
                },
              ],
            });
          }
        }
        
        // Call external update handler
        onUpdate?.(html, css);
      });

    } catch (initError) {
      console.error('❌ GrapesJS init FAILED:', initError);
      console.error('Error details:', {
        message: initError instanceof Error ? initError.message : String(initError),
        stack: initError instanceof Error ? initError.stack : undefined,
      });
      // Don't throw - let the component handle the error gracefully
      setIsReady(true); // Set ready anyway to prevent infinite loading
    }

    // Cleanup
    return () => {
      if (grapesEditorRef.current) {
        grapesEditorRef.current.destroy();
        grapesEditorRef.current = null;
      }
    };
  }, [components]); // Re-initialize when components change

  // Apply dark theme to editor when site theme changes
  useEffect(() => {
    const editor = grapesEditorRef.current;
    if (!editor) return;

    const canvas = editor.Canvas.getElement();
    if (canvas) {
      if (isDark) {
        // Apply dark theme styles to canvas
        canvas.style.backgroundColor = '#ffffff'; // Keep canvas white for content
        canvas.style.color = '#1f2937'; // Dark text on canvas
      } else {
        // Apply light theme styles to canvas
        canvas.style.backgroundColor = '#ffffff'; // Light background
        canvas.style.color = '#1f2937'; // Dark text
      }
    }

    // Apply theme to editor panels and UI elements
    const applyThemeToElements = (selector: string, darkStyles: Record<string, string>, lightStyles: Record<string, string>) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        const el = element as HTMLElement;
        if (isDark) {
          Object.assign(el.style, darkStyles);
        } else {
          Object.assign(el.style, lightStyles);
        }
      });
    };

    // Toolbar and panels - gray/orange theme (like Claude)
    applyThemeToElements('.gjs-pn-panel, .gjs-toolbar, .gjs-pn-panels', {
      backgroundColor: '#2d2d2d',
      color: '#e5e5e5',
      borderColor: '#404040'
    }, {
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      borderColor: '#e5e7eb'
    });

    // Block manager and layer manager
    applyThemeToElements('.gjs-block-category, .gjs-blocks-c, .gjs-layer', {
      backgroundColor: '#2d2d2d',
      color: '#e5e5e5'
    }, {
      backgroundColor: '#f9fafb',
      color: '#1a1a1a'
    });

    // Style manager
    applyThemeToElements('.gjs-sm-sector, .gjs-sm-properties, .gjs-trt-traits', {
      backgroundColor: '#2d2d2d',
      color: '#e5e5e5'
    }, {
      backgroundColor: '#ffffff',
      color: '#1a1a1a'
    });

    // Buttons and controls
    applyThemeToElements('.gjs-pn-btn, .gjs-toolbar-item, button', {
      backgroundColor: isDark ? '#3a3a3a' : '#f9fafb',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
      borderColor: isDark ? '#404040' : '#d1d5db'
    }, {
      backgroundColor: '#f9fafb',
      color: '#1a1a1a',
      borderColor: '#d1d5db'
    });

    // Active/hover states
    applyThemeToElements('.gjs-pn-btn:hover, .gjs-toolbar-item:hover', {
      backgroundColor: isDark ? '#3a3a3a' : '#f3f4f6'
    }, {
      backgroundColor: '#f3f4f6'
    });

    // Input fields and selects
    applyThemeToElements('input, select, textarea', {
      backgroundColor: isDark ? '#3a3a3a' : '#ffffff',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
      borderColor: isDark ? '#404040' : '#d1d5db'
    }, {
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      borderColor: '#d1d5db'
    });

    // Specific GrapesJS elements - orange accent
    applyThemeToElements('.gjs-badge, .gjs-com-badge', {
      backgroundColor: '#FF6B35',
      color: '#ffffff'
    }, {
      backgroundColor: '#FF6B35',
      color: '#ffffff'
    });

    // Modal dialogs
    applyThemeToElements('.gjs-mdl-dialog', {
      backgroundColor: '#2d2d2d',
      color: '#e5e5e5',
      borderColor: '#404040'
    }, {
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      borderColor: '#e5e7eb'
    });

  }, [isDark]);

  /**
   * Sync loaded/imported project structure into the GrapesJS canvas.
   *
   * After ZIP import, the parser fills `project.pages[0].components` and `styles`.
   * This effect translates that structured data into HTML + CSS for GrapesJS.
   */
  useEffect(() => {
    const editor = grapesEditorRef.current;

    if (!isReady || !editor) {
      return;
    }
    
    // Handle case where currentProject becomes null (e.g., after localStorage error)
    if (!currentProject) {
      console.warn('[GrapeEditor] ⚠️ currentProject is null - skipping sync. This may happen if project is too large for localStorage.');
      return;
    }

    const firstPage = currentProject.pages[0];
    if (!firstPage) return;

    // Signature to avoid unnecessary re-syncs on minor metadata changes
    const signature = `${currentProject.id}:${firstPage.id}:${firstPage.components?.length || 0}`;
    if (lastSyncedProjectRef.current === signature) {
      return;
    }

    // Build HTML from parsed components (ZIP import, structured project)
    // CRITICAL FIX: Handle both string (SimpleParser V3) and array (Parser V2) formats
    const components = firstPage.components;
    const componentCount = typeof components === 'string' 
      ? components.length 
      : Array.isArray(components) 
        ? (components as any[]).length 
        : 0;
    console.log('[GrapeEditor] Building HTML from components, component count:', componentCount);
    
    let htmlFromComponents = '';
    
    // Type guard: If components is already a string (HTML), use it directly
    if (typeof components === 'string') {
      htmlFromComponents = components;
      console.log('[GrapeEditor] Components is HTML string, using directly, length:', htmlFromComponents.length);
    }
    // If components is an array, process it as before
    else if (Array.isArray(components) && components.length > 0) {
      htmlFromComponents = components
        .map((component, idx) => {
          const html = component?.props && typeof component.props.html === 'string'
            ? component.props.html
            : '';
          
          if (!html || html.trim().length === 0) {
            console.warn(`[GrapeEditor] Component ${idx} has empty HTML:`, {
              type: component?.type,
              category: component?.category,
              props: component?.props
            });
          } else {
            console.log(`[GrapeEditor] Component ${idx} HTML length: ${html.length}, preview: ${html.substring(0, 100)}`);
          }
          
          return html;
        })
        .filter(Boolean)
        .join('\n');
    }
    
    console.log('[GrapeEditor] Final HTML from components length:', htmlFromComponents.length);
    if (htmlFromComponents.length === 0) {
      console.error('[GrapeEditor] ⚠️ WARNING: No HTML content extracted from components!');
      console.error('[GrapeEditor] Component structure:', JSON.stringify(firstPage.components?.slice(0, 2), null, 2));
    }

    const cssParts: string[] = [];
    if (currentProject.globalStyles) cssParts.push(currentProject.globalStyles);
    if (firstPage.styles) cssParts.push(firstPage.styles);
    const css = cssParts.join('\n');

    const shouldApply =
      htmlFromComponents ||
      css ||
      editor.getHtml().trim().length === 0;

    if (!shouldApply) {
      lastSyncedProjectRef.current = signature;
      return;
    }

    if (htmlFromComponents) {
      // КРИТИЧЕСКИ ВАЖНО: НЕ конвертировать CSS в inline для ZIP импортов!
      // ZIP импорты уже содержат <style> теги с CSS - конвертация может терять элементы
      // Проверяем: если HTML уже содержит <style> тег, значит это ZIP импорт
      const hasStyleTag = htmlFromComponents.includes('<style') || htmlFromComponents.includes('<STYLE');
      
      let htmlWithInlineStyles = htmlFromComponents;
      
      // Только конвертируем CSS в inline если:
      // 1. НЕТ <style> тега в HTML (старый формат проекта)
      // 2. ЕСТЬ CSS для конвертации
      if (css && !hasStyleTag) {
        console.log('[GrapeEditor] Converting CSS classes to inline styles (no <style> tag found)...');
        htmlWithInlineStyles = convertCssToInlineStyles(htmlFromComponents, css);
        console.log('[GrapeEditor] ✅ CSS converted to inline styles');
      } else if (hasStyleTag) {
        console.log('[GrapeEditor] ⚠️ HTML contains <style> tag - skipping CSS-to-inline conversion to preserve structure');
      } else {
        console.log('[GrapeEditor] No CSS to convert or no style tag - using HTML as-is');
      }
      
      // CRITICAL: Don't sanitize HTML by default - sanitization was corrupting valid HTML attributes
      // Only sanitize if setComponents fails (truly broken HTML)
      console.log('Setting components from ZIP import, HTML length:', htmlWithInlineStyles.length);
      console.log('HTML preview (first 500 chars):', htmlWithInlineStyles.substring(0, 500));
      
      // Wait for canvas to be ready before setting components
      // This prevents black canvas issues when setting components immediately after import
      const setComponentsWhenReady = () => {
        const frame = editor.Canvas.getFrameEl();
        if (frame && frame.contentDocument && frame.contentDocument.body) {
          console.log('Canvas frame is ready, setting components...');
          try {
            editor.setComponents(htmlWithInlineStyles);
            console.log('✅ Components set successfully');
          } catch (error) {
            console.error('Failed to set components in GrapesJS, trying with sanitization:', error);
            // Only sanitize if setComponents fails (truly broken HTML)
            const sanitizedHtml = sanitizeHtml(htmlWithInlineStyles);
            try {
              editor.setComponents(sanitizedHtml);
              console.log('✅ Components set after sanitization');
            } catch (retryError) {
              console.error('Failed to set components even after sanitization:', retryError);
            }
          }
        } else {
          console.log('Canvas frame not ready yet, retrying in 200ms...');
          setTimeout(setComponentsWhenReady, 200);
        }
      };
      
      // Start trying to set components
      setTimeout(setComponentsWhenReady, 100);
    }

    // Note: We still call setStyle() for any CSS that couldn't be inlined
    // (like @media queries, pseudo-selectors, etc.) but most styles are now inline
    if (css) {
      // Only set CSS that contains rules that can't be inlined (media queries, etc.)
      // Most class-based styles are now inline in the HTML
      const hasNonInlineableRules = css.includes('@media') || css.includes(':hover') || css.includes(':before') || css.includes(':after');
      if (hasNonInlineableRules) {
        editor.setStyle(css);
        console.log('✅ Additional CSS rules (media queries, pseudo-selectors) added via setStyle()');
      }
    }

    lastSyncedProjectRef.current = signature;
  }, [currentProject, isReady]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    clear: () => {
      if (grapesEditorRef.current) {
        grapesEditorRef.current.setComponents('');
        grapesEditorRef.current.setStyle('');
      }
    },
    getEditor: () => grapesEditorRef.current,
    setComponents: (html: string) => {
      if (grapesEditorRef.current) {
        // CRITICAL: Don't sanitize by default - sanitization was corrupting valid HTML
        // Only sanitize if setComponents fails (truly broken HTML)
        try {
          grapesEditorRef.current.setComponents(html);
        } catch (error) {
          console.warn('[GrapeEditor] setComponents failed, trying with sanitization:', error);
          const sanitizedHtml = sanitizeHtml(html);
          grapesEditorRef.current.setComponents(sanitizedHtml);
        }
      }
    },
    setStyle: (css: string) => {
      if (grapesEditorRef.current) {
        grapesEditorRef.current.setStyle(css);
      }
    },
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  }), [handleUndo, handleRedo, canUndo, canRedo]);

  return (
    <div className="h-full w-full relative">
      <style jsx global>{`
        /* Center GrapesJS canvas */
        .gjs-cv-canvas {
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100%;
          padding-top: 20px;
        }
        
        .gjs-frame {
          margin: 0 auto;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        
        /* Ensure canvas wrapper is centered */
        .gjs-cv-canvas__frames {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        
        /* Hide default GrapesJS panels that duplicate our UI */
        .gjs-pn-panels .gjs-pn-devices-c {
          display: none !important;
        }
        
        /* Image resize handles styling */
        .gjs-resizer-h {
          background-color: #ff6b35 !important;
          border: 2px solid white !important;
          border-radius: 50% !important;
          width: 10px !important;
          height: 10px !important;
        }
        
        /* Ensure editor container accepts drops */
        .gjs-editor {
          pointer-events: auto;
        }
        
        /* Style the drop placeholder */
        .gjs-placeholder {
          border: 2px dashed #ff6b35 !important;
          background-color: rgba(255, 107, 53, 0.08) !important;
          min-height: 50px;
        }
      `}</style>
      
      <div ref={editorRef} className="h-full w-full" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      )}
    </div>
  );
});
