/**
 * Root Detector Module
 * 
 * Detects the actual site root folder within a ZIP file.
 * Handles nested structures like space-science/upload/ pattern.
 * Uses a scoring system to find the most likely site root.
 * 
 * @version 2.0.0
 */

import {
  ZipFileIndex,
  ZipFileEntry,
  RootDetectionResult,
  RootScoreEntry,
  RootSignal,
  FolderStructureType,
  IGNORE_FOLDERS,
} from './types';

// ============================================================================
// SCORING CONSTANTS
// ============================================================================

/**
 * Positive signals - these indicate a valid site root
 */
const POSITIVE_SIGNALS: Record<string, number> = {
  // High confidence signals
  'has_index_html': 50,          // index.html present = strong signal
  'has_css_folder': 20,          // css/ folder
  'has_js_folder': 20,           // js/ folder
  'has_images_folder': 15,       // images/ folder
  'has_img_folder': 15,          // img/ folder
  'has_assets_folder': 15,       // assets/ folder
  'has_fonts_folder': 10,        // fonts/ folder
  
  // Medium confidence signals
  'has_other_html': 10,          // other .html files (about.html, contact.html)
  'has_vendor_folder': 8,        // vendor/ folder
  'has_fontawesome_folder': 8,   // fontawesome/ folder
  
  // Low confidence signals
  'has_nested_css': 5,           // assets/css/ pattern
  'has_nested_js': 5,            // assets/js/ pattern
  'has_readme': 3,               // Has readme (sometimes in site root)
};

/**
 * Negative signals - these indicate NOT a valid site root
 */
const NEGATIVE_SIGNALS: Record<string, number> = {
  // Strong negative signals (ignore these folders)
  '__MACOSX': -100,
  'Source': -80,
  'source-for-web-designers': -80,
  'Event Doc': -70,
  'Event_Doc': -70,
  'PSD': -60,
  'psd': -60,
  'license': -50,
  'License': -50,
  
  // Medium negative signals
  'node_modules': -40,
  '.git': -40,
  
  // Weak negative signals (design files)
  'has_psd_files': -20,
  'has_ai_files': -20,
  'has_sketch_files': -20,
};

// ============================================================================
// MAIN DETECTOR CLASS
// ============================================================================

export class RootDetector {
  private fileIndex: ZipFileIndex;
  private directories: string[];
  private scores: Map<string, RootScoreEntry>;

  constructor(fileIndex: ZipFileIndex) {
    this.fileIndex = fileIndex;
    this.directories = this.extractDirectories();
    this.scores = new Map();
  }

  /**
   * Detect the site root folder
   * 
   * @returns Detection result with root path and confidence
   */
  detect(): RootDetectionResult {
    console.log('[RootDetector] Starting root detection...');
    console.log('[RootDetector] Total directories:', this.directories.length);
    console.log('[RootDetector] HTML files:', this.fileIndex.htmlFiles.length);

    // Step 1: Find all potential roots (folders containing index.html)
    const potentialRoots = this.findPotentialRoots();
    console.log('[RootDetector] Potential roots:', potentialRoots);

    // Step 2: Score each potential root
    for (const root of potentialRoots) {
      this.scoreRoot(root);
    }

    // Step 3: Also check the ZIP root (empty string)
    this.scoreRoot('');

    // Step 4: Find the highest scoring root
    const sortedScores = Array.from(this.scores.entries())
      .sort((a, b) => b[1].score - a[1].score);

    console.log('[RootDetector] Scores:', sortedScores.map(([path, entry]) => ({
      path: path || '(root)',
      score: entry.score,
      signals: entry.signals.length,
    })));

    // Get the best result
    const best = sortedScores[0];
    if (!best) {
      // Fallback to empty root
      return this.createResult('', 0);
    }

    return this.createResult(best[0], best[1].score);
  }

