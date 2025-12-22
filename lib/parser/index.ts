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
    try {
      const tagName = element.tagName?.toLowerCase() || '';
      // node-html-parser uses classNames, not classList
      const classNames = (element as any).classNames || [];
      const classList = Array.isArray(classNames) ? classNames : [];
      
      if (tagName === 'header' || classList.some((c: string) => c.includes('header'))) return 'header';
      if (tagName === 'footer' || classList.some((c: string) => c.includes('footer'))) return 'footer';
      if (tagName === 'nav' || classList.some((c: string) => c.includes('nav'))) return 'navigation';
      if (classList.some((c: string) => c.includes('hero'))) return 'hero';
      if (tagName === 'form' || classList.some((c: string) => c.includes('form'))) return 'form';
      if (tagName === 'button' || (typeof element.querySelector === 'function' && element.querySelector('button'))) return 'button';
      if (tagName === 'section') return 'section';
      
      return 'custom';
    } catch (error) {
      console.warn('[Parser] Error determining category, using custom:', error);
      return 'custom';
    }
  };
  
  // Helper to extract component from element
  const extractComponent = (element: any, index: number): Component => {
    // CRITICAL: Log immediately at function entry to catch any early errors
    console.log(`[Parser] ✅ extractComponent() called for index ${index}`);
    
    try {
      console.log(`[Parser] 📊 Element details:`, {
        elementExists: !!element,
        elementType: typeof element,
        hasTagName: !!(element as any)?.tagName,
        tagName: (element as any)?.tagName || 'NONE',
        elementKeys: element && typeof element === 'object' ? Object.keys(element as object).slice(0, 10) : []
      });
    } catch (logError) {
      console.warn(`[Parser] ⚠️ Error logging element details:`, {
        error: logError instanceof Error ? logError.message : String(logError),
        elementExists: !!element,
        elementType: typeof element
      });
    }
    
    try {
      let category: Component['category'] = 'custom';
      let tagName = 'div';
      
      try {
        category = getCategory(element);
        tagName = element.tagName?.toLowerCase() || 'div';
        console.log(`[Parser] ✅ Got category: ${category}, tagName: ${tagName}`);
      } catch (error) {
        console.warn(`[Parser] Error getting category/tagName for element ${index}:`, error);
        // Use defaults above
      }
    
    // CRITICAL FIX: Use toString() to get full HTML representation including nested elements
    // node-html-parser's toString() returns the full outerHTML of the element
    let elementHtml = '';
    try {
      // Try toString() first - this should give us the full HTML including all nested children
      if (typeof element.toString === 'function') {
        try {
          elementHtml = element.toString();
        } catch (toStringError) {
          console.warn(`[Parser] toString() threw an error for ${tagName}:`, {
            error: toStringError instanceof Error ? toStringError.message : String(toStringError),
            stack: toStringError instanceof Error ? toStringError.stack : undefined
          });
          // Continue to fallback construction
        }
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
    
    // Safely extract className and attributes
    let className = '';
    let attributes: Record<string, any> = {};
    let styles: Record<string, string> | undefined = undefined;
    
    try {
      const classNames = (element as any).classNames;
      if (Array.isArray(classNames)) {
        className = classNames.join(' ') || '';
      }
    } catch (error) {
      console.warn(`[Parser] Error extracting className:`, error);
    }
    
    try {
      attributes = (element as any).attributes || {};
    } catch (error) {
      console.warn(`[Parser] Error extracting attributes:`, error);
    }
    
    try {
      if (typeof element.getAttribute === 'function') {
        const styleAttr = element.getAttribute('style');
        if (styleAttr && typeof styleAttr === 'string') {
          styles = Object.fromEntries(
            styleAttr
              .split(';')
              .filter(s => s.trim())
              .map(s => {
                const [key, value] = s.split(':').map(str => str.trim());
                return [key, value];
              })
              .filter(([key]) => key) // Filter out invalid entries
          );
          // If we couldn't parse any styles, set to undefined
          if (styles && Object.keys(styles).length === 0) {
            styles = undefined;
          }
        }
      }
    } catch (error) {
      console.warn(`[Parser] Error extracting styles:`, error);
    }
    
      const component: Component = {
        id: uuidv4(),
        type: tagName,
        category,
        props: {
          html: elementHtml,
          className,
          attributes
        },
        styles,
        position: {
          x: 0,
          y: index * 100,
          width: 100,
          height: 100
        }
      };
      
      console.log(`[Parser] ✅ Successfully created component ${index}:`, {
        type: component.type,
        category: component.category,
        htmlLength: component.props?.html?.length || 0
      });
      
      return component;
      
    } catch (error) {
      // CRITICAL: Catch ANY error that happens in extractComponent
      console.error(`[Parser] ❌ FATAL ERROR in extractComponent ${index}:`, error);
      console.error(`[Parser] Error type:`, typeof error);
      console.error(`[Parser] Error constructor:`, error?.constructor?.name);
      console.error(`[Parser] Error message:`, error instanceof Error ? error.message : String(error));
      console.error(`[Parser] Error stack:`, error instanceof Error ? error.stack : 'No stack');
      console.error(`[Parser] Full error object:`, {
        error,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      });
      
      // Re-throw to be caught by outer handler
      throw error;
    }
  };
  
  // Extract top-level components (direct children of body)
  // node-html-parser returns childNodes as an array
  const childNodes = body.childNodes || [];
  
  console.log(`[Parser] 🔍 Analyzing HTML structure:`, {
    totalChildNodes: childNodes.length,
    bodyInnerHTML: body.innerHTML?.substring(0, 200) || 'EMPTY',
    bodyTagName: body.tagName
  });
  
  // Filter to get only element nodes (not text nodes)
  const mainElements = childNodes.filter(
    (node): node is ReturnType<typeof parse> => {
      const isValid = node && 
             typeof node === 'object' && 
             'tagName' in node && 
             typeof (node as any).tagName === 'string' &&
             (node as any).tagName.length > 0; // Ensure it's a real element
      
      if (!isValid && node) {
        console.log(`[Parser] ⚠️ Filtered out node:`, {
          type: typeof node,
          hasTagName: 'tagName' in node,
          tagName: (node as any).tagName
        });
      }
      
      return isValid;
    }
  );
  
  console.log(`[Parser] 📊 Found ${mainElements.length} top-level elements from ${childNodes.length} child nodes`);
  
  if (mainElements.length === 0) {
    console.warn(`[Parser] ⚠️ WARNING: No valid elements found in body!`);
    console.warn(`[Parser] Body childNodes types:`, childNodes.map((node: any, idx: number) => ({
      index: idx,
      type: typeof node,
      tagName: node?.tagName,
      hasTagName: 'tagName' in (node || {})
    })));
  }
  
  mainElements.forEach((element, index) => {
    console.log(`[Parser] 🔄 Extracting component ${index}...`);
    try {
      const component = extractComponent(element, index);
      components.push(component);
      console.log(`[Parser] ✅ Successfully extracted component ${index} (type: ${component.type}, htmlLength: ${component.props?.html?.length || 0})`);
    } catch (error) {
      // Log detailed error information
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorDetails = {
        message: errorMessage,
        stack: errorStack,
        elementType: typeof element,
        elementTagName: (element as any)?.tagName,
        elementKeys: element && typeof element === 'object' ? Object.keys(element as object) : [],
        errorType: error?.constructor?.name || typeof error
      };
      
      console.error(`[Parser] ❌ Error extracting component ${index}:`, errorDetails);
      console.error(`[Parser] ❌ Error details (raw):`, {
        message: errorMessage,
        stack: errorStack,
        error: error
      });
      
      // Continue processing other components - don't fail the entire parse
      // Optionally add a placeholder component
      console.warn(`[Parser] ⚠️ Skipping component ${index} due to error, continuing with next component...`);
    }
  });
  
  console.log(`[Parser] ✅ Extracted ${components.length} components total`);
  
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
        console.log(`[ZIP Parser] 🔄 Calling parseHtmlToComponents() with body content length: ${bodyContent.length}`);
        const components = parseHtmlToComponents(bodyContent);
        
        console.log(`[ZIP Parser] ✅ Parsed ${components.length} components from ${fileName}`);
        
        // Detailed component logging
        if (components.length === 0) {
          console.warn(`[ZIP Parser] ⚠️ WARNING: No components extracted from ${fileName}!`);
          console.warn(`[ZIP Parser] Body content preview: ${bodyContent.substring(0, 500)}`);
        } else {
          components.forEach((comp, idx) => {
            const htmlLength = comp.props?.html?.length || 0;
            console.log(`[ZIP Parser] Component ${idx}:`, {
              type: comp.type,
              category: comp.category,
              htmlLength: htmlLength,
              hasProps: !!comp.props,
              htmlPreview: comp.props?.html?.substring(0, 100) || 'EMPTY'
            });
          });
        }
        
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
        
        console.log(`[ZIP Parser] 📄 Created page with ${page.components.length} components`);
        
        // Extract inline styles
        const styleMatches = content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        for (const match of styleMatches) {
          page.styles = (page.styles || '') + '\n' + parseCss(match[1]);
        }
        
        console.log(`[ZIP Parser] ➕ Adding page to project. Total pages: ${project.pages.length + 1}`);
        project.pages.push(page);
        console.log(`[ZIP Parser] ✅ Page added. Project now has ${project.pages.length} pages with ${project.pages.reduce((sum, p) => sum + p.components.length, 0)} total components`);
        
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorDetails = {
        message: errorMessage,
        stack: errorStack,
        errorType: error?.constructor?.name || typeof error,
        fileName
      };
      
      console.warn(`Failed to process file ${fileName}:`, errorDetails);
      console.warn(`Failed to process file ${fileName} (raw error):`, {
        error,
        message: errorMessage,
        stack: errorStack
      });
      
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



