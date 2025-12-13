/**
 * ZIP Parser Types
 * 
 * Type definitions for ZIP parsing with progress tracking.
 * 
 * Stage 2 Module 4: ZIP-Parser Core enhancements
 */

export interface ParseProgress {
  stage: 'loading' | 'parsing' | 'processing' | 'complete';
  progress: number; // 0-100
  message: string;
  currentFile?: string;
  totalFiles?: number;
  processedFiles?: number;
}

export type ProgressCallback = (progress: ParseProgress) => void;

export interface ParseOptions {
  maxSize?: number; // Maximum file size in bytes (default: 50MB)
  onProgress?: ProgressCallback;
  clearCanvas?: () => void | Promise<void>; // Callback to clear canvas before import
}

export interface ParseResult {
  project: import('@/lib/types/project').Project;
  metadata: {
    originalFileName: string;
    fileSize: number;
    pagesCount: number;
    componentsCount: number;
    processingTime: number; // milliseconds
  };
}

export class ZipParseError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_FORMAT' | 'SIZE_EXCEEDED' | 'CORRUPTED' | 'UNSUPPORTED' | 'UNKNOWN',
    public details?: unknown
  ) {
    super(message);
    this.name = 'ZipParseError';
  }
}








