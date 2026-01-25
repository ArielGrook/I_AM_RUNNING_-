/**
 * Asset Converter Module
 * 
 * Converts images and fonts to base64 data URLs for embedding.
 * Uses parallel processing for better performance.
 * Handles various image and font formats found in templates.
 * 
 * @version 2.0.0
 */

import {
  ZipFileEntry,
  ZipFileIndex,
  AssetV2,
  AssetType,
  AssetConversionResult,
  AssetConversionOptions,
  ImportWarning,
  ProgressCallback,
} from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONSTANTS
// ============================================================================

const MIME_TYPES: Record<string, string> = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  
  // Fonts
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
  
  // Video
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'video/ogg',
  
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'];
const FONT_EXTENSIONS = ['woff', 'woff2', 'ttf', 'otf', 'eot'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'aac'];

// Default limits
const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB per image
const DEFAULT_MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

// ============================================================================
// MAIN CONVERTER CLASS
// ============================================================================

export class AssetConverter {
  private options: AssetConversionOptions;
  private warnings: ImportWarning[] = [];
  private convertedAssets: AssetV2[] = [];
  private replacementMap: Map<string, string> = new Map();
  
  constructor(options: AssetConversionOptions = {}) {
    this.options = {
      maxImageSize: DEFAULT_MAX_IMAGE_SIZE,
      compressionQuality: 0.85,
      skipLargeImages: true,
      convertSvgToDataUrl: true,
      ...options,
    };
  }

