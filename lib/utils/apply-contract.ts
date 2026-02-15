/**
 * Apply JSON Contract to Canvas
 *
 * Legacy: was used for GrapesJS. Puck migration: editor no longer uses this;
 * contract application to Puck data can be added in a future phase.
 */

import { JsonContract } from '@/lib/types/chat';
import { getComponentCatalog } from '@/lib/components/supabase-catalog';
import { Category, StyleVariant } from '@/lib/types/project';

/** Minimal editor interface (legacy GrapesJS shape; not used with Puck) */
interface LegacyEditorLike {
  addComponents: (html: string) => unknown;
  getById: (id: string) => { set: (k: string, v: unknown) => void; remove: () => void } | undefined;
  getCss: () => string;
  setStyle: (css: string) => void;
}

/**
 * Find matching component from Supabase catalog
 */
async function findMatchingComponent(
  category: Category,
  style?: StyleVariant
): Promise<string | null> {
  try {
    const catalog = await getComponentCatalog(false);
    const matches = catalog.filter(
      (c) => c.category === category && (!style || c.style === style)
    );
    
    if (matches.length > 0) {
      // Return HTML from first match
      return matches[0].html;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to find matching component:', error);
    return null;
  }
}

/**
 * Apply JSON contract to editor (legacy GrapesJS; not used with Puck)
 */
export async function applyContractToEditor(
  editor: LegacyEditorLike,
  contract: JsonContract
): Promise<void> {
  try {
    switch (contract.action) {
      case 'create':
        for (const component of contract.components) {
          let html = component.html;
          if (!html) {
            html = await findMatchingComponent(component.category, component.style) || '';
          }
          if (html) {
            editor.addComponents(html);
          }
        }
        break;

      case 'update':
        for (const component of contract.components) {
          if (component.id) {
            const model = editor.getById(component.id);
            if (model) {
              if (component.html) {
                model.set('content', component.html);
              }
              if (component.props) {
                Object.entries(component.props).forEach(([key, value]) => {
                  model.set(key, value);
                });
              }
            }
          }
        }
        break;

      case 'delete':
        for (const component of contract.components) {
          if (component.id) {
            const model = editor.getById(component.id);
            if (model) {
              model.remove();
            }
          }
        }
        break;
        
      case 'style':
        // Apply global styles
        if (contract.styles) {
          let css = editor.getCss();
          
          if (contract.styles.colors) {
            const colors = contract.styles.colors;
            css += `
              :root {
                ${colors.primary ? `--color-primary: ${colors.primary};` : ''}
                ${colors.secondary ? `--color-secondary: ${colors.secondary};` : ''}
                ${colors.accent ? `--color-accent: ${colors.accent};` : ''}
                ${colors.background ? `--color-background: ${colors.background};` : ''}
                ${colors.text ? `--color-text: ${colors.text};` : ''}
              }
            `;
          }
          
          if (contract.styles.fonts) {
            const fonts = contract.styles.fonts;
            css += `
              :root {
                ${fonts.heading ? `--font-heading: ${fonts.heading};` : ''}
                ${fonts.body ? `--font-body: ${fonts.body};` : ''}
              }
            `;
          }
          
          editor.setStyle(css);
        }
        break;
    }
  } catch (error) {
    console.error('Failed to apply contract:', error);
    throw error;
  }
}

