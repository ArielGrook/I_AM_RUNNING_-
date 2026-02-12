'use client';

import { useEffect } from 'react';

/**
 * Applies dark mode from localStorage on initial load.
 * Syncs with dashboard/editor dark mode preference when navigating or refreshing.
 */
export function DarkModeInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
    } else if (saved === 'false') {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  return null;
}
