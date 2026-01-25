/**
 * Parser V2 - Main Entry Point
 * 
 * Complete ZIP parser system for importing website templates.
 * Orchestrates all modules in the correct sequence.
 * 
 * Features:
 * - Multi-page template support
 * - Hybrid CSS strategy (preserves @keyframes, @media, etc.)
 * - Intelligent root detection
 * - Asset conversion with parallel processing
 * - Progress tracking
 * - Hybrid storage (localStorage + IndexedDB)
 * 
 * @version 2.0.0
 */

import { v4 as uuidv4 } from 'uuid';

// Module imports
import { ZipExtractor, isValidZip, getZipInfo } from './zip-extractor';
import { RootDetector, quickDetectRoot, normalizeToRoot } from './root-detector';
import { CSSProcessor, mergeCSS, hasAnimations } from './css-processor';
import { AssetConverter, calculateAssetSize } from './asset-converter';
import { HTMLProcessor, extractTitle } from './html-processor';
import { PageBuilder, createDefaultHomePage, mergePagesBySlug } from './page-builder';
import { StorageManager, isIndexedDBAvailable, clearAllParserStorage } from './storage-manager';
import { ProgressTracker, formatTime } from './progress-tracker';

// Type imports
import {
  ProjectV2,
  PageV2,
  AssetV2,
  ParserOptions,
  ParseProgress,
  ProgressCallback,
  WarningCallback,
  ImportMetadata,
  ImportWarning,
  SkippedFile,
  ParserError,
  ZipFileIndex,
  RootDetectionResult,
  CSSClassification,
  AssetConversionResult,
} from './types';

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

/**
 * Parse a ZIP file and return a ProjectV2 structure
 * 
 * This is the main entry point for the parser.
 * 
 * @param file - ZIP file (File, Blob, or ArrayBuffer)
 * @param options - Parser options including callbacks and limits
 * @returns Parsed project ready for the editor
 */
