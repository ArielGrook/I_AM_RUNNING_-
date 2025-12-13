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
 */
export type BlockDefinition = {
  id: string;
  label: string;
  category: string;
  content: string;
  media?: string | null;
  activate?: boolean;
  select?: boolean;
  attributes?: Record<string, any>;
};

/**
 * Get block definitions from Supabase components
 * Returns array of block definitions to be passed into grapesjs.init() config
 * 
 * @param components - Array of Supabase components
 * @returns Array of block definitions
 */
export function getSupabaseBlockDefinitions(components: SupabaseComponent[]): BlockDefinition[] {
  return components.map((component) => ({
    id: component.id,
    label: component.name,
    category: component.category.charAt(0).toUpperCase() + component.category.slice(1),
    content: component.html,
    media: component.thumbnail || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/></svg>`,
    activate: true,
    select: true,
  }));
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

