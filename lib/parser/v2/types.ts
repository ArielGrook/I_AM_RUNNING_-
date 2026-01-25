/**
 * Parser V2 Types
 * 
 * Complete type definitions for the new modular ZIP parser system.
 * Designed for future backend block integration.
 * 
 * @version 2.0.0
 */

// ============================================================================
// PROJECT STRUCTURE
// ============================================================================

export interface ProjectV2 {
  version: '2.0';
  id: string;
  name: string;
  
  // FRONTEND (populated during import)
  pages: PageV2[];
  globalStyles: string;      // @keyframes, @media, @font-face - non-inlineable CSS
  globalScripts: string[];   // CDN links, library scripts
  assets: AssetV2[];         // images, fonts in base64
  
  // BACKEND (empty arrays now, ready for future)
  backendBlocks: BackendBlock[];
  backendTriggers: Trigger[];
  environment: EnvironmentVar[];
  
  // SETTINGS
  settings: ProjectSettings;
  
  // METADATA
  createdAt: string;
  updatedAt: string;
  importMetadata?: ImportMetadata;
}

export interface PageV2 {
  id: string;
  name: string;           // Display name: 'About Us', 'Contact'
  slug: string;           // URL slug: 'about-us', 'contact'
  originalFile: string;   // Original filename: 'about.html'
  
  // CONTENT
  html: string;           // Processed HTML with inline styles
  css: string;            // Page-specific CSS that couldn't be inlined
  
  // SCRIPTS (filtered by whitelist)
  scripts: ScriptReference[];
  
  // FUTURE
  animations: AnimationDefinition[];
  triggers: PageTrigger[];
  
  // META
  order: number;
  isHome: boolean;
  meta: PageMeta;
}

export interface AssetV2 {
  id: string;
  filename: string;
  originalPath: string;   // Path in ZIP: 'assets/images/logo.png'
  type: AssetType;
  mimeType: string;
  data: string;           // Base64 encoded
  size: number;           // Original size in bytes
}

export type AssetType = 'image' | 'font' | 'video' | 'audio' | 'other';

export interface ScriptReference {
  id: string;
  type: 'cdn' | 'local' | 'inline';
  src?: string;           // For CDN/local scripts
  content?: string;       // For inline scripts (sanitized)
  order: number;
}

export interface AnimationDefinition {
  name: string;
  keyframes: string;
  duration?: string;
  timing?: string;
}

export interface PageTrigger {
  id: string;
  elementSelector: string;
  event: string;
  action: string;
}

export interface PageMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface ProjectSettings {
  deployment?: {
    platform: 'vercel' | 'netlify' | null;
    url?: string;
  };
  domain?: string;
  language?: string;
  favicon?: string;
  theme?: ThemeSettings;
}

export interface ThemeSettings {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
}

// ============================================================================
// BACKEND BLOCKS (Future - empty for now)
// ============================================================================

export interface BackendBlock {
  id: string;
  type: 'auth' | 'database' | 'payment' | 'email' | 'api' | 'storage';
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface Trigger {
  id: string;
  frontendElement: string;
  event: string;
  backendBlock: string;
  action: string;
  params?: Record<string, unknown>;
}

export interface EnvironmentVar {
  key: string;
  value?: string;
  required: boolean;
  description?: string;
}

// ============================================================================
// IMPORT METADATA
// ============================================================================

export interface ImportMetadata {
  originalFileName: string;
  originalFileSize: number;
  importedAt: string;
  parserVersion: string;
  
  // Stats
  totalFiles: number;
  processedFiles: number;
  skippedFiles: SkippedFile[];
  warnings: ImportWarning[];
  
  // Timing
  processingTime: number;
  
  // Detected patterns
  detectedStructure: FolderStructureType;
  detectedRoot: string;
  