  /**
   * Convert all assets from the file index
   * 
   * @param fileIndex - ZIP file index
   * @param rootPath - Detected site root path
   * @param onProgress - Progress callback
   * @returns Conversion result with assets and replacement map
   */
  async convertAll(
    fileIndex: ZipFileIndex,
    rootPath: string = '',
    onProgress?: ProgressCallback
  ): Promise<AssetConversionResult> {
    console.log('[AssetConverter] Starting asset conversion...');
    console.log('[AssetConverter] Images:', fileIndex.imageFiles.length);
    console.log('[AssetConverter] Fonts:', fileIndex.fontFiles.length);
    
    const startTime = Date.now();
    this.convertedAssets = [];
    this.replacementMap = new Map();
    this.warnings = [];
    
    let totalSize = 0;
    let convertedCount = 0;
    let skippedCount = 0;

    // Filter files that are within the root path
    const imagesToConvert = fileIndex.imageFiles.filter(f => 
      this.isInRoot(f.path, rootPath)
    );
    const fontsToConvert = fileIndex.fontFiles.filter(f => 
      this.isInRoot(f.path, rootPath)
    );

    const totalFiles = imagesToConvert.length + fontsToConvert.length;
    console.log('[AssetConverter] Files to convert:', totalFiles);

    // Process images with parallel batching
    const BATCH_SIZE = 5;
    let processed = 0;

    // Process images in batches
    for (let i = 0; i < imagesToConvert.length; i += BATCH_SIZE) {
      const batch = imagesToConvert.slice(i, i + BATCH_SIZE);
      
      onProgress?.({
        stage: 'assets',
        progress: 40 + Math.round((processed / totalFiles) * 25),
        message: `Converting images... (${processed}/${totalFiles})`,
        currentFile: batch[0]?.name,
        totalFiles,
        processedFiles: processed,
      });

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(file => this.convertAsset(file, rootPath, 'image'))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled' && result.value) {
          this.convertedAssets.push(result.value.asset);
          this.replacementMap.set(result.value.originalPath, result.value.dataUrl);
          totalSize += result.value.asset.size;
          convertedCount++;
        } else if (result.status === 'rejected') {
          skippedCount++;
          this.warnings.push({
            type: 'warning',
            message: `Failed to convert image: ${batch[j].name}`,
            file: batch[j].path,
          });
        }
        processed++;
      }
    }

    // Process fonts
    for (let i = 0; i < fontsToConvert.length; i += BATCH_SIZE) {
      const batch = fontsToConvert.slice(i, i + BATCH_SIZE);
      
      onProgress?.({
        stage: 'assets',
        progress: 40 + Math.round((processed / totalFiles) * 25),
        message: `Converting fonts... (${processed}/${totalFiles})`,
        currentFile: batch[0]?.name,
        totalFiles,
        processedFiles: processed,
      });

      const results = await Promise.allSettled(
        batch.map(file => this.convertAsset(file, rootPath, 'font'))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled' && result.value) {
          this.convertedAssets.push(result.value.asset);
          this.replacementMap.set(result.value.originalPath, result.value.dataUrl);
          totalSize += result.value.asset.size;
          convertedCount++;
        } else if (result.status === 'rejected') {
          skippedCount++;
          this.warnings.push({
            type: 'warning',
            message: `Failed to convert font: ${batch[j].name}`,
            file: batch[j].path,
          });
        }
        processed++;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[AssetConverter] Conversion complete in ${elapsed}ms:`, {
      converted: convertedCount,
      skipped: skippedCount,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
    });

    return {
      assets: this.convertedAssets,
      replacementMap: this.replacementMap,
      totalSize,
      convertedCount,
      skippedCount,
      compressionSavings: 0, // TODO: Implement compression savings calculation
    };
  }

  /**
   * Convert a single asset to base64
   */
  private async convertAsset(
    file: ZipFileEntry,
    rootPath: string,
    assetType: AssetType
  ): Promise<{ asset: AssetV2; originalPath: string; dataUrl: string } | null> {
    try {
      // Get blob data
      const blob = await file.getBlob();
      const size = blob.size;

      // Check size limit for images
      if (assetType === 'image' && this.options.maxImageSize && size > this.options.maxImageSize) {
        if (this.options.skipLargeImages) {
          this.warnings.push({
            type: 'warning',
            message: `Skipping large image (${(size / 1024 / 1024).toFixed(2)}MB): ${file.name}`,
            file: file.path,
            suggestion: 'Consider optimizing this image before import.',
          });
          return null;
        }
      }

      // Convert to base64
      const dataUrl = await this.blobToDataUrl(blob, file.extension);

      // Get relative path from root
      const relativePath = this.getRelativePath(file.path, rootPath);

      const asset: AssetV2 = {
        id: uuidv4(),
        filename: file.name,
        originalPath: file.path,
        type: assetType,
        mimeType: MIME_TYPES[file.extension] || 'application/octet-stream',
        data: dataUrl,
        size,
      };

      return {
        asset,
        originalPath: relativePath,
        dataUrl,
      };
    } catch (error) {
      console.warn(`[AssetConverter] Error converting ${file.path}:`, error);
      throw error;
    }
  }

  /**
   * Convert blob to base64 data URL
   */
  private blobToDataUrl(blob: Blob, extension: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        
        // Ensure correct MIME type in data URL
        const mimeType = MIME_TYPES[extension] || blob.type || 'application/octet-stream';
        
        // Check if the result already has the correct format
        if (result.startsWith(`data:${mimeType}`)) {
          resolve(result);
        } else {
          // Extract base64 content and rebuild with correct MIME
          const base64Match = result.match(/base64,(.+)$/);
          if (base64Match) {
            resolve(`data:${mimeType};base64,${base64Match[1]}`);
          } else {
            resolve(result);
          }
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file as data URL'));
      };
      
      reader.readAsDataURL(blob);
    });
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
   * Get warnings generated during conversion
   */
  getWarnings(): ImportWarning[] {
    return this.warnings;
  }

  /**
   * Get the replacement map for use in HTML processing
   */
  getReplacementMap(): Map<string, string> {
    return this.replacementMap;
  }

  /**
   * Replace asset paths in HTML/CSS content
   */
  replaceAssetPaths(content: string, replacementMap?: Map<string, string>): string {
    const map = replacementMap || this.replacementMap;
    let result = content;

    for (const [originalPath, dataUrl] of map) {
      // Build various path patterns that might be used
      const patterns = this.buildPathPatterns(originalPath);
      
      for (const pattern of patterns) {
        // Replace in src attributes
        result = result.replace(
          new RegExp(`(src\\s*=\\s*["'])${this.escapeRegex(pattern)}(["'])`, 'gi'),
          `$1${dataUrl}$2`
        );
        
        // Replace in href attributes
        result = result.replace(
          new RegExp(`(href\\s*=\\s*["'])${this.escapeRegex(pattern)}(["'])`, 'gi'),
          `$1${dataUrl}$2`
        );
        
        // Replace in url() in CSS
        result = result.replace(
          new RegExp(`(url\\s*\\(\\s*["']?)${this.escapeRegex(pattern)}(["']?\\s*\\))`, 'gi'),
          `$1${dataUrl}$2`
        );
        
        // Replace in srcset
        result = result.replace(
          new RegExp(`(srcset\\s*=\\s*["'][^"']*?)${this.escapeRegex(pattern)}`, 'gi'),
          `$1${dataUrl}`
        );
      }
    }

    return result;
  }

  /**
   * Build various path patterns for an asset
   */
  private buildPathPatterns(originalPath: string): string[] {
    const patterns: string[] = [originalPath];
    
    // Add variant with ./ prefix
    if (!originalPath.startsWith('./')) {
      patterns.push('./' + originalPath);
    }
    
    // Add variant without ./ prefix
    if (originalPath.startsWith('./')) {
      patterns.push(originalPath.slice(2));
    }
    
    // Add variant with ../ handling
    const parts = originalPath.split('/');
    if (parts.length > 1) {
      // Just the filename
      patterns.push(parts[parts.length - 1]);
      
      // Last two parts
      if (parts.length > 2) {
        patterns.push(parts.slice(-2).join('/'));
      }
    }

    return patterns;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get asset type from extension
   */
  static getAssetType(extension: string): AssetType {
    if (IMAGE_EXTENSIONS.includes(extension)) return 'image';
    if (FONT_EXTENSIONS.includes(extension)) return 'font';
    if (VIDEO_EXTENSIONS.includes(extension)) return 'video';
    if (AUDIO_EXTENSIONS.includes(extension)) return 'audio';
    return 'other';
  }

  /**
   * Get MIME type from extension
   */
  static getMimeType(extension: string): string {
    return MIME_TYPES[extension] || 'application/octet-stream';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate total size of assets
 */
export function calculateAssetSize(assets: AssetV2[]): number {
  return assets.reduce((sum, asset) => sum + asset.size, 0);
}

/**
 * Filter assets by type
 */
export function filterAssetsByType(
  assets: AssetV2[],
  type: AssetType
): AssetV2[] {
  return assets.filter(asset => asset.type === type);
}

/**
 * Create a quick replacement map from asset paths
 */
export function createQuickReplacementMap(
  assets: AssetV2[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const asset of assets) {
    map.set(asset.originalPath, asset.data);
  }
  return map;
}

/**
 * Check if an extension is a supported image format
 */
export function isSupportedImage(extension: string): boolean {
  return IMAGE_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Check if an extension is a supported font format
 */
export function isSupportedFont(extension: string): boolean {
  return FONT_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Convert a single file to base64 (standalone utility)
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from data URL
 */
export async function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
