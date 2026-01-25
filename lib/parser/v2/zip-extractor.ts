/**
 * ZIP Extractor Module
 * 
 * Handles ZIP file reading and builds a file index for further processing.
 * Supports streaming and lazy content loading for performance.
 * 
 * @version 2.0.0
 */

import JSZip from 'jszip';
import {
  ZipFileEntry,
  ZipFileIndex,
  ParserError,
  ProgressCallback,
  IGNORE_FOLDERS,
  IGNORE_EXTENSIONS,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'];
const FONT_EXTENSIONS = ['woff', 'woff2', 'ttf', 'otf', 'eot', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'aac'];

// ============================================================================
// MAIN EXTRACTOR CLASS
// ============================================================================

export class ZipExtractor {
  private zip: JSZip | null = null;
  private fileIndex: ZipFileIndex | null = null;

  /**
   * Load and extract a ZIP file
   * 
   * @param file - ZIP file as File, Blob, or ArrayBuffer
   * @param onProgress - Optional progress callback
   * @returns File index with categorized entries
   */
  async extract(
    file: File | Blob | ArrayBuffer,
    onProgress?: ProgressCallback
  ): Promise<ZipFileIndex> {
    const startTime = Date.now();

    // Report start
    onProgress?.({
      stage: 'reading',
      progress: 0,
      message: 'Reading ZIP file...',
    });

    // Load ZIP file
    try {
      this.zip = new JSZip();
      await this.zip.loadAsync(file);
    } catch (error) {
      throw new ParserError(
        'Failed to read ZIP file. The file may be corrupted or not a valid ZIP.',
        'INVALID_ZIP',
        error
      );
    }

    onProgress?.({
      stage: 'reading',
      progress: 30,
      message: 'Building file index...',
    });

    // Build file index
    const entries = new Map<string, ZipFileEntry>();
    const htmlFiles: ZipFileEntry[] = [];
    const cssFiles: ZipFileEntry[] = [];
    const jsFiles: ZipFileEntry[] = [];
    const imageFiles: ZipFileEntry[] = [];
    const fontFiles: ZipFileEntry[] = [];
    const otherFiles: ZipFileEntry[] = [];

    let totalSize = 0;
    let totalFiles = 0;

    // Get all file entries
    const zipEntries = Object.entries(this.zip.files);
    const totalEntries = zipEntries.length;

    for (let i = 0; i < zipEntries.length; i++) {
      const [path, zipEntry] = zipEntries[i];

      // Skip directories
      if (zipEntry.dir) continue;

      // Check if should be ignored
      if (this.shouldIgnore(path)) {
        continue;
      }

      // Extract file info
      const name = this.getFileName(path);
      const extension = this.getExtension(name);
      const directory = this.getDirectory(path);

      // Create file entry with lazy loading
      const entry: ZipFileEntry = {
        path,
        name,
        extension,
        directory,
        size: 0, // Will be populated when content is loaded
        isDirectory: false,
        getContent: async () => {
          const content = await zipEntry.async('string');
          entry.size = new Blob([content]).size;
          return content;
        },
        getBlob: async () => {
          const blob = await zipEntry.async('blob');
          entry.size = blob.size;
          return blob;
        },
        getArrayBuffer: async () => {
          const buffer = await zipEntry.async('arraybuffer');
          entry.size = buffer.byteLength;
          return buffer;
        },
      };

      // Categorize by type
      entries.set(path, entry);
      totalFiles++;

      if (extension === 'html' || extension === 'htm') {
        htmlFiles.push(entry);
      } else if (extension === 'css') {
        cssFiles.push(entry);
      } else if (extension === 'js') {
        jsFiles.push(entry);
      } else if (IMAGE_EXTENSIONS.includes(extension)) {
        imageFiles.push(entry);
      } else if (FONT_EXTENSIONS.includes(extension)) {
        fontFiles.push(entry);
      } else {
        otherFiles.push(entry);
      }

      // Report progress
      if (i % 10 === 0) {
        onProgress?.({
          stage: 'reading',
          progress: 30 + Math.round((i / totalEntries) * 60),
          message: `Indexing files... (${i + 1}/${totalEntries})`,
          currentFile: name,
          totalFiles: totalEntries,
          processedFiles: i + 1,
        });
      }
    }

    onProgress?.({
      stage: 'reading',
      progress: 95,
      message: 'Finalizing index...',
    });

    // Create file index (root detection will be done separately)
    this.fileIndex = {
      entries,
      htmlFiles,
      cssFiles,
      jsFiles,
      imageFiles,
      fontFiles,
      otherFiles,
      totalSize,
      totalFiles,
      detectedRoot: '', // Will be set by root-detector
      rootScore: 0,
    };

    const elapsed = Date.now() - startTime;
    console.log(`[ZipExtractor] Indexed ${totalFiles} files in ${elapsed}ms`);
    console.log(`[ZipExtractor] Categories:`, {
      html: htmlFiles.length,
      css: cssFiles.length,
      js: jsFiles.length,
      images: imageFiles.length,
      fonts: fontFiles.length,
      other: otherFiles.length,
    });

    onProgress?.({
      stage: 'reading',
      progress: 100,
      message: `Found ${totalFiles} files`,
      totalFiles,
      processedFiles: totalFiles,
      elapsed,
    });

    return this.fileIndex;
  }

  /**
   * Get the current file index
   */
  getIndex(): ZipFileIndex | null {
    return this.fileIndex;
  }

  /**
   * Get file content by path
   */
  async getFileContent(path: string): Promise<string | null> {
    const entry = this.fileIndex?.entries.get(path);
    if (!entry) return null;
    return entry.getContent();
  }

  /**
   * Get file as blob by path
   */
  async getFileBlob(path: string): Promise<Blob | null> {
    const entry = this.fileIndex?.entries.get(path);
    if (!entry) return null;
    return entry.getBlob();
  }

  /**
   * Check if file path should be ignored
   */
  private shouldIgnore(path: string): boolean {
    // Check ignored folders
    for (const folder of IGNORE_FOLDERS) {
      if (path.includes(`/${folder}/`) || path.startsWith(`${folder}/`)) {
        return true;
      }
    }

    // Check ignored extensions
    const ext = '.' + this.getExtension(path);
    if (IGNORE_EXTENSIONS.includes(ext as typeof IGNORE_EXTENSIONS[number])) {
      return true;
    }

    // Check for hidden files
    const name = this.getFileName(path);
    if (name.startsWith('.')) {
      return true;
    }

    return false;
  }

  /**
   * Extract filename from path
   */
  private getFileName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
  }

  /**
   * Extract file extension (lowercase)
   */
  private getExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Extract directory from path
   */
  private getDirectory(path: string): string {
    const parts = path.split('/');
    parts.pop(); // Remove filename
    return parts.join('/');
  }

  /**
   * Get all files in a specific directory
   */
  getFilesInDirectory(directory: string): ZipFileEntry[] {
    if (!this.fileIndex) return [];

    const files: ZipFileEntry[] = [];
    for (const [path, entry] of this.fileIndex.entries) {
      if (entry.directory === directory || entry.directory.startsWith(directory + '/')) {
        files.push(entry);
      }
    }
    return files;
  }

  /**
   * Get all directories in the ZIP
   */
  getDirectories(): string[] {
    if (!this.fileIndex) return [];

    const directories = new Set<string>();
    for (const [, entry] of this.fileIndex.entries) {
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
    return Array.from(directories).sort();
  }

  /**
   * Find files matching a pattern
   */
  findFiles(pattern: RegExp | string): ZipFileEntry[] {
    if (!this.fileIndex) return [];

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const files: ZipFileEntry[] = [];

    for (const [path, entry] of this.fileIndex.entries) {
      if (regex.test(path)) {
        files.push(entry);
      }
    }
    return files;
  }

  /**
   * Calculate total size of specific file types
   */
  async calculateTotalSize(fileTypes?: ('html' | 'css' | 'js' | 'images' | 'fonts' | 'other')[]): Promise<number> {
    if (!this.fileIndex) return 0;

    let files: ZipFileEntry[] = [];

    if (!fileTypes) {
      files = Array.from(this.fileIndex.entries.values());
    } else {
      for (const type of fileTypes) {
        switch (type) {
          case 'html':
            files.push(...this.fileIndex.htmlFiles);
            break;
          case 'css':
            files.push(...this.fileIndex.cssFiles);
            break;
          case 'js':
            files.push(...this.fileIndex.jsFiles);
            break;
          case 'images':
            files.push(...this.fileIndex.imageFiles);
            break;
          case 'fonts':
            files.push(...this.fileIndex.fontFiles);
            break;
          case 'other':
            files.push(...this.fileIndex.otherFiles);
            break;
        }
      }
    }

    let totalSize = 0;
    for (const file of files) {
      const blob = await file.getBlob();
      totalSize += blob.size;
    }

    return totalSize;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.zip = null;
    this.fileIndex = null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick check if a file is a valid ZIP
 */
export async function isValidZip(file: File | Blob | ArrayBuffer): Promise<boolean> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get ZIP file info without full extraction
 */
export async function getZipInfo(file: File | Blob | ArrayBuffer): Promise<{
  fileCount: number;
  hasHtml: boolean;
  hasCss: boolean;
  hasImages: boolean;
  topLevelFolders: string[];
}> {
  const zip = new JSZip();
  await zip.loadAsync(file);

  let fileCount = 0;
  let hasHtml = false;
  let hasCss = false;
  let hasImages = false;
  const topLevelFolders = new Set<string>();

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    fileCount++;

    const ext = path.split('.').pop()?.toLowerCase() || '';
    if (ext === 'html' || ext === 'htm') hasHtml = true;
    if (ext === 'css') hasCss = true;
    if (IMAGE_EXTENSIONS.includes(ext)) hasImages = true;

    // Get top-level folder
    const parts = path.split('/');
    if (parts.length > 1 && parts[0]) {
      topLevelFolders.add(parts[0]);
    }
  }

  return {
    fileCount,
    hasHtml,
    hasCss,
    hasImages,
    topLevelFolders: Array.from(topLevelFolders),
  };
}

/**
 * Create a file entry for testing/mocking
 */
export function createMockFileEntry(
  path: string,
  content: string
): ZipFileEntry {
  const name = path.split('/').pop() || '';
  const extension = name.split('.').pop()?.toLowerCase() || '';
  const directory = path.split('/').slice(0, -1).join('/');
  const size = new Blob([content]).size;

  return {
    path,
    name,
    extension,
    directory,
    size,
    isDirectory: false,
    getContent: async () => content,
    getBlob: async () => new Blob([content]),
    getArrayBuffer: async () => new TextEncoder().encode(content).buffer,
  };
}
