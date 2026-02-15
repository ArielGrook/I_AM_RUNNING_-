'use client';

import { useEditor } from '@craftjs/core';
import React from 'react';

const ROOT_NODE = 'ROOT';

export const LayersPanel = () => {
  const editor = useEditor();
  const nodes = useEditor((state) => state.nodes);

  if (!editor?.query || !editor?.actions) return null;

  const { query, actions } = editor;

  const getRootId = (): string | null => {
    try {
      if (query.node(ROOT_NODE).isRoot()) {
        return ROOT_NODE;
      }
    } catch {
      // ROOT may not exist
    }
    const root = Object.values(nodes || {}).find(
      (n) => n && n.data != null && n.data.parent == null
    );
    return root?.id ?? null;
  };

  const renderNode = (id: string, depth: number) => {
    try {
      const node = query.node(id).get();
      const displayName = node.data.displayName || node.data.name || 'Node';
      const childIds = node.data.nodes ?? [];

      return (
        <div key={id} className="mb-1">
          <button
            onClick={() => actions.selectNode(id)}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-600 text-white text-sm truncate"
            style={{ paddingLeft: `${12 + depth * 12}px` }}
          >
            {displayName}
          </button>
          {childIds.map((childId) => renderNode(childId, depth + 1))}
        </div>
      );
    } catch {
      return null;
    }
  };

  const rootId = getRootId();
  if (!rootId) return null;

  return (
    <div className="w-56 bg-gray-800 border-r border-gray-700 overflow-y-auto shrink-0">
      <div className="p-4 border-b border-gray-700 font-semibold text-white">
        Layers
      </div>
      <div className="p-4">
        {renderNode(rootId, 0)}
      </div>
    </div>
  );
};
