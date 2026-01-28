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
 * - Preserves JavaScript scripts (converts known libraries to CDN)
 * - Returns array of pages for tab navigation
 * 
 * @version 3.1.0
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
  const jsMap = new Map<string, string>(); // path -> base64 data URL for JS files
  const fontMap = new Map<string, string>(); // path -> base64 data URL for font files
  
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
    
    // Convert JavaScript files to base64
    else if (extension === 'js' && !path.includes('__MACOSX')) {
      try {
        const base64Content = await entry.async('base64');
        const dataUrl = `data:application/javascript;base64,${base64Content}`;
        
        // Add multiple path variations to jsMap for better matching
        jsMap.set(path, dataUrl); // Full path
        jsMap.set(fileName, dataUrl); // Filename only
        const normalizedPath = path.replace(/^\.\//, '').replace(/^\.\.\//, '');
        jsMap.set(normalizedPath, dataUrl); // Normalized path
        jsMap.set(path.replace(/\\/g, '/'), dataUrl); // Windows path normalized
        jsMap.set(path.replace(/\//g, '\\'), dataUrl); // Reverse Windows path
        
        log(`[SimpleParser V3] 📜 Converted JS: ${fileName}`);
      } catch (error) {
        logError(`[SimpleParser V3] ⚠️ Failed to convert JS ${fileName}:`, error);
      }
    }
    
    // Convert font files to base64
    else if (['woff', 'woff2', 'ttf', 'eot', 'otf'].includes(extension) && !path.includes('__MACOSX')) {
      try {
        const base64Content = await entry.async('base64');
        
        // Determine MIME type
        const mimeTypes: Record<string, string> = {
          'woff': 'font/woff',
          'woff2': 'font/woff2',
          'ttf': 'font/ttf',
          'otf': 'font/otf',
          'eot': 'application/vnd.ms-fontobject',
        };
        const mimeType = mimeTypes[extension.toLowerCase()] || 'font/woff';
        const dataUrl = `data:${mimeType};base64,${base64Content}`;
        
        // Add multiple path variations to fontMap for better matching
        fontMap.set(path, dataUrl); // Full path
        fontMap.set(fileName, dataUrl); // Filename only
        const normalizedPath = path.replace(/^\.\//, '').replace(/^\.\.\//, '');
        fontMap.set(normalizedPath, dataUrl); // Normalized path
        fontMap.set(path.replace(/\\/g, '/'), dataUrl); // Windows path normalized
        fontMap.set(path.replace(/\//g, '\\'), dataUrl); // Reverse Windows path
        
        log(`[SimpleParser V3] 🔤 Converted font: ${fileName}`);
      } catch (error) {
        logError(`[SimpleParser V3] ⚠️ Failed to convert font ${fileName}:`, error);
      }
    }
  }
  
  if (htmlFiles.length === 0) {
    throw new Error('No HTML files found in ZIP template');
  }
  
  log(`[SimpleParser V3] 📊 Found ${htmlFiles.length} HTML files, ${cssFiles.length} CSS files, ${imageMap.size} images, ${jsMap.size} JS files, ${fontMap.size} fonts`);
  
  // Debug: Log jsMap, imageMap, and fontMap contents
  if (debug) {
    log(`[SimpleParser V3] 📊 jsMap contents:`, Array.from(jsMap.keys()));
    log(`[SimpleParser V3] 📊 imageMap contents (first 10):`, Array.from(imageMap.keys()).slice(0, 10));
    log(`[SimpleParser V3] 📊 fontMap contents:`, Array.from(fontMap.keys()));
  }
  
  // Merge all CSS files into one shared CSS
  // First, inline all @import directives
  let sharedCss = '';
  for (const cssFile of cssFiles) {
    let cssContent = cssFile.content;
    
    // Inline @import directives
    cssContent = await inlineCssImports(cssContent, cssFile.path, zipContents, log, logError);
    
    // Replace image paths in CSS with base64
    cssContent = replaceCssAssetPaths(cssContent, imageMap);
    
    // Replace font paths in @font-face with base64
    cssContent = replaceFontPaths(cssContent, fontMap, log);
    
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
      
      // Replace script src attributes directly in DOM using node-html-parser
      // Query from entire document (head + body) to catch all scripts
      const scriptTags = doc.querySelectorAll('script[src]');
      let scriptReplacedCount = 0;
      
      // Track original paths to prevent duplication
      const processedScriptPaths = new Set<string>();
      
      for (const scriptTag of scriptTags) {
        const originalSrc = scriptTag.getAttribute('src');
        if (!originalSrc) continue;
        
        // Normalize original path for duplicate checking
        const normalizedOriginalSrc = normalizePath(originalSrc);
        const originalFileName = originalSrc.split('/').pop() || originalSrc;
        
        // Check if this script was already processed (to prevent duplicates)
        const isDuplicate = processedScriptPaths.has(normalizedOriginalSrc) || 
                           processedScriptPaths.has(originalFileName);
        
        if (isDuplicate) {
          log(`   ⚠️ Skipping duplicate script: ${originalSrc}`);
          scriptTag.remove(); // Remove duplicate
          continue;
        }
        
        // Mark as processed
        processedScriptPaths.add(normalizedOriginalSrc);
        processedScriptPaths.add(originalFileName);
        
        // Normalize path (remove ./ and ../)
        const normalizedSrc = normalizePath(originalSrc);
        const fileName = originalSrc.split('/').pop() || originalSrc;
        
        // Check jsMap with multiple path variations (try all possible matches)
        let dataUrl = jsMap.get(normalizedSrc) || 
                     jsMap.get(fileName) || 
                     jsMap.get(originalSrc);
        
        // Also try path variations with different separators
        if (!dataUrl) {
          const pathVariations = [
            normalizedSrc,
            originalSrc.replace(/\\/g, '/'), // Windows path
            originalSrc.replace(/\//g, '\\'), // Reverse Windows path
            fileName,
          ];
          
          for (const variation of pathVariations) {
            dataUrl = jsMap.get(variation);
            if (dataUrl) break;
          }
        }
        
        if (dataUrl) {
          // Replace src attribute with base64 data URL
          scriptTag.setAttribute('src', dataUrl);
          log(`   🔄 Replaced JS: ${originalSrc} → base64`);
          scriptReplacedCount++;
        } else {
          // Try CDN conversion for known libraries
          const srcLower = originalSrc.toLowerCase();
          for (const [lib, cdn] of Object.entries(SCRIPT_CDN_MAP)) {
            if (srcLower.includes(lib)) {
              scriptTag.setAttribute('src', cdn);
              log(`   🔄 Converted ${lib} to CDN: ${cdn}`);
              scriptReplacedCount++;
              break;
            }
          }
        }
      }
      
      // Extract body content AFTER script replacement
      // КРИТИЧЕСКИ ВАЖНО: Скрипты остаются там, где они были (head или body)
      // Дубликаты уже удалены выше
      const body = doc.querySelector('body');
      let bodyHtml = body ? body.innerHTML : htmlContent;
      
      // Также извлекаем скрипты из head и добавляем их в bodyHtml
      // (они уже обработаны и дубликаты удалены)
      const head = doc.querySelector('head');
      const headScripts = head ? head.querySelectorAll('script[src]') : [];
      if (headScripts.length > 0) {
        const headScriptsHtml: string[] = [];
        headScripts.forEach(script => {
          const src = script.getAttribute('src');
          if (!src) return;
          
          // Get all attributes
          const attrs = (script as any).attributes || {};
          const attrsArray: string[] = [];
          Object.entries(attrs).forEach(([name, value]) => {
            attrsArray.push(`${name}="${value}"`);
          });
          const attrsStr = attrsArray.length > 0 ? ' ' + attrsArray.join(' ') : '';
          
          headScriptsHtml.push(`<script${attrsStr}></script>`);
        });
        
        // Добавляем скрипты из head в конец bodyHtml
        if (headScriptsHtml.length > 0) {
          bodyHtml += '\n' + headScriptsHtml.join('\n');
          log(`   📦 Added ${headScriptsHtml.length} script(s) from head to body`);
        }
      }
      
      // Replace image paths with base64
      bodyHtml = replaceHtmlAssetPaths(bodyHtml, imageMap);
      
      // Collect all scripts (including inline) for logging
      const allScripts = doc.querySelectorAll('script');
      const scriptCount = allScripts.length;
      
      if (scriptCount > 0) {
        log(`   ✅ Processed ${scriptCount} script(s) (${scriptReplacedCount} replaced with base64/CDN)`);
      }
      
      // Extract inline styles from <style> tags and process background images
      const styleTags = doc.querySelectorAll('style');
      let pageCss = '';
      for (const styleTag of styleTags) {
        let cssContent = styleTag.textContent || '';
        
        // Inline @import directives
        cssContent = await inlineCssImports(cssContent, htmlFile.path, zipContents, log, logError);
        
        // Replace CSS asset paths (including background images)
        cssContent = replaceCssAssetPaths(cssContent, imageMap);
        
        // Replace font paths in @font-face
        cssContent = replaceFontPaths(cssContent, fontMap, log);
        
        // Additional processing for background-image URLs (check both images and fonts)
        cssContent = cssContent.replace(
          /url\(['"]?([^'"()]+)['"]?\)/gi,
          (match, path) => {
            const cleanPath = path.split('?')[0].split('#')[0]; // Remove query params and hash
            const normalizedPath = cleanPath.replace(/^\.\//, '').replace(/^\.\.\//, '');
            const fileName = cleanPath.split('/').pop() || cleanPath;
            
            // Check imageMap and fontMap with multiple path variations
            let dataUrl = imageMap.get(normalizedPath) || imageMap.get(fileName) || imageMap.get(cleanPath);
            if (!dataUrl) {
              dataUrl = fontMap.get(normalizedPath) || fontMap.get(fileName) || fontMap.get(cleanPath);
            }
            
            if (dataUrl) {
              log(`   🎨 Replaced CSS url(): ${path}`);
              return `url('${dataUrl}')`;
            }
            
            return match;
          }
        );
        
        pageCss += cssContent + '\n';
      }
      
      // Inject shared CSS into HTML as <style> tag
      // КРИТИЧЕСКИ ВАЖНО: CSS вставляется как <style> тег, НЕ конвертируется в inline!
      if (sharedCss.trim() || pageCss.trim()) {
        const allCss = (sharedCss + '\n' + pageCss).trim();
        bodyHtml = `<style id="template-styles">${allCss}</style>\n${bodyHtml}`;
      }
      
      // Scripts are already in bodyHtml (they were replaced in DOM)
      
      // КРИТИЧЕСКИ ВАЖНО: Возвращаем HTML БЕЗ дополнительной обработки!
      // НЕ конвертируем CSS в inline styles - это может терять элементы!
      // НЕ оптимизируем HTML структуру
      // НЕ удаляем комментарии или нестандартные атрибуты
      pages.push({
        name: htmlFile.name,
        html: bodyHtml, // ← Оригинальный HTML с замененными путями, но структура сохранена
        css: pageCss, // Page-specific CSS (shared CSS уже в bodyHtml как <style>)
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
  
  // Count elements in HTML for debugging
  const countElements = (html: string) => {
    const divs = (html.match(/<div/gi) || []).length;
    const spans = (html.match(/<span/gi) || []).length;
    const imgs = (html.match(/<img/gi) || []).length;
    const scripts = (html.match(/<script/gi) || []).length;
    const links = (html.match(/<a\s/gi) || []).length;
    const buttons = (html.match(/<button/gi) || []).length;
    const inputs = (html.match(/<input/gi) || []).length;
    const tables = (html.match(/<table/gi) || []).length;
    const sections = (html.match(/<section/gi) || []).length;
    
    return { divs, spans, imgs, scripts, links, buttons, inputs, tables, sections };
  };
  
  // Log statistics for each page
  pages.forEach(page => {
    const stats = countElements(page.html);
    log(`[SimpleParser V3] 📊 Page "${page.name}" statistics:`);
    log(`   - DIVs: ${stats.divs}`);
    log(`   - SPANs: ${stats.spans}`);
    log(`   - IMGs: ${stats.imgs}`);
    log(`   - SCRIPTs: ${stats.scripts}`);
    log(`   - Links: ${stats.links}`);
    log(`   - Buttons: ${stats.buttons}`);
    log(`   - Inputs: ${stats.inputs}`);
    log(`   - Tables: ${stats.tables}`);
    log(`   - Sections: ${stats.sections}`);
    log(`   - HTML length: ${page.html.length} chars`);
    log(`   - CSS length: ${page.css.length} chars`);
  });
  
  return {
    pages,
    css: sharedCss,
    stats: {
      totalFiles: Object.keys(zipContents.files).length,
      htmlFiles: htmlFiles.length,
      cssFiles: cssFiles.length,
      imagesConverted: imageMap.size,
      jsFilesConverted: jsMap.size,
      fontsConverted: fontMap.size,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * CDN mappings for common libraries
 */
const SCRIPT_CDN_MAP: Record<string, string> = {
  'jquery': 'https://code.jquery.com/jquery-3.6.0.min.js',
  'bootstrap': 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
  'owl.carousel': 'https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js',
  'slick': 'https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js',
  'isotope': 'https://unpkg.com/isotope-layout@3/dist/isotope.pkgd.min.js',
};

/**
 * Convert script path to CDN if it's a known library, otherwise fix the path
 * Preserves all other script attributes (type, async, defer, etc.)
 * Note: Base64 JS files are handled before this function is called
 */
function convertScriptToCDN(src: string, otherAttributes: string = '', jsMap?: Map<string, string>): string {
  const srcLower = src.toLowerCase();
  
  // Check if it's a known library
  for (const [lib, cdn] of Object.entries(SCRIPT_CDN_MAP)) {
    if (srcLower.includes(lib)) {
      console.log(`   🔄 Converted ${lib} to CDN: ${cdn}`);
      return `<script src="${cdn}"${otherAttributes}></script>`;
    }
  }
  
  // If it's already a CDN URL (http/https), keep it as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `<script src="${src}"${otherAttributes}></script>`;
  }
  
  // Otherwise, try to fix relative paths (though they may not work in GrapesJS)
  // For now, we'll keep the original path - GrapesJS may handle it
  const fixedPath = src.replace(/^\.\//, '').replace(/^\.\.\//, '');
  return `<script src="${fixedPath}"${otherAttributes}></script>`;
}

/**
 * Normalize path for matching
 */
function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/') // Windows → Unix
    .replace(/^\.\//, '') // ./path → path
    .replace(/^\.\.\//, '') // ../path → path
    .replace(/\/+/g, '/') // // → /
    .trim();
}

/**
 * Inline CSS @import directives
 */
async function inlineCssImports(
  css: string,
  basePath: string,
  zipContents: JSZip,
  log: (msg: string, ...args: any[]) => void,
  logError: (msg: string, ...args: any[]) => void
): Promise<string> {
  const importRegex = /@import\s+(?:url\(['"]?([^'"()]+)['"]?\)|['"]([^'"]+)['"])\s*;?/gi;
  
  let match;
  const imports: Array<{ fullMatch: string; path: string }> = [];
  
  // Find all @import directives
  while ((match = importRegex.exec(css)) !== null) {
    const path = match[1] || match[2];
    imports.push({ fullMatch: match[0], path });
  }
  
  // Process each import
  for (const imp of imports) {
    try {
      // Resolve relative path
      const baseDir = basePath.split('/').slice(0, -1).join('/');
      const resolvedPath = normalizePath(
        imp.path.startsWith('/') 
          ? imp.path.substring(1)
          : `${baseDir}/${imp.path}`
      );
      
      // Try to find the CSS file in ZIP
      let cssContent = '';
      const pathVariations = [
        resolvedPath,
        imp.path,
        `${baseDir}/${imp.path}`,
        imp.path.replace(/^\.\//, ''),
        imp.path.replace(/^\.\.\//, ''),
      ];
      
      for (const pathVar of pathVariations) {
        const file = zipContents.files[pathVar];
        if (file && !file.dir) {
          cssContent = await file.async('string');
          log(`   📦 Found CSS @import: ${imp.path} → ${pathVar}`);
          break;
        }
      }
      
      if (cssContent) {
        // Recursively process nested @import
        const inlinedContent = await inlineCssImports(cssContent, resolvedPath, zipContents, log, logError);
        css = css.replace(imp.fullMatch, inlinedContent);
        log(`   ✅ Inlined CSS @import: ${imp.path}`);
      } else {
        logError(`   ⚠️ Could not find CSS file for @import: ${imp.path}`);
        // Remove the @import if file not found
        css = css.replace(imp.fullMatch, '');
      }
    } catch (error) {
      logError(`   ⚠️ Failed to inline CSS @import ${imp.path}:`, error);
      // Remove the @import on error
      css = css.replace(imp.fullMatch, '');
    }
  }
  
  return css;
}

/**
 * Replace font paths in @font-face rules with base64 data URLs
 */
function replaceFontPaths(
  css: string,
  fontMap: Map<string, string>,
  log: (msg: string, ...args: any[]) => void
): string {
  // Process @font-face rules
  return css.replace(/@font-face\s*{([^}]*)}/gi, (match, content) => {
    const replacedContent = content.replace(
      /url\(['"]?([^'"()]+)['"]?\)/gi,
      (urlMatch: string, path: string) => {
        const cleanPath = path.split('?')[0].split('#')[0]; // Remove query params and hash
        const normalizedPath = normalizePath(cleanPath);
        const fileName = cleanPath.split('/').pop() || cleanPath;
        
        // Try multiple path variations
        let dataUrl = fontMap.get(normalizedPath) || 
                     fontMap.get(fileName) || 
                     fontMap.get(cleanPath);
        
        if (!dataUrl) {
          // Try with different separators
          const pathVariations = [
            normalizedPath,
            cleanPath.replace(/\\/g, '/'),
            cleanPath.replace(/\//g, '\\'),
            fileName,
          ];
          
          for (const variation of pathVariations) {
            dataUrl = fontMap.get(variation);
            if (dataUrl) break;
          }
        }
        
        if (dataUrl) {
          log(`   🔤 Replaced font URL: ${path}`);
          return `url('${dataUrl}')`;
        }
        
        return urlMatch; // Keep original if not found
      }
    );
    
    return `@font-face {${replacedContent}}`;
  });
}

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
