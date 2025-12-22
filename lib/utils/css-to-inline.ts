/**
 * CSS to Inline Styles Converter
 * 
 * Converts CSS classes to inline styles in HTML content.
 * This fixes the issue where GrapesJS treats CSS strings in canvas.styles as URLs.
 * 
 * Based on working approach from LSB-REDACTOR.js where all styles are inline.
 */

/**
 * Parse CSS string into a map of selectors to styles
 */
function parseCssToMap(css: string): Map<string, Record<string, string>> {
  const styleMap = new Map<string, Record<string, string>>();
  
  if (!css || typeof css !== 'string') return styleMap;
  
  // Remove comments
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Match CSS rules: selector { property: value; ... }
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;
  
  while ((match = ruleRegex.exec(withoutComments)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2].trim();
    
    // Parse declarations into key-value pairs
    const styles: Record<string, string> = {};
    declarations.split(';').forEach(decl => {
      const [key, value] = decl.split(':').map(s => s.trim());
      if (key && value) {
        // Convert kebab-case to camelCase for inline styles
        const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        styles[camelKey] = value;
      }
    });
    
    if (Object.keys(styles).length > 0) {
      styleMap.set(selector, styles);
    }
  }
  
  return styleMap;
}

/**
 * Apply CSS styles to HTML element by matching classes
 */
function applyStylesToElement(
  html: string,
  styleMap: Map<string, Record<string, string>>,
  className: string
): string {
  if (!className || !styleMap.size) return html;
  
  const classes = className.split(/\s+/).filter(Boolean);
  let combinedStyles: Record<string, string> = {};
  
  // Collect styles from all matching classes
  classes.forEach(cls => {
    const classSelector = `.${cls}`;
    const styles = styleMap.get(classSelector);
    if (styles) {
      combinedStyles = { ...combinedStyles, ...styles };
    }
  });
  
  // If we found matching styles, apply them inline
  if (Object.keys(combinedStyles).length > 0) {
    // Convert camelCase back to kebab-case for inline style attribute
    const inlineStyle = Object.entries(combinedStyles)
      .map(([key, value]) => {
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${kebabKey}: ${value}`;
      })
      .join('; ');
    
    // Add or merge with existing style attribute
    const existingStyleMatch = html.match(/style=["']([^"']*)["']/i);
    if (existingStyleMatch) {
      // Merge with existing styles (avoid duplicates)
      const existingStyle = existingStyleMatch[1].trim();
      const mergedStyle = existingStyle 
        ? `${existingStyle}; ${inlineStyle}`
        : inlineStyle;
      html = html.replace(
        /style=["']([^"']*)["']/i,
        `style="${mergedStyle}"`
      );
    } else {
      // Add new style attribute - find the right position (before closing >)
      // Handle both self-closing and regular tags
      if (html.endsWith('/>')) {
        html = html.replace(/\/>$/, ` style="${inlineStyle}" />`);
      } else {
        html = html.replace(/>/, ` style="${inlineStyle}">`);
      }
    }
  }
  
  return html;
}

/**
 * Convert CSS classes to inline styles in HTML content
 * 
 * @param html - HTML content with CSS classes
 * @param css - CSS string with class definitions
 * @returns HTML with inline styles applied
 */
export function convertCssToInlineStyles(html: string, css: string): string {
  // CRITICAL: Always return HTML, never CSS only
  if (!html || typeof html !== 'string') {
    console.warn('[CSS-to-Inline] No HTML provided, returning empty string');
    return '';
  }
  
  if (!css || typeof css !== 'string') {
    console.warn('[CSS-to-Inline] No CSS provided, returning HTML as-is');
    return html;
  }
  
  // Parse CSS into a map
  const styleMap = parseCssToMap(css);
  
  if (styleMap.size === 0) {
    console.log('[CSS-to-Inline] No CSS rules found, returning HTML as-is');
    return html;
  }
  
  console.log(`[CSS-to-Inline] Converting CSS to inline styles. HTML length: ${html.length}, CSS rules: ${styleMap.size}`);
  
  // Match all HTML elements with class attributes (case-insensitive)
  // Handles: <tag class="...">, <tag class='...'>, and self-closing tags
  const classRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*class=["']([^"']+)["'][^>]*(?:\/>|>)/gi;
  let result = html;
  
  // Process each match
  result = result.replace(classRegex, (fullMatch) => {
    // Extract class attribute value
    const classMatch = fullMatch.match(/class=["']([^"']+)["']/i);
    if (!classMatch) return fullMatch;
    
    const className = classMatch[1];
    return applyStylesToElement(fullMatch, styleMap, className);
  });
  
  // CRITICAL: Verify we still have HTML (not just CSS)
  if (!result || result.trim().length === 0) {
    console.error('[CSS-to-Inline] ERROR: Result is empty after conversion, returning original HTML');
    return html;
  }
  
  // Verify result contains HTML tags
  if (!result.includes('<') || !result.includes('>')) {
    console.error('[CSS-to-Inline] ERROR: Result does not contain HTML tags, returning original HTML');
    return html;
  }
  
  console.log(`[CSS-to-Inline] ✅ Conversion complete. Result HTML length: ${result.length}`);
  return result;
}

/**
 * Convert CSS to inline styles for a complete HTML document
 * Processes all elements with classes and applies matching CSS rules as inline styles
 */
export function convertHtmlWithCss(html: string, css: string): string {
  if (!css) return html;
  
  // Simple approach: For each CSS rule, find matching elements and apply styles
  const styleMap = parseCssToMap(css);
  
  if (styleMap.size === 0) return html;
  
  let result = html;
  
  // Process each CSS rule
  styleMap.forEach((styles, selector) => {
    // Only process class selectors (starting with .)
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      
      // Find all elements with this class
      const classRegex = new RegExp(
        `(<[^>]*class=["'][^"']*\\b${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^"']*["'][^>]*>)`,
        'gi'
      );
      
      result = result.replace(classRegex, (match) => {
        return applyStylesToElement(match, styleMap, className);
      });
    }
  });
  
  return result;
}

