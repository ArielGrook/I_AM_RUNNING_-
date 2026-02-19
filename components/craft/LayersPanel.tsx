'use client';

import { useEditor } from '@craftjs/core';
import React, { useState } from 'react';
import { useEditorTheme } from './EditorThemeContext';

const ROOT_NODE = 'ROOT';

const ICONS: Record<string, string> = {
  Container: '▦',
  Text: 'T',
  Button: '▣',
  Image: '🖼',
  Hero: '◉',
  CTA: '▶',
  Features: '✦',
  Header: '☰',
  Footer: '▬',
};

export const LayersPanel = () => {
  const editor = useEditor();
  const { currentSelectedId } = useEditor((state) => {
    const sel = state.events.selected;
    return { currentSelectedId: sel?.values().next().value as string | undefined };
  });
  const { t } = useEditorTheme();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!editor?.query || !editor?.actions) return null;
  const { query, actions } = editor;

  const getRootId = (): string | null => {
    try {
      if (query.node(ROOT_NODE).isRoot()) return ROOT_NODE;
    } catch { /* noop */ }
    try {
      const state = query.getState();
      const nodeEntries = Object.values(state.nodes ?? {});
      const root = nodeEntries.find(
        (n) => n && typeof n === 'object' && 'data' in n && (n as { data: { parent: string | null } }).data.parent == null
      );
      return (root as { id?: string } | undefined)?.id ?? null;
    } catch { return null; }
  };

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderNode = (id: string, depth: number): React.ReactNode => {
    try {
      const node = query.node(id).get();
      const displayName = node.data.displayName || node.data.name || 'Node';
      const childIds = node.data.nodes ?? [];
      const linkedIds = Object.values(node.data.linkedNodes ?? {});
      const allChildren = [...childIds, ...linkedIds];
      const hasChildren = allChildren.length > 0;
      const isCollapsed = collapsed[id] ?? false;
      const isSelected = currentSelectedId === id;
      const isRoot = node.data.parent === null;
      const icon = ICONS[displayName] ?? '•';

      return (
        <div key={id}>
          <div
            className={`group flex items-center gap-1 rounded-md transition-colors cursor-pointer ${
              isSelected
                ? 'bg-[#FF6B35]/15 text-[#FF6B35]'
                : t('text-gray-500 hover:bg-gray-100 hover:text-gray-800', 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200')
            }`}
            style={{ paddingLeft: `${8 + depth * 14}px`, height: 30 }}
            onClick={() => actions.selectNode(id)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
                className={`w-4 h-4 flex items-center justify-center text-[9px] shrink-0 ${t('text-gray-400 hover:text-gray-700', 'text-gray-500 hover:text-gray-300')}`}
              >
                {isCollapsed ? '▸' : '▾'}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className="text-[11px] w-4 text-center shrink-0 opacity-60">{icon}</span>
            <span className={`text-[11px] font-medium truncate flex-1 ${isRoot ? t('text-gray-400', 'text-gray-500') : ''}`}>
              {isRoot ? 'Root' : displayName}
            </span>
            {!isRoot && isSelected && (
              <button
                onClick={(e) => { e.stopPropagation(); actions.delete(id); }}
                className="w-5 h-5 flex items-center justify-center rounded text-[10px] text-gray-500 hover:text-red-500 hover:bg-red-100/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mr-1"
                title="Delete"
              >✕</button>
            )}
          </div>
          {hasChildren && !isCollapsed && (
            <div>{allChildren.map((cid) => renderNode(cid, depth + 1))}</div>
          )}
        </div>
      );
    } catch {
      return null;
    }
  };

  const rootId = getRootId();
  if (!rootId) return null;

  return (
    <div className={`w-52 border-r flex flex-col shrink-0 overflow-hidden ${t(
      'bg-white border-gray-200',
      'bg-[#1e1e1e] border-gray-700/60'
    )}`}>
      <div className={`px-4 py-3 border-b shrink-0 ${t('border-gray-200', 'border-gray-700/60')}`}>
        <span className={`text-sm font-semibold tracking-wide ${t('text-gray-900', 'text-white')}`}>Layers</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {renderNode(rootId, 0)}
      </div>
    </div>
  );
};
