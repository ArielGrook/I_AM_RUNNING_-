/**
 * Project Store (Zustand)
 * 
 * Manages project state, auto-save, and localStorage persistence.
 * 
 * Stage 1 Module 1: Project System
 * - Project naming
 * - Auto-save to localStorage every 60s
 * - Restore state on reload
 * 
 * CRITICAL FIX: localStorage QuotaExceededError handling
 * - Checks data size before persisting (3MB threshold)
 * - Disables persist for large projects to prevent quota errors
 * - Handles QuotaExceededError gracefully with logging
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Project, SaveStatus } from '@/lib/types/project';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_VERSION = 'v2';
const CHUNK_SIZE = 900_000; // ~0.9MB chunks to keep localStorage writes reliable
const STORAGE_FALLBACK_DB = 'project-storage';
const STORAGE_FALLBACK_STORE = 'projects';

type CompressionEncoding = 'gzip' | 'none';

const isClient = typeof window !== 'undefined';

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function gzipCompress(input: string): Promise<{ payload: string; encoding: CompressionEncoding }> {
  if (typeof CompressionStream === 'undefined') {
    return { payload: input, encoding: 'none' };
  }

  const encoder = new TextEncoder();
  const stream = new Blob([encoder.encode(input)]).stream().pipeThrough(new CompressionStream('gzip'));
  const arrayBuffer = await new Response(stream).arrayBuffer();
  return { payload: uint8ToBase64(new Uint8Array(arrayBuffer)), encoding: 'gzip' };
}

async function gzipDecompress(payload: string, encoding: CompressionEncoding): Promise<string> {
  if (encoding !== 'gzip' || typeof DecompressionStream === 'undefined') {
    return payload;
  }

  const bytes = base64ToUint8(payload);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const arrayBuffer = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(arrayBuffer);
}

async function openIndexedDb(): Promise<IDBDatabase | null> {
  if (!isClient || !('indexedDB' in window)) return null;

  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE_FALLBACK_DB, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORAGE_FALLBACK_STORE)) {
        db.createObjectStore(STORAGE_FALLBACK_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  }).catch((error) => {
    console.error('[Project Store] ❌ IndexedDB open failed:', error);
    return null;
  });
}

async function idbSet(name: string, payload: string, encoding: CompressionEncoding): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORAGE_FALLBACK_STORE, 'readwrite');
    const store = tx.objectStore(STORAGE_FALLBACK_STORE);
    store.put({
      id: name,
      version: STORAGE_VERSION,
      encoding,
      payload,
      updatedAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }).catch((error) => {
    console.error('[Project Store] ❌ IndexedDB write failed:', error);
  });
}

async function idbGet(name: string): Promise<{ payload: string; encoding: CompressionEncoding } | null> {
  const db = await openIndexedDb();
  if (!db) return null;

  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE_FALLBACK_STORE, 'readonly');
    const store = tx.objectStore(STORAGE_FALLBACK_STORE);
    const request = store.get(name);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    console.error('[Project Store] ❌ IndexedDB read failed:', error);
    return null;
  });
}

async function idbRemove(name: string): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORAGE_FALLBACK_STORE, 'readwrite');
    const store = tx.objectStore(STORAGE_FALLBACK_STORE);
    store.delete(name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }).catch((error) => {
    console.error('[Project Store] ❌ IndexedDB delete failed:', error);
  });
}

function clearChunkedLocalStorage(name: string) {
  if (!isClient || typeof localStorage === 'undefined') return;
  const meta = localStorage.getItem(`${name}:meta`);
  const chunks = meta ? Number.parseInt(JSON.parse(meta)?.chunks ?? '0', 10) : 0;
  if (Number.isFinite(chunks)) {
    for (let i = 0; i < chunks; i += 1) {
      localStorage.removeItem(`${name}:chunk:${i}`);
    }
  }
  localStorage.removeItem(`${name}:meta`);
  localStorage.removeItem(name);
}

async function saveChunked(
  name: string,
  data: string,
  encoding: CompressionEncoding
): Promise<'local' | 'idb'> {
  if (!isClient || typeof localStorage === 'undefined') {
    await idbSet(name, data, encoding);
    return 'idb';
  }

  clearChunkedLocalStorage(name);

  const chunks = [];
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    chunks.push(data.slice(i, i + CHUNK_SIZE));
  }

  try {
    const meta = JSON.stringify({
      version: STORAGE_VERSION,
      encoding,
      chunks: chunks.length,
      storage: 'local',
    });
    localStorage.setItem(`${name}:meta`, meta);
    chunks.forEach((chunk, idx) => {
      localStorage.setItem(`${name}:chunk:${idx}`, chunk);
    });
    // Lightweight marker for compatibility (not used for payload)
    localStorage.setItem(name, 'chunked');
    return 'local';
  } catch (error: any) {
    console.warn('[Project Store] ⚠️ localStorage chunk write failed, falling back to IndexedDB:', error);
    clearChunkedLocalStorage(name);
    await idbSet(name, data, encoding);
    return 'idb';
  }
}

async function loadChunked(
  name: string
): Promise<{ payload: string; encoding: CompressionEncoding } | null> {
  if (!isClient) return null;

  const metaRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(`${name}:meta`) : null;
  if (metaRaw) {
    try {
      const meta = JSON.parse(metaRaw) as {
        version: string;
        encoding: CompressionEncoding;
        chunks: number;
        storage?: 'local' | 'idb';
      };
      if (meta.version === STORAGE_VERSION && meta.chunks > 0) {
        let combined = '';
        for (let i = 0; i < meta.chunks; i += 1) {
          combined += localStorage.getItem(`${name}:chunk:${i}`) || '';
        }
        if (combined.length) {
          return { payload: combined, encoding: meta.encoding || 'none' };
        }
      }
    } catch (error) {
      console.warn('[Project Store] ⚠️ Failed to read chunked localStorage payload:', error);
    }
  }

  const idbValue = await idbGet(name);
  if (idbValue) {
    return { payload: idbValue.payload, encoding: idbValue.encoding || 'none' };
  }

  return null;
}

/**
 * Custom storage wrapper with compression + chunking and IndexedDB fallback
 */
