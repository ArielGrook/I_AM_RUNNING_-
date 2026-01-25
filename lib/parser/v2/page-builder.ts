/**
 * Page Builder Module
 * 
 * Builds page structures from processed HTML files.
 * Handles multi-page templates, navigation, and page ordering.
 * 
 * @version 2.0.0
 */

import {
  ZipFileEntry,
  ZipFileIndex,
  PageV2,
  ScriptReference,
  PageMeta,
  ImportWarning,
  CSSClassification,
} from './types';
import { HTMLProcessor, getPageNameFromFile, getPageSlugFromFile, extractTitle } from './html-processor';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Order priority for common page names
 */
const PAGE_ORDER_PRIORITY: Record<string, number> = {
  'index': 0,
  'home': 1,
  'about': 10,
  'about-us': 11,
  'aboutus': 11,
  'services': 20,
  'our-services': 21,
  'products': 25,
  'shop': 26,
  'portfolio': 30,
  'gallery': 31,
  'projects': 32,
  'blog': 40,
  'news': 41,
  'contact': 90,
  'contact-us': 91,
  'contactus': 91,
};

// ============================================================================
// MAIN BUILDER CLASS
// ============================================================================

export class PageBuilder {
  private htmlProcessor: HTMLProcessor;
  private warnings: ImportWarning[] = [];

  constructor() {
    this.htmlProcessor = new HTMLProcessor();
  }

  /**
   * Build pages from HTML files
   * 
   * @param fileIndex - ZIP file index
   * @param rootPath - Detected site root path
   * @param cssClassification - Processed CSS classification
   * @param assetReplacements - Asset path to data URL map
   * @returns Array of built pages
   */
  async buildPages(
    fileIndex: ZipFileIndex,
    rootPath: string,
    cssClassification: CSSClassification,
    assetReplacements: Map<string, string>
  ): Promise<PageV2[]> {
    console.log('[PageBuilder] Building pages...');
    console.log('[PageBuilder] HTML files:', fileIndex.htmlFiles.length);
    console.log('[PageBuilder] Root path:', rootPath || '(ZIP root)');

    const pages: PageV2[] = [];
    this.warnings = [];

    // Filter HTML files within root path
    const htmlFiles = fileIndex.htmlFiles.filter(f => 
      this.isInRoot(f.path, rootPath)
    );

    console.log('[PageBuilder] HTML files in root:', htmlFiles.length);

    // Process each HTML file
    for (const htmlFile of htmlFiles) {
      try {
        const page = await this.buildPage(
          htmlFile,
          rootPath,
          cssClassification,
          assetReplacements
        );
        
        if (page) {
          pages.push(page);
        }
      } catch (error) {
        console.warn(`[PageBuilder] Failed to build page ${htmlFile.name}:`, error);
        this.warnings.push({
          type: 'error',
          message: `Failed to process page: ${htmlFile.name}`,
          file: htmlFile.path,
        });
      }
    }

    // Sort pages by priority
    const sortedPages = this.sortPages(pages);

    // Assign order numbers
    sortedPages.forEach((page, index) => {
      page.order = index;
    });

    console.log('[PageBuilder] Built pages:', sortedPages.map(p => ({
      name: p.name,
      slug: p.slug,
      order: p.order,
      isHome: p.isHome,
    })));

    return sortedPages;
  }

