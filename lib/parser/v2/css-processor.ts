/**
 * CSS Processor Module
 * 
 * Implements the hybrid CSS strategy:
 * - Global CSS: @keyframes, @media, @font-face, :hover, etc. (cannot be inlined)
 * - Inlineable CSS: Simple selectors like .class { color: red; }
 * 
 * Based on analysis of 52 templates with varying CSS complexity.
 * 
 * @version 2.0.0
 */

import {
  CSSClassification,
  CSSInlineRule,
  CSSParseOptions,
  ImportWarning,
} from './types';

// ============================================================================
// GLOBAL CSS PATTERNS (MUST stay global - cannot be inlined)
// ============================================================================

/**
 * Patterns that identify CSS rules that CANNOT be converted to inline styles.
 * These must be preserved in a <style> block.
 */
const GLOBAL_CSS_PATTERNS = [
  // At-rules (always global)
  /@keyframes\s+[\w-]+/i,
  /@-webkit-keyframes\s+[\w-]+/i,
  /@-moz-keyframes\s+[\w-]+/i,
  /@media\s*\(/i,
  /@font-face\s*\{/i,
  /@import\s+/i,
  /@supports\s*\(/i,
  /@charset\s+/i,
  /@page\s*\{/i,
  /@layer\s+/i,
  
  // Root and CSS variables
  /:root\s*\{/i,
  /var\s*\(\s*--[\w-]+/i,
  
  // Pseudo-classes (state-based - can't be inlined)
  /:hover\s*\{/i,
  /:focus\s*\{/i,
  /:active\s*\{/i,
  /:visited\s*\{/i,
  /:focus-visible\s*\{/i,
  /:focus-within\s*\{/i,
  /:disabled\s*\{/i,
  /:enabled\s*\{/i,
  /:checked\s*\{/i,
  /:invalid\s*\{/i,
  /:valid\s*\{/i,
  /:required\s*\{/i,
  /:optional\s*\{/i,
  /:empty\s*\{/i,
  /:target\s*\{/i,
  /:not\s*\(/i,
  /:is\s*\(/i,
  /:where\s*\(/i,
  /:has\s*\(/i,
  
  // Pseudo-classes (structural)
  /:first-child/i,
  /:last-child/i,
  /:nth-child\s*\(/i,
  /:nth-of-type\s*\(/i,
  /:first-of-type/i,
  /:last-of-type/i,
  /:only-child/i,
  /:only-of-type/i,
  
  // Pseudo-elements
  /::before/i,
  /::after/i,
  /:before/i,     // Legacy syntax
  /:after/i,      // Legacy syntax
  /::placeholder/i,
  /::-webkit-input-placeholder/i,
  /::-moz-placeholder/i,
  /:-ms-input-placeholder/i,
  /::selection/i,
  /::first-letter/i,
  /::first-line/i,
  /::marker/i,
  /::backdrop/i,
  
  // Combinators (nested selectors - can't be applied to single element)
  /\s+>\s+/,              // Direct child: .parent > .child
  /\s+\+\s+/,             // Adjacent sibling: .element + .sibling
  /\s+~\s+/,              // General sibling: .element ~ .sibling
  /\s{2,}/,               // Descendant: .parent .child (2+ spaces after trim)
  
  // Attribute selectors (can sometimes be inlined, but safer to keep global)
  /\[data-[\w-]+/i,
  /\[aria-[\w-]+/i,
  /\[class[*^$~|]=/i,     // Complex class attribute selectors
  /\[[\w-]+\s*[*^$~|]=/i, // Any attribute with operators
];

/**
 * Patterns for simple selectors that CAN be inlined
 */
const INLINEABLE_SELECTOR_PATTERNS = [
  /^\.[\w-]+$/,           // Simple class: .button
  /^#[\w-]+$/,            // Simple ID: #header
  /^[\w]+$/,              // Simple element: div, span
  /^[\w]+\.[\w-]+$/,      // Element with class: div.container
];

// ============================================================================
// MAIN PROCESSOR CLASS
// ============================================================================

export class CSSProcessor {
  private options: CSSParseOptions;
  private warnings: ImportWarning[] = [];

  constructor(options: CSSParseOptions = {}) {
    this.options = {
      preserveVendorPrefixes: true,
      minify: false,
      resolveImports: false,
      ...options,
    };
  }

  /**
   * Process and classify CSS content
   * 
   * @param cssContent - Raw CSS string (can be multiple files merged)
   * @returns Classification with inlineable and global CSS
   */
  process(cssContent: string): CSSClassification {
    console.log('[CSSProcessor] Processing CSS, length:', cssContent.length);
    
    const result: CSSClassification = {
      inlineable: new Map(),
      global: '',
      keyframes: new Map(),
      mediaQueries: [],
      fontFaces: [],
      imports: [],
      stats: {
        totalRules: 0,
        inlineableCount: 0,
        globalCount: 0,
      },
    };

    // Step 1: Extract and store @imports
    const { css: cssWithoutImports, imports } = this.extractImports(cssContent);
    result.imports = imports;

    // Step 2: Extract @keyframes
    const { css: cssWithoutKeyframes, keyframes } = this.extractKeyframes(cssWithoutImports);
    result.keyframes = keyframes;
    result.global += this.keyframesToString(keyframes);

    // Step 3: Extract @font-face
    const { css: cssWithoutFonts, fontFaces } = this.extractFontFaces(cssWithoutKeyframes);
    result.fontFaces = fontFaces;
    result.global += '\n' + fontFaces.join('\n');

    // Step 4: Extract @media queries
    const { css: cssWithoutMedia, mediaQueries } = this.extractMediaQueries(cssWithoutFonts);
    result.mediaQueries = mediaQueries;
    result.global += '\n' + mediaQueries.join('\n');

    // Step 5: Parse remaining rules
    const rules = this.parseRules(cssWithoutMedia);
    result.stats.totalRules = rules.length;

    // Step 6: Classify each rule
    for (const rule of rules) {
      if (this.isGlobalRule(rule.selector)) {
        result.global += '\n' + rule.raw;
        result.stats.globalCount++;
      } else if (this.isInlineableSelector(rule.selector)) {
        // Can be inlined
        const inlineRule: CSSInlineRule = {
          selector: rule.selector,
          properties: rule.properties,
          specificity: this.calculateSpecificity(rule.selector),
        };
        result.inlineable.set(rule.selector, inlineRule);
        result.stats.inlineableCount++;
      } else {
        // Complex selector - keep global
        result.global += '\n' + rule.raw;
        result.stats.globalCount++;
      }
    }

    // Clean up global CSS
    result.global = this.cleanupCSS(result.global);

    console.log('[CSSProcessor] Classification complete:', {
      inlineable: result.inlineable.size,
      global: result.global.length,
      keyframes: result.keyframes.size,
      mediaQueries: result.mediaQueries.length,
      fontFaces: result.fontFaces.length,
      imports: result.imports.length,
    });

    return result;
  }

  /**
   * Extract @import rules
   */
  private extractImports(css: string): { css: string; imports: string[] } {
    const imports: string[] = [];
    const regex = /@import\s+(?:url\s*\([^)]+\)|['"][^'"]+['"])[^;]*;/gi;
    
    const cssWithoutImports = css.replace(regex, (match) => {
      imports.push(match);
      return '';
    });

    return { css: cssWithoutImports, imports };
  }

  /**
   * Extract @keyframes rules
   */
  private extractKeyframes(css: string): { css: string; keyframes: Map<string, string> } {
    const keyframes = new Map<string, string>();
    
    // Match @keyframes and @-webkit-keyframes
    const regex = /@(-webkit-|-moz-)?keyframes\s+([\w-]+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gi;
    
    const cssWithoutKeyframes = css.replace(regex, (match, prefix, name, content) => {
      // Store with normalized name (without vendor prefix)
      const normalizedName = name;
      const fullKeyframe = match;
      
      // If we already have this keyframe, keep the one without prefix
      if (!keyframes.has(normalizedName) || !prefix) {
        keyframes.set(normalizedName, fullKeyframe);
      }
      
      return '';
    });

    return { css: cssWithoutKeyframes, keyframes };
  }

  /**
   * Extract @font-face rules
   */
  private extractFontFaces(css: string): { css: string; fontFaces: string[] } {
    const fontFaces: string[] = [];
    const regex = /@font-face\s*\{[^}]+\}/gi;
    
    const cssWithoutFonts = css.replace(regex, (match) => {
      fontFaces.push(match);
      return '';
    });

    return { css: cssWithoutFonts, fontFaces };
  }

  /**
   * Extract @media queries
   */
  private extractMediaQueries(css: string): { css: string; mediaQueries: string[] } {
    const mediaQueries: string[] = [];
    
    // Regex to match @media blocks including nested content
    // This is a simplified version - handles most cases
    const regex = /@media\s*[^{]+\{(?:[^{}]*|\{[^{}]*\})*\}/gi;
    
    const cssWithoutMedia = css.replace(regex, (match) => {
      mediaQueries.push(match);
      return '';
    });

    return { css: cssWithoutMedia, mediaQueries };
  }

  /**
   * Parse CSS rules from remaining content
   */
  private parseRules(css: string): ParsedRule[] {
    const rules: ParsedRule[] = [];
    
    // Remove comments
    const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split into rule blocks
    // This regex matches: selector(s) { properties }
    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let match;

    while ((match = ruleRegex.exec(cssWithoutComments)) !== null) {
      const selectorPart = match[1].trim();
      const propertiesPart = match[2].trim();

      // Skip empty rules
      if (!selectorPart || !propertiesPart) continue;

      // Handle multiple selectors (comma-separated)
      const selectors = selectorPart.split(',').map(s => s.trim()).filter(s => s);

      for (const selector of selectors) {
        const properties = this.parseProperties(propertiesPart);
        
        if (Object.keys(properties).length > 0) {
          rules.push({
            selector,
            properties,
            raw: `${selector} { ${propertiesPart} }`,
          });
        }
      }
    }

    return rules;
  }

  /**
   * Parse CSS properties from a declaration block
   */
  private parseProperties(declarationBlock: string): Record<string, string> {
    const properties: Record<string, string> = {};
    
    // Split by semicolon, handling values that might contain semicolons
    const declarations = declarationBlock.split(';');
    
    for (const declaration of declarations) {
      const trimmed = declaration.trim();
      if (!trimmed) continue;

      // Find the first colon (property: value)
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const property = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();

      if (property && value) {
        // Normalize property name (keep vendor prefixes if configured)
        if (this.options.preserveVendorPrefixes || !property.startsWith('-')) {
          properties[property] = value;
        }
      }
    }

    return properties;
  }

  /**
   * Check if a rule should be kept global
   */
  private isGlobalRule(selector: string): boolean {
    for (const pattern of GLOBAL_CSS_PATTERNS) {
      if (pattern.test(selector)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a selector can be inlined
   */
  private isInlineableSelector(selector: string): boolean {
    // Must not match any global patterns
    if (this.isGlobalRule(selector)) {
      return false;
    }

    // Check if it's a simple selector
    for (const pattern of INLINEABLE_SELECTOR_PATTERNS) {
      if (pattern.test(selector)) {
        return true;
      }
    }

    // Check for compound selectors (multiple classes/IDs without spaces)
    // e.g., .class1.class2 or .class#id
    if (/^[.#\w-]+$/.test(selector) && !selector.includes(' ')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate selector specificity for proper cascade ordering
   */
  private calculateSpecificity(selector: string): number {
    let specificity = 0;

    // Count IDs (#)
    const idCount = (selector.match(/#[\w-]+/g) || []).length;
    specificity += idCount * 100;

    // Count classes (.) and pseudo-classes (:)
    const classCount = (selector.match(/\.[\w-]+/g) || []).length;
    const pseudoClassCount = (selector.match(/:[\w-]+/g) || []).length;
    specificity += (classCount + pseudoClassCount) * 10;

    // Count element selectors
    const elementCount = (selector.match(/^[\w]+|[\s>+~][\w]+/g) || []).length;
    specificity += elementCount;

    return specificity;
  }

  /**
   * Convert keyframes map back to CSS string
   */
  private keyframesToString(keyframes: Map<string, string>): string {
    let result = '';
    for (const [, css] of keyframes) {
      result += css + '\n';
    }
    return result;
  }

  /**
   * Clean up and optionally minify CSS
   */
  private cleanupCSS(css: string): string {
    // Remove excessive whitespace
    let cleaned = css
      .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
      .replace(/^\s+/gm, '')       // Remove leading whitespace per line
      .trim();

    if (this.options.minify) {
      cleaned = cleaned
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*;\s*/g, ';')
        .replace(/\s*:\s*/g, ':')
        .replace(/\n/g, '');
    }

    return cleaned;
  }

  /**
   * Get warnings generated during processing
   */
  getWarnings(): ImportWarning[] {
    return this.warnings;
  }

  /**
   * Replace asset paths in CSS with base64 data URLs
   */
  replaceAssetPaths(
    css: string,
    replacements: Map<string, string>
  ): string {
    if (!css || replacements.size === 0) return css;

    console.log('[CSSProcessor] === PATH REPLACEMENT START ===');
    console.log('[CSSProcessor] Asset map keys:', Array.from(replacements.keys()));
    console.log('[CSSProcessor] CSS length before replacement:', css.length);

    const normalizedMap = new Map<string, string>();
    for (const [key, value] of replacements) {
      const normalizedKey = normalizeAssetPath(key);
      if (normalizedKey) {
        normalizedMap.set(normalizedKey, value);
      }
    }

    let replacedCount = 0;
    const urlPattern = /url\(['"]?([^'"()]+)['"]?\)/gi;
    const updatedCss = css.replace(urlPattern, (match, path) => {
      console.log('[CSSProcessor] Found url():', path);
      const normalizedPath = normalizeAssetPath(path);
      if (!normalizedPath) {
        console.log('[CSSProcessor] ⚠️ Skipping non-local url():', path);
        return match;
      }

      const dataUrl = normalizedMap.get(normalizedPath);
      if (dataUrl) {
        replacedCount += 1;
        console.log('[CSSProcessor] ✅ Replacing with base64:', normalizedPath);
        return `url(${dataUrl})`;
      }

      console.log('[CSSProcessor] ⚠️ No base64 found for:', normalizedPath);
      return match;
    });

    console.log('[CSSProcessor] CSS length after replacement:', updatedCss.length);
    console.log('[CSSProcessor] Replacements applied:', replacedCount);
    console.log('[CSSProcessor] === PATH REPLACEMENT END ===');

    return updatedCss;
  }

  /**
   * Apply inline styles to an HTML element string
   */
  applyInlineStyles(
    html: string,
    inlineRules: Map<string, CSSInlineRule>
  ): string {
    let result = html;

    // For each inlineable rule, find matching elements and apply styles
    for (const [selector, rule] of inlineRules) {
      // Handle class selectors
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        result = this.applyStylesToClass(result, className, rule.properties);
      }
      // Handle ID selectors
      else if (selector.startsWith('#')) {
        const id = selector.slice(1);
        result = this.applyStylesToId(result, id, rule.properties);
      }
      // Handle element selectors
      else if (/^[\w]+$/.test(selector)) {
        result = this.applyStylesToElement(result, selector, rule.properties);
      }
    }

    return result;
  }

  /**
   * Apply styles to elements with a specific class
   */
  private applyStylesToClass(
    html: string,
    className: string,
    properties: Record<string, string>
  ): string {
    const styleString = this.propertiesToString(properties);
    
    // Regex to find elements with this class
    const regex = new RegExp(
      `(<[^>]*\\bclass\\s*=\\s*["'][^"']*\\b${this.escapeRegex(className)}\\b[^"']*["'][^>]*)>`,
      'gi'
    );

    return html.replace(regex, (match, tagContent) => {
      // Check if already has style attribute
      if (/\bstyle\s*=\s*["']/i.test(tagContent)) {
        // Append to existing style
        return tagContent.replace(
          /(\bstyle\s*=\s*["'])([^"']*)(["'])/i,
          `$1$2; ${styleString}$3`
        ) + '>';
      } else {
        // Add new style attribute
        return `${tagContent} style="${styleString}">`;
      }
    });
  }

  /**
   * Apply styles to element with a specific ID
   */
  private applyStylesToId(
    html: string,
    id: string,
    properties: Record<string, string>
  ): string {
    const styleString = this.propertiesToString(properties);
    
    const regex = new RegExp(
      `(<[^>]*\\bid\\s*=\\s*["']${this.escapeRegex(id)}["'][^>]*)>`,
      'gi'
    );

    return html.replace(regex, (match, tagContent) => {
      if (/\bstyle\s*=\s*["']/i.test(tagContent)) {
        return tagContent.replace(
          /(\bstyle\s*=\s*["'])([^"']*)(["'])/i,
          `$1$2; ${styleString}$3`
        ) + '>';
      } else {
        return `${tagContent} style="${styleString}">`;
      }
    });
  }

  /**
   * Apply styles to all elements of a specific type
   */
  private applyStylesToElement(
    html: string,
    elementName: string,
    properties: Record<string, string>
  ): string {
    const styleString = this.propertiesToString(properties);
    
    const regex = new RegExp(
      `(<${this.escapeRegex(elementName)}(?:\\s[^>]*)?)>`,
      'gi'
    );

    return html.replace(regex, (match, tagContent) => {
      if (/\bstyle\s*=\s*["']/i.test(tagContent)) {
        return tagContent.replace(
          /(\bstyle\s*=\s*["'])([^"']*)(["'])/i,
          `$1$2; ${styleString}$3`
        ) + '>';
      } else {
        return `${tagContent} style="${styleString}">`;
      }
    });
  }

  /**
   * Convert properties object to inline style string
   */
  private propertiesToString(properties: Record<string, string>): string {
    return Object.entries(properties)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

interface ParsedRule {
  selector: string;
  properties: Record<string, string>;
  raw: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Merge multiple CSS files into one
 */
export function mergeCSS(cssFiles: string[]): string {
  return cssFiles
    .filter(css => css && css.trim())
    .join('\n\n/* --- Merged CSS --- */\n\n');
}

/**
 * Quick check if CSS contains animations
 */
export function hasAnimations(css: string): boolean {
  return /@keyframes/i.test(css) || /animation\s*:/i.test(css);
}

/**
 * Quick check if CSS has media queries
 */
export function hasMediaQueries(css: string): boolean {
  return /@media/i.test(css);
}

/**
 * Extract animation names used in CSS
 */
export function extractAnimationNames(css: string): string[] {
  const names = new Set<string>();
  
  // From @keyframes definitions
  const keyframeMatches = css.matchAll(/@keyframes\s+([\w-]+)/gi);
  for (const match of keyframeMatches) {
    names.add(match[1]);
  }
  
  // From animation property usage
  const animationMatches = css.matchAll(/animation(?:-name)?\s*:\s*([\w-]+)/gi);
  for (const match of animationMatches) {
    if (!['none', 'inherit', 'initial', 'unset'].includes(match[1].toLowerCase())) {
      names.add(match[1]);
    }
  }

  return Array.from(names);
}

/**
 * Extract CSS variables defined in :root
 */
export function extractCSSVariables(css: string): Map<string, string> {
  const variables = new Map<string, string>();
  
  // Match :root block
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/i);
  if (rootMatch) {
    const declarations = rootMatch[1];
    const varMatches = declarations.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g);
    
    for (const match of varMatches) {
      variables.set(`--${match[1]}`, match[2].trim());
    }
  }

  return variables;
}

/**
 * Normalize asset paths for consistent lookup
 */
export function normalizeAssetPath(path: string): string | null {
  if (!path) return null;

  let normalized = path.replace(/\\/g, '/').trim();

  // Skip external or data URLs
  if (
    normalized.startsWith('data:') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('//')
  ) {
    return null;
  }

  // Remove query/hash
  normalized = normalized.split('?')[0]?.split('#')[0] || normalized;

  // Remove leading ./ and ../
  normalized = normalized.replace(/^(\.\.\/)+/g, '');
  normalized = normalized.replace(/^\.\//, '');

  // Remove leading slash
  normalized = normalized.replace(/^\/+/, '');

  return normalized;
}

/**
 * Create a CSS processor and process content in one call
 */
export function processCSS(
  cssContent: string,
  options?: CSSParseOptions
): CSSClassification {
  const processor = new CSSProcessor(options);
  return processor.process(cssContent);
}
