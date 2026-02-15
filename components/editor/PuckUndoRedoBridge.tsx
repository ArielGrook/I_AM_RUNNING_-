'use client';

import React, { useEffect, useRef } from 'react';
import { usePuck } from '@puckeditor/core';

export interface PuckUndoRedoApi {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface PuckUndoRedoBridgeProps {
  apiRef?: React.MutableRefObject<PuckUndoRedoApi | null>;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export function PuckUndoRedoBridge({ apiRef, onHistoryChange }: PuckUndoRedoBridgeProps) {
  const { history } = usePuck();
  const lastCanRef = useRef({ canUndo: false, canRedo: false });

  useEffect(() => {
    const canUndo = history.hasPast;
    const canRedo = history.hasFuture;
    if (apiRef) {
      apiRef.current = { undo: history.back, redo: history.forward, canUndo, canRedo };
    }
    if (onHistoryChange && (lastCanRef.current.canUndo !== canUndo || lastCanRef.current.canRedo !== canRedo)) {
      lastCanRef.current = { canUndo, canRedo };
      onHistoryChange(canUndo, canRedo);
    }
  }, [history.hasPast, history.hasFuture, history.back, history.forward, apiRef, onHistoryChange]);

  return null;
}
