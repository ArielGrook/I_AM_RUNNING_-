'use client';

import { useEditor, useNode, NodeProvider } from '@craftjs/core';
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useEditorTheme } from './EditorThemeContext';

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
  const { t } = useEditorTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border-b last:border-0 ${t('border-gray-200', 'border-[#2a2a2a]')}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${t(
          'hover:bg-gray-100',
          'hover:bg-gray-700/40'
        )}`}
      >
        <span className={`text-[11px] font-semibold uppercase tracking-widest ${t('text-gray-500', 'text-gray-400')}`}>
          {title}
        </span>
        <span className={`text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''} ${t('text-gray-400', 'text-gray-500')}`}>
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
      className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors text-sm"
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
  const { t } = useEditorTheme();
  const { actions } = useEditor();
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
    <div
      className={`craft-settings-panel w-72 border-l flex flex-col shrink-0 ${t(
        'bg-white border-gray-200',
        'bg-[#1a1a1a] border-[#2a2a2a]'
      )}`}
      style={{ height: '100%' }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${t('border-gray-200', 'border-[#2a2a2a]')}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#FF6B35] shrink-0" />
          <span className={`text-sm font-semibold truncate ${t('text-gray-900', 'text-white')}`}>
            {selected?.name ?? 'Inspector'}
          </span>
        </div>
        {selected?.isDeletable && (
          <NodeProvider id={selected.id}>
            <DeleteNodeButton />
          </NodeProvider>
        )}
      </div>

      {/* Body — scrollable */}
      <div className={`flex-1 min-h-0 overflow-y-auto craft-editor-right ${t('text-gray-900', 'text-white')}`}>
        {!selected ? (
          <div className="text-sm text-gray-500 p-4">
            Select a component to edit its properties
          </div>
        ) : selected.settings ? (
          <NodeProvider id={selected.id} related>
            {React.createElement(selected.settings)}
          </NodeProvider>
        ) : (
          <div className="text-sm text-gray-500 p-4">
            Select a component to edit its properties
          </div>
        )}
      </div>

      {/* Delete button — always visible when a non-ROOT node is selected */}
      {selected?.id && selected.id !== 'ROOT' && (
        <div className="p-4 border-t border-[#2a2a2a] mt-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this component?')) {
                actions.delete(selected.id);
              }
            }}
            className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={14} />
            Delete Component
          </button>
        </div>
      )}
    </div>
  );
};
