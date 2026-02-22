'use client';

import React, { useCallback, useMemo } from 'react';
import { useEditor } from '@craftjs/core';

export interface PageInfo {
  id: string;
  name: string;
  slug: string;
}

export const PagesContext = React.createContext<{
  pages: PageInfo[];
  currentPage: string;
  navigateTo: (slug: string) => void;
}>({ pages: [], currentPage: '', navigateTo: () => {} });

function slugify(name: string): string {
  const s = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return s || 'page';
}

export type PageStateForContext = { id: string; name: string; slug?: string };

export function PagesProvider({
  children,
  pages,
  activePageId,
  onPageChange,
}: {
  children: React.ReactNode;
  pages: PageStateForContext[];
  activePageId: string;
  onPageChange: (targetId: string, currentPageJson: string) => void;
}) {
  const { query } = useEditor();
  const pageInfos: PageInfo[] = useMemo(
    () =>
      pages.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug ?? slugify(p.name) ?? p.id,
      })),
    [pages]
  );
  const navigateTo = useCallback(
    (slug: string) => {
      const page = pageInfos.find((p) => p.slug === slug);
      if (!page) return;
      try {
        const json = query.serialize();
        onPageChange(page.id, json);
      } catch {
        onPageChange(page.id, '');
      }
    },
    [pageInfos, query, onPageChange]
  );
  const value = useMemo(
    () => ({ pages: pageInfos, currentPage: activePageId, navigateTo }),
    [pageInfos, activePageId, navigateTo]
  );
  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}
