/**
 * Puck editor wrapper for main editor page.
 * Controlled component: data + onChange. Supports multi-page via parent state.
 */

'use client';

import '@puckeditor/core/puck.css';
import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { puckConfig } from '@/lib/editor/puck-config';

const Puck = dynamic(
  () => import('@puckeditor/core').then((mod) => mod.Puck),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-gray-500">Loading editor...</div> }
);

export type PuckData = Record<string, unknown>;

export interface PuckEditorProps {
  data: PuckData;
  onChange: (data: PuckData) => void;
  onPublish?: (data: PuckData) => void;
  className?: string;
}

export function PuckEditor({ data, onChange, onPublish, className }: PuckEditorProps) {
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

  return (
    <div className={className ?? 'h-full w-full min-w-0 flex-1 overflow-hidden'}>
      <Puck
        config={puckConfig}
        data={data}
        onChange={handleChange}
        onPublish={handlePublish}
      />
    </div>
  );
}
