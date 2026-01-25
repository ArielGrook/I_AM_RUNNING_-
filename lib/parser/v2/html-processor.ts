/**
 * HTML Processor Module
 * 
 * Processes HTML files:
 * - Applies inline styles from CSS
 * - Replaces asset paths with base64 data URLs
 * - Extracts and filters scripts
 * - Extracts page metadata
 * 
 * @version 2.0.0
 */

import { parse, HTMLElement } from 'node-html-parser';
import sanitizeHtml from 'sanitize-html';
import {
  HTMLProcessingResult,
  HTMLProcessingOptions,
  CSSInlineRule,
  ScriptReference,
  PageMeta,
  ImportWarning,
  CDN_WHITELIST,
} from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Sanitization options for HTML content
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // Document structure
    'html', 'head', 'body', 'title', 'meta', 'link', 'style',
    // Sections
    'header', 'footer', 'main', 'section', 'article', 'nav', 'aside',
    'div', 'span', 'p', 'br', 'hr',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text formatting
    'a', 'strong', 'em', 'b', 'i', 'u', 's', 'small', 'sub', 'sup',
    'mark', 'del', 'ins', 'abbr', 'code', 'pre', 'blockquote', 'q', 'cite',
    // Lists
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Forms
    'form', 'input', 'textarea', 'select', 'option', 'optgroup', 'button',
    'label', 'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter',
    // Media
    'img', 'picture', 'source', 'video', 'audio', 'track',
    'figure', 'figcaption', 'canvas', 'iframe',
    // SVG
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
    'ellipse', 'g', 'defs', 'clipPath', 'mask', 'pattern', 'use',
    'symbol', 'text', 'tspan', 'textPath', 'image', 'linearGradient',
    'radialGradient', 'stop', 'filter', 'feGaussianBlur', 'feOffset',
    'feMerge', 'feMergeNode', 'feBlend', 'feColorMatrix',
    // Interactive
    'details', 'summary', 'dialog',
    // Other
    'time', 'address', 'wbr', 'template', 'slot',
  ],
  allowedAttributes: {
    '*': [
      'class', 'id', 'style', 'title', 'role', 'tabindex',
      'data-*', 'aria-*', 'lang', 'dir', 'hidden', 'draggable',
    ],
    a: ['href', 'target', 'rel', 'download', 'hreflang'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'srcset', 'sizes', 'decoding'],
    video: ['src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'width', 'height', 'preload', 'playsinline'],
    audio: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
    source: ['src', 'type', 'srcset', 'sizes', 'media'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow', 'loading', 'sandbox'],
    form: ['action', 'method', 'enctype', 'name', 'novalidate', 'autocomplete'],
    input: ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'min', 'max', 'step', 'pattern', 'autocomplete', 'checked', 'multiple', 'accept'],
    button: ['type', 'disabled', 'name', 'value', 'form'],
    textarea: ['name', 'placeholder', 'required', 'disabled', 'readonly', 'rows', 'cols', 'maxlength', 'minlength'],
    select: ['name', 'required', 'disabled', 'multiple', 'size'],
    option: ['value', 'selected', 'disabled'],
    label: ['for'],
    meta: ['charset', 'name', 'content', 'http-equiv', 'property'],
    link: ['rel', 'href', 'type', 'media', 'sizes', 'crossorigin'],
    svg: ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'width', 'height', 'preserveAspectRatio'],
    path: ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'transform'],
    table: ['border', 'cellpadding', 'cellspacing'],
    td: ['colspan', 'rowspan', 'headers'],
    th: ['colspan', 'rowspan', 'scope', 'headers'],
    col: ['span'],
    colgroup: ['span'],
    time: ['datetime'],
    track: ['src', 'kind', 'srclang', 'label', 'default'],
    picture: [],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data', 'blob'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data', 'blob'],
    video: ['http', 'https', 'data', 'blob'],
    audio: ['http', 'https', 'data', 'blob'],
    source: ['http', 'https', 'data', 'blob'],
    a: ['http', 'https', 'mailto', 'tel', '#'],
    iframe: ['http', 'https'],
  },
};

// ============================================================================
// MAIN PROCESSOR CLASS
// ============================================================================

export class HTMLProcessor {
  private warnings: ImportWarning[] = [];

