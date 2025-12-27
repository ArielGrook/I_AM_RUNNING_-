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
import { getAllCatalogBlockDefinitions, getSupabaseBlockDefinitions, type BlockDefinition } from '@/lib/grapesjs/catalog-blocks';
import { type SupabaseComponent } from '@/lib/components/supabase-catalog';
import { convertCssToInlineStyles } from '@/lib/utils/css-to-inline';

export interface GrapeEditorRef {
  clear: () => void;
  getEditor: () => grapesjs.Editor | null;
  setComponents: (html: string) => void;
  setStyle: (css: string) => void;
}

interface GrapeEditorProps {
  onUpdate?: (html: string, css: string) => void;
  initialHtml?: string;
  initialCss?: string;
  isRTL?: boolean;
  components?: SupabaseComponent[]; // Supabase components to register as blocks
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
  ({ onUpdate, initialHtml = '', initialCss = '', isRTL = false, components }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const grapesEditorRef = useRef<grapesjs.Editor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastSyncedProjectRef = useRef<string | null>(null);
  const { currentProject, updateProject } = useProjectStore();

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
        allowScripts: 1,
        dragMode: 'absolute',
        dragAutoScroll: 1,
        dragMultipleComponent: 1,
        showOffsets: 1,
        resizer: {
          tl: 1,
          tr: 1,
          bl: 1,
          br: 1,
          tc: 1,
          bc: 1,
          cl: 1,
          cr: 1,
          ratioDefault: true,
          preserveAspectRatio: true,
        },

        deviceManager: {
          devices: [
            { name: 'Desktop', width: '1200px', widthMedia: '' },
            { name: 'Tablet', width: '768px', widthMedia: '991px' },
            { name: 'Mobile', width: '320px', widthMedia: '767px' },
          ],
        },
        
        // Canvas configuration - CRITICAL: Load Tailwind CSS so components render properly
        canvas: {
          styles: [
            'https://cdn.tailwindcss.com', // Tailwind CSS for component styling
          ],
          scripts: [],
          frameStyle: `
            body {
              min-height: 5000px;
              position: relative;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
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
        } catch (cssError) {
          console.warn('[GrapeEditor] Failed to inject CSS on component add:', cssError);
        }
      });
      
      // Set default device to Desktop for consistent preview
      editor.setDevice('Desktop');

      // Save editor reference (matching legacy pattern)
      grapesEditorRef.current = editor;

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

      // Listen for changes
      editor.on('update', () => {
        const html = editor.getHtml();
        const css = editor.getCss();
        
        // Update project store
        if (currentProject) {
          const currentPage = currentProject.pages[0];
          if (currentPage) {
            updateProject({
              pages: [
                {
                  ...currentPage,
                  components: [], // TODO: Parse HTML to components
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
  }, [isRTL, components]); // Re-initialize if RTL or components change

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
    console.log('[GrapeEditor] Building HTML from components, component count:', firstPage.components?.length || 0);
    
    const htmlFromComponents =
      firstPage.components && firstPage.components.length > 0
        ? firstPage.components
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
            .join('\n')
        : '';
    
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
      // CRITICAL FIX: Convert CSS classes to inline styles before setting components
      // This matches the working approach from LSB-REDACTOR.js where all styles are inline
      // GrapesJS treats CSS strings in canvas.styles as URLs, so we must inline styles
      let htmlWithInlineStyles = htmlFromComponents;
      
      if (css) {
        console.log('Converting CSS classes to inline styles...');
        htmlWithInlineStyles = convertCssToInlineStyles(htmlFromComponents, css);
        console.log('✅ CSS converted to inline styles');
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
  }), []);

  return (
    <div className="h-full w-full relative" dir={isRTL ? 'rtl' : 'ltr'}>
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
