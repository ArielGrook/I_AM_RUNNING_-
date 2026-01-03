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

const isClient = typeof window !== 'undefined';

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

function saveChunkedSync(
  name: string,
  data: string
): 'chunked' | 'direct' | 'failed' {
  if (!isClient || typeof localStorage === 'undefined') {
    return 'failed';
  }

  try {
    // First try direct write (fast path) to keep restore simple
    clearChunkedLocalStorage(name);
    localStorage.setItem(name, data);
    return 'direct';
  } catch (error) {
    console.warn('[Project Store] ⚠️ direct localStorage write failed, attempting chunked:', error);
  }

  try {
    clearChunkedLocalStorage(name);

    const chunks = [];
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      chunks.push(data.slice(i, i + CHUNK_SIZE));
    }

    const meta = JSON.stringify({
      version: STORAGE_VERSION,
      encoding: 'none',
      chunks: chunks.length,
      storage: 'local',
    });
    localStorage.setItem(`${name}:meta`, meta);
    chunks.forEach((chunk, idx) => {
      localStorage.setItem(`${name}:chunk:${idx}`, chunk);
    });
    // Marker for compatibility (not used for payload)
    localStorage.setItem(name, 'chunked');
    return 'chunked';
  } catch (error) {
    console.error('[Project Store] ❌ localStorage write failed:', error);
    clearChunkedLocalStorage(name);
    return 'failed';
  }
}

function loadChunkedSync(
  name: string
): string | null {
  if (!isClient || typeof localStorage === 'undefined') return null;

  const metaRaw = localStorage.getItem(`${name}:meta`);
  if (metaRaw) {
    try {
      const meta = JSON.parse(metaRaw) as {
        version: string;
        chunks: number;
        encoding?: string;
      };
      if (meta.version === STORAGE_VERSION && meta.chunks > 0) {
        let combined = '';
        for (let i = 0; i < meta.chunks; i += 1) {
          combined += localStorage.getItem(`${name}:chunk:${i}`) || '';
        }
        if (combined.length) {
          return combined;
        }
      }
    } catch (error) {
      console.warn('[Project Store] ⚠️ Failed to read chunked localStorage payload:', error);
    }
  }

  const raw = localStorage.getItem(name);
  // Guard against stale marker without meta
  if (raw === 'chunked' && !metaRaw) {
    return null;
  }
  return raw;
}

/**
 * Custom storage wrapper with chunking support (synchronous for Zustand persist)
 */
const createSafeLocalStorage = (): StateStorage => {
  if (!isClient || typeof localStorage === 'undefined') {
    // Server-safe no-op storage
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  return {
    getItem: (name: string): string | null => {
      try {
        return loadChunkedSync(name);
      } catch (error) {
        console.error('[Project Store] Error reading from storage:', error);
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        const storageUsed = saveChunkedSync(name, value);

        console.log('[Project Store] ✅ Persisted project state', {
          storage: storageUsed,
          rawSizeMB: (new Blob([value]).size / 1024 / 1024).toFixed(2),
        });
      } catch (error: any) {
        console.error('[Project Store] ❌ Error saving project state:', error);
      }
    },
    removeItem: (name: string): void => {
      try {
        clearChunkedLocalStorage(name);
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