  /**
   * Process an HTML file
   * 
   * @param htmlContent - Raw HTML content
   * @param options - Processing options
   * @returns Processed HTML and extracted data
   */
  process(
    htmlContent: string,
    options: HTMLProcessingOptions
  ): HTMLProcessingResult {
    console.log('[HTMLProcessor] Processing HTML, length:', htmlContent.length);
    
    this.warnings = [];
    
    // Step 1: Parse HTML
    const doc = parse(htmlContent, {
      comment: false,
      blockTextElements: {
        script: true,
        noscript: true,
        style: true,
        pre: true,
      },
    });

    // Step 2: Extract metadata from head
    const meta = this.extractMeta(doc);

    // Step 3: Extract scripts
    const extractedScripts = this.extractScripts(doc, options.scriptWhitelist || []);

    // Step 4: Get body content
    const body = doc.querySelector('body');
    let bodyHtml = body ? body.innerHTML : doc.innerHTML;

    // Step 5: Apply inline styles
    if (options.inlineStyles && options.inlineStyles.size > 0) {
      bodyHtml = this.applyInlineStyles(bodyHtml, options.inlineStyles);
    }

    // Step 6: Replace asset paths
    if (options.assetReplacements && options.assetReplacements.size > 0) {
      bodyHtml = this.replaceAssetPaths(bodyHtml, options.assetReplacements);
    }

    // Step 7: Collect used assets
    const usedAssets = this.collectUsedAssets(bodyHtml);

    // Step 8: Sanitize if requested
    if (options.sanitize) {
      bodyHtml = sanitizeHtml(bodyHtml, SANITIZE_OPTIONS);
    }

    console.log('[HTMLProcessor] Processing complete:', {
      outputLength: bodyHtml.length,
      scriptsExtracted: extractedScripts.length,
      assetsUsed: usedAssets.length,
    });

    return {
      html: bodyHtml,
      extractedScripts,
      extractedMeta: meta,
      usedAssets,
      warnings: this.warnings,
    };
  }

  /**
   * Extract metadata from HTML head
   */
  private extractMeta(doc: ReturnType<typeof parse>): PageMeta {
    const head = doc.querySelector('head');
    if (!head) {
      return {};
    }

    const meta: PageMeta = {};

    // Title
    const titleEl = head.querySelector('title');
    if (titleEl) {
      meta.title = titleEl.text.trim();
    }

    // Description
    const descriptionEl = head.querySelector('meta[name="description"]');
    if (descriptionEl) {
      meta.description = descriptionEl.getAttribute('content') || undefined;
    }

    // Keywords
    const keywordsEl = head.querySelector('meta[name="keywords"]');
    if (keywordsEl) {
      const keywordsContent = keywordsEl.getAttribute('content');
      if (keywordsContent) {
        meta.keywords = keywordsContent.split(',').map(k => k.trim()).filter(k => k);
      }
    }

    // Open Graph image
    const ogImageEl = head.querySelector('meta[property="og:image"]');
    if (ogImageEl) {
      meta.ogImage = ogImageEl.getAttribute('content') || undefined;
    }

    return meta;
  }

  /**
   * Extract and filter scripts
   */
  private extractScripts(
    doc: ReturnType<typeof parse>,
    whitelist: string[]
  ): ScriptReference[] {
    const scripts: ScriptReference[] = [];
    const scriptElements = doc.querySelectorAll('script');
    let order = 0;

    for (const scriptEl of scriptElements) {
      const src = scriptEl.getAttribute('src');

      if (src) {
        // External script
        if (this.isWhitelistedScript(src, whitelist)) {
          scripts.push({
            id: uuidv4(),
            type: this.isCDN(src) ? 'cdn' : 'local',
            src,
            order: order++,
          });
        } else {
          this.warnings.push({
            type: 'info',
            message: `Skipped non-whitelisted script: ${src}`,
            suggestion: 'External scripts are filtered for security.',
          });
        }
      } else {
        // Inline script - skip for security
        const content = scriptEl.innerHTML.trim();
        if (content) {
          this.warnings.push({
            type: 'info',
            message: 'Skipped inline script for security',
            suggestion: 'Inline scripts are not imported to prevent XSS.',
          });
        }
      }

      // Remove script from DOM
      scriptEl.remove();
    }

    return scripts;
  }

