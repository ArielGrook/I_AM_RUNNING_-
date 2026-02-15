'use client';

import { useEditor } from '@craftjs/core';
import React from 'react';

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

  const handleSave = () => {
    try {
      const json = query.serialize();
      onSave(json);
    } catch (e) {
      console.error('Serialize failed:', e);
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

  return (
    <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4 shrink-0">
      <button
        onClick={() => router.push(`/${locale}/dashboard`)}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
      >
        ← Кабинет
      </button>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-4 py-2 bg-[#FF6B35] hover:bg-[#ff8555] rounded text-white disabled:opacity-50"
      >
        {isSaving ? '…' : '💾 Сохранить'}
      </button>
      <button
        onClick={() => actions.history.undo()}
        disabled={!canUndo}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo"
      >
        ↩ Undo
      </button>
      <button
        onClick={() => actions.history.redo()}
        disabled={!canRedo}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo"
      >
        ↪ Redo
      </button>
      <button
        onClick={onPreview}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
      >
        👁 Превью
      </button>
      <button
        onClick={onAddPage}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
      >
        + Страница
      </button>
      <div className="flex gap-2 ml-auto">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => handlePageClick(page.id)}
            className={`px-3 py-1 rounded ${
              page.id === activePageId
                ? 'bg-[#FF6B35] text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {page.name}
          </button>
        ))}
      </div>
    </div>
  );
};