  /**
   * Find all folders containing index.html
   */
  private findPotentialRoots(): string[] {
    const roots = new Set<string>();

    for (const htmlFile of this.fileIndex.htmlFiles) {
      // Check if this is an index file
      if (htmlFile.name.toLowerCase() === 'index.html' || 
          htmlFile.name.toLowerCase() === 'index.htm') {
        roots.add(htmlFile.directory);
      }
    }

    // Also add parent directories of index files
    for (const root of roots) {
      const parts = root.split('/');
      while (parts.length > 0) {
        parts.pop();
        const parent = parts.join('/');
        if (parent && !roots.has(parent)) {
          // Check if parent has index.html
          const parentIndex = this.fileIndex.htmlFiles.find(
            f => f.directory === parent && 
                 (f.name.toLowerCase() === 'index.html' || 
                  f.name.toLowerCase() === 'index.htm')
          );
          if (parentIndex) {
            roots.add(parent);
          }
        }
      }
    }

    return Array.from(roots);
  }

  /**
   * Score a potential root folder
   */
  private scoreRoot(rootPath: string): void {
    const signals: RootSignal[] = [];
    let totalScore = 0;

    // Check for index.html
    const hasIndex = this.hasFileInFolder(rootPath, 'index.html') ||
                     this.hasFileInFolder(rootPath, 'index.htm');
    if (hasIndex) {
      const signal = { type: 'positive' as const, pattern: 'has_index_html', score: POSITIVE_SIGNALS['has_index_html'] };
      signals.push(signal);
      totalScore += signal.score;
    }

    // Check for common folders
    const foldersToCheck = [
      { name: 'css', signal: 'has_css_folder' },
      { name: 'js', signal: 'has_js_folder' },
      { name: 'images', signal: 'has_images_folder' },
      { name: 'img', signal: 'has_img_folder' },
      { name: 'assets', signal: 'has_assets_folder' },
      { name: 'fonts', signal: 'has_fonts_folder' },
      { name: 'vendor', signal: 'has_vendor_folder' },
      { name: 'fontawesome', signal: 'has_fontawesome_folder' },
    ];

    for (const { name, signal } of foldersToCheck) {
      if (this.hasFolderInRoot(rootPath, name)) {
        const score = POSITIVE_SIGNALS[signal] || 5;
        signals.push({ type: 'positive', pattern: signal, score });
        totalScore += score;
      }
    }

    // Check for other HTML files (about.html, contact.html, etc.)
    const otherHtmlCount = this.countOtherHtmlFiles(rootPath);
    if (otherHtmlCount > 0) {
      const score = POSITIVE_SIGNALS['has_other_html'] * Math.min(otherHtmlCount, 5);
      signals.push({ type: 'positive', pattern: 'has_other_html', score });
      totalScore += score;
    }

    // Check for nested structure (assets/css/, assets/js/)
    if (this.hasNestedFolder(rootPath, 'assets/css') || 
        this.hasNestedFolder(rootPath, 'assets/images')) {
      const signal = { type: 'positive' as const, pattern: 'has_nested_css', score: POSITIVE_SIGNALS['has_nested_css'] };
      signals.push(signal);
      totalScore += signal.score;
    }

    // Apply negative signals
    for (const [pattern, score] of Object.entries(NEGATIVE_SIGNALS)) {
      // Check if this root is inside an ignored folder
      if (rootPath.includes(pattern) || rootPath.startsWith(pattern)) {
        signals.push({ type: 'negative', pattern, score });
        totalScore += score;
      }
    }

    // Check for design files in root (negative signal)
    if (this.hasFileType(rootPath, '.psd')) {
      const signal = { type: 'negative' as const, pattern: 'has_psd_files', score: NEGATIVE_SIGNALS['has_psd_files'] };
      signals.push(signal);
      totalScore += signal.score;
    }

    // Bonus: If root is empty string (actual ZIP root) and has good structure
    if (rootPath === '' && hasIndex) {
      totalScore += 10; // Small bonus for being at ZIP root
    }

    // Store the score
    this.scores.set(rootPath, {
      folder: rootPath,
      score: totalScore,
      signals,
    });
  }