  // CSS stats
  cssStats: {
    totalRules: number;
    inlinedRules: number;
    globalRules: number;
    keyframesCount: number;
    mediaQueriesCount: number;
  };
}

export interface SkippedFile {
  path: string;
  reason: SkipReason;
  message?: string;
}

export type SkipReason = 
  | 'ignored_folder'    // __MACOSX, Source/, etc.
  | 'unsupported_type'  // .psd, .config, etc.
  | 'parse_error'       // Failed to parse
  | 'size_exceeded'     // File too large
  | 'security'          // Potential security issue
  | 'duplicate';        // Already processed

export interface ImportWarning {
  type: 'info' | 'warning' | 'error';
  message: string;
  file?: string;
  suggestion?: string;
}

// ============================================================================
// ZIP EXTRACTOR TYPES
// ============================================================================

export interface ZipFileEntry {
  path: string;           // Full path in ZIP: 'template/css/style.css'
  name: string;           // Filename: 'style.css'
  extension: string;      // Extension: 'css'
  directory: string;      // Directory: 'template/css'
  size: number;
  isDirectory: boolean;
  
  // Content (loaded lazily)
  getContent: () => Promise<string>;
  getBlob: () => Promise<Blob>;
  getArrayBuffer: () => Promise<ArrayBuffer>;
}

export interface ZipFileIndex {
  entries: Map<string, ZipFileEntry>;
  
  // Quick access by type
  htmlFiles: ZipFileEntry[];
  cssFiles: ZipFileEntry[];
  jsFiles: ZipFileEntry[];
  imageFiles: ZipFileEntry[];
  fontFiles: ZipFileEntry[];
  otherFiles: ZipFileEntry[];
  
  // Stats
  totalSize: number;
  totalFiles: number;
  
  // Root detection result
  detectedRoot: string;
  rootScore: number;
}

// ============================================================================
// ROOT DETECTOR TYPES
// ============================================================================

export type FolderStructureType = 
  | 'flat'              // CSS/JS at root
  | 'traditional'       // css/, js/, images/ folders
  | 'assets'            // assets/ subfolder
  | 'vendor'            // vendor/ with libraries
  | 'nested'            // Site in subfolder (upload/, dist/)
  | 'mixed';            // Combination of patterns

export interface RootDetectionResult {
  rootPath: string;           // Empty string for root, or 'upload/' etc.
  confidence: number;         // 0-100
  structureType: FolderStructureType;
  indexHtmlPath: string;      // Full path to main index.html
  
  // Found patterns
  foundPatterns: string[];
  ignoredFolders: string[];
}

export interface RootScoreEntry {
  folder: string;
  score: number;
  signals: RootSignal[];
}

export interface RootSignal {
  type: 'positive' | 'negative';
  pattern: string;
  score: number;
}

// ============================================================================
// CSS PROCESSOR TYPES
// ============================================================================

export interface CSSClassification {
  // Rules that can be inlined (simple selectors)
  inlineable: Map<string, CSSInlineRule>;
  
  // Rules that must stay global
  global: string;
  
  // Extracted @rules
  keyframes: Map<string, string>;
  mediaQueries: string[];
  fontFaces: string[];
  imports: string[];
  
  // Stats
  stats: {
    totalRules: number;
    inlineableCount: number;
    globalCount: number;
  };
}

export interface CSSInlineRule {
  selector: string;
  properties: Record<string, string>;
  specificity: number;
}

export interface CSSParseOptions {
  preserveVendorPrefixes?: boolean;
  minify?: boolean;
  resolveImports?: boolean;
}

// ============================================================================
// ASSET CONVERTER TYPES
// ============================================================================

export interface AssetConversionResult {
  assets: AssetV2[];
  replacementMap: Map<string, string>;  // originalPath → base64 data URL
  
