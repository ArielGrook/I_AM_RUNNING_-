/**
 * Auto-Save Hook
 * 
 * Automatically saves project to localStorage on changes (debounced 2.5 seconds).
 * 
 * Stage 1 Module 1: Project System
 * Task 1.3: Enhanced auto-save with 2.5s debouncing
 */

import { useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { useProjectStore } from '@/lib/store/project-store';
import { canSaveOrExport } from '@/lib/utils/demo-mode';
import { saveProjectToSupabase } from '@/lib/store/supabase-sync';

const AUTO_SAVE_DEBOUNCE = 2500; // 2.5 seconds debounce

/**
 * Hook for auto-saving project state on changes
 * 
 * @param enabled - Whether auto-save is enabled (default: true)
 */
export function useAutoSave(enabled: boolean = true) {
  const { currentProject, setSaveStatus } = useProjectStore();
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Perform the actual save
  const performSave = useCallback(async () => {
    const project = useProjectStore.getState().currentProject;
    if (!project) return;

    // Check demo mode limits
    if (!canSaveOrExport()) {
      console.warn('[Auto-Save] Demo mode limit reached');
      setSaveStatus('error');
      return;
    }

    try {
      setSaveStatus('saving');
      
      // Zustand persist middleware handles localStorage save automatically
      // Just update the timestamp to trigger the persist middleware
      const { updateProject } = useProjectStore.getState();
      updateProject({
        metadata: {
          ...project.metadata,
          updatedAt: new Date().toISOString(),
        },
      });
      
      // Save to Supabase (if authenticated) - non-blocking
      saveProjectToSupabase(project).catch(() => {});
      
      setSaveStatus('saved');
      console.log('[Auto-Save] ✅ Saved');
    } catch (error) {
      console.error('[Auto-Save] ❌ Failed:', error);
      setSaveStatus('error');
    }
  }, [setSaveStatus]);

  // Setup debounced save function
  useEffect(() => {
    if (!enabled || !currentProject) {
      return;
    }

    debouncedSaveRef.current = debounce(performSave, AUTO_SAVE_DEBOUNCE);

    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, [enabled, currentProject, performSave]);

  // Trigger save (called from editor on changes)
  const triggerSave = useCallback(() => {
    if (debouncedSaveRef.current && enabled && currentProject) {
      debouncedSaveRef.current();
    }
  }, [enabled, currentProject]);

  // Flush save immediately
  const saveNow = useCallback(() => {
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.flush();
    } else {
      performSave();
    }
  }, [performSave]);

  return { saveNow, triggerSave };
}

