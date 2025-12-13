/**
 * Auto-Save Hook
 * 
 * Automatically saves project to localStorage every 60 seconds (debounced).
 * 
 * Stage 1 Module 1: Project System
 */

import { useEffect, useRef } from 'react';
import debounce from 'lodash.debounce';
import { useProjectStore } from '@/lib/store/project-store';
import { canSaveOrExport } from '@/lib/utils/demo-mode';
import { saveProjectToSupabase } from '@/lib/store/supabase-sync';

const AUTO_SAVE_INTERVAL = 60000; // 60 seconds

/**
 * Hook for auto-saving project state
 * 
 * Stage 1 Module 1: Project System
 * Stage 3 Module 9: Demo Mode integration
 * 
 * @param enabled - Whether auto-save is enabled (default: true)
 * @param interval - Auto-save interval in milliseconds (default: 60s)
 */
export function useAutoSave(enabled: boolean = true, interval: number = AUTO_SAVE_INTERVAL) {
  const { currentProject, setSaveStatus } = useProjectStore();
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    if (!enabled || !currentProject) {
      return;
    }

    // Create debounced save function
    debouncedSaveRef.current = debounce(async () => {
      if (!currentProject) return;

      // Check demo mode limits
      if (!canSaveOrExport()) {
        console.warn('Demo mode limit reached, cannot save');
        setSaveStatus('error');
        return;
      }

      try {
        setSaveStatus('saving');
        
        // Save to Supabase (if authenticated)
        await saveProjectToSupabase(currentProject);
        
        // Zustand persist middleware handles localStorage save
        setSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('error');
      }
    }, interval);

    // Cleanup
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, [enabled, currentProject, interval, setSaveStatus]);

  /**
   * Manually trigger save (useful for immediate saves)
   */
  const saveNow = () => {
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.flush();
    }
  };

  return { saveNow };
}

