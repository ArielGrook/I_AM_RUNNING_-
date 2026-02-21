'use client';

import { useNode, useEditor } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React from 'react';

type TronFooterLink = { label: string; href: string };

const tokens = {
  dark: { bg: '#000000', text: '#ffffff', muted: '#52525b', accent: '#e11d48', gridColor: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', cardBg: 'rgba(255,255,255,0.02)', cardBorder: 'rgba(255,255,255,0.08)' },
  light: { bg: '#ffffff', text: '#0a0a0a', textSecondary: '#52525b', muted: '#52525b', accent: '#e11d48', border: 'rgba(0,0,0,0.08)', gridColor: 'rgba(0,0,0,0.06)', cardBg: 'rgba(0,0,0,0.02)', cardBorder: 'rgba(0,0,0,0.08)' },
};

// --- FooterColumn (editable child node) ---
export interface FooterColumnProps {
  title: string;
  links: TronFooterLink[];
  description?: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

export const FooterColumn = ({ title, links, description, accentColor, colorScheme, animationType, animateDelay }: FooterColumnProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const t = tokens[colorScheme];
  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }
  const isBrand = description != null && description !== '';
  const firstLetter = (title || 'B').charAt(0).toUpperCase();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...animAttrs}
      className={isSelected ? 'craft-node-selected' : ''}
    >
      {isBrand ? (
        <>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              background: t.accent,
              color: t.bg,
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
          <p style={{ fontSize: 14, color: t.muted, lineHeight: 1.6, margin: 0, maxWidth: 280 }}>{description}</p>
        </>
      ) : (
        <>
          <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.accent, margin: '0 0 12px' }}>{title || 'Links'}</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(links ?? []).map((link, j) => (
              <li key={j} style={{ marginBottom: 8 }}>
                <a href={link.href} style={{ fontSize: 14, color: t.text, textDecoration: 'none' }}>{link.label}</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

const FooterColumnSettings = () => {
  const { actions: { setProp } } = useNode();
  const { title, links, description, animationType, animateDelay } = useNode((n) => n.data.props as FooterColumnProps) ?? {} as FooterColumnProps;
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  const linkList = links ?? [];

  const updateLink = (index: number, field: 'label' | 'href', value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.links as TronFooterLink[])];
      arr[index] = { ...arr[index], [field]: value };
      p.links = arr;
    }, 500);
  };

  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Title</label><input type="text" value={title ?? ''} onChange={(e) => setT('title', 500)(e.target.value)} className={inputCls} placeholder="Column title" /></div>
      <div><label className={labelCls}>Description (optional, for brand column)</label><textarea value={description ?? ''} onChange={(e) => setT('description', 500)(e.target.value)} className={inputCls} rows={2} placeholder="Leave empty for link column" /></div>
      <div><label className={labelCls}>Links</label></div>
      {linkList.map((link, j) => (
        <div key={j} className="flex gap-2 items-center">
          <input value={link.label} onChange={(e) => updateLink(j, 'label', e.target.value)} className={inputCls} placeholder="Label" />
          <input value={link.href} onChange={(e) => updateLink(j, 'href', e.target.value)} className={inputCls} placeholder="URL" />
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.links = (p.links as TronFooterLink[]).filter((_, k) => k !== j); }, 500)} className="text-xs text-red-400 shrink-0">×</button>
        </div>
      ))}
      <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.links = [...(p.links as TronFooterLink[] || []), { label: 'Link', href: '#' }]; }, 500)} className="text-xs text-gray-400">+ Add link</button>
      <div><label className={labelCls}>Animation</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
};

FooterColumn.craft = {
  displayName: 'Footer Column',
  props: { title: 'Links', links: [{ label: 'Link', href: '#' }], accentColor: '#e11d48', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: FooterColumnSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

const DEFAULT_COL_0: Omit<FooterColumnProps, 'accentColor' | 'colorScheme'> = { title: 'Brand', description: 'Building tools for modern teams. Fast, simple, reliable.', links: [], animationType: 'none', animateDelay: '0' };
const DEFAULT_COL_1: Omit<FooterColumnProps, 'accentColor' | 'colorScheme'> = { title: 'Product', links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }, { label: 'FAQ', href: '#' }], animationType: 'none', animateDelay: '0' };
const DEFAULT_COL_2: Omit<FooterColumnProps, 'accentColor' | 'colorScheme'> = { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Contact', href: '#' }], animationType: 'none', animateDelay: '0' };
const DEFAULT_COLS = [DEFAULT_COL_0, DEFAULT_COL_1, DEFAULT_COL_2];

// --- TronFooter section ---
export const TronFooter = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  copyright = '© 2025 Company. All rights reserved.',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  copyright?: string;
}) => {
  const { id: sectionId, connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const editor = useEditor();
  const query = editor?.query;
  const t = tokens[colorScheme];
  const gridLines =
    `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`;
  const getNodeSafe = typeof query?.getNode === 'function' ? query.getNode.bind(query) : () => null;
  const colIds = [`${sectionId}-col-0`, `${sectionId}-col-1`, `${sectionId}-col-2`];

  return (
    <footer
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-16 ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        borderTop: `1px solid ${t.border}`,
        backgroundImage: gridLines,
        backgroundSize: '50px 50px',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {colIds.map((colId, i) => {
            const node = getNodeSafe(colId);
            const props = node?.data?.props
              ? { ...node.data.props, accentColor, colorScheme }
              : { ...DEFAULT_COLS[i], accentColor, colorScheme };
            return <Element key={colId} id={colId} is={FooterColumn} canvas {...(props as FooterColumnProps)} />;
          })}
        </div>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${t.border}` }}>
          <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>{copyright}</p>
        </div>
      </div>
    </footer>
  );
};

const TronFooterSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, copyright } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    copyright: node.data.props.copyright as string,
  }));
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

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
          <div><label className={labelCls}>Copyright</label><input type="text" value={copyright ?? ''} onChange={(e) => setT('copyright', 500)(e.target.value)} className={inputCls} /></div>
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