  // Stats
  totalSize: number;
  convertedCount: number;
  skippedCount: number;
  compressionSavings: number;
}

export interface AssetConversionOptions {
  maxImageSize?: number;      // Max image file size before compression (bytes)
  compressionQuality?: number; // JPEG quality 0-1
  skipLargeImages?: boolean;
  convertSvgToDataUrl?: boolean;
}

// ============================================================================
// HTML PROCESSOR TYPES
// ============================================================================

export interface HTMLProcessingResult {
  html: string;               // Processed HTML
  extractedScripts: ScriptReference[];
  extractedMeta: PageMeta;
  usedAssets: string[];       // Asset paths used in this HTML
  warnings: ImportWarning[];
}

export interface HTMLProcessingOptions {
  inlineStyles: Map<string, CSSInlineRule>;
  assetReplacements: Map<string, string>;
  scriptWhitelist: string[];
  sanitize?: boolean;
}

// ============================================================================
// PROGRESS TRACKING TYPES
// ============================================================================

export type ParseStage = 
  | 'reading'       // Reading ZIP file
  | 'detecting'     // Detecting structure
  | 'classifying'   // Classifying files
  | 'css'           // Processing CSS
  | 'assets'        // Converting assets
  | 'html'          // Processing HTML
  | 'building'      // Building pages
  | 'finalizing'    // Saving to storage
  | 'complete';     // Done

export interface ParseProgress {
  stage: ParseStage;
  progress: number;       // 0-100
  message: string;
  
  // Optional details
  currentFile?: string;
  totalFiles?: number;
  processedFiles?: number;
  
  // Timing
  elapsed?: number;
  estimated?: number;
}

export type ProgressCallback = (progress: ParseProgress) => void;
export type WarningCallback = (warning: ImportWarning) => void;

// ============================================================================
// PARSER OPTIONS
// ============================================================================

export interface ParserOptions {
  // Callbacks
  onProgress?: ProgressCallback;
  onWarning?: WarningCallback;
  
  // Limits
  maxFileSize?: number;       // Max ZIP size (default: 50MB)
  maxImageSize?: number;      // Max single image (default: 5MB)
  maxTotalAssets?: number;    // Max total assets size (default: 20MB)
  
  // Behavior
  sanitizeHtml?: boolean;
  preserveComments?: boolean;
  extractInlineScripts?: boolean;
  
  // CSS options
  cssOptions?: CSSParseOptions;
  
  // Asset options
  assetOptions?: AssetConversionOptions;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ParseErrorCode = 
  | 'INVALID_ZIP'
  | 'SIZE_EXCEEDED'
  | 'NO_HTML_FOUND'
  | 'ROOT_DETECTION_FAILED'
  | 'CSS_PARSE_ERROR'
  | 'HTML_PARSE_ERROR'
  | 'ASSET_CONVERSION_ERROR'
  | 'STORAGE_ERROR'
  | 'UNKNOWN';

export class ParserError extends Error {
  constructor(
    message: string,
    public code: ParseErrorCode,
    public details?: unknown,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface StorageStrategy {
  localStorage: {
    projectMeta: ProjectMetaStorage;
    pageStructure: PageStructureStorage[];
    settings: ProjectSettings;
  };
  
  indexedDB: {
    assets: AssetV2[];
    largeContent: LargeContentStorage[];
  };
}

export interface ProjectMetaStorage {
  id: string;
  version: string;
  name: string;
  pageCount: number;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageStructureStorage {
  id: string;
  name: string;
  slug: string;
  order: number;
  isHome: boolean;
  htmlSize: number;      // Size reference
  cssSize: number;
}

export interface LargeContentStorage {
  pageId: string;
  type: 'html' | 'css' | 'script';
  content: string;
}

// ============================================================================
// CDN WHITELIST
// ============================================================================

export const CDN_WHITELIST = [
  'unpkg.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'code.jquery.com',
  'stackpath.bootstrapcdn.com',
  'ajax.googleapis.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'use.fontawesome.com',
  'kit.fontawesome.com',
  'cdn.tailwindcss.com',
  'maxcdn.bootstrapcdn.com',
] as const;

// ============================================================================
// IGNORE PATTERNS
// ============================================================================

export const IGNORE_FOLDERS = [
  '__MACOSX',
  '.DS_Store',
  'Source',
  'source-for-web-designers',
  'Event Doc',
  'PSD',
  'psd',
  'license',
  '.git',
  'node_modules',
] as const;

export const IGNORE_EXTENSIONS = [
  '.psd',
  '.ai',
  '.sketch',
  '.fig',
  '.xd',
  '.map',
  '.scss',
  '.sass',
  '.less',
  '.config',
  '.rb',
  '.txt',
  '.md',
  '.DS_Store',
] as const;
