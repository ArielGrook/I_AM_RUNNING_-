'use client';

import { useEditor } from '@craftjs/core';
import React from 'react';

export const Viewport = ({ children }: { children: React.ReactNode }) => {
  const { connectors } = useEditor();

  return (
    <div className="flex-1 bg-white overflow-auto min-w-0">
      <div
        ref={(ref) => {
          if (ref) {
            connectors.select(connectors.hover(ref, ''));
          }
        }}
        className="min-h-full p-4"
      >
        {children}
      </div>
    </div>
  );
};
