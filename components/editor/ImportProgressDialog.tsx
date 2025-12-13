/**
 * Import Progress Dialog
 * 
 * Shows progress during ZIP file import with detailed status.
 * 
 * Stage 2 Module 4: ZIP-Parser Core enhancements
 */

'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ParseProgress } from '@/lib/parser/types';
import { Loader2 } from 'lucide-react';

interface ImportProgressDialogProps {
  open: boolean;
  progress: ParseProgress | null;
}

export function ImportProgressDialog({ open, progress }: ImportProgressDialogProps) {
  if (!progress) return null;

  const getStageLabel = (stage: ParseProgress['stage']) => {
    switch (stage) {
      case 'loading':
        return 'Loading ZIP file...';
      case 'parsing':
        return 'Analyzing contents...';
      case 'processing':
        return 'Processing files...';
      case 'complete':
        return 'Import complete!';
      default:
        return 'Processing...';
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importing Project</DialogTitle>
          <DialogDescription>
            {getStageLabel(progress.stage)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <ProgressBar
            progress={progress.progress}
            message={progress.message}
            showPercentage={true}
          />

          {progress.currentFile && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Current file:</span> {progress.currentFile}
            </div>
          )}

          {progress.totalFiles && progress.processedFiles !== undefined && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Progress:</span>{' '}
              {progress.processedFiles} of {progress.totalFiles} files processed
            </div>
          )}

          {progress.stage !== 'complete' && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}