  /**
   * Check if a file exists directly in a folder
   */
  private hasFileInFolder(folder: string, filename: string): boolean {
    for (const entry of this.fileIndex.entries.values()) {
      if (entry.directory === folder && 
          entry.name.toLowerCase() === filename.toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a subfolder exists directly under a root
   */
  private hasFolderInRoot(rootPath: string, folderName: string): boolean {
    const targetPath = rootPath ? `${rootPath}/${folderName}` : folderName;
    
    for (const entry of this.fileIndex.entries.values()) {
      if (entry.directory === targetPath || 
          entry.directory.startsWith(targetPath + '/')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a nested folder path exists
   */
  private hasNestedFolder(rootPath: string, nestedPath: string): boolean {
    const targetPath = rootPath ? `${rootPath}/${nestedPath}` : nestedPath;
    
    for (const entry of this.fileIndex.entries.values()) {
      if (entry.directory === targetPath || 
          entry.directory.startsWith(targetPath + '/')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Count HTML files (excluding index) in a folder
   */
  private countOtherHtmlFiles(rootPath: string): number {
    let count = 0;
    for (const htmlFile of this.fileIndex.htmlFiles) {
      if (htmlFile.directory === rootPath && 
          htmlFile.name.toLowerCase() !== 'index.html' &&
          htmlFile.name.toLowerCase() !== 'index.htm') {
        count++;
      }
    }
    return count;
  }

  /**
   * Check if folder contains files of a specific type
   */
  private hasFileType(rootPath: string, extension: string): boolean {
    for (const entry of this.fileIndex.entries.values()) {
      if (entry.directory === rootPath && 
          entry.extension === extension.replace('.', '')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Extract all unique directories from the file index
   */
  private extractDirectories(): string[] {
    const directories = new Set<string>();
    
    for (const entry of this.fileIndex.entries.values()) {
      if (entry.directory) {
        // Add all parent directories
        const parts = entry.directory.split('/');
        let current = '';
        for (const part of parts) {
          current = current ? `${current}/${part}` : part;
          directories.add(current);
        }
      }
    }

    return Array.from(directories);
  }

  /**
   * Determine the folder structure type
   */
  private detectStructureType(rootPath: string): FolderStructureType {
    const hasAssetsFolder = this.hasFolderInRoot(rootPath, 'assets');
    const hasCssFolder = this.hasFolderInRoot(rootPath, 'css');
    const hasJsFolder = this.hasFolderInRoot(rootPath, 'js');
    const hasVendorFolder = this.hasFolderInRoot(rootPath, 'vendor');
    
    // Check if CSS/JS are at root level (flat structure)
    const hasCssAtRoot = this.fileIndex.cssFiles.some(f => f.directory === rootPath);
    const hasJsAtRoot = this.fileIndex.jsFiles.some(f => f.directory === rootPath);

    // Detect structure type
    if (rootPath && rootPath !== '') {
      // Check if this is a nested structure (upload/, dist/, etc.)
      const rootParts = rootPath.split('/');
      if (rootParts.length > 0 && !IGNORE_FOLDERS.includes(rootParts[0] as typeof IGNORE_FOLDERS[number])) {
        // This is a nested root (like space-science/upload/)
        if (hasAssetsFolder || (hasCssFolder && hasJsFolder)) {
          return 'nested';
        }
      }
    }

    if (hasCssAtRoot && hasJsAtRoot) {
      return 'flat';
    }

    if (hasVendorFolder) {
      return 'vendor';
    }

    if (hasAssetsFolder) {
      return 'assets';
    }

    if (hasCssFolder || hasJsFolder) {
      return 'traditional';
    }

    return 'mixed';
  }

  /**
   * Create the final detection result
   */
  private createResult(rootPath: string, score: number): RootDetectionResult {
    const structureType = this.detectStructureType(rootPath);
    
    // Find the index.html path
    let indexHtmlPath = rootPath ? `${rootPath}/index.html` : 'index.html';
    const indexFile = this.fileIndex.htmlFiles.find(
      f => f.directory === rootPath && 
           (f.name.toLowerCase() === 'index.html' || f.name.toLowerCase() === 'index.htm')
    );
    if (indexFile) {
      indexHtmlPath = indexFile.path;
    }

    // Collect found patterns
    const foundPatterns: string[] = [];
    const scoreEntry = this.scores.get(rootPath);
    if (scoreEntry) {
      for (const signal of scoreEntry.signals) {
        if (signal.type === 'positive') {
          foundPatterns.push(signal.pattern);
        }
      }
    }

    // Collect ignored folders
    const ignoredFolders: string[] = [];
    for (const dir of this.directories) {
      for (const ignored of IGNORE_FOLDERS) {
        if (dir.includes(ignored)) {
          ignoredFolders.push(dir);
          break;
        }
      }
    }

    // Calculate confidence (0-100)
    const maxPossibleScore = 
      POSITIVE_SIGNALS['has_index_html'] +
      POSITIVE_SIGNALS['has_css_folder'] +
      POSITIVE_SIGNALS['has_js_folder'] +
      POSITIVE_SIGNALS['has_images_folder'] +
      POSITIVE_SIGNALS['has_assets_folder'] +
      POSITIVE_SIGNALS['has_other_html'] * 5;
    
    const confidence = Math.min(100, Math.max(0, Math.round((score / maxPossibleScore) * 100)));

    const result: RootDetectionResult = {
      rootPath,
      confidence,
      structureType,
      indexHtmlPath,
      foundPatterns,
      ignoredFolders: [...new Set(ignoredFolders)],
    };

    console.log('[RootDetector] Final result:', {
      rootPath: rootPath || '(ZIP root)',
      confidence,
      structureType,
      indexHtmlPath,
      foundPatterns: foundPatterns.length,
      ignoredFolders: ignoredFolders.length,
    });

    return result;
  }

  /**
   * Get detailed scores for debugging
   */
  getScores(): Map<string, RootScoreEntry> {
    return this.scores;
  }

  /**
   * Get files relative to detected root
   */
  getRelativePath(absolutePath: string, rootPath: string): string {
    if (!rootPath) return absolutePath;
    if (absolutePath.startsWith(rootPath + '/')) {
      return absolutePath.slice(rootPath.length + 1);
    }
    return absolutePath;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick root detection without full scoring
 */
export function quickDetectRoot(fileIndex: ZipFileIndex): string {
  // Find index.html files
  const indexFiles = fileIndex.htmlFiles.filter(
    f => f.name.toLowerCase() === 'index.html' || f.name.toLowerCase() === 'index.htm'
  );

  if (indexFiles.length === 0) {
    return '';
  }

  // If only one index.html, use its directory
  if (indexFiles.length === 1) {
    return indexFiles[0].directory;
  }

  // Multiple index files - prefer the one NOT in ignored folders
  for (const indexFile of indexFiles) {
    let isIgnored = false;
    for (const ignored of IGNORE_FOLDERS) {
      if (indexFile.path.includes(ignored)) {
        isIgnored = true;
        break;
      }
    }
    if (!isIgnored) {
      return indexFile.directory;
    }
  }

  // Fallback to first non-ignored
  return indexFiles[0].directory;
}

/**
 * Check if a path is inside the detected root
 */
export function isInsideRoot(path: string, rootPath: string): boolean {
  if (!rootPath) return true;
  return path.startsWith(rootPath + '/') || path === rootPath;
}

/**
 * Normalize path relative to root
 */
export function normalizeToRoot(path: string, rootPath: string): string {
  if (!rootPath) return path;
  if (path.startsWith(rootPath + '/')) {
    return path.slice(rootPath.length + 1);
  }
  return path;
}
