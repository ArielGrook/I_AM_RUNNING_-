'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useCallback } from 'react';

type TronFooterLink = { label: string; href: string };
type TronFooterColumn = { title: string; links: TronFooterLink[] };

const DEFAULT_COLUMNS: TronFooterColumn[] = [
  { title: 'Product', links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }, { label: 'FAQ', href: '#' }] },
  { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Contact', href: '#' }] },
];

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

export const TronFooter = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  logoText = 'Brand',
  description = 'Building tools for modern teams. Fast, simple, reliable.',
  columns = DEFAULT_COLUMNS,
  copyright = '© 2025 Company. All rights reserved.',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  logoText?: string;
  description?: string;
  columns?: TronFooterColumn[];
  copyright?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) {
        const rect = e.currentTarget.getBoundingClientRect();
        setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    },
    [enabled]
  );

  const tokens = colorScheme === 'dark'
    ? { bg: '#000000', text: '#ffffff', muted: '#52525b', accent: accentColor }
    : { bg: '#ffffff', text: '#0a0a0a', muted: '#52525b', accent: accentColor };
  const rgb = hexToRgb(accentColor ?? '#e11d48');
  const gridColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const gridLines =
    `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`;
  const spotlight =
    `radial-gradient(500px circle at ${cursor.x}px ${cursor.y}px, rgba(${rgb}, 0.08), transparent 60%)`;
  const backgroundImage = hovered && !enabled ? `${spotlight}, ${gridLines}` : gridLines;
  const backgroundSize = hovered && !enabled ? 'auto, 50px 50px, 50px 50px' : '50px 50px';

  const list = columns ?? DEFAULT_COLUMNS;
  const firstLetter = (logoText || 'B').charAt(0).toUpperCase();

  return (
    <footer
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-16 ${isSelected ? 'outline outline-2 outline-red-500' : ''}`}
      style={{
        background: tokens.bg,
        borderTop: `1px solid rgba(${rgb}, 0.2)`,
        backgroundImage,
        backgroundSize,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 4,
                background: tokens.accent,
                color: tokens.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              {firstLetter}
            </div>
            <p style={{ fontSize: 14, color: tokens.muted, lineHeight: 1.6, margin: 0, maxWidth: 280 }}>{description}</p>
          </div>
          {list.map((col, i) => (
            <div key={i}>
              <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.accent, margin: '0 0 12px' }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(col.links ?? []).map((link, j) => (
                  <li key={j} style={{ marginBottom: 8 }}>
                    <a href={link.href} style={{ fontSize: 14, color: tokens.text, textDecoration: 'none' }}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid rgba(${rgb}, 0.15)` }}>
          <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>{copyright}</p>
        </div>
      </div>
    </footer>
  );
};

const TronFooterSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, logoText, description, columns, copyright } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    logoText: node.data.props.logoText as string,
    description: node.data.props.description as string,
    columns: node.data.props.columns as TronFooterColumn[],
    copyright: node.data.props.copyright as string,
  }));
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateColumn = (colIndex: number, field: 'title' | 'links', value: string | TronFooterLink[]) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.columns as TronFooterColumn[])];
      arr[colIndex] = { ...arr[colIndex], [field]: value };
      p.columns = arr;
    });
  };

  const updateLink = (colIndex: number, linkIndex: number, field: 'label' | 'href', value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.columns as TronFooterColumn[])];
      const links = [...(arr[colIndex].links ?? [])];
      links[linkIndex] = { ...links[linkIndex], [field]: value };
      arr[colIndex] = { ...arr[colIndex], links };
      p.columns = arr;
    });
  };

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Color scheme</label><select value={colorScheme ?? 'dark'} onChange={(e) => setT('colorScheme', 300)(e.target.value)} className={inputCls}><option value="dark">Dark</option><option value="light">Light</option></select></div>
          <div className="flex items-center gap-2"><label className={`${labelCls} shrink-0 w-20`}>Accent</label><input type="color" value={accentColor ?? '#e11d48'} onChange={(e) => setT('accentColor', 300)(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0" /><span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Logo text</label><input type="text" value={logoText ?? ''} onChange={(e) => setT('logoText', 500)(e.target.value)} className={inputCls} placeholder="Brand" /></div>
          <div><label className={labelCls}>Description</label><textarea value={description ?? ''} onChange={(e) => setT('description', 500)(e.target.value)} className={inputCls} rows={2} placeholder="Short description" /></div>
          <div><label className={labelCls}>Copyright</label><input type="text" value={copyright ?? ''} onChange={(e) => setT('copyright', 500)(e.target.value)} className={inputCls} /></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Columns</h3>
        <div className="space-y-3">
          {(columns ?? []).map((col, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/60 space-y-2">
              <input type="text" value={col.title} onChange={(e) => updateColumn(i, 'title', e.target.value)} className={inputCls} placeholder="Column title" />
              {(col.links ?? []).map((link, j) => (
                <div key={j} className="flex gap-2">
                  <input type="text" value={link.label} onChange={(e) => updateLink(i, j, 'label', e.target.value)} className={inputCls} placeholder="Label" />
                  <input type="text" value={link.href} onChange={(e) => updateLink(i, j, 'href', e.target.value)} className={inputCls} placeholder="URL" />
                  <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { const arr = [...(p.columns as TronFooterColumn[])]; arr[i].links = arr[i].links?.filter((_, k) => k !== j) ?? []; p.columns = arr; })} className="text-xs text-red-400 shrink-0">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { const arr = [...(p.columns as TronFooterColumn[])]; arr[i].links = [...(arr[i].links ?? []), { label: 'Link', href: '#' }]; p.columns = arr; })} className="text-xs text-gray-400">+ Add link</button>
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.columns = (p.columns as TronFooterColumn[]).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove column</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.columns = [...(p.columns as TronFooterColumn[] || []), { title: 'Links', links: [{ label: 'Link', href: '#' }] }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add column</button>
        </div>
      </section>
    </div>
  );
};

TronFooter.craft = {
  displayName: 'Tron Footer',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    logoText: 'Brand',
    description: 'Building tools for modern teams. Fast, simple, reliable.',
    columns: DEFAULT_COLUMNS,
    copyright: '© 2025 Company. All rights reserved.',
  },
  related: { settings: TronFooterSettings },
  custom: {
    styleTags: ['dark', 'neon', 'footer'],
    businessTags: ['footer', 'navigation', 'tech'],
    featureTags: ['footer', 'navigation'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
