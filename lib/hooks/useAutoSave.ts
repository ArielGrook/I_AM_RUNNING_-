/**
 * Auto-Save Hook
 * 
 * Automatically saves project to localStorage on every change (debounced 1-2 seconds).
 * 
 * Stage 1 Module 1: Project System
 * Task 1.3: Enhanced auto-save with 1-2s debouncing
 */

import { useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { useProjectStore } from '@/lib/store/project-store';
import { canSaveOrExport } from '@/lib/utils/demo-mode';
import { saveProjectToSupabase } from '@/lib/store/supabase-sync';

const AUTO_SAVE_DEBOUNCE = 1500; // 1.5 seconds debounce

/**
 * Hook for auto-saving project state on every change
 * 
 * Stage 1 Module 1: Project System
 * Stage 3 Module 9: Demo Mode integration
 * Task 1.3: Enhanced with 1-2s debouncing on every change
 * 
 * @param enabled - Whether auto-save is enabled (default: true)
 */
export function useAutoSave(enabled: boolean = true) {
  const { currentProject, setSaveStatus } = useProjectStore();
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Save function
  const performSave = useCallback(async () => {
    const project = useProjectStore.getState().currentProject;
    if (!project) return;

    // Check demo mode limits
    if (!canSaveOrExport()) {
      console.warn('Demo mode limit reached, cannot save');
      setSaveStatus('error');
      return;
    }

    try {
      setSaveStatus('saving');
      
      // Save to Supabase (if authenticated)
      await saveProjectToSupabase(project);
      
      // Zustand persist middleware handles localStorage save automatically
      // The persist middleware will save when state changes
      setSaveStatus('saved');
      
      console.log('[Auto-Save] ✅ Project saved successfully');
    } catch (error) {
      console.error('[Auto-Save] ❌ Save failed:', error);
      setSaveStatus('error');
    }
  }, [setSaveStatus]);

  useEffect(() => {
    if (!enabled || !currentProject) {
      return;
    }

    // Create debounced save function (1.5 seconds)
    debouncedSaveRef.current = debounce(performSave, AUTO_SAVE_DEBOUNCE);

    // Cleanup
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, [enabled, currentProject, performSave]);

  /**
   * Manually trigger save (useful for immediate saves)
   */
  const saveNow = useCallback(() => {
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.flush();
    } else {
      // If debounce not ready, save immediately
      performSave();
    }
  }, [performSave]);

  /**
   * Trigger save on change (called from editor)
   */
  const triggerSave = useCallback(() => {
    if (debouncedSaveRef.current && enabled && currentProject) {
      debouncedSaveRef.current();
    }
  }, [enabled, currentProject]);

  return { saveNow, triggerSave };
}

