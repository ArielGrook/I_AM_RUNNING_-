/**
 * Import Progress Dialog
 * 
 * Shows progress during ZIP file import with detailed status.
 * Updated for Parser V2 with 8-stage tracking.
 * 
 * Stage 2 Module 4: ZIP-Parser Core enhancements
 */

'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ParseProgress, ParseStage } from '@/lib/parser/v2/types';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportProgressDialogProps {
  open: boolean;
  progress: ParseProgress | null;
}

export function ImportProgressDialog({ open, progress }: ImportProgressDialogProps) {
  if (!progress) return null;

  // Stage labels for Parser V2
  const getStageLabel = (stage: ParseStage | string) => {
    switch (stage) {
      case 'reading':
        return 'Reading ZIP file...';
      case 'detecting':
        return 'Detecting site structure...';
      case 'classifying':
        return 'Classifying files...';
      case 'css':
        return 'Processing CSS...';
      case 'assets':
        return 'Converting images & fonts...';
      case 'html':
        return 'Processing HTML pages...';
      case 'building':
        return 'Building project structure...';
      case 'finalizing':
        return 'Finalizing project...';
      case 'complete':
        return 'Import complete!';
      // Legacy stage support
      case 'loading':
        return 'Loading ZIP file...';
      case 'parsing':
        return 'Analyzing contents...';
      case 'processing':
        return 'Processing files...';
      default:
        return 'Processing...';
    }
  };

  // Stage icons for visual feedback
  const getStageIcon = (stage: ParseStage | string) => {
    switch (stage) {
      case 'reading':
        return '📦';
      case 'detecting':
        return '🔍';
      case 'classifying':
        return '📂';
      case 'css':
        return '🎨';
      case 'assets':
        return '🖼️';
      case 'html':
        return '📄';
      case 'building':
        return '🏗️';
      case 'finalizing':
        return '✨';
      case 'complete':
        return '✅';
      default:
        return '⏳';
    }
  };

  const isComplete = progress.stage === 'complete';
  const isError = progress.message?.startsWith('❌');

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              isError ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )
            ) : (
              <span className="text-xl">{getStageIcon(progress.stage)}</span>
            )}
            Importing Project
          </DialogTitle>
          <DialogDescription>
            {getStageLabel(progress.stage)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress Bar */}
          <ProgressBar
            progress={progress.progress}
            message={progress.message}
            showPercentage={true}
          />

          {/* Current File */}
          {progress.currentFile && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Current file:</span>{' '}
              <span className="font-mono text-xs truncate block">{progress.currentFile}</span>
            </div>
          )}

          {/* Files Progress */}
          {progress.totalFiles && progress.processedFiles !== undefined && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Progress:</span>{' '}
              {progress.processedFiles} of {progress.totalFiles} files processed
            </div>
          )}

          {/* Time Estimate */}
          {progress.estimated && progress.estimated > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Estimated time remaining: ~{Math.ceil(progress.estimated / 1000)}s
            </div>
          )}

          {/* Loading Spinner or Completion Icon */}
          {!isComplete && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {/* Stage Progress Indicators */}
          <div className="flex justify-center gap-1 pt-2">
            {['reading', 'detecting', 'css', 'assets', 'html', 'building', 'complete'].map((stage, index) => {
              const stageOrder = ['reading', 'detecting', 'classifying', 'css', 'assets', 'html', 'building', 'finalizing', 'complete'];
              const currentIndex = stageOrder.indexOf(progress.stage);
              const stageIndex = stageOrder.indexOf(stage);
              const isActive = stageIndex <= currentIndex;
              
              return (
                <div
                  key={stage}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  title={getStageLabel(stage)}
                />
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}








