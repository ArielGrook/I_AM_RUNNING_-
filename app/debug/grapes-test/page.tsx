'use client';

import Link from 'next/link';

/**
 * GrapesJS debug page – removed with Puck migration.
 * Use the main editor at /[locale]/editor for the Puck-based editor.
 */
export default function GrapesTestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">GrapesJS Debug (removed)</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        GrapesJS was removed in the Puck migration. The main editor now uses Puck.
      </p>
      <Link
        href="/en/editor"
        className="text-[#FF6B35] hover:underline font-medium"
      >
        Open Puck editor →
      </Link>
    </div>
  );
}