  /**
   * Check if a script URL is whitelisted
   */
  private isWhitelistedScript(src: string, whitelist: string[]): boolean {
    // Check CDN whitelist
    for (const cdn of CDN_WHITELIST) {
      if (src.includes(cdn)) {
        return true;
      }
    }

    // Check custom whitelist
    for (const pattern of whitelist) {
      if (src.includes(pattern)) {
        return true;
      }
    }

    // Allow local scripts (relative paths)
    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
      // Check for known library patterns
      const knownLibraries = [
        'jquery', 'bootstrap', 'owl', 'slick', 'isotope', 'magnific',
        'waypoints', 'counter', 'aos', 'scrollreveal', 'rellax',
        'imagesloaded', 'masonry', 'mixitup', 'lightbox', 'swiper',
      ];
      
      const srcLower = src.toLowerCase();
      for (const lib of knownLibraries) {
        if (srcLower.includes(lib)) {
          return true;
        }
      }

      // Allow vendor folder scripts
      if (srcLower.includes('vendor/') || srcLower.includes('/vendor/')) {
        return true;
      }

      // Allow js folder scripts
      if (srcLower.includes('/js/') || srcLower.startsWith('js/')) {
        return true;
      }

      // Allow assets/js scripts
      if (srcLower.includes('assets/js/')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if URL is a CDN
   */
  private isCDN(url: string): boolean {
    for (const cdn of CDN_WHITELIST) {
      if (url.includes(cdn)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Apply inline styles to HTML
   */
  private applyInlineStyles(
    html: string,
    inlineStyles: Map<string, CSSInlineRule>
  ): string {
    let result = html;

    // Sort by specificity (lower first, so higher specificity wins when applied later)
    const sortedRules = Array.from(inlineStyles.values())
      .sort((a, b) => a.specificity - b.specificity);

    for (const rule of sortedRules) {
      const styleString = Object.entries(rule.properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');

      if (!styleString) continue;

      // Apply based on selector type
      if (rule.selector.startsWith('.')) {
        // Class selector
        const className = rule.selector.slice(1);
        result = this.applyStyleToClass(result, className, styleString);
      } else if (rule.selector.startsWith('#')) {
        // ID selector
        const id = rule.selector.slice(1);
        result = this.applyStyleToId(result, id, styleString);
      } else if (/^[\w]+$/.test(rule.selector)) {
        // Element selector
        result = this.applyStyleToElement(result, rule.selector, styleString);
      }
    }

    return result;
  }

  /**
   * Apply style to elements with a class
   */
  private applyStyleToClass(html: string, className: string, style: string): string {
    // Match elements with this class
    const regex = new RegExp(
      `(<[^>]*\\bclass\\s*=\\s*["'][^"']*\\b${this.escapeRegex(className)}\\b[^"']*["'][^>]*)(/?>)`,
      'gi'
    );

    return html.replace(regex, (match, tagContent, closing) => {
      return this.mergeStyle(tagContent, style) + closing;
    });
  }

  /**
   * Apply style to element with an ID
   */
  private applyStyleToId(html: string, id: string, style: string): string {
    const regex = new RegExp(
      `(<[^>]*\\bid\\s*=\\s*["']${this.escapeRegex(id)}["'][^>]*)(/?>)`,
      'gi'
    );

    return html.replace(regex, (match, tagContent, closing) => {
      return this.mergeStyle(tagContent, style) + closing;
    });
  }

  /**
   * Apply style to all elements of a type
   */
  private applyStyleToElement(html: string, elementName: string, style: string): string {
    const regex = new RegExp(
      `(<${this.escapeRegex(elementName)}(?:\\s[^>]*)?)(/?>)`,
      'gi'
    );

    return html.replace(regex, (match, tagContent, closing) => {
      return this.mergeStyle(tagContent, style) + closing;
    });
  }

  /**
   * Merge new style with existing style attribute
   */
  private mergeStyle(tagContent: string, newStyle: string): string {
    if (/\bstyle\s*=\s*["']/i.test(tagContent)) {
      // Has existing style - append
      return tagContent.replace(
        /(\bstyle\s*=\s*["'])([^"']*)(["'])/i,
        (match, prefix, existing, suffix) => {
          const merged = existing.trim();
          const separator = merged.endsWith(';') ? ' ' : '; ';
          return `${prefix}${merged}${separator}${newStyle}${suffix}`;
        }
      );
    } else {
      // No existing style - add
      return `${tagContent} style="${newStyle}"`;
    }
  }

  /**
   * Replace asset paths with base64 data URLs
   */
  private replaceAssetPaths(
    html: string,
    replacements: Map<string, string>
  ): string {
    let result = html;

    for (const [originalPath, dataUrl] of replacements) {
      // Build patterns for various path formats
      const patterns = this.buildPathPatterns(originalPath);

      for (const pattern of patterns) {
        const escaped = this.escapeRegex(pattern);

        // Replace in src attributes
        result = result.replace(
          new RegExp(`(src\\s*=\\s*["'])${escaped}(["'])`, 'gi'),
          `$1${dataUrl}$2`
        );

        // Replace in href (for fonts, etc.)
        result = result.replace(
          new RegExp(`(href\\s*=\\s*["'])${escaped}(["'])`, 'gi'),
          `$1${dataUrl}$2`
        );

        // Replace in style background-image
        result = result.replace(
          new RegExp(`(url\\s*\\(\\s*["']?)${escaped}(["']?\\s*\\))`, 'gi'),
          `$1${dataUrl}$2`
        );

        // Replace in poster attribute
        result = result.replace(
          new RegExp(`(poster\\s*=\\s*["'])${escaped}(["'])`, 'gi'),
          `$1${dataUrl}$2`
        );

        // Replace in srcset (images)
        result = result.replace(
          new RegExp(`${escaped}(\\s+\\d+[wx])`, 'gi'),
          `${dataUrl}$1`
        );
      }
    }

    return result;
  }

  /**
   * Build various path patterns for matching
   */
  private buildPathPatterns(originalPath: string): string[] {
    const patterns = [originalPath];

    // Without leading ./
    if (originalPath.startsWith('./')) {
      patterns.push(originalPath.slice(2));
    } else {
      patterns.push('./' + originalPath);
    }

    // Without leading ../
    if (originalPath.includes('../')) {
      const simplified = originalPath.replace(/\.\.\//g, '');
      patterns.push(simplified);
    }

    // Just filename for relative references
    const parts = originalPath.split('/');
    if (parts.length > 1) {
      patterns.push(parts[parts.length - 1]);
      if (parts.length > 2) {
        patterns.push(parts.slice(-2).join('/'));
      }
    }

    return [...new Set(patterns)]; // Remove duplicates
  }

  /**
   * Collect asset paths used in HTML
   */
  private collectUsedAssets(html: string): string[] {
    const assets = new Set<string>();

    // Match src attributes
    const srcMatches = html.matchAll(/src\s*=\s*["']([^"']+)["']/gi);
    for (const match of srcMatches) {
      if (!match[1].startsWith('data:') && !match[1].startsWith('http')) {
        assets.add(match[1]);
      }
    }

    // Match href with file extensions
    const hrefMatches = html.matchAll(/href\s*=\s*["']([^"']+\.(css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|otf|eot))["']/gi);
    for (const match of hrefMatches) {
      if (!match[1].startsWith('data:') && !match[1].startsWith('http')) {
        assets.add(match[1]);
      }
    }

    // Match url() in inline styles
    const urlMatches = html.matchAll(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/gi);
    for (const match of urlMatches) {
      if (!match[1].startsWith('data:') && !match[1].startsWith('http')) {
        assets.add(match[1]);
      }
    }

    return Array.from(assets);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get warnings generated during processing
   */
  getWarnings(): ImportWarning[] {
    return this.warnings;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract body content from HTML
 */
export function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

/**
 * Extract head content from HTML
 */
export function extractHeadContent(html: string): string {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return headMatch ? headMatch[1] : '';
}

/**
 * Extract title from HTML
 */
export function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Get page name from filename
 */
export function getPageNameFromFile(filename: string): string {
  // Remove extension
  const name = filename.replace(/\.[^.]+$/, '');
  
  // Convert to readable name
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Get page slug from filename
 */
export function getPageSlugFromFile(filename: string): string {
  // Remove extension
  const name = filename.replace(/\.[^.]+$/, '');
  
  // Convert to slug
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Quick sanitize for display purposes
 */
export function quickSanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags,
    allowedAttributes: sanitizeHtml.defaults.allowedAttributes,
  });
}
