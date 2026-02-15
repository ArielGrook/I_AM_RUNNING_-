'use client';

import { useEditor, NodeProvider } from '@craftjs/core';
import React from 'react';

export const SettingsPanel = () => {
  const selected = useEditor((state) => {
    const currentNodeId = state.events.selected.values().next().value;
    if (!currentNodeId) return null;
    const node = state.nodes[currentNodeId];
    if (!node) return null;
    const settings = (node.related as { settings?: React.ComponentType })?.settings;
    return {
      id: currentNodeId,
      name: node.data.displayName ?? node.data.name ?? 'Component',
      settings,
    };
  });

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto shrink-0">
      <div className="p-4 border-b border-gray-700 font-semibold text-white">
        {selected?.name ?? 'Settings'}
      </div>
      <div className="text-white">
        {selected?.settings ? (
          <NodeProvider id={selected.id} related>
            {React.createElement(selected.settings)}
          </NodeProvider>
        ) : (
          <div className="p-4 text-gray-400 text-sm">
            Select a component to edit its properties
          </div>
        )}
      </div>
    </div>
  );
};
