/**
 * Storage Manager Module
 * 
 * Handles saving and loading projects using hybrid storage strategy:
 * - localStorage: Project metadata, page structure (fast, synchronous)
 * - IndexedDB: Large assets, full HTML content (no size limits)
 * 
 * @version 2.0.0
 */

import {
  ProjectV2,
  PageV2,
  AssetV2,
  ProjectSettings,
  StorageStrategy,
  ProjectMetaStorage,
  PageStructureStorage,
  LargeContentStorage,
  ImportWarning,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = 'i-am-running-v2';
const DB_VERSION = 1;
const STORE_ASSETS = 'assets';
const STORE_CONTENT = 'content';

const LS_PREFIX = 'iar-v2:';
const LS_META_KEY = 'meta';
const LS_PAGES_KEY = 'pages';
const LS_SETTINGS_KEY = 'settings';

// Size thresholds
const INLINE_CONTENT_LIMIT = 50 * 1024; // 50KB - content below this stays in localStorage

// ============================================================================
// INDEXEDDB HELPER
// ============================================================================

/**
 * Open the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create assets store
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
      }

      // Create content store
      if (!db.objectStoreNames.contains(STORE_CONTENT)) {
        db.createObjectStore(STORE_CONTENT, { keyPath: 'pageId' });
      }
    };
  });
}

// ============================================================================
// MAIN STORAGE CLASS
// ============================================================================

export class StorageManager {
  private db: IDBDatabase | null = null;
  private projectId: string = '';
  private warnings: ImportWarning[] = [];

  /**
   * Initialize storage for a project
   */
  async init(projectId: string): Promise<void> {
    this.projectId = projectId;
    this.warnings = [];

    try {
      this.db = await openDatabase();
    } catch (error) {
      console.warn('[StorageManager] IndexedDB not available, falling back to localStorage only');
      this.db = null;
    }
  }

  /**
   * Save a project using hybrid storage
   */
  async saveProject(project: ProjectV2): Promise<void> {
    console.log('[StorageManager] Saving project:', project.id);
    
    this.projectId = project.id;

    // 1. Save metadata to localStorage
    const meta: ProjectMetaStorage = {
      id: project.id,
      version: project.version,
      name: project.name,
      pageCount: project.pages.length,
      assetCount: project.assets.length,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
    this.saveMeta(meta);

    // 2. Save settings to localStorage
    this.saveSettings(project.settings);

    // 3. Save page structure to localStorage (without large content)
    const pageStructures: PageStructureStorage[] = project.pages.map(page => ({
      id: page.id,
      name: page.name,
      slug: page.slug,
      order: page.order,
      isHome: page.isHome,
      htmlSize: page.html.length,
      cssSize: page.css.length,
    }));
    this.savePageStructures(pageStructures);

    // 4. Save page content (to IndexedDB if large, localStorage if small)
    for (const page of project.pages) {
      await this.savePageContent(page);
    }

    // 5. Save assets to IndexedDB
    if (this.db && project.assets.length > 0) {
      await this.saveAssets(project.assets);
    }

    // 6. Save global CSS and scripts to localStorage (usually small)
    this.saveGlobalStyles(project.globalStyles);
    this.saveGlobalScripts(project.globalScripts);

    console.log('[StorageManager] Project saved successfully');
  }

  /**
   * Load a project from storage
   */
  async loadProject(): Promise<ProjectV2 | null> {
    console.log('[StorageManager] Loading project:', this.projectId);

    // 1. Load metadata
    const meta = this.loadMeta();
    if (!meta) {
      console.log('[StorageManager] No project metadata found');
      return null;
    }

    // 2. Load settings
    const settings = this.loadSettings();

    // 3. Load page structures
    const pageStructures = this.loadPageStructures();
    if (!pageStructures || pageStructures.length === 0) {
      console.log('[StorageManager] No pages found');
      return null;
    }

    // 4. Load page content
    const pages: PageV2[] = [];
    for (const structure of pageStructures) {
      const page = await this.loadPageContent(structure);
      if (page) {
        pages.push(page);
      }
    }

    // 5. Load assets
    const assets = this.db ? await this.loadAssets() : [];

    // 6. Load global styles and scripts
    const globalStyles = this.loadGlobalStyles();
    const globalScripts = this.loadGlobalScripts();

    const project: ProjectV2 = {
      version: '2.0',
      id: meta.id,
      name: meta.name,
      pages,
      globalStyles,
      globalScripts,
      assets,
      backendBlocks: [],
      backendTriggers: [],
      environment: [],
      settings,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
    };

    console.log('[StorageManager] Project loaded:', {
      pages: pages.length,
      assets: assets.length,
    });

    return project;
  }

  /**
   * Delete a project from storage
   */
  async deleteProject(): Promise<void> {
    console.log('[StorageManager] Deleting project:', this.projectId);

    // Clear localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${LS_PREFIX}${this.projectId}:`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear IndexedDB
    if (this.db) {
      await this.clearStore(STORE_ASSETS);
      await this.clearStore(STORE_CONTENT);
    }

    console.log('[StorageManager] Project deleted');
  }

  /**
   * Check available storage space
   */
  async checkStorageSpace(): Promise<{
    localStorage: { used: number; available: number };
    indexedDB: { used: number; available: number };
  }> {
    // localStorage estimate
    let lsUsed = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        lsUsed += (localStorage.getItem(key)?.length || 0) * 2; // UTF-16
      }
    }

    // IndexedDB estimate (if available)
    let idbUsed = 0;
    let idbAvailable = 0;
    
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        idbUsed = estimate.usage || 0;
        idbAvailable = estimate.quota || 0;
      } catch (error) {
        console.warn('[StorageManager] Storage estimation failed:', error);
      }
    }

    return {
      localStorage: {
        used: lsUsed,
        available: 5 * 1024 * 1024 - lsUsed, // ~5MB typical limit
      },
      indexedDB: {
        used: idbUsed,
        available: idbAvailable - idbUsed,
      },
    };
  }

  // ============================================================================
  // PRIVATE METHODS - localStorage
  // ============================================================================

  private getKey(suffix: string): string {
    return `${LS_PREFIX}${this.projectId}:${suffix}`;
  }

  private saveMeta(meta: ProjectMetaStorage): void {
    localStorage.setItem(this.getKey(LS_META_KEY), JSON.stringify(meta));
  }

  private loadMeta(): ProjectMetaStorage | null {
    const data = localStorage.getItem(this.getKey(LS_META_KEY));
    return data ? JSON.parse(data) : null;
  }

  private saveSettings(settings: ProjectSettings): void {
    localStorage.setItem(this.getKey(LS_SETTINGS_KEY), JSON.stringify(settings));
  }

  private loadSettings(): ProjectSettings {
    const data = localStorage.getItem(this.getKey(LS_SETTINGS_KEY));
    return data ? JSON.parse(data) : {};
  }

  private savePageStructures(pages: PageStructureStorage[]): void {
    localStorage.setItem(this.getKey(LS_PAGES_KEY), JSON.stringify(pages));
  }

  private loadPageStructures(): PageStructureStorage[] | null {
    const data = localStorage.getItem(this.getKey(LS_PAGES_KEY));
    return data ? JSON.parse(data) : null;
  }

  private saveGlobalStyles(styles: string): void {
    localStorage.setItem(this.getKey('globalStyles'), styles);
  }

  private loadGlobalStyles(): string {
    return localStorage.getItem(this.getKey('globalStyles')) || '';
  }

  private saveGlobalScripts(scripts: string[]): void {
    localStorage.setItem(this.getKey('globalScripts'), JSON.stringify(scripts));
  }

  private loadGlobalScripts(): string[] {
    const data = localStorage.getItem(this.getKey('globalScripts'));
    return data ? JSON.parse(data) : [];
  }

  // ============================================================================
  // PRIVATE METHODS - Page Content
  // ============================================================================

  private async savePageContent(page: PageV2): Promise<void> {
    const contentSize = page.html.length + page.css.length;

    if (contentSize < INLINE_CONTENT_LIMIT) {
      // Small content - save to localStorage
      localStorage.setItem(
        this.getKey(`page:${page.id}`),
        JSON.stringify({
          html: page.html,
          css: page.css,
          scripts: page.scripts,
          meta: page.meta,
        })
      );
    } else {
      // Large content - save to IndexedDB
      if (this.db) {
        await this.saveToStore(STORE_CONTENT, {
          pageId: page.id,
          html: page.html,
          css: page.css,
          scripts: page.scripts,
          meta: page.meta,
        });
      } else {
        // Fallback to localStorage (may hit quota)
        try {
          localStorage.setItem(
            this.getKey(`page:${page.id}`),
            JSON.stringify({
              html: page.html,
              css: page.css,
              scripts: page.scripts,
              meta: page.meta,
            })
          );
        } catch (error) {
          this.warnings.push({
            type: 'warning',
            message: `Failed to save page content: ${page.name}`,
            suggestion: 'Page content may be too large for localStorage.',
          });
        }
      }
    }
  }

  private async loadPageContent(structure: PageStructureStorage): Promise<PageV2 | null> {
    // Try localStorage first
    const lsData = localStorage.getItem(this.getKey(`page:${structure.id}`));
    if (lsData) {
      const content = JSON.parse(lsData);
      return {
        id: structure.id,
        name: structure.name,
        slug: structure.slug,
        originalFile: '',
        html: content.html,
        css: content.css,
        scripts: content.scripts || [],
        animations: [],
        triggers: [],
        order: structure.order,
        isHome: structure.isHome,
        meta: content.meta || {},
      };
    }

    // Try IndexedDB
    if (this.db) {
      const content = await this.loadFromStore(STORE_CONTENT, structure.id);
      if (content) {
        return {
          id: structure.id,
          name: structure.name,
          slug: structure.slug,
          originalFile: '',
          html: content.html,
          css: content.css,
          scripts: content.scripts || [],
          animations: [],
          triggers: [],
          order: structure.order,
          isHome: structure.isHome,
          meta: content.meta || {},
        };
      }
    }

    return null;
  }

  // ============================================================================
  // PRIVATE METHODS - IndexedDB
  // ============================================================================

  private async saveAssets(assets: AssetV2[]): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_ASSETS], 'readwrite');
    const store = transaction.objectStore(STORE_ASSETS);

    for (const asset of assets) {
      store.put(asset);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async loadAssets(): Promise<AssetV2[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_ASSETS], 'readonly');
      const store = transaction.objectStore(STORE_ASSETS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveToStore(storeName: string, data: unknown): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async loadFromStore(storeName: string, key: string): Promise<any> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async clearStore(storeName: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get warnings generated during storage operations
   */
  getWarnings(): ImportWarning[] {
    return this.warnings;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Estimate size of an object when serialized
 */
export function estimateSize(obj: unknown): number {
  const str = JSON.stringify(obj);
  return str.length * 2; // UTF-16 encoding
}

/**
 * Clear all parser storage
 */
export async function clearAllParserStorage(): Promise<void> {
  // Clear localStorage
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(LS_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear IndexedDB
  if (isIndexedDBAvailable()) {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('[StorageManager] Failed to delete IndexedDB:', error);
    }
  }
}

/**
 * List all stored projects
 */
export function listStoredProjects(): string[] {
  const projects: string[] = [];
  const prefix = `${LS_PREFIX}`;
  const suffix = `:${LS_META_KEY}`;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix) && key.endsWith(suffix)) {
      const projectId = key.slice(prefix.length, key.length - suffix.length);
      projects.push(projectId);
    }
  }

  return projects;
}