  /**
   * Build a single page from an HTML file
   */
  private async buildPage(
    htmlFile: ZipFileEntry,
    rootPath: string,
    cssClassification: CSSClassification,
    assetReplacements: Map<string, string>
  ): Promise<PageV2 | null> {
    console.log(`[PageBuilder] Processing: ${htmlFile.name}`);

    // Get HTML content
    const htmlContent = await htmlFile.getContent();
    
    if (!htmlContent || htmlContent.trim().length === 0) {
      this.warnings.push({
        type: 'warning',
        message: `Empty HTML file: ${htmlFile.name}`,
        file: htmlFile.path,
      });
      return null;
    }

    // Process HTML
    const processingResult = this.htmlProcessor.process(htmlContent, {
      inlineStyles: cssClassification.inlineable,
      assetReplacements,
      scriptWhitelist: [],
      sanitize: false, // Don't sanitize during build
    });

    // Collect warnings from HTML processor
    this.warnings.push(...processingResult.warnings);

    // Determine page properties
    const relativePath = this.getRelativePath(htmlFile.path, rootPath);
    const slug = getPageSlugFromFile(htmlFile.name);
    const isHome = this.isHomePage(htmlFile.name, relativePath);
    
    // Get name from title or filename
    const name = processingResult.extractedMeta.title || 
                 getPageNameFromFile(htmlFile.name);

    // Build page CSS (global CSS that couldn't be inlined)
    // We don't include it per-page since it's global
    const pageCss = '';

    const page: PageV2 = {
      id: uuidv4(),
      name,
      slug: isHome ? 'index' : slug,
      originalFile: htmlFile.name,
      html: processingResult.html,
      css: pageCss,
      scripts: processingResult.extractedScripts,
      animations: [],
      triggers: [],
      order: 0, // Will be set later
      isHome,
      meta: processingResult.extractedMeta,
    };

    return page;
  }

