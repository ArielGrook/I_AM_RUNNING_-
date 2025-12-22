/**
 * Project Store (Zustand)
 * 
 * Manages project state, auto-save, and localStorage persistence.
 * 
 * Stage 1 Module 1: Project System
 * - Project naming
 * - Auto-save to localStorage every 60s
 * - Restore state on reload
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Project, SaveStatus } from '@/lib/types/project';
import { v4 as uuidv4 } from 'uuid';

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
      storage: createJSONStorage(() => localStorage),
      // Only persist currentProject
      partialize: (state) => ({
        currentProject: state.currentProject,
        lastSaved: state.lastSaved,
      }),
    }
  )
);








