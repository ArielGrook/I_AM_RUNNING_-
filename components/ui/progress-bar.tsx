/**
 * Progress Bar Component
 * 
 * Displays progress for long-running operations (ZIP parsing, etc.)
 * 
 * Stage 2 Module 4: ZIP-Parser Core enhancements
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  message,
  className,
  showPercentage = true,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('w-full', className)}>
      {message && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{message}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-900">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}








