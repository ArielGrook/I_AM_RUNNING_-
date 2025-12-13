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
function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return html;

  let sanitized = html;

  // CRITICAL: Fix quotes in attribute NAMES first (this causes InvalidCharacterError)
  // Pattern: attribute-name-with-quote"=value or attribute-name-with-quote'=value
  // Example: border-gray-200"= → border-gray-200=
  sanitized = sanitized.replace(/([a-zA-Z0-9_-]+)["']=/g, '$1=');

  // Fix double quotes at the end of attribute values: class="x"" → class="x"
  // Matches: attribute="value"" (double quote at end)
  sanitized = sanitized.replace(/(\w+)=(["'])([^"']*?)\2\2/gi, '$1=$2$3$2');

  // Fix single quotes at the end of attribute values: class='x'' → class='x'
  sanitized = sanitized.replace(/(\w+)=(['"])([^'"]*?)\2\2/gi, '$1=$2$3$2');

  // Fix missing spaces between attributes: widthclass= → width class=
  // Common patterns where attributes are merged
  sanitized = sanitized.replace(/(\w+)(class|id|style|href|src|alt|width|height|type|name|value|data-[\w-]+)=/gi, '$1 $2=');

  // Fix attributes where value has trailing quote before next attribute or closing tag
  // Pattern: class="value" attribute= or class="value">
  sanitized = sanitized.replace(/(\w+)=(["'])([^"']*?)\2\s*([>"'])/g, (match, attr, quote, value, end) => {
    // If end is a quote (double quote), it's likely a malformed attribute
    if (end === quote) {
      return `${attr}=${quote}${value}${quote}`;
    }
    return match;
  });

  // Fix unclosed attribute values: class="x → class="x"
  // Look for attributes that start with quote but don't have closing quote before > or space
  sanitized = sanitized.replace(/(\w+)=(["'])([^"'>]*?)([>"\s])/g, (match, attr, quote, value, end) => {
    // If we hit > or space without closing quote, add the closing quote
    if (end !== quote && end !== '>') {
      return `${attr}=${quote}${value}${quote}${end}`;
    }
    return match;
  });

  // Fix attributes with invalid characters in names (keep only alphanumeric, dash, underscore, colon)
  // This is a safety net for any remaining malformed attribute names
  sanitized = sanitized.replace(/(<[a-zA-Z][^>]*?)\s+([^"'\s=]+["'])=/g, (match, tagStart, badAttr) => {
    // Remove quotes from attribute name
    const cleanAttr = badAttr.replace(/["']/g, '');
    return `${tagStart} ${cleanAttr}=`;
  });

  // Final cleanup: ensure all attribute values are properly quoted if they contain spaces
  // This helps with attributes like: class=border-gray-200 (should be class="border-gray-200")
  sanitized = sanitized.replace(/(\w+)=([^"'\s>]+)(\s|>)/g, (match, attr, value, end) => {
    // If value doesn't start with quote and contains special chars, quote it
    if (!value.match(/^["']/) && (value.includes('-') || value.includes('_'))) {
      return `${attr}="${value}"${end}`;
    }
    return match;
  });

  return sanitized;
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
      // Test with empty blocks first to isolate the problem
      editor = grapesjs.init({
        container: editorRef.current!,
        height: '100%',
        width: 'auto',
        fromElement: false,
        storageManager: false,
        
        blockManager: {
          appendTo: '#blocks-container',
          blocks: [], // EMPTY - test if basic init works
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
      if (initialHtml || initialCss) {
        const sanitizedHtml = initialHtml ? sanitizeHtml(initialHtml) : '';
        try {
          editor.setComponents(sanitizedHtml);
          editor.setStyle(initialCss);
        } catch (error) {
          console.error('Failed to set initial content:', error);
        }
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

    if (!isReady || !editor || !currentProject) {
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
    const htmlFromComponents =
      firstPage.components && firstPage.components.length > 0
        ? firstPage.components
            .map((component) =>
              component?.props && typeof component.props.html === 'string'
                ? component.props.html
                : ''
            )
            .filter(Boolean)
            .join('\n')
        : '';

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
      // Sanitize HTML to fix malformed attributes before setting
      const sanitizedHtml = sanitizeHtml(htmlFromComponents);
      
      // Use setTimeout to ensure editor is fully ready
      // This prevents black canvas issues when setting components immediately after import
      setTimeout(() => {
        try {
          editor.setComponents(sanitizedHtml);
        } catch (error) {
          console.error('Failed to set components in GrapesJS:', error);
          // Try again with more aggressive sanitization
          const moreSanitized = sanitizedHtml.replace(/[^\x20-\x7E\n\r\t]/g, '');
          try {
            editor.setComponents(moreSanitized);
          } catch (retryError) {
            console.error('Failed to set components even after aggressive sanitization:', retryError);
          }
        }
      }, 100);
    }

    if (css) {
      editor.setStyle(css);
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
        // Sanitize HTML before setting to fix malformed attributes
        const sanitizedHtml = sanitizeHtml(html);
        grapesEditorRef.current.setComponents(sanitizedHtml);
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
