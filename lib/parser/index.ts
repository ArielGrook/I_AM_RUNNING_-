import JSZip from 'jszip';
import sanitizeHtml from 'sanitize-html';
import { parse } from 'node-html-parser';
import { v4 as uuidv4 } from 'uuid';
import { Project, Page, Component, ProjectSchema } from '@/lib/types/project';
import { ParseOptions, ParseResult, ZipParseError, ParseProgress } from './types';

// Sanitize HTML options
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'header', 'footer', 'main', 'section', 'article', 'nav', 'aside',
    'figure', 'figcaption', 'picture', 'source', 'video', 'audio',
    'canvas', 'svg', 'path', 'circle', 'rect', 'line', 'polyline',
    'polygon', 'ellipse', 'g', 'defs', 'clipPath', 'mask', 'pattern'
  ]),
  allowedAttributes: {
    '*': ['class', 'id', 'style', 'data-*', 'aria-*', 'role', 'tabindex'],
    a: ['href', 'target', 'rel', 'download'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'srcset', 'sizes'],
    video: ['src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'width', 'height'],
    audio: ['src', 'controls', 'autoplay', 'loop', 'muted'],
    source: ['src', 'type', 'srcset', 'sizes', 'media'],
    svg: ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
    path: ['d', 'fill', 'stroke', 'stroke-width'],
    input: ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'readonly'],
    form: ['action', 'method', 'enctype'],
    button: ['type', 'disabled'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
    a: ['http', 'https', 'mailto', 'tel']
  }
};

// Parse HTML content into components
function parseHtmlToComponents(html: string): Component[] {
  const sanitized = sanitizeHtml(html, sanitizeOptions);
  const components: Component[] = [];
  
  // Parse HTML using node-html-parser (server-side compatible)
  const doc = parse(sanitized);
  const body = doc.querySelector('body') || doc;
  
  // Helper to determine component category
  const getCategory = (element: ReturnType<typeof parse>): Component['category'] => {
    const tagName = element.tagName?.toLowerCase() || '';
    const classList = element.classList || [];
    
    if (tagName === 'header' || classList.some((c: string) => c.includes('header'))) return 'header';
    if (tagName === 'footer' || classList.some((c: string) => c.includes('footer'))) return 'footer';
    if (tagName === 'nav' || classList.some((c: string) => c.includes('nav'))) return 'navigation';
    if (classList.some((c: string) => c.includes('hero'))) return 'hero';
    if (tagName === 'form' || classList.some((c: string) => c.includes('form'))) return 'form';
    if (tagName === 'button' || element.querySelector('button')) return 'button';
    if (tagName === 'section') return 'section';
    
    return 'custom';
  };
  
  // Helper to extract component from element
  const extractComponent = (element: ReturnType<typeof parse>, index: number): Component => {
    const category = getCategory(element);
    const tagName = element.tagName?.toLowerCase() || 'div';
    
    // CRITICAL FIX: Use toString() to get full HTML representation including nested elements
    // node-html-parser's toString() returns the full outerHTML of the element
    let elementHtml = '';
    try {
      // Try toString() first - this should give us the full HTML including all nested children
      if (typeof element.toString === 'function') {
        elementHtml = element.toString();
      }
      
      // Fallback: manually construct if toString() doesn't work or returns empty
      if (!elementHtml || elementHtml.trim().length === 0) {
        console.warn(`[Parser] toString() returned empty, manually constructing HTML for ${tagName}`);
        
        // Get innerHTML which includes all nested HTML (not just text)
        const innerHTML = (element as any).innerHTML || '';
        const attrs = element.attributes || {};
        const classNames = element.classNames || [];
        const styleAttr = element.getAttribute('style') || '';
        const idAttr = element.getAttribute('id') || '';
        
        // Build attribute string
        const attrParts: string[] = [];
        
        // Add ID if present
        if (idAttr) {
          attrParts.push(`id="${idAttr}"`);
        }
        
        // Add class if present
        if (classNames.length > 0) {
          attrParts.push(`class="${classNames.join(' ')}"`);
        }
        
        // Add style if present
        if (styleAttr) {
          attrParts.push(`style="${styleAttr}"`);
        }
        
        // Add other attributes
        Object.entries(attrs).forEach(([key, value]) => {
          if (key !== 'class' && key !== 'style' && key !== 'id') {
            attrParts.push(`${key}="${String(value)}"`);
          }
        });
        
        const allAttrs = attrParts.length > 0 ? ' ' + attrParts.join(' ') : '';
        
        // Construct full HTML element with innerHTML (preserves nested structure)
        elementHtml = `<${tagName}${allAttrs}>${innerHTML}</${tagName}>`;
      }
      
      // Verify we got HTML
      if (!elementHtml || elementHtml.trim().length === 0) {
        console.warn(`[Parser] Empty HTML for element ${tagName} after all attempts, using fallback`);
        elementHtml = `<${tagName}>Empty component</${tagName}>`;
      } else {
        // Log success for debugging
        console.log(`[Parser] Extracted HTML for ${tagName}, length: ${elementHtml.length}, preview: ${elementHtml.substring(0, 100)}`);
      }
    } catch (error) {
      console.error('[Parser] Error extracting HTML from element:', error);
      // Last resort: use minimal HTML
      elementHtml = `<${tagName}>Error parsing element</${tagName}>`;
    }
    
    return {
      id: uuidv4(),
      type: tagName,
      category,
      props: {
        html: elementHtml,
        className: element.classNames?.join(' ') || '',
        attributes: element.attributes || {}
      },
      styles: element.getAttribute('style') ? 
        Object.fromEntries(
          element.getAttribute('style')!
            .split(';')
            .filter(s => s.trim())
            .map(s => {
              const [key, value] = s.split(':').map(str => str.trim());
              return [key, value];
            })
        ) : undefined,
      position: {
        x: 0,
        y: index * 100,
        width: 100,
        height: 100
      }
    };
  };
  
  // Extract top-level components (direct children of body)
  // node-html-parser returns childNodes as an array
  const childNodes = body.childNodes || [];
  
  // Filter to get only element nodes (not text nodes)
  const mainElements = childNodes.filter(
    (node): node is ReturnType<typeof parse> => {
      return node && 
             typeof node === 'object' && 
             'tagName' in node && 
             typeof (node as any).tagName === 'string' &&
             (node as any).tagName.length > 0; // Ensure it's a real element
    }
  );
  
  console.log(`[Parser] Found ${mainElements.length} top-level elements from ${childNodes.length} child nodes`);
  
  mainElements.forEach((element, index) => {
    const component = extractComponent(element, index);
    components.push(component);
  });
  
  console.log(`[Parser] Extracted ${components.length} components total`);
  
  return components;
}