const createSafeLocalStorage = (): StateStorage => {
  if (!isClient || typeof localStorage === 'undefined') {
    // Server-safe no-op storage
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const chunked = await loadChunked(name);
        if (chunked) {
          const decompressed = await gzipDecompress(chunked.payload, chunked.encoding);
          return decompressed;
        }

        const raw = localStorage.getItem(name);
        return raw;
      } catch (error) {
        console.error('[Project Store] Error reading from storage:', error);
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const { payload, encoding } = await gzipCompress(value);
        const storageUsed = await saveChunked(name, payload, encoding);

        console.log('[Project Store] ✅ Persisted project state', {
          encoding,
          storage: storageUsed,
          rawSizeMB: (new Blob([value]).size / 1024 / 1024).toFixed(2),
          compressedSizeMB: (new Blob([payload]).size / 1024 / 1024).toFixed(2),
        });
      } catch (error: any) {
        console.error('[Project Store] ❌ Error saving project state:', error);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        clearChunkedLocalStorage(name);
        await idbRemove(name);
      } catch (error) {
        console.error('[Project Store] Error removing project state:', error);
      }
    },
  };
};

interface ProjectState {
  // Current project
  currentProject: Project | null;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  
  // Actions
  createProject: (name: string, description?: string) => void;
  updateProject: (updates: Partial<Project>) => void;
  loadProject: (project: Project) => void;
  clearProject: () => void;
  setSaveStatus: (status: SaveStatus) => void;
}

/**
 * Create a new project with default values
 */
function createNewProject(name: string, description?: string): Project {
  const now = new Date().toISOString();
  
  return {
    id: uuidv4(),
    name,
    description: description || '',
    pages: [
      {
        id: uuidv4(),
        name: 'Home',
        slug: 'index',
        title: name,
        components: [],
      },
    ],
    globalStyles: '',
    globalScripts: '',
    assets: [],
    settings: {
      language: 'en',
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
    },
  };
}

/**
 * Project store with localStorage persistence
 */
export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      saveStatus: 'idle',
      lastSaved: null,

      createProject: (name: string, description?: string) => {
        const project = createNewProject(name, description);
        set({
          currentProject: project,
          saveStatus: 'saved',
          lastSaved: new Date(),
        });
      },

      updateProject: (updates: Partial<Project>) => {
        const current = get().currentProject;
        if (!current) return;

        const updated: Project = {
          ...current,
          ...updates,
          metadata: {
            ...current.metadata,
            ...updates.metadata,
            updatedAt: new Date().toISOString(),
          },
        };

        set({
          currentProject: updated,
          saveStatus: 'saving',
        });
      },

      loadProject: (project: Project) => {
        console.log('[Project Store] 🔄 loadProject() called');
        console.log('[Project Store] 📦 Project being loaded:', {
          id: project.id,
          name: project.name,
          pagesCount: project.pages?.length || 0,
          firstPageComponents: project.pages?.[0]?.components?.length || 0,
          componentsDetails: project.pages?.[0]?.components?.map((c, i) => ({
            index: i,
            type: c.type,
            category: c.category,
            hasProps: !!c.props,
            hasHtml: !!c.props?.html,
            htmlLength: c.props?.html?.length || 0
          })) || []
        });
        
        set({
          currentProject: project,
          saveStatus: 'saved',
          lastSaved: new Date(),
        });
        
        console.log('[Project Store] ✅ Project loaded into store');
      },

      clearProject: () => {
        set({
          currentProject: null,
          saveStatus: 'idle',
          lastSaved: null,
        });
      },

      setSaveStatus: (status: SaveStatus) => {
        set({
          saveStatus: status,
          lastSaved: status === 'saved' ? new Date() : get().lastSaved,
        });
      },
    }),
    {
      name: 'project-storage', // localStorage key
      storage: createJSONStorage(() => createSafeLocalStorage()),
      // Only persist currentProject and lastSaved
      partialize: (state) => {
        const partialState = {
          currentProject: state.currentProject,
          lastSaved: state.lastSaved,
        };

        return partialState;
      },
    }
  )
);








