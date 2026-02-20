'use client';

import { useEditor } from '@craftjs/core';
import React, { useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useEditorTheme } from './EditorThemeContext';

const ROOT_NODE = 'ROOT';

const ICONS: Record<string, string> = {
  Container: '▦', Text: 'T', Button: '▣', Image: '🖼',
  Hero: '◉', CTA: '▶', Features: '✦', Header: '☰', Footer: '▬',
  Testimonials: '💬', Pricing: '💰', FAQ: '❓', Divider: '—', Video: '▶️',
};

const TYPE_COLORS: Record<string, string> = {
  Container: '#6366f1', Text: '#8b5cf6', Button: '#f59e0b',
  Image: '#10b981', Hero: '#ef4444', CTA: '#ec4899',
  Features: '#14b8a6', Header: '#3b82f6', Footer: '#64748b',
  Testimonials: '#a855f7', Pricing: '#22c55e', FAQ: '#f97316',
  Divider: '#94a3b8', Video: '#e11d48',
};

export const LayersPanel = () => {
  const editor = useEditor();
  const { currentSelectedId } = useEditor((state) => {
    const sel = state.events.selected;
    return { currentSelectedId: sel?.values().next().value as string | undefined };
  });
  const { t } = useEditorTheme();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [layersOpen, setLayersOpen] = useState(false);

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

  // Move node up/down within its parent
  const moveNode = useCallback((nodeId: string, direction: 'up' | 'down') => {
    try {
      const node = query.node(nodeId).get();
      const parentId = node.data.parent;
      if (!parentId) return;
      const parent = query.node(parentId).get();
      const siblings = [...(parent.data.nodes ?? [])];
      const idx = siblings.indexOf(nodeId);
      if (idx < 0) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= siblings.length) return;
      actions.move(nodeId, parentId, targetIdx);
    } catch { /* noop */ }
  }, [query, actions]);

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
      const typeColor = TYPE_COLORS[displayName] ?? '#6b7280';

      return (
        <div key={id}>
          <div
            className={`group flex items-center gap-1 rounded-md transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#FF6B35]/12 text-[#FF6B35]'
                : t('text-gray-600 hover:bg-gray-100 hover:text-gray-900', 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200')
            }`}
            style={{ paddingLeft: `${6 + depth * 16}px`, height: 28 }}
            onClick={() => actions.selectNode(id)}
          >
            {/* Depth line */}
            {depth > 0 && (
              <span
                className="absolute shrink-0"
                style={{
                  left: `${depth * 16 - 4}px`,
                  width: 1,
                  height: 28,
                  background: t('rgba(0,0,0,0.06)', 'rgba(255,255,255,0.06)'),
                }}
              />
            )}

            {/* Expand/collapse */}
            {hasChildren ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
                className={`w-4 h-4 flex items-center justify-center text-[8px] shrink-0 rounded transition-colors ${t('text-gray-400 hover:text-gray-700 hover:bg-gray-200', 'text-gray-500 hover:text-gray-300 hover:bg-gray-600')}`}
              >
                {isCollapsed ? '▸' : '▾'}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {/* Type dot + icon */}
            <span
              className="w-4 h-4 flex items-center justify-center rounded text-[9px] shrink-0"
              style={{ color: typeColor, opacity: 0.8 }}
            >
              {icon}
            </span>

            {/* Name */}
            <span className={`text-[11px] font-medium truncate flex-1 ${isRoot ? t('text-gray-400 italic', 'text-gray-500 italic') : ''}`}>
              {isRoot ? 'Root' : displayName}
            </span>

            {/* Action buttons on hover */}
            {!isRoot && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mr-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); moveNode(id, 'up'); }}
                  className={`w-4 h-4 flex items-center justify-center rounded text-[8px] ${t('text-gray-400 hover:text-gray-700 hover:bg-gray-200', 'text-gray-500 hover:text-gray-300 hover:bg-gray-600')}`}
                  title="Move up"
                >▲</button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveNode(id, 'down'); }}
                  className={`w-4 h-4 flex items-center justify-center rounded text-[8px] ${t('text-gray-400 hover:text-gray-700 hover:bg-gray-200', 'text-gray-500 hover:text-gray-300 hover:bg-gray-600')}`}
                  title="Move down"
                >▼</button>
                {isSelected && (
                  <button
                    onClick={(e) => { e.stopPropagation(); actions.delete(id); }}
                    className="w-4 h-4 flex items-center justify-center rounded text-[8px] text-gray-500 hover:text-red-500 hover:bg-red-100/60"
                    title="Delete"
                  >✕</button>
                )}
              </div>
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
    <div className={`w-52 flex flex-col shrink-0 overflow-hidden ${t(
      'bg-white',
      'bg-[#1e1e1e]'
    )}`}>
      <button
        type="button"
        onClick={() => setLayersOpen(!layersOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider border-t ${t(
          'text-gray-500 hover:text-gray-700 border-gray-200',
          'text-gray-400 hover:text-white border-gray-800'
        )}`}
      >
        <span>Layers</span>
        <ChevronDown
          size={12}
          className={layersOpen ? 'rotate-180' : ''}
          style={{ transition: 'transform 0.2s' }}
        />
      </button>
      {layersOpen && (
        <div className="max-h-48 overflow-y-auto craft-editor-left py-1 px-1 relative">
          {renderNode(rootId, 0)}
        </div>
      )}
    </div>
  );
};