  /**
   * Sort pages by priority
   */
  private sortPages(pages: PageV2[]): PageV2[] {
    return pages.sort((a, b) => {
      const priorityA = this.getPagePriority(a.slug);
      const priorityB = this.getPagePriority(b.slug);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Same priority - sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get page priority for ordering
   */
  private getPagePriority(slug: string): number {
    const normalizedSlug = slug.toLowerCase();
    
    if (PAGE_ORDER_PRIORITY.hasOwnProperty(normalizedSlug)) {
      return PAGE_ORDER_PRIORITY[normalizedSlug];
    }
    
    // Check partial matches
    for (const [key, priority] of Object.entries(PAGE_ORDER_PRIORITY)) {
      if (normalizedSlug.includes(key) || key.includes(normalizedSlug)) {
        return priority + 1; // Slightly lower priority than exact match
      }
    }
    
    return 50; // Default priority (middle)
  }

  /**
   * Check if a file is the home page
   */
  private isHomePage(filename: string, relativePath: string): boolean {
    const name = filename.toLowerCase();
    
    // Direct index.html check
    if (name === 'index.html' || name === 'index.htm') {
      // Check it's in root, not in a subfolder
      const dir = relativePath.replace(filename, '').replace(/\/$/, '');
      return dir === '' || dir === '.';
    }
    
    // Home page check
    if (name === 'home.html' || name === 'home.htm') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if a path is inside the root
   */
  private isInRoot(path: string, rootPath: string): boolean {
    if (!rootPath) return true;
    return path.startsWith(rootPath + '/') || path === rootPath;
  }

  /**
   * Get relative path from root
   */
  private getRelativePath(absolutePath: string, rootPath: string): string {
    if (!rootPath) return absolutePath;
    if (absolutePath.startsWith(rootPath + '/')) {
      return absolutePath.slice(rootPath.length + 1);
    }
    return absolutePath;
  }

  /**
   * Get warnings generated during building
   */
  getWarnings(): ImportWarning[] {
    return this.warnings;
  }

  /**
   * Fix internal navigation links between pages
   */
  fixNavigationLinks(pages: PageV2[]): PageV2[] {
    // Build a map of original filenames to new slugs
    const fileToSlug = new Map<string, string>();
    
    for (const page of pages) {
      fileToSlug.set(page.originalFile, page.slug);
      // Also add without extension
      const nameWithoutExt = page.originalFile.replace(/\.[^.]+$/, '');
      fileToSlug.set(nameWithoutExt + '.html', page.slug);
      fileToSlug.set(nameWithoutExt + '.htm', page.slug);
    }

    // Fix links in each page
    for (const page of pages) {
      page.html = this.fixLinksInHtml(page.html, fileToSlug);
    }

    return pages;
  }

  /**
   * Fix links in HTML content
   */
  private fixLinksInHtml(html: string, fileToSlug: Map<string, string>): string {
    let result = html;

    for (const [filename, slug] of fileToSlug) {
      // Replace href="filename.html" with href="#page-slug" or similar
      // The actual implementation depends on how the editor handles navigation
      const patterns = [
        filename,
        './' + filename,
        '../' + filename,
      ];

      for (const pattern of patterns) {
        const regex = new RegExp(
          `(href\\s*=\\s*["'])${this.escapeRegex(pattern)}(["'])`,
          'gi'
        );
        
        // Replace with a page reference
        // Format: #page:{slug} - this can be handled by the editor
        result = result.replace(regex, `$1#page:${slug}$2`);
      }
    }

    return result;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Detect shared header/footer across pages
   */
  detectSharedElements(pages: PageV2[]): {
    hasSharedHeader: boolean;
    hasSharedFooter: boolean;
    headerHtml?: string;
    footerHtml?: string;
  } {
    if (pages.length < 2) {
      return { hasSharedHeader: false, hasSharedFooter: false };
    }

    // Extract headers and footers from each page
    const headers: string[] = [];
    const footers: string[] = [];

    for (const page of pages) {
      const headerMatch = page.html.match(/<header[^>]*>[\s\S]*?<\/header>/i);
      if (headerMatch) {
        headers.push(headerMatch[0]);
      }

      const footerMatch = page.html.match(/<footer[^>]*>[\s\S]*?<\/footer>/i);
      if (footerMatch) {
        footers.push(footerMatch[0]);
      }
    }

    // Check if headers are similar (simple similarity check)
    const hasSharedHeader = headers.length > 1 && 
                           this.areSimilar(headers[0], headers[1]);
    
    const hasSharedFooter = footers.length > 1 && 
                           this.areSimilar(footers[0], footers[1]);

    return {
      hasSharedHeader,
      hasSharedFooter,
      headerHtml: hasSharedHeader ? headers[0] : undefined,
      footerHtml: hasSharedFooter ? footers[0] : undefined,
    };
  }

  /**
   * Simple similarity check for HTML strings
   */
  private areSimilar(html1: string, html2: string): boolean {
    // Remove whitespace and compare
    const normalize = (html: string) => html.replace(/\s+/g, ' ').trim();
    const n1 = normalize(html1);
    const n2 = normalize(html2);
    
    // Check if they're at least 80% similar in length
    const lengthRatio = Math.min(n1.length, n2.length) / Math.max(n1.length, n2.length);
    if (lengthRatio < 0.8) return false;
    
    // For short content, do direct comparison
    if (n1.length < 500) {
      return n1 === n2;
    }
    
    // For longer content, compare first 200 and last 200 chars
    return n1.slice(0, 200) === n2.slice(0, 200) &&
           n1.slice(-200) === n2.slice(-200);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a default home page
 */
export function createDefaultHomePage(): PageV2 {
  return {
    id: uuidv4(),
    name: 'Home',
    slug: 'index',
    originalFile: 'index.html',
    html: '<div class="container"><h1>Welcome</h1><p>Your content here</p></div>',
    css: '',
    scripts: [],
    animations: [],
    triggers: [],
    order: 0,
    isHome: true,
    meta: {
      title: 'Home',
    },
  };
}

/**
 * Merge pages with same slug
 */
export function mergePagesBySlug(pages: PageV2[]): PageV2[] {
  const pageMap = new Map<string, PageV2>();
  
  for (const page of pages) {
    if (!pageMap.has(page.slug)) {
      pageMap.set(page.slug, page);
    } else {
      // Page with this slug already exists
      // Keep the one with more content or isHome
      const existing = pageMap.get(page.slug)!;
      if (page.isHome || page.html.length > existing.html.length) {
        pageMap.set(page.slug, page);
      }
    }
  }

  return Array.from(pageMap.values());
}

/**
 * Validate page structure
 */
export function validatePage(page: PageV2): boolean {
  return !!(
    page.id &&
    page.name &&
    page.slug &&
    page.html !== undefined
  );
}

/**
 * Get page statistics
 */
export function getPageStats(page: PageV2): {
  htmlLength: number;
  cssLength: number;
  scriptCount: number;
  hasAnimations: boolean;
} {
  return {
    htmlLength: page.html.length,
    cssLength: page.css.length,
    scriptCount: page.scripts.length,
    hasAnimations: page.animations.length > 0,
  };
}
