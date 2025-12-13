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
import { registerAllCatalogBlocks, registerSupabaseBlocks } from '@/lib/grapesjs/catalog-blocks';
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

    // Initialize Grape.js editor
    const editor = grapesjs.init({
      container: editorRef.current,
      height: '100%',
      width: '100%',
      
      // RTL support
      rtl: isRTL,
      
      // Critical settings from legacy code for ZIP import compatibility
      allowScripts: 1,
      dragMode: 'absolute',
      dragAutoScroll: 1,
      dragMultipleComponent: 1,
      
      // Canvas configuration with frame styles (legacy compatibility)
      canvas: {
        styles: [],
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
        `
      },
      
      // Storage configuration (localStorage for now, Supabase later)
      storageManager: {
        type: 'local',
        autosave: true,
        autoload: true,
        stepsBeforeSave: 1,
      },
      
      // Block manager configuration
      blockManager: {
        appendTo: '#blocks-container',
      },
      
      // Layer manager
      layerManager: {
        appendTo: '#layers-container',
      },
      
      // Style manager
      styleManager: {
        appendTo: '#styles-container',
        sectors: [
          {
            name: 'Dimension',
            open: false,
            buildProps: ['width', 'min-height', 'padding'],
            properties: [
              {
                type: 'integer',
                name: 'The width',
                property: 'width',
                units: ['px', '%'],
                defaults: 'auto',
                min: 0,
              },
            ],
          },
          {
            name: 'Extra',
            open: false,
            buildProps: ['background-color', 'box-shadow', 'custom-prop'],
            properties: [
              {
                id: 'custom-prop',
                name: 'Custom Label',
                property: 'font-size',
                type: 'select',
                defaults: '32px',
                options: [
                  { value: '12px', name: 'Tiny' },
                  { value: '18px', name: 'Medium' },
                  { value: '32px', name: 'Big' },
                ],
              },
            ],
          },
        ],
      },
      
      // Device manager
      deviceManager: {
        devices: [
          {
            name: 'Desktop',
            width: '',
          },
          {
            name: 'Tablet',
            width: '768px',
            widthMedia: '992px',
          },
          {
            name: 'Mobile',
            width: '320px',
            widthMedia: '768px',
          },
        ],
      },
      
      // Panels configuration
      panels: {
        defaults: [
          {
            id: 'layers',
            el: '.panel__right',
            resizable: {
              maxDim: 350,
              minDim: 200,
              tc: 0,
              cl: 1,
              cr: 0,
              bc: 0,
              keyWidth: 'flex-basis',
            },
          },
          {
            id: 'panel-devices',
            el: '.panel__devices',
            buttons: [
              {
                id: 'device-desktop',
                label: 'D',
                command: 'set-device-desktop',
                active: true,
                togglable: false,
              },
              {
                id: 'device-tablet',
                label: 'T',
                command: 'set-device-tablet',
                togglable: false,
              },
              {
                id: 'device-mobile',
                label: 'M',
                command: 'set-device-mobile',
                togglable: false,
              },
            ],
          },
        ],
      },
      
      // Plugins
      plugins: ['gjs-blocks-basic', 'gjs-preset-webpage'],
      pluginsOpts: {
        'gjs-preset-webpage': {
          modalImportTitle: 'Import Template',
          modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Paste here your HTML/CSS and click Import</div>',
          modalImportContent: (editor: grapesjs.Editor) => {
            return editor.getHtml() + '<style>' + editor.getCss() + '</style>';
          },
        },
      },
    });

    // Save editor reference (matching legacy pattern)
    grapesEditorRef.current = editor;

    // Register components as custom blocks
    if (components && components.length > 0) {
      // Use Supabase components if provided
      registerSupabaseBlocks(editor, components);
    } else {
      // Fallback to static catalog
      registerAllCatalogBlocks(editor);
    }

    // Use canvas:frame:loaded event instead of load - this fires when canvas iframe is ACTUALLY ready
    // This is the correct event to use (not 'load' which fires too early)
    let readySet = false;
    
    editor.on('canvas:frame:loaded', () => {
      // Canvas frame is now fully loaded and ready
      const canvasWrapper = editor.Canvas.getWrapperEl();
      if (canvasWrapper) {
        // Center canvas horizontally
        canvasWrapper.style.display = 'flex';
        canvasWrapper.style.justifyContent = 'center';
        canvasWrapper.style.alignItems = 'flex-start';
        canvasWrapper.style.minHeight = '100%';
        canvasWrapper.style.paddingTop = '20px';
      }
      // Mark editor as ready after canvas frame is confirmed loaded
      if (!readySet) {
        setIsReady(true);
        readySet = true;
      }
    });

    // Fallback: if canvas:frame:loaded doesn't fire, set ready after a delay
    // This matches legacy pattern where editor is ready immediately after init
    setTimeout(() => {
      if (!readySet) {
        setIsReady(true);
        readySet = true;
      }
    }, 500);

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

    // Note: setIsReady(true) is now called inside editor.on('canvas:frame:loaded') callback
    // after canvas frame is confirmed ready, with a fallback timeout

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
