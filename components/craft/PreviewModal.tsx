'use client';

import React from 'react';

export const PreviewModal = ({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close preview"
      />
      <div className="relative z-10 w-[90vw] max-w-4xl h-[80vh] bg-gray-900 rounded-lg shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
          <h2 className="text-white font-semibold">Preview</h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-600 text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            srcDoc={data}
            title="Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
};
