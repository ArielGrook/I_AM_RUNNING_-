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

/**
 * Maximum size for localStorage persistence (3MB)
 * localStorage typically has 5-10MB limit, so we use 3MB as safe threshold
 */
const MAX_LOCALSTORAGE_SIZE = 3 * 1024 * 1024; // 3MB in bytes

/**
 * Calculate approximate size of an object in bytes (JSON stringified)
 */
function calculateSize(obj: any): number {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch (error) {
    console.warn('[Project Store] Failed to calculate size:', error);
    return 0;
  }
}

/**
 * Custom localStorage storage wrapper with size checks and error handling
 * Prevents QuotaExceededError by skipping persist for large projects
 */
const createSafeLocalStorage = (): StateStorage => {
  return {
    getItem: (name: string): string | null => {
      try {
        return localStorage.getItem(name);
      } catch (error) {
        console.error('[Project Store] Error reading from localStorage:', error);
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        // Check size before attempting to save
        const size = new Blob([value]).size;
        const currentSize = localStorage.getItem(name) ? new Blob([localStorage.getItem(name)!]).size : 0;
        
        console.log(`[Project Store] 📊 Storage size check:`, {
          key: name,
          newSize: `${(size / 1024 / 1024).toFixed(2)}MB`,
          currentSize: `${(currentSize / 1024 / 1024).toFixed(2)}MB`,
          threshold: `${(MAX_LOCALSTORAGE_SIZE / 1024 / 1024).toFixed(2)}MB`,
          willExceed: size > MAX_LOCALSTORAGE_SIZE
        });
        
        if (size > MAX_LOCALSTORAGE_SIZE) {
          console.warn(`[Project Store] ⚠️ Project size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${(MAX_LOCALSTORAGE_SIZE / 1024 / 1024).toFixed(2)}MB). Skipping localStorage persist to prevent QuotaExceededError.`);
          console.warn(`[Project Store] 💡 Large projects will not be persisted to localStorage. Consider using Supabase for storage.`);
          return; // Skip persist for large projects
        }
        
        // Attempt to save
        localStorage.setItem(name, value);
        console.log(`[Project Store] ✅ Successfully persisted to localStorage (${(size / 1024 / 1024).toFixed(2)}MB)`);
      } catch (error: any) {
        // Handle QuotaExceededError specifically
        if (error?.name === 'QuotaExceededError' || error?.code === 22) {
          console.error('[Project Store] ❌ QuotaExceededError: localStorage is full. Skipping persist for this project.');
          console.error('[Project Store] 💡 Consider clearing localStorage or using Supabase for large projects.');
        } else {
          console.error('[Project Store] ❌ Error saving to localStorage:', error);
        }
        // Don't throw - gracefully handle the error by skipping persist
      }
    },
    removeItem: (name: string): void => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.error('[Project Store] Error removing from localStorage:', error);
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
      // CRITICAL: Size check happens in createSafeLocalStorage() to prevent QuotaExceededError
      partialize: (state) => {
        const partialState = {
          currentProject: state.currentProject,
          lastSaved: state.lastSaved,
        };
        
        // Log size before partialization
        const size = calculateSize(partialState);
        if (state.currentProject) {
          console.log(`[Project Store] 📦 Preparing to persist project:`, {
            projectName: state.currentProject.name,
            projectId: state.currentProject.id,
            pagesCount: state.currentProject.pages?.length || 0,
            componentsCount: state.currentProject.pages?.[0]?.components?.length || 0,
            estimatedSize: `${(size / 1024 / 1024).toFixed(2)}MB`,
            willPersist: size <= MAX_LOCALSTORAGE_SIZE
          });
        }
        
        return partialState;
      },
    }
  )
);