// Parse CSS content
function parseCss(css: string): string {
  // Sanitize CSS to remove potentially harmful rules
  const sanitizedCss = css
    .replace(/@import\s+[^;]+;/gi, '') // Remove @import
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/expression\s*\(/gi, ''); // Remove IE expressions
  
  return sanitizedCss;
}

/**
 * Parse ZIP file into Project with progress tracking and error handling
 * 
 * Stage 2 Module 4: Enhanced with streaming, progress callbacks, size limits
 * Fixes BIG REVIEW.md #9: Better error handling
 * 
 * @param file - ZIP file as ArrayBuffer
 * @param options - Parse options including progress callback and size limits
 * @returns Parsed project with metadata
 */
export async function parseZip(
  file: ArrayBuffer,
  options: ParseOptions = {}
): Promise<ParseResult> {
  console.log('[Parser] 🚀 parseZip() called');
  console.log('[Parser] 📦 Input:', {
    fileSize: file.byteLength,
    maxSize: options.maxSize || 50 * 1024 * 1024,
    hasProgressCallback: !!options.onProgress
  });
  
  const startTime = Date.now();
  const maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB default
  const onProgress = options.onProgress;
  
  // Check file size
  if (file.byteLength > maxSize) {
    console.error('[Parser] ❌ File size exceeded');
    throw new ZipParseError(
      `File size (${(file.byteLength / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
      'SIZE_EXCEEDED',
      { fileSize: file.byteLength, maxSize }
    );
  }
  
  // Clear canvas before import if callback provided
  if (options.clearCanvas) {
    onProgress?.({
      stage: 'loading',
      progress: 0,
      message: 'Clearing canvas...',
    });
    try {
      await options.clearCanvas();
    } catch (error) {
      console.warn('Failed to clear canvas:', error);
      // Continue anyway - not critical
    }
  }
  
  // Report loading stage
  onProgress?.({
    stage: 'loading',
    progress: 10,
    message: 'Loading ZIP file...',
  });
  
  console.log('[Parser] 🔄 Creating JSZip instance...');
  let zip: JSZip;
  let contents: JSZip;
  
  try {
    zip = new JSZip();
    console.log('[Parser] 🔄 Loading ZIP file...');
    contents = await zip.loadAsync(file);
    console.log('[Parser] ✅ ZIP file loaded successfully');
  } catch (error) {
    if (error instanceof JSZip.JSZipError) {
      throw new ZipParseError(
        'Invalid or corrupted ZIP file format',
        'INVALID_FORMAT',
        error
      );
    }
    throw new ZipParseError(
      'Failed to load ZIP file',
      'CORRUPTED',
      error
    );
  }
  
  // Count total files for progress tracking
  const fileEntries = Object.entries(contents.files).filter(([, entry]) => !entry.dir);
  const totalFiles = fileEntries.length;
  
  console.log('[Parser] 📊 Found files:', {
    totalFiles,
    files: fileEntries.map(([path]) => path).slice(0, 10) // Log first 10 files
  });
  
  onProgress?.({
    stage: 'parsing',
    progress: 20,
    message: `Found ${totalFiles} files to process`,
    totalFiles,
    processedFiles: 0,
  });
  
  const now = new Date().toISOString();
  const project: Project = {
    id: uuidv4(),
    name: 'Imported Project',
    description: 'Project imported from ZIP file',
    pages: [],
    globalStyles: '',
    globalScripts: '',
    assets: [],
    settings: {
      language: 'en'
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0.0'
    }
  };
  
  // Process each file in the ZIP with progress tracking
  let processedFiles = 0;
  
  for (const [path, zipEntry] of fileEntries) {
    const fileName = path.split('/').pop() || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Update progress
    processedFiles++;
    const fileProgress = 20 + (processedFiles / totalFiles) * 70; // 20-90%
    
    onProgress?.({
      stage: 'processing',
      progress: Math.round(fileProgress),
      message: `Processing ${fileName}...`,
      currentFile: fileName,
      totalFiles,
      processedFiles,
    });
    
    try {
      if (extension === 'html' || extension === 'htm') {
        // Parse HTML file as a page
        const content = await zipEntry.async('string');
        
        console.log(`[ZIP Parser] Processing HTML file: ${fileName}, content length: ${content.length}`);
        
        // Extract title from HTML
        const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : fileName.replace(/\.[^.]+$/, '');
        
        // Extract body content
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : content;
        
        console.log(`[ZIP Parser] Body content length: ${bodyContent.length}`);
        console.log(`[ZIP Parser] Body preview (first 200 chars): ${bodyContent.substring(0, 200)}`);
        
        // Parse components from body
        const components = parseHtmlToComponents(bodyContent);
        
        console.log(`[ZIP Parser] Parsed ${components.length} components`);
        components.forEach((comp, idx) => {
          const htmlLength = comp.props?.html?.length || 0;
          console.log(`[ZIP Parser] Component ${idx}: type=${comp.type}, html length=${htmlLength}, preview=${comp.props?.html?.substring(0, 100) || 'EMPTY'}`);
        });
        
        // Create page
        const page: Page = {
          id: uuidv4(),
          name: title,
          slug: fileName.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title,
          components,
          styles: '',
          scripts: ''
        };
        
        // Extract inline styles
        const styleMatches = content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        for (const match of styleMatches) {
          page.styles = (page.styles || '') + '\n' + parseCss(match[1]);
        }
        
        project.pages.push(page);
        
      } else if (extension === 'css') {
        // Add to global styles
        const content = await zipEntry.async('string');
        project.globalStyles = (project.globalStyles || '') + '\n' + parseCss(content);
        
      } else if (extension === 'js') {
        // Add to global scripts (sanitized)
        const content = await zipEntry.async('string');
        // Basic sanitization - in production, use a proper JS sanitizer
        const sanitizedJs = content.replace(/eval\s*\(/gi, '').replace(/Function\s*\(/gi, '');
        project.globalScripts = (project.globalScripts || '') + '\n' + sanitizedJs;
        
      } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) {
        // Handle images as assets
        const blob = await zipEntry.async('blob');
        const dataUrl = await blobToDataUrl(blob);
        
        project.assets = project.assets || [];
        project.assets.push({
          id: uuidv4(),
          name: fileName,
          type: blob.type || `image/${extension}`,
          url: dataUrl,
          size: blob.size
        });
      }
    } catch (error) {
      // Log error but continue processing other files
      console.warn(`Failed to process file ${fileName}:`, error);
      // Don't throw - allow other files to be processed
    }
  }
  
  // Ensure at least one page exists
  if (project.pages.length === 0) {
    project.pages.push({
      id: uuidv4(),
      name: 'Home',
      slug: 'index',
      title: project.name,
      components: []
    });
  }
  
  // Extract project name from ZIP filename or first page
  if (project.pages.length > 0) {
    project.name = project.pages[0].title || 'Imported Project';
  }
  
  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: 'Import complete!',
    totalFiles,
    processedFiles,
  });
  
  // Validate the project structure
  let validatedProject: Project;
  try {
    validatedProject = ProjectSchema.parse(project);
  } catch (error) {
    throw new ZipParseError(
      'Invalid project structure in ZIP file',
      'INVALID_FORMAT',
      error
    );
  }
  
  const processingTime = Date.now() - startTime;
  const componentsCount = validatedProject.pages.reduce(
    (sum, page) => sum + page.components.length,
    0
  );
  
  console.log('[Parser] ✅ ZIP parsing complete:', {
    pagesCount: validatedProject.pages.length,
    componentsCount,
    processingTime: `${processingTime}ms`
  });
  
  return {
    project: validatedProject,
    metadata: {
      originalFileName: 'imported.zip', // Will be set by caller
      fileSize: file.byteLength,
      pagesCount: validatedProject.pages.length,
      componentsCount,
      processingTime,
    },
  };
}

// Helper to convert Blob to Data URL
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Export project validation
export function validateProject(project: unknown): Project {
  return ProjectSchema.parse(project);
}

// Re-export types
export type { ParseOptions, ParseResult, ParseProgress } from './types';

// Re-export ZipParseError as a class (not just a type)
export { ZipParseError } from './types';