export async function parseZipProject(
  file: File | Blob | ArrayBuffer,
  options: ParserOptions = {}
): Promise<ProjectV2> {
  const startTime = Date.now();
  const projectId = uuidv4();
  
  console.log('[ParserV2] ====================================');
  console.log('[ParserV2] Starting ZIP import');
  console.log('[ParserV2] Project ID:', projectId);
  console.log('[ParserV2] File size:', file instanceof ArrayBuffer ? file.byteLength : file.size);
  console.log('[ParserV2] ====================================');

  // Initialize progress tracker
  const tracker = new ProgressTracker();
  tracker.init(options.onProgress);

  // Collect all warnings
  const allWarnings: ImportWarning[] = [];
  const skippedFiles: SkippedFile[] = [];

  try {
    // ========================================================================
    // STEP 1: Read ZIP File
    // ========================================================================
    tracker.startStage('reading');
    
    const extractor = new ZipExtractor();
    const fileIndex = await extractor.extract(file, options.onProgress);
    
    console.log('[ParserV2] ZIP extracted:', {
      totalFiles: fileIndex.totalFiles,
      htmlFiles: fileIndex.htmlFiles.length,
      cssFiles: fileIndex.cssFiles.length,
      images: fileIndex.imageFiles.length,
      fonts: fileIndex.fontFiles.length,
    });

    tracker.setFileCount(fileIndex.totalFiles, 0);
    tracker.completeStage('ZIP file read successfully');

    // Check for HTML files
    if (fileIndex.htmlFiles.length === 0) {
      throw new ParserError(
        'No HTML files found in the ZIP. Please ensure the template contains at least one .html file.',
        'NO_HTML_FOUND'
      );
    }

    // ========================================================================
    // STEP 2: Detect Site Root
    // ========================================================================
    tracker.startStage('detecting');

    const rootDetector = new RootDetector(fileIndex);
    const rootResult = rootDetector.detect();

    console.log('[ParserV2] Root detection:', {
      rootPath: rootResult.rootPath || '(ZIP root)',
      confidence: rootResult.confidence,
      structureType: rootResult.structureType,
      indexPath: rootResult.indexHtmlPath,
    });

    // Update file index with detected root
    fileIndex.detectedRoot = rootResult.rootPath;
    fileIndex.rootScore = rootResult.confidence;

    tracker.completeStage(`Site structure detected: ${rootResult.structureType}`);

    // ========================================================================
    // STEP 3: Process CSS
    // ========================================================================
    tracker.startStage('css');

    // Collect all CSS files within the root
    const cssFiles = fileIndex.cssFiles.filter(f => 
      !rootResult.rootPath || f.path.startsWith(rootResult.rootPath)
    );

    console.log('[ParserV2] CSS files to process:', cssFiles.length);

    // Read and merge all CSS content
    const cssContents: string[] = [];
    for (let i = 0; i < cssFiles.length; i++) {
      try {
        const content = await cssFiles[i].getContent();
        cssContents.push(content);
        tracker.update((i + 1) / cssFiles.length * 0.8, `Processing ${cssFiles[i].name}`);
      } catch (error) {
        skippedFiles.push({
          path: cssFiles[i].path,
          reason: 'parse_error',
          message: `Failed to read CSS file: ${error}`,
        });
      }
    }

    const mergedCSS = mergeCSS(cssContents);
    console.log('[ParserV2] Merged CSS length:', mergedCSS.length);

    // Process CSS (classify into inlineable vs global)
    const cssProcessor = new CSSProcessor(options.cssOptions);
    const cssClassification = cssProcessor.process(mergedCSS);

    console.log('[ParserV2] CSS classification:', {
      inlineable: cssClassification.inlineable.size,
      globalLength: cssClassification.global.length,
      keyframes: cssClassification.keyframes.size,
      mediaQueries: cssClassification.mediaQueries.length,
      fontFaces: cssClassification.fontFaces.length,
    });

    allWarnings.push(...cssProcessor.getWarnings());
    tracker.completeStage('CSS processed');

    // ========================================================================
    // STEP 4: Convert Assets
    // ========================================================================
    tracker.startStage('assets');

    const assetConverter = new AssetConverter(options.assetOptions);
    const assetResult = await assetConverter.convertAll(
      fileIndex,
      rootResult.rootPath,
      options.onProgress
    );

    console.log('[ParserV2] Assets converted:', {
      count: assetResult.convertedCount,
      skipped: assetResult.skippedCount,
      totalSize: `${(assetResult.totalSize / 1024 / 1024).toFixed(2)}MB`,
    });

    allWarnings.push(...assetConverter.getWarnings());
    tracker.completeStage('Assets converted');

    // ========================================================================
    // STEP 5: Process HTML and Build Pages
    // ========================================================================
    tracker.startStage('html');

    const pageBuilder = new PageBuilder();
    let pages = await pageBuilder.buildPages(
      fileIndex,
      rootResult.rootPath,
      cssClassification,
      assetResult.replacementMap
    );

    console.log('[ParserV2] Pages built:', pages.length);

    // Fix navigation links between pages
    pages = pageBuilder.fixNavigationLinks(pages);

    // Merge pages with same slug
    pages = mergePagesBySlug(pages);

    allWarnings.push(...pageBuilder.getWarnings());
    tracker.completeStage('HTML processed');

    // ========================================================================
    // STEP 6: Build Project Structure
    // ========================================================================
    tracker.startStage('building');

    // Ensure at least one home page
    if (pages.length === 0) {
      pages.push(createDefaultHomePage());
      allWarnings.push({
        type: 'warning',
        message: 'No pages could be imported. Created a default home page.',
      });
    }

    // Ensure one page is marked as home
    const hasHome = pages.some(p => p.isHome);
    if (!hasHome && pages.length > 0) {
      pages[0].isHome = true;
    }

    // Sort pages by order
    pages.sort((a, b) => a.order - b.order);

    // Extract project name from first page or filename
    let projectName = 'Imported Project';
    const indexPage = pages.find(p => p.isHome);
    if (indexPage?.meta.title) {
      projectName = indexPage.meta.title;
    } else if (file instanceof File) {
      projectName = file.name.replace(/\.zip$/i, '');
    }

    // Build global scripts list from pages
    const globalScripts: string[] = [];
    for (const page of pages) {
      for (const script of page.scripts) {
        if (script.src && script.type === 'cdn' && !globalScripts.includes(script.src)) {
          globalScripts.push(script.src);
        }
      }
    }

    const processingTime = Date.now() - startTime;

    // Build import metadata
    const importMetadata: ImportMetadata = {
      originalFileName: file instanceof File ? file.name : 'imported.zip',
      originalFileSize: file instanceof ArrayBuffer ? file.byteLength : file.size,
      importedAt: new Date().toISOString(),
      parserVersion: '2.0.0',
      totalFiles: fileIndex.totalFiles,
      processedFiles: fileIndex.totalFiles - skippedFiles.length,
      skippedFiles,
      warnings: allWarnings,
      processingTime,
      detectedStructure: rootResult.structureType,
      detectedRoot: rootResult.rootPath,
      cssStats: {
        totalRules: cssClassification.stats.totalRules,
        inlinedRules: cssClassification.stats.inlineableCount,
        globalRules: cssClassification.stats.globalCount,
        keyframesCount: cssClassification.keyframes.size,
        mediaQueriesCount: cssClassification.mediaQueries.length,
      },
    };

    tracker.completeStage('Project structure built');

    // ========================================================================
    // STEP 7: Create Project
    // ========================================================================
    tracker.startStage('finalizing');

    const now = new Date().toISOString();

    const project: ProjectV2 = {
      version: '2.0',
      id: projectId,
      name: projectName,
      pages,
      globalStyles: cssClassification.global,
      globalScripts,
      assets: assetResult.assets,
      backendBlocks: [],
      backendTriggers: [],
      environment: [],
      settings: {
        language: 'en',
      },
      createdAt: now,
      updatedAt: now,
      importMetadata,
    };

    // ========================================================================
    // STEP 8: Save to Storage (optional)
    // ========================================================================
    // Note: Storage is handled separately by the caller if needed

    tracker.complete('Import complete!');

    console.log('[ParserV2] ====================================');
    console.log('[ParserV2] Import complete!');
    console.log('[ParserV2] Processing time:', formatTime(processingTime));
    console.log('[ParserV2] Pages:', pages.length);
    console.log('[ParserV2] Assets:', assetResult.assets.length);
    console.log('[ParserV2] Warnings:', allWarnings.length);
    console.log('[ParserV2] ====================================');

    // Report warnings
    if (options.onWarning && allWarnings.length > 0) {
      for (const warning of allWarnings) {
        options.onWarning(warning);
      }
    }

    // Clean up
    extractor.dispose();

    return project;

  } catch (error) {
    console.error('[ParserV2] Import failed:', error);
    
    if (error instanceof ParserError) {
      throw error;
    }

    throw new ParserError(
      `Import failed: ${error instanceof Error ? error.message : String(error)}`,
      'UNKNOWN',
      error
    );
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick preview of a ZIP file without full parsing
 */
export async function previewZip(file: File | Blob | ArrayBuffer): Promise<{
  isValid: boolean;
  fileCount: number;
  hasHtml: boolean;
  hasCss: boolean;
  hasImages: boolean;
  topLevelFolders: string[];
}> {
  const valid = await isValidZip(file);
  if (!valid) {
    return {
      isValid: false,
      fileCount: 0,
      hasHtml: false,
      hasCss: false,
      hasImages: false,
      topLevelFolders: [],
    };
  }

  const info = await getZipInfo(file);
  return {
    isValid: true,
    ...info,
  };
}

/**
 * Save a project to storage
 */
export async function saveProject(project: ProjectV2): Promise<void> {
  const storage = new StorageManager();
  await storage.init(project.id);
  await storage.saveProject(project);
  storage.close();
}

/**
 * Load a project from storage
 */
export async function loadProject(projectId: string): Promise<ProjectV2 | null> {
  const storage = new StorageManager();
  await storage.init(projectId);
  const project = await storage.loadProject();
  storage.close();
  return project;
}

/**
 * Delete a project from storage
 */
export async function deleteProject(projectId: string): Promise<void> {
  const storage = new StorageManager();
  await storage.init(projectId);
  await storage.deleteProject();
  storage.close();
}

/**
 * Convert project V2 to format compatible with existing editor
 */
export function projectToEditorFormat(project: ProjectV2): {
  html: string;
  css: string;
  assets: Array<{ id: string; name: string; url: string; type: string; size: number }>;
} {
  // Get home page or first page
  const mainPage = project.pages.find(p => p.isHome) || project.pages[0];
  
  if (!mainPage) {
    return { html: '', css: '', assets: [] };
  }

  // Combine page HTML with wrapper
  const html = mainPage.html;
  
  // Combine global CSS with page CSS
  const css = [project.globalStyles, mainPage.css].filter(Boolean).join('\n');

  // Convert assets to simpler format
  const assets = project.assets.map(asset => ({
    id: asset.id,
    name: asset.filename,
    url: asset.data,
    type: asset.mimeType,
    size: asset.size,
  }));

  return { html, css, assets };
}

/**
 * Get all pages as HTML for export
 */
export function exportPagesToHtml(project: ProjectV2): Map<string, string> {
  const pages = new Map<string, string>();

  for (const page of project.pages) {
    const filename = page.isHome ? 'index.html' : `${page.slug}.html`;
    
    // Build full HTML document
    const html = `<!DOCTYPE html>
<html lang="${project.settings.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.meta.title || page.name}</title>
  ${page.meta.description ? `<meta name="description" content="${page.meta.description}">` : ''}
  <style>
${project.globalStyles}
${page.css}
  </style>
</head>
<body>
${page.html}
  ${project.globalScripts.map(src => `<script src="${src}"></script>`).join('\n  ')}
</body>
</html>`;

    pages.set(filename, html);
  }

  return pages;
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Export types
export * from './types';

// Export utility functions
export { formatTime } from './progress-tracker';
export { mergeCSS, hasAnimations, extractAnimationNames, extractCSSVariables } from './css-processor';
export { isIndexedDBAvailable, clearAllParserStorage, listStoredProjects } from './storage-manager';
export { isValidZip, getZipInfo } from './zip-extractor';
export { getPageNameFromFile, getPageSlugFromFile, extractBodyContent } from './html-processor';

// Export classes for advanced usage
export { ZipExtractor } from './zip-extractor';
export { RootDetector } from './root-detector';
export { CSSProcessor } from './css-processor';
export { AssetConverter } from './asset-converter';
export { HTMLProcessor } from './html-processor';
export { PageBuilder } from './page-builder';
export { StorageManager } from './storage-manager';
export { ProgressTracker } from './progress-tracker';
