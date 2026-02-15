/**
 * Puck editor wrapper for main editor page.
 * Controlled component: data + onChange. Supports multi-page via parent state.
 */

'use client';

import '@puckeditor/core/puck.css';
import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { puckConfig } from '@/lib/editor/puck-config';
import { RightPanelSections } from '@/components/editor/RightPanelSections';
import { PuckUndoRedoBridge } from '@/components/editor/PuckUndoRedoBridge';

const Puck = dynamic(
  () => import('@puckeditor/core').then((mod) => mod.Puck),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-gray-500">Loading editor...</div> }
);

export type PuckData = Record<string, unknown>;

export interface PuckUndoRedoApi {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface PuckEditorProps {
  data: PuckData;
  onChange: (data: PuckData) => void;
  onPublish?: (data: PuckData) => void;
  className?: string;
  puckApiRef?: React.MutableRefObject<PuckUndoRedoApi | null>;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export function PuckEditor({ data, onChange, onPublish, className, puckApiRef, onHistoryChange }: PuckEditorProps) {
  const handleChange = useCallback(
    (newData: PuckData) => {
      onChange(newData);
    },
    [onChange]
  );

  const handlePublish = useCallback(
    (published: PuckData) => {
      onChange(published);
      onPublish?.(published);
    },
    [onChange, onPublish]
  );

  const overrides = {
    header: ({ children }: { children: React.ReactNode; actions: React.ReactNode }) => (
      <>
        <PuckUndoRedoBridge apiRef={puckApiRef} onHistoryChange={onHistoryChange} />
        {children}
      </>
    ),
    fields: ({
      children,
      itemSelector,
    }: {
      children: React.ReactNode;
      isLoading: boolean;
      itemSelector?: { index: number; zone?: string } | null;
    }) => <RightPanelSections itemSelector={itemSelector ?? null}>{children}</RightPanelSections>,
  };

  return (
    <div className={className ?? 'h-full w-full min-w-0 flex-1 overflow-hidden'}>
      <Puck config={puckConfig} data={data} onChange={handleChange} onPublish={handlePublish} overrides={overrides} />
    </div>
  );
}
