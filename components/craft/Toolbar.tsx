'use client';

import { useEditor } from '@craftjs/core';
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useEditorTheme } from './EditorThemeContext';

type PageItem = { id: string; name: string };

const ROOT_ID = 'ROOT';

export const Toolbar = ({
  onSave,
  onPreview,
  onAddPage,
  pages,
  setPages,
  activePageId,
  onPageChange,
  locale,
  router,
  isSaving,
  outlines,
  onToggleOutlines,
  previewMode,
  onTogglePreview,
  previewScheme = 'dark',
  setPreviewScheme,
  onReplayAnimations,
  projectId,
  projectName,
  onRenameProject,
}: {
  onSave: (serializedJson: string) => void;
  onPreview: () => void;
  onAddPage: () => void;
  pages: PageItem[];
  setPages: React.Dispatch<React.SetStateAction<PageItem[]>>;
  activePageId: string;
  onPageChange: (targetId: string, currentPageJson: string) => void;
  locale: string;
  router: { push: (path: string) => void };
  isSaving: boolean;
  outlines: boolean;
  onToggleOutlines: () => void;
  previewMode: boolean;
  onTogglePreview: () => void;
  previewScheme?: 'dark' | 'light';
  setPreviewScheme?: (s: 'dark' | 'light' | ((prev: 'dark' | 'light') => 'dark' | 'light')) => void;
  onReplayAnimations?: () => void | Promise<void>;
  projectId?: string | null;
  projectName?: string;
  onRenameProject?: (newName: string) => Promise<void>;
}) => {
  const { query, actions } = useEditor();
  const canUndo = query.history.canUndo();
  const canRedo = query.history.canRedo();
  const { theme, toggle, t } = useEditorTheme();
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState('');
  const [editingProject, setEditingProject] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState('');

  const handleSave = () => {
    try {
      const json = query.serialize();
      onSave(json);
    } catch (e) {
      console.error('Serialize failed:', e);
    }
  };

  const handleExportJSON = () => {
    try {
      const json = query.serialize();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `page-${activePageId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handlePageClick = (targetId: string) => {
    if (targetId === activePageId) return;
    try {
      const json = query.serialize();
      onPageChange(targetId, json);
    } catch (e) {
      console.error('Serialize failed:', e);
      onPageChange(targetId, '');
    }
  };

  const clearCanvas = () => {
    if (!window.confirm('Clear all content? This cannot be undone.')) return;
    try {
      const state = query.getState();
      const rootNode = state?.nodes?.[ROOT_ID];
      const childIds = (rootNode?.data?.nodes ?? []) as string[];
      [...childIds].reverse().forEach((id) => {
        try {
          actions.delete(id);
        } catch {}
      });
    } catch (e) {
      console.error('Clear canvas failed:', e);
    }
  };

  const btnCls = `px-3 py-2 h-9 min-w-[36px] rounded-md text-[13px] font-medium transition-all ${t(
    'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    'text-gray-400 hover:text-white hover:bg-gray-700/60'
  )}`;
  const iconBtnCls = `w-9 h-9 min-w-[36px] flex items-center justify-center rounded-md text-[13px] transition-all disabled:opacity-25 disabled:cursor-not-allowed ${t(
    'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
    'text-gray-400 hover:text-white hover:bg-gray-700/60'
  )}`;
  const activeBtnCls = `px-3 py-2 h-9 rounded-md text-[13px] font-medium transition-all bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30`;
  const dividerCls = `w-px h-6 mx-1.5 ${t('bg-gray-200', 'bg-gray-700/60')}`;

  const applySchemeToTronNodes = (scheme: 'dark' | 'light') => {
    try {
      const state = query.getState();
      const nodes = state?.nodes ?? {};
      Object.keys(nodes).forEach((id) => {
        if (id === 'ROOT') return;
        const node = nodes[id];
        const props = node?.data?.props;
        if (props && 'colorScheme' in props) {
          actions.setProp(id, (p: Record<string, unknown>) => {
            p.colorScheme = scheme;
          });
        }
      });
    } catch {
      // noop
    }
  };

  const handleExitPreview = () => {
    applySchemeToTronNodes('dark');
    setPreviewScheme?.('dark');
    onTogglePreview();
  };

  if (previewMode) {
    return (
      <div className={`h-12 border-b flex items-center justify-center px-3 gap-2 shrink-0 ${t(
        'bg-white border-gray-200',
        'bg-[#1a1a1a] border-gray-700/60'
      )}`}>
        <span className={`text-xs font-medium ${t('text-gray-500', 'text-gray-400')}`}>Preview Mode</span>
        {setPreviewScheme && (
          <button
            type="button"
            onClick={() => {
              const newScheme = previewScheme === 'dark' ? 'light' : 'dark';
              setPreviewScheme(newScheme);
              applySchemeToTronNodes(newScheme);
            }}
            style={{
              background: previewScheme === 'light' ? '#ffffff' : '#0a0a0a',
              color: previewScheme === 'light' ? '#0a0a0a' : '#ffffff',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {previewScheme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        )}
        {onReplayAnimations && (
          <button
            type="button"
            onClick={() => onReplayAnimations()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-all"
          >
            ▶ Replay
          </button>
        )}
        <button onClick={handleExitPreview} className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FF6B35] text-white hover:bg-[#ff8555] transition-all">
          Exit Preview
        </button>
      </div>
    );
  }

  return (
    <div className={`h-12 border-b flex items-center px-3 gap-0.5 shrink-0 ${t(
      'bg-white border-gray-200',
      'bg-[#1a1a1a] border-gray-700/60'
    )}`}>
      {/* Back */}
      <button onClick={() => router.push(`/${locale}/dashboard`)} className={iconBtnCls} title="Back to Dashboard">
        ←
      </button>

      {/* Project name (inline edit) */}
      {editingProject ? (
        <input
          autoFocus
          value={editingProjectName}
          onChange={(e) => setEditingProjectName(e.target.value)}
          onBlur={async () => {
            const name = editingProjectName.trim();
            if (name && onRenameProject) {
              await onRenameProject(name);
            }
            setEditingProject(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') setEditingProject(false);
          }}
          style={{ width: `${Math.max(editingProjectName.length * 8, 80)}px` }}
          className="bg-transparent border-b border-orange-500 outline-none text-white text-sm px-1 ml-1"
        />
      ) : (
        <span
          onDoubleClick={() => {
            setEditingProject(true);
            setEditingProjectName(projectName ?? '');
          }}
          className={`ml-2 text-sm font-medium truncate max-w-[180px] cursor-text ${t('text-gray-700', 'text-gray-300')}`}
          title="Double-click to rename"
        >
          {projectName || 'Project'}
        </span>
      )}

      <div className={dividerCls} />

      {/* Save */}
      <button
        data-save-btn
        onClick={handleSave}
        disabled={isSaving}
        className="px-3 py-2 h-9 rounded-md text-[13px] font-semibold transition-all
          bg-[#FF6B35] text-white hover:bg-[#ff8555] disabled:opacity-50 shadow-sm shadow-[#FF6B35]/20"
      >
        {isSaving ? '⏳' : '💾 Save'}
      </button>

      {/* Undo / Redo */}
      <button onClick={() => actions.history.undo()} disabled={!canUndo} className={iconBtnCls} title="Undo (Ctrl+Z)">↩</button>
      <button onClick={() => actions.history.redo()} disabled={!canRedo} className={iconBtnCls} title="Redo (Ctrl+Y)">↪</button>

      <div className={dividerCls} />

      {/* Clear Canvas */}
      <button onClick={clearCanvas} className={iconBtnCls} title="Clear canvas">
        <Trash2 size={16} />
      </button>

      {/* Outlines */}
      <button
        onClick={onToggleOutlines}
        className={outlines ? activeBtnCls : btnCls}
        title="Toggle element outlines"
      >
        ⊞ Outlines
      </button>

      {/* Preview */}
      <button onClick={onTogglePreview} className={btnCls} title="Preview mode (hide panels)">
        👁 Preview
      </button>

      {/* Export */}
      <button onClick={handleExportJSON} className={btnCls} title="Export JSON">
        📥 Export
      </button>

      {/* Theme toggle */}
      <button onClick={toggle} className={iconBtnCls} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pages */}
      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => editingPageId !== page.id && handlePageClick(page.id)}
            className={`px-3 py-2 h-9 rounded-md text-[13px] font-medium transition-all flex items-center ${
              page.id === activePageId
                ? 'bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30'
                : t(
                    'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent',
                    'text-gray-500 hover:text-gray-300 hover:bg-gray-700/40 border border-transparent'
                  )
            }`}
          >
            {editingPageId === page.id ? (
              <input
                autoFocus
                value={editingPageName}
                onChange={(e) => setEditingPageName(e.target.value)}
                onBlur={() => {
                  if (editingPageName.trim()) {
                    setPages((prev) =>
                      prev.map((p) => (p.id === page.id ? { ...p, name: editingPageName.trim() } : p))
                    );
                  }
                  setEditingPageId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setEditingPageId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: `${Math.max(editingPageName.length * 8, 60)}px` }}
                className="bg-transparent border-b border-orange-500 outline-none text-white text-sm px-1"
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingPageId(page.id);
                  setEditingPageName(page.name);
                }}
              >
                {page.name}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={onAddPage}
          className="w-9 h-9 min-w-[36px] flex items-center justify-center rounded-md text-gray-500 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 transition-all text-[13px]"
          title="Add page"
        >
          +
        </button>
      </div>
    </div>
  );
};
