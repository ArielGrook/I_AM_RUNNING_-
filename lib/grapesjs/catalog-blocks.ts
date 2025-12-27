/**
 * Grape.js Catalog Blocks Integration
 * 
 * Converts component catalog items into Grape.js blocks.
 * Supports both static catalog and Supabase components.
 * 
 * CRITICAL: Blocks are returned as definitions to be passed into grapesjs.init() config,
 * matching the legacy pattern where blocks are defined DURING init, not after.
 * 
 * Stage 1 Module 2: Editor Structure
 * Stage 2 Module 5: Component System from Supabase
 */

import { componentCatalog } from '@/lib/components/catalog';
import { type SupabaseComponent } from '@/lib/components/supabase-catalog';
import { Category } from '@/lib/types/project';

/**
 * Block definition type matching GrapesJS block format
 * 
 * CRITICAL: content can be a string or a function that returns a string
 * Function receives (block, editor) and can inject CSS
 */
export type BlockDefinition = {
  id: string;
  label: string;
  category: string;
  content: string | ((block: any, editor: any) => string);
  media?: string | null;
  activate?: boolean;
  select?: boolean;
  attributes?: Record<string, any>;
};

/**
 * Get block definitions from Supabase components
 * Returns array of block definitions to be passed into grapesjs.init() config
 * 
 * CRITICAL FIX: Ensure HTML is a string and inject CSS when block is added
 * 
 * @param components - Array of Supabase components
 * @returns Array of block definitions
 */
export function getSupabaseBlockDefinitions(components: SupabaseComponent[]): BlockDefinition[] {
  return components.map((component) => {
    // CRITICAL: Ensure HTML is a string, not JSON or object
    let htmlContent = '';
    if (typeof component.html === 'string') {
      htmlContent = component.html;
    } else if (component.html) {
      // If it's an object or JSON string, try to extract HTML
      try {
        const parsed = typeof component.html === 'string' ? JSON.parse(component.html) : component.html;
        htmlContent = parsed.html || parsed.content || String(component.html);
      } catch {
        htmlContent = String(component.html);
      }
    }
    
    // CRITICAL: Store CSS separately for injection
    const componentCss = component.css || '';
    
    return {
      id: component.id,
      label: component.name,
      category: component.category.charAt(0).toUpperCase() + component.category.slice(1),
      // CRITICAL: Content must be a STRING, not JSON or object
      // Use function to inject CSS when block is dragged
      content: (block: any, editor: any) => {
        // Inject CSS if component has CSS
        if (componentCss && editor) {
          try {
            const currentCss = editor.getCss() || '';
            // Only add CSS if it's not already present (check first 50 chars to avoid duplicates)
            const cssPreview = componentCss.substring(0, 50).trim();
            if (cssPreview && !currentCss.includes(cssPreview)) {
              const newCss = currentCss ? currentCss + '\n\n/* Component: ' + component.name + ' */\n' + componentCss : componentCss;
              editor.setStyle(newCss);
            }
          } catch (cssError) {
            console.warn('[Block] Failed to inject CSS for component:', component.name, cssError);
          }
        }
        // CRITICAL: Return HTML as string (not JSON, not object)
        // Validate it's actually HTML, not JSON
        if (htmlContent.trim().startsWith('{') || htmlContent.trim().startsWith('[')) {
          console.error('[Block] ERROR: Component HTML appears to be JSON instead of HTML:', component.name);
          console.error('[Block] HTML content:', htmlContent.substring(0, 200));
          // Try to extract HTML from JSON if it's a JSON string
          try {
            const parsed = JSON.parse(htmlContent);
            if (parsed.html) {
              return parsed.html;
            } else if (parsed.content) {
              return parsed.content;
            }
          } catch {
            // Not valid JSON, return as-is but log warning
          }
        }
        return htmlContent;
      },
      media: component.thumbnail || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/></svg>`,
      activate: true,
      select: true,
      // Store CSS for reference
      attributes: {
        'data-component-css': componentCss,
      },
    };
  });
}

/**
 * Get block definitions from static catalog
 * Returns array of block definitions to be passed into grapesjs.init() config
 * 
 * @param category - Optional category filter
 * @returns Array of block definitions
 */
export function getCatalogBlockDefinitions(category?: Category): BlockDefinition[] {
  // Get components to register
  const components = category
    ? componentCatalog.filter(c => c.category === category)
    : componentCatalog;
  
  return components.map((component) => {
    // Get default variant (minimal)
    const html = component.variants.minimal || component.variants.modern || '';
    
    return {
      id: component.id,
      label: component.name,
      category: component.category.charAt(0).toUpperCase() + component.category.slice(1),
      content: html,
      media: component.thumbnail || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/></svg>`,
      activate: true,
      select: true,
    };
  });
}

/**
 * Get all catalog block definitions (static catalog - fallback)
 * Returns array of block definitions to be passed into grapesjs.init() config
 */
export function getAllCatalogBlockDefinitions(): BlockDefinition[] {
  return getCatalogBlockDefinitions();
}

// Legacy functions kept for backward compatibility (but should not be used)
// These will be deprecated in favor of the get* functions above
import grapesjs from 'grapesjs';

/**
 * @deprecated Use getSupabaseBlockDefinitions() instead and pass blocks into init config
 */
export function registerSupabaseBlocks(editor: grapesjs.Editor, components: SupabaseComponent[]): void {
  console.warn('registerSupabaseBlocks is deprecated. Use getSupabaseBlockDefinitions() instead.');
  const blocks = editor.BlockManager;
  const definitions = getSupabaseBlockDefinitions(components);
  definitions.forEach(def => {
    blocks.add(def.id, def);
  });
}

/**
 * @deprecated Use getCatalogBlockDefinitions() instead and pass blocks into init config
 */
export function registerCatalogBlocks(editor: grapesjs.Editor, category?: Category): void {
  console.warn('registerCatalogBlocks is deprecated. Use getCatalogBlockDefinitions() instead.');
  const blocks = editor.BlockManager;
  const definitions = getCatalogBlockDefinitions(category);
  definitions.forEach(def => {
    blocks.add(def.id, def);
  });
}

/**
 * @deprecated Use getAllCatalogBlockDefinitions() instead and pass blocks into init config
 */
export function registerAllCatalogBlocks(editor: grapesjs.Editor): void {
  registerCatalogBlocks(editor);
}

/**
 * @deprecated Use getCatalogBlockDefinitions(category) instead and pass blocks into init config
 */
export function registerCategoryBlocks(editor: grapesjs.Editor, category: Category): void {
  registerCatalogBlocks(editor, category);
}

