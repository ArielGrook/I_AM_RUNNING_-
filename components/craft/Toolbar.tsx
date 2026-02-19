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
  outlines,
  onToggleOutlines,
  previewMode,
  onTogglePreview,
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
  outlines: boolean;
  onToggleOutlines: () => void;
  previewMode: boolean;
  onTogglePreview: () => void;
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

  const btnCls = `px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${t(
    'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    'text-gray-400 hover:text-white hover:bg-gray-700/60'
  )}`;
  const iconBtnCls = `w-8 h-8 flex items-center justify-center rounded-md text-sm transition-all disabled:opacity-25 disabled:cursor-not-allowed ${t(
    'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
    'text-gray-400 hover:text-white hover:bg-gray-700/60'
  )}`;
  const activeBtnCls = `px-2.5 py-1.5 rounded-md text-xs font-medium transition-all bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30`;
  const dividerCls = `w-px h-6 mx-1.5 ${t('bg-gray-200', 'bg-gray-700/60')}`;

  if (previewMode) {
    return (
      <div className={`h-12 border-b flex items-center justify-center px-3 gap-2 shrink-0 ${t(
        'bg-white border-gray-200',
        'bg-[#1a1a1a] border-gray-700/60'
      )}`}>
        <span className={`text-xs font-medium ${t('text-gray-500', 'text-gray-400')}`}>Preview Mode</span>
        <button onClick={onTogglePreview} className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FF6B35] text-white hover:bg-[#ff8555] transition-all">
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

      <div className={dividerCls} />

      {/* Save */}
      <button
        data-save-btn
        onClick={handleSave}
        disabled={isSaving}
        className="px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all
          bg-[#FF6B35] text-white hover:bg-[#ff8555] disabled:opacity-50 shadow-sm shadow-[#FF6B35]/20"
      >
        {isSaving ? '⏳' : '💾 Save'}
      </button>

      {/* Undo / Redo */}
      <button onClick={() => actions.history.undo()} disabled={!canUndo} className={iconBtnCls} title="Undo (Ctrl+Z)">↩</button>
      <button onClick={() => actions.history.redo()} disabled={!canRedo} className={iconBtnCls} title="Redo (Ctrl+Y)">↪</button>

      <div className={dividerCls} />

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
            onClick={() => handlePageClick(page.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              page.id === activePageId
                ? 'bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30'
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
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 transition-all text-sm"
          title="Add page"
        >
          +
        </button>
      </div>
    </div>
  );
};
