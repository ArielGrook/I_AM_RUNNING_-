/**
 * SimpleParser V3
 * 
 * Simplified ZIP parser that processes all HTML files and converts assets to base64.
 * Designed for multi-page template support.
 * 
 * Features:
 * - Processes ALL HTML files (not just index.html)
 * - Converts images to base64 data URLs
 * - Injects CSS into HTML
 * - Returns array of pages for tab navigation
 * 
 * @version 3.0.0
 */

import JSZip from 'jszip';
import { parse } from 'node-html-parser';

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedPage {
  name: string;      // Filename: 'index.html', 'about.html', etc.
  html: string;      // Processed HTML with base64 images
  css: string;       // Page-specific CSS (usually empty, CSS is shared)
}

export interface ParseTemplateResult {
  pages: ParsedPage[];  // Array of all processed pages
  css: string;          // Shared CSS (merged from all CSS files)
  stats: {
    totalFiles: number;
    htmlFiles: number;
    cssFiles: number;
    imagesConverted: number;
  };
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

/**
 * Parse ZIP template and return all pages with base64 assets
 * 
 * @param file - ZIP file (File, Blob, or ArrayBuffer)
 * @param debug - Enable debug logging
 * @returns Parsed pages array and shared CSS
 */
export async function parseTemplate(
  file: File | Blob | ArrayBuffer,
  debug: boolean = false
): Promise<ParseTemplateResult> {
  const log = debug ? console.log : () => {};
  const logError = console.error;
  
  log('[SimpleParser V3] 🚀 Starting template parsing...');
  
  // Load ZIP file
  const zip = new JSZip();
  let zipContents: JSZip;
  
  try {
    zipContents = await zip.loadAsync(file);
    log('[SimpleParser V3] ✅ ZIP file loaded');
  } catch (error) {
    logError('[SimpleParser V3] ❌ Failed to load ZIP:', error);
    throw new Error(`Failed to load ZIP file: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Collect all files
  const htmlFiles: Array<{ path: string; name: string }> = [];
  const cssFiles: Array<{ path: string; content: string }> = [];
  const imageMap = new Map<string, string>(); // path -> base64 data URL
  
  // First pass: collect HTML and CSS files, convert images
  log('[SimpleParser V3] 📦 Processing ZIP contents...');
  
  for (const [path, entry] of Object.entries(zipContents.files)) {
    if (entry.dir) continue;
    
    const extension = path.split('.').pop()?.toLowerCase() || '';
    const fileName = path.split('/').pop() || path;
    
    // Collect HTML files
    if (extension === 'html' || extension === 'htm') {
      htmlFiles.push({ path, name: fileName });
      log(`[SimpleParser V3] 📄 Found HTML: ${fileName}`);
    }
    
    // Collect CSS files
    else if (extension === 'css') {
      try {
        const content = await entry.async('string');
        cssFiles.push({ path, content });
        log(`[SimpleParser V3] 🎨 Found CSS: ${fileName}`);
      } catch (error) {
        logError(`[SimpleParser V3] ⚠️ Failed to read CSS ${fileName}:`, error);
      }
    }
    
    // Convert images to base64
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'].includes(extension)) {
      try {
        const blob = await entry.async('blob');
        const base64 = await blobToDataUrl(blob, extension);
        imageMap.set(path, base64);
        imageMap.set(fileName, base64); // Also map by filename for easier lookup
        log(`[SimpleParser V3] 🖼️ Converted image: ${fileName}`);
      } catch (error) {
        logError(`[SimpleParser V3] ⚠️ Failed to convert image ${fileName}:`, error);
      }
    }
  }
  
  if (htmlFiles.length === 0) {
    throw new Error('No HTML files found in ZIP template');
  }
  
  log(`[SimpleParser V3] 📊 Found ${htmlFiles.length} HTML files, ${cssFiles.length} CSS files, ${imageMap.size} images`);
  
  // Merge all CSS files into one shared CSS
  let sharedCss = '';
  for (const cssFile of cssFiles) {
    let cssContent = cssFile.content;
    
    // Replace image paths in CSS with base64
    cssContent = replaceCssAssetPaths(cssContent, imageMap);
    
    sharedCss += `\n/* ${cssFile.path} */\n${cssContent}\n`;
  }
  
  // Process each HTML file
  const pages: ParsedPage[] = [];
  
  for (const htmlFile of htmlFiles) {
    try {
      log(`[SimpleParser V3] 🔄 Processing ${htmlFile.name}...`);
      
      const htmlContent = await zipContents.files[htmlFile.path].async('string');
      
      // Parse HTML
      const doc = parse(htmlContent);
      
      // Extract body content
      const body = doc.querySelector('body');
      let bodyHtml = body ? body.innerHTML : htmlContent;
      
      // Replace image paths with base64
      bodyHtml = replaceHtmlAssetPaths(bodyHtml, imageMap);
      
      // Extract inline styles from <style> tags
      const styleTags = doc.querySelectorAll('style');
      let pageCss = '';
      for (const styleTag of styleTags) {
        const cssContent = styleTag.textContent || '';
        pageCss += replaceCssAssetPaths(cssContent, imageMap) + '\n';
      }
      
      // Inject shared CSS into HTML as <style> tag
      if (sharedCss.trim() || pageCss.trim()) {
        const allCss = (sharedCss + '\n' + pageCss).trim();
        bodyHtml = `<style>${allCss}</style>\n${bodyHtml}`;
      }
      
      pages.push({
        name: htmlFile.name,
        html: bodyHtml,
        css: pageCss, // Page-specific CSS (shared CSS is already injected)
      });
      
      log(`[SimpleParser V3] ✅ Processed ${htmlFile.name}`);
    } catch (error) {
      logError(`[SimpleParser V3] ❌ Failed to process ${htmlFile.name}:`, error);
      // Continue with other pages
    }
  }
  
  // Sort pages: index.html first, then alphabetically
  pages.sort((a, b) => {
    if (a.name.toLowerCase() === 'index.html') return -1;
    if (b.name.toLowerCase() === 'index.html') return 1;
    return a.name.localeCompare(b.name);
  });
  
  log(`[SimpleParser V3] ✅ Parsing complete! ${pages.length} pages processed`);
  
  return {
    pages,
    css: sharedCss,
    stats: {
      totalFiles: Object.keys(zipContents.files).length,
      htmlFiles: htmlFiles.length,
      cssFiles: cssFiles.length,
      imagesConverted: imageMap.size,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert blob to base64 data URL
 */
function blobToDataUrl(blob: Blob, extension: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        ico: 'image/x-icon',
      };
      const mimeType = mimeTypes[extension.toLowerCase()] || blob.type || 'image/png';
      
      if (result.startsWith(`data:${mimeType}`)) {
        resolve(result);
      } else {
        const base64Match = result.match(/base64,(.+)$/);
        if (base64Match) {
          resolve(`data:${mimeType};base64,${base64Match[1]}`);
        } else {
          resolve(result);
        }
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Replace asset paths in HTML with base64 data URLs
 */
function replaceHtmlAssetPaths(html: string, imageMap: Map<string, string>): string {
  let result = html;
  
  // Replace src, href, poster attributes
  result = result.replace(
    /(src|href|poster)\s*=\s*["']([^"']+)["']/gi,
    (match, attr, path) => {
      // Try exact path first
      let dataUrl = imageMap.get(path);
      
      // Try filename only
      if (!dataUrl) {
        const fileName = path.split('/').pop() || path;
        dataUrl = imageMap.get(fileName);
      }
      
      // Try normalized path (remove leading ./ or ..)
      if (!dataUrl) {
        const normalized = path.replace(/^\.\//, '').replace(/^\.\.\//, '');
        dataUrl = imageMap.get(normalized);
      }
      
      if (dataUrl) {
        return `${attr}="${dataUrl}"`;
      }
      
      return match;
    }
  );
  
  // Replace srcset
  result = result.replace(
    /srcset\s*=\s*["']([^"']+)["']/gi,
    (match, srcset) => {
      const urls = srcset.split(',').map((s: string) => s.trim().split(/\s+/)[0]);
      const replaced = urls.map((url: string) => {
        let dataUrl = imageMap.get(url);
        if (!dataUrl) {
          const fileName = url.split('/').pop() || url;
          dataUrl = imageMap.get(fileName);
        }
        return dataUrl || url;
      });
      return `srcset="${replaced.join(', ')}"`;
    }
  );
  
  return result;
}

/**
 * Replace asset paths in CSS with base64 data URLs
 */
function replaceCssAssetPaths(css: string, imageMap: Map<string, string>): string {
  return css.replace(
    /url\(['"]?([^'"()]+)['"]?\)/gi,
    (match, path) => {
      // Remove quotes if present
      const cleanPath = path.replace(/^['"]|['"]$/g, '');
      
      // Try exact path
      let dataUrl = imageMap.get(cleanPath);
      
      // Try filename only
      if (!dataUrl) {
        const fileName = cleanPath.split('/').pop() || cleanPath;
        dataUrl = imageMap.get(fileName);
      }
      
      // Try normalized path
      if (!dataUrl) {
        const normalized = cleanPath.replace(/^\.\//, '').replace(/^\.\.\//, '');
        dataUrl = imageMap.get(normalized);
      }
      
      if (dataUrl) {
        return `url(${dataUrl})`;
      }
      
      return match;
    }
  );
}
