'use client';

import { useEditor } from '@craftjs/core';
import React from 'react';
import { useEditorTheme } from './EditorThemeContext';

type PageItem = { id: string; name: string };

export const Toolbar = ({
  onSave,
  onPreview,
  onAddPage,
  pages,
  activePageId,
  onPageChange,
  locale,
  router,
  isSaving,
}: {
  onSave: (serializedJson: string) => void;
  onPreview: () => void;
  onAddPage: () => void;
  pages: PageItem[];
  activePageId: string;
  onPageChange: (targetId: string, currentPageJson: string) => void;
  locale: string;
  router: { push: (path: string) => void };
  isSaving: boolean;
}) => {
  const { query, actions } = useEditor();
  const canUndo = query.history.canUndo();
  const canRedo = query.history.canRedo();
  const { theme, toggle, t } = useEditorTheme();

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

  const btnCls = `px-3 py-1.5 rounded text-xs transition-colors ${t(
    'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60',
    'text-gray-400 hover:text-white hover:bg-gray-700/60'
  )}`;
  const iconBtnCls = `w-8 h-8 flex items-center justify-center rounded text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${t(
    'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60',
    'text-gray-400 hover:text-white hover:bg-gray-700/60'
  )}`;
  const dividerCls = `w-px h-6 mx-1 ${t('bg-gray-300', 'bg-gray-700/60')}`;

  return (
    <div className={`h-12 border-b flex items-center px-3 gap-1 shrink-0 ${t(
      'bg-white border-gray-200',
      'bg-[#1a1a1a] border-gray-700/60'
    )}`}>
      {/* Back */}
      <button onClick={() => router.push(`/${locale}/dashboard`)} className={btnCls} title="Back to Dashboard">
        ← Back
      </button>

      <div className={dividerCls} />

      {/* Save */}
      <button
        data-save-btn
        onClick={handleSave}
        disabled={isSaving}
        className="px-3 py-1.5 rounded text-xs font-semibold transition-all
          bg-[#FF6B35] text-white hover:bg-[#ff8555] disabled:opacity-50 shadow-sm shadow-[#FF6B35]/20"
      >
        {isSaving ? '...' : 'Save'}
      </button>

      {/* Undo / Redo */}
      <button onClick={() => actions.history.undo()} disabled={!canUndo} className={iconBtnCls} title="Undo (Ctrl+Z)">↩</button>
      <button onClick={() => actions.history.redo()} disabled={!canRedo} className={iconBtnCls} title="Redo (Ctrl+Shift+Z)">↪</button>

      <div className={dividerCls} />

      {/* Preview */}
      <button onClick={onPreview} className={btnCls} title="Preview">Preview</button>

      {/* Export */}
      <button onClick={handleExportJSON} className={btnCls} title="Export JSON">Export</button>

      {/* Theme toggle */}
      <button onClick={toggle} className={btnCls} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pages */}
      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => handlePageClick(page.id)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              page.id === activePageId
                ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/40'
                : t(
                    'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent',
                    'text-gray-500 hover:text-gray-300 hover:bg-gray-700/40 border border-transparent'
                  )
            }`}
          >
            {page.name}
          </button>
        ))}
        <button
          onClick={onAddPage}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 transition-colors text-sm"
          title="Add page"
        >
          +
        </button>
      </div>
    </div>
  );
};
