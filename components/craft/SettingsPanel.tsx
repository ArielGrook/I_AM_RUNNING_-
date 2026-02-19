'use client';

import { useEditor, useNode, NodeProvider } from '@craftjs/core';
import React, { useState } from 'react';

// ── Accordion section ──────────────────────────────────
export function SettingsSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-700/60 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-700/40 transition-colors"
      >
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {title}
        </span>
        <span className={`text-gray-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && <div className="px-3 pb-3 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

// ── Delete button (inner — needs useNode context) ──────
function DeleteNodeButton() {
  const { actions } = useEditor();
  const { id } = useNode();
  return (
    <button
      onClick={() => actions.delete(id)}
      title="Delete component"
      className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-red-900/40 hover:text-red-400 transition-colors text-sm"
    >
      ✕
    </button>
  );
}

type SelectedInfo = {
  id: string;
  name: string;
  isDeletable: boolean;
  settings: React.ComponentType | undefined;
} | null;

// ── Main panel ─────────────────────────────────────────
export const SettingsPanel = () => {
  const { selected } = useEditor((state): { selected: SelectedInfo } => {
    const currentNodeId = state.events.selected.values().next().value as string | undefined;
    if (!currentNodeId) return { selected: null };
    const node = state.nodes[currentNodeId];
    if (!node) return { selected: null };
    const settings = (node.related as { settings?: React.ComponentType })?.settings;
    return {
      selected: {
        id: currentNodeId,
        name: node.data.displayName ?? node.data.name ?? 'Component',
        isDeletable: node.data.parent !== null,
        settings,
      },
    };
  });

  return (
    <div className="w-72 bg-[#1e1e1e] border-l border-gray-700/60 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#FF6B35] shrink-0" />
          <span className="text-sm font-semibold text-white truncate">
            {selected?.name ?? 'Settings'}
          </span>
        </div>
        {selected?.isDeletable && (
          <NodeProvider id={selected.id}>
            <DeleteNodeButton />
          </NodeProvider>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto text-white custom-scrollbar">
        {selected?.settings ? (
          <NodeProvider id={selected.id} related>
            {React.createElement(selected.settings)}
          </NodeProvider>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <span className="text-3xl opacity-30">⚙️</span>
            <p className="text-gray-500 text-sm">
              Select a component on the canvas to edit its properties
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
