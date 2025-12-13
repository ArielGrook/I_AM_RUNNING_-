/**
 * Apply JSON Contract to Canvas
 * 
 * Converts JSON contracts from AI into Grape.js components.
 * 
 * Stage 3 Module 7: Chat with ChatGPT
 */

import { JsonContract } from '@/lib/types/chat';
import { getComponentCatalog } from '@/lib/components/supabase-catalog';
import { Category, StyleVariant } from '@/lib/types/project';
import type grapesjs from 'grapesjs';

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
 * Apply JSON contract to Grape.js editor
 */
export async function applyContractToEditor(
  editor: grapesjs.Editor,
  contract: JsonContract
): Promise<void> {
  try {
    switch (contract.action) {
      case 'create':
        // Add new components
        for (const component of contract.components) {
          let html = component.html;
          
          // If no HTML provided, try to find from catalog
          if (!html) {
            html = await findMatchingComponent(component.category, component.style) || '';
          }
          
          if (html) {
            // Add component to canvas
            editor.addComponents(html);
          }
        }
        break;
        
      case 'update':
        // Update existing components (by ID or selector)
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
        // Remove components
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

