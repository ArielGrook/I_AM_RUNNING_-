/**
 * Progress Tracker Module
 * 
 * Tracks and reports parsing progress.
 * Provides time estimates and stage-based progress updates.
 * 
 * @version 2.0.0
 */

import {
  ParseStage,
  ParseProgress,
  ProgressCallback,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Stage configuration with progress ranges and typical durations
 */
const STAGE_CONFIG: Record<ParseStage, {
  label: string;
  startProgress: number;
  endProgress: number;
  typicalDuration: number; // milliseconds
}> = {
  reading: {
    label: 'Reading ZIP file',
    startProgress: 0,
    endProgress: 10,
    typicalDuration: 500,
  },
  detecting: {
    label: 'Detecting site structure',
    startProgress: 10,
    endProgress: 15,
    typicalDuration: 200,
  },
  classifying: {
    label: 'Classifying files',
    startProgress: 15,
    endProgress: 20,
    typicalDuration: 300,
  },
  css: {
    label: 'Processing CSS',
    startProgress: 20,
    endProgress: 35,
    typicalDuration: 1000,
  },
  assets: {
    label: 'Converting images & fonts',
    startProgress: 35,
    endProgress: 65,
    typicalDuration: 5000,
  },
  html: {
    label: 'Processing HTML',
    startProgress: 65,
    endProgress: 85,
    typicalDuration: 2000,
  },
  building: {
    label: 'Building pages',
    startProgress: 85,
    endProgress: 95,
    typicalDuration: 500,
  },
  finalizing: {
    label: 'Saving project',
    startProgress: 95,
    endProgress: 99,
    typicalDuration: 1000,
  },
  complete: {
    label: 'Import complete!',
    startProgress: 100,
    endProgress: 100,
    typicalDuration: 0,
  },
};

// ============================================================================
// MAIN TRACKER CLASS
// ============================================================================

export class ProgressTracker {
  private callback: ProgressCallback | null = null;
  private startTime: number = 0;
  private currentStage: ParseStage = 'reading';
  private stageStartTime: number = 0;
  private totalFiles: number = 0;
  private processedFiles: number = 0;

  /**
   * Initialize the tracker with a callback
   */
  init(callback?: ProgressCallback): void {
    this.callback = callback || null;
    this.startTime = Date.now();
    this.stageStartTime = this.startTime;
    this.currentStage = 'reading';
    this.totalFiles = 0;
    this.processedFiles = 0;
  }

  /**
   * Start a new stage
   */
  startStage(stage: ParseStage): void {
    this.currentStage = stage;
    this.stageStartTime = Date.now();
    
    const config = STAGE_CONFIG[stage];
    this.report({
      stage,
      progress: config.startProgress,
      message: config.label + '...',
      elapsed: Date.now() - this.startTime,
      estimated: this.estimateRemaining(stage, 0),
    });
  }

  /**
   * Update progress within the current stage
   * 
   * @param stageProgress - Progress within this stage (0-1)
   * @param message - Optional custom message
   * @param currentFile - Current file being processed
   */
  update(
    stageProgress: number,
    message?: string,
    currentFile?: string
  ): void {
    const config = STAGE_CONFIG[this.currentStage];
    const range = config.endProgress - config.startProgress;
    const progress = Math.round(config.startProgress + range * stageProgress);

    this.report({
      stage: this.currentStage,
      progress: Math.min(progress, config.endProgress),
      message: message || config.label + '...',
      currentFile,
      totalFiles: this.totalFiles,
      processedFiles: this.processedFiles,
      elapsed: Date.now() - this.startTime,
      estimated: this.estimateRemaining(this.currentStage, stageProgress),
    });
  }

  /**
   * Update file count for progress tracking
   */
  setFileCount(total: number, processed: number): void {
    this.totalFiles = total;
    this.processedFiles = processed;
  }

  /**
   * Increment processed file count
   */
  incrementProcessed(): void {
    this.processedFiles++;
  }

  /**
   * Complete the current stage and move to next
   */
  completeStage(message?: string): void {
    const config = STAGE_CONFIG[this.currentStage];
    
    this.report({
      stage: this.currentStage,
      progress: config.endProgress,
      message: message || `${config.label} complete`,
      totalFiles: this.totalFiles,
      processedFiles: this.processedFiles,
      elapsed: Date.now() - this.startTime,
    });
  }

  /**
   * Mark the entire process as complete
   */
  complete(message?: string): void {
    this.currentStage = 'complete';
    
    this.report({
      stage: 'complete',
      progress: 100,
      message: message || 'Import complete!',
      totalFiles: this.totalFiles,
      processedFiles: this.processedFiles,
      elapsed: Date.now() - this.startTime,
    });
  }

  /**
   * Report an error (doesn't stop tracking)
   */
  error(message: string, file?: string): void {
    this.report({
      stage: this.currentStage,
      progress: this.getCurrentProgress(),
      message: `Error: ${message}`,
      currentFile: file,
      elapsed: Date.now() - this.startTime,
    });
  }

  /**
   * Send progress update to callback
   */
  private report(progress: ParseProgress): void {
    if (this.callback) {
      try {
        this.callback(progress);
      } catch (error) {
        console.warn('[ProgressTracker] Callback error:', error);
      }
    }
  }

  /**
   * Get current overall progress
   */
  private getCurrentProgress(): number {
    const config = STAGE_CONFIG[this.currentStage];
    return config.startProgress;
  }

  /**
   * Estimate remaining time
   */
  private estimateRemaining(stage: ParseStage, stageProgress: number): number {
    const elapsed = Date.now() - this.startTime;
    
    // Get remaining stages
    const stages = Object.keys(STAGE_CONFIG) as ParseStage[];
    const currentIndex = stages.indexOf(stage);
    
    // Sum typical duration for remaining stages
    let remaining = 0;
    for (let i = currentIndex; i < stages.length; i++) {
      const s = stages[i];
      if (i === currentIndex) {
        // Current stage: estimate based on progress
        remaining += STAGE_CONFIG[s].typicalDuration * (1 - stageProgress);
      } else if (s !== 'complete') {
        remaining += STAGE_CONFIG[s].typicalDuration;
      }
    }

    // Adjust based on actual elapsed time vs expected
    const expectedElapsed = stages
      .slice(0, currentIndex)
      .reduce((sum, s) => sum + STAGE_CONFIG[s].typicalDuration, 0);
    
    if (expectedElapsed > 0 && elapsed > 0) {
      const ratio = elapsed / expectedElapsed;
      remaining *= ratio;
    }

    return Math.round(remaining);
  }

  /**
   * Get elapsed time
   */
  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get current stage
   */
  getCurrentStage(): ParseStage {
    return this.currentStage;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format milliseconds to human-readable time
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Create a simple progress bar string
 */
export function createProgressBar(progress: number, width: number = 20): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

/**
 * Get stage label
 */
export function getStageLabel(stage: ParseStage): string {
  return STAGE_CONFIG[stage]?.label || stage;
}

/**
 * Check if stage is before another stage
 */
export function isStageBefore(stage1: ParseStage, stage2: ParseStage): boolean {
  const stages = Object.keys(STAGE_CONFIG) as ParseStage[];
  return stages.indexOf(stage1) < stages.indexOf(stage2);
}

/**
 * Create a no-op progress tracker for testing
 */
export function createNoOpTracker(): ProgressTracker {
  const tracker = new ProgressTracker();
  tracker.init(() => {}); // Empty callback
  return tracker;
}
