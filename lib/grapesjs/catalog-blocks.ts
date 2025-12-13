/**
 * Grape.js Catalog Blocks Integration
 * 
 * Converts component catalog items into Grape.js blocks.
 * Supports both static catalog and Supabase components.
 * 
 * Stage 1 Module 2: Editor Structure
 * Stage 2 Module 5: Component System from Supabase
 */

import { componentCatalog } from '@/lib/components/catalog';
import { type SupabaseComponent } from '@/lib/components/supabase-catalog';
import { Category } from '@/lib/types/project';
import grapesjs from 'grapesjs';

/**
 * Register Supabase components as Grape.js blocks
 * 
 * @param editor - Grape.js editor instance
 * @param components - Array of Supabase components
 */
export function registerSupabaseBlocks(editor: grapesjs.Editor, components: SupabaseComponent[]): void {
  const blocks = editor.BlockManager;
  
  // Group by category
  const byCategory = components.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<Category, SupabaseComponent[]>);
  
  // Register blocks for each category
  Object.entries(byCategory).forEach(([cat, comps]) => {
    comps.forEach((component) => {
      blocks.add(component.id, {
        label: component.name,
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        content: component.html,
        media: component.thumbnail || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/></svg>`,
        activate: true,
        select: true,
      });
    });
  });
}

/**
 * Register component catalog items as Grape.js blocks (static catalog)
 * 
 * @param editor - Grape.js editor instance
 * @param category - Optional category filter
 */
export function registerCatalogBlocks(editor: grapesjs.Editor, category?: Category): void {
  const blocks = editor.BlockManager;
  
  // Get components to register
  const components = category
    ? componentCatalog.filter(c => c.category === category)
    : componentCatalog;
  
  // Group by category
  const byCategory = components.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<Category, typeof components>);
  
  // Register blocks for each category
  Object.entries(byCategory).forEach(([cat, comps]) => {
    comps.forEach((component) => {
      // Get default variant (minimal)
      const html = component.variants.minimal || component.variants.modern || '';
      
      blocks.add(component.id, {
        label: component.name,
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        content: html,
        media: component.thumbnail || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/></svg>`,
        activate: true,
        select: true,
      });
    });
  });
}

/**
 * Register all catalog blocks (static catalog - fallback)
 */
export function registerAllCatalogBlocks(editor: grapesjs.Editor): void {
  registerCatalogBlocks(editor);
}

/**
 * Register blocks for a specific category
 */
export function registerCategoryBlocks(editor: grapesjs.Editor, category: Category): void {
  registerCatalogBlocks(editor, category);
}

