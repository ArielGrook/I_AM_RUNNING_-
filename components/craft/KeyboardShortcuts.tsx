'use client';

import { useEditor } from '@craftjs/core';
import { useEffect, useCallback } from 'react';

/**
 * Keyboard shortcuts for the Craft.js editor.
 * Must be rendered inside <Editor>.
 *
 * Ctrl+Z  → Undo
 * Ctrl+Shift+Z / Ctrl+Y → Redo
 * Ctrl+S  → Save (calls onSave callback)
 * Delete / Backspace → Delete selected node
 */
export const KeyboardShortcuts = ({
  onSave,
}: {
  onSave: () => void;
}) => {
  const { actions, query } = useEditor();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas/contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isEditable) {
        // Still allow Ctrl+S in inputs
        if (!(e.ctrlKey && e.key === 's')) return;
      }

      // Ctrl+Z → Undo
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (query.history.canUndo()) actions.history.undo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y → Redo
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        if (query.history.canRedo()) actions.history.redo();
        return;
      }

      // Ctrl+S → Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onSave();
        return;
      }

      // Delete / Backspace → Delete selected node
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const selectedId = query.getEvent('selected').first();
        if (selectedId && query.node(selectedId).isDeletable()) {
          actions.delete(selectedId);
        }
      }
    },
    [actions, query, onSave]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
};
