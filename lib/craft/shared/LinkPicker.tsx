'use client';

import React, { useContext } from 'react';
import { useEditor } from '@craftjs/core';
import { PagesContext } from '@/lib/craft/context/PagesContext';

export type LinkValue = {
  type: 'section' | 'page' | 'external';
  href: string;
};

export function LinkPicker({
  value,
  onChange,
  label = 'Link',
}: {
  value: LinkValue;
  onChange: (val: LinkValue) => void;
  label?: string;
}) {
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5';
  const inputCls = 'w-full px-3 py-2 rounded-md text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 mb-3';

  // Секции на странице
  const { nodes } = useEditor((s) => ({ nodes: s.nodes }));
  const availableSections = React.useMemo(() => {
    const nodeList = nodes ? Object.values(nodes) : [];
    return nodeList
      .filter((n) => (n?.data?.props as Record<string, unknown>)?.['data-block-type'])
      .map((n) => {
        const props = n?.data?.props as Record<string, unknown> | undefined;
        const blockType = props?.['data-block-type'] as string;
        const displayName = (n?.data?.displayName as string) || blockType || n?.id;
        return { id: n?.id ?? '', label: displayName, blockType: blockType ?? '' };
      })
      .filter((s) => s.blockType);
  }, [nodes]);

  // Страницы
  let pages: Array<{ id: string; name: string; slug: string }> = [];
  try {
    const pagesCtx = useContext(PagesContext);
    pages = pagesCtx?.pages ?? [];
  } catch {
    // PagesContext не доступен
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label className={labelCls}>{label}</label>
      <select
        className={inputCls}
        value={value.type}
        onChange={(e) => onChange({ type: e.target.value as LinkValue['type'], href: '' })}
      >
        <option value="section">Section on page</option>
        <option value="page">Another page</option>
        <option value="external">External URL</option>
      </select>

      {value.type === 'section' && (
        <select
          className={inputCls}
          value={value.href}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
        >
          <option value="">Select section...</option>
          {availableSections.map((s) => (
            <option key={s.id} value={`#${s.blockType}`}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      {value.type === 'page' && (
        <select
          className={inputCls}
          value={value.href}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
        >
          <option value="">Select page...</option>
          {pages.map((p) => (
            <option key={p.id} value={`/${p.slug}`}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {value.type === 'external' && (
        <input
          className={inputCls}
          type="text"
          placeholder="https://..."
          value={value.href}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
        />
      )}
    </div>
  );
}

// Хелпер — конвертировать простой href строку в LinkValue
export function hrefToLinkValue(href: string): LinkValue {
  if (!href || href === '#') return { type: 'external', href: '#' };
  if (href.startsWith('#')) return { type: 'section', href };
  if (href.startsWith('/')) return { type: 'page', href };
  return { type: 'external', href };
}

// Хелпер — универсальный обработчик кликов для всех типов ссылок
export function handleLinkClick(
  e: React.MouseEvent | React.TouchEvent,
  href: string,
  enabled: boolean,
  navigateToPage?: (slug: string) => void
) {
  if (enabled) {
    e.preventDefault();
    return;
  }
  if (!href || href === '#') {
    e.preventDefault();
    return;
  }

  e.preventDefault();

  if (href.startsWith('#')) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (href.startsWith('/')) {
    const pageSlug = href.replace(/^\//, '');
    if (navigateToPage) {
      navigateToPage(pageSlug);
    } else {
      window.location.href = href;
    }
    return;
  }

  window.open(href, '_blank');
}
