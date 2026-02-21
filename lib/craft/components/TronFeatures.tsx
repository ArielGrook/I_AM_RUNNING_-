'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';

type TronFeatureItem = { title: string; description: string };

const DEFAULT_ITEMS: TronFeatureItem[] = [
  { title: 'Lightning Fast', description: 'Optimized for speed. Under 1s load time.' },
  { title: 'Secure by Default', description: 'Enterprise-grade security built in.' },
  { title: 'Easy to Use', description: 'No learning curve. Build in minutes.' },
];

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

export const TronFeatures = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  title = 'Everything you need',
  subtitle = 'Powerful tools built for modern businesses',
  items = DEFAULT_ITEMS,
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
  items?: TronFeatureItem[];
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const tokens = {
    dark: {
      bg: '#000000',
      text: '#ffffff',
      muted: '#52525b',
      accent: accentColor,
      gridColor: 'rgba(255,255,255,0.03)',
      cardBg: 'rgba(255,255,255,0.02)',
      cardBorder: 'rgba(255,255,255,0.08)',
    },
    light: {
      bg: '#ffffff',
      bgSecondary: '#f8fafc',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      accent: accentColor,
      border: 'rgba(0,0,0,0.08)',
      cardBg: 'rgba(0,0,0,0.02)',
      cardBorder: 'rgba(0,0,0,0.08)',
      gridColor: 'rgba(0,0,0,0.06)',
      muted: '#52525b',
    },
  };
  const t = tokens[colorScheme];
  const rgb = hexToRgb(accentColor);

  const gridLines =
    `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`;

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    dataAttrs['data-animate-delay'] = animateDelay ?? '0';
  }

  const list = items ?? DEFAULT_ITEMS;

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-20 ${isSelected ? 'outline outline-2 outline-red-500' : ''}`}
      style={{
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: '50px 50px',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 800,
              color: t.text,
              margin: 0,
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: 16, color: t.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {list.map((item, i) => (
            <div
              key={i}
              className="transition-all duration-200"
              style={{
                border: `1px solid ${t.cardBorder}`,
                background: t.cardBg,
                borderRadius: 4,
                padding: 32,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `rgba(${rgb}, 0.6)`;
                e.currentTarget.style.boxShadow = `0 0 20px rgba(${rgb}, 0.1)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `rgba(${rgb}, 0.25)`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  height: 2,
                  width: 40,
                  background: accentColor,
                  marginBottom: 20,
                }}
              />
              <h3 style={{ fontSize: 17, fontWeight: 600, color: t.text, margin: '0 0 8px' }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.6, margin: 0 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TronFeaturesSettings = () => {
  const {
    actions: { setProp },
    colorScheme,
    accentColor,
    title,
    subtitle,
    items,
    animationType,
    animateDelay,
  } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    items: node.data.props.items as TronFeatureItem[],
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));

  const setT = (key: string, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateItem = (index: number, field: keyof TronFeatureItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.items as TronFeatureItem[])];
      arr[index] = { ...arr[index], [field]: value };
      p.items = arr;
    });
  };

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Color scheme</label>
            <select value={colorScheme ?? 'dark'} onChange={(e) => setT('colorScheme', 300)(e.target.value)} className={inputCls}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={`${labelCls} shrink-0 w-20`}>Accent</label>
            <input type="color" value={accentColor ?? '#e11d48'} onChange={(e) => setT('accentColor', 300)(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
            <span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span>
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Title</label><input type="text" value={title ?? ''} onChange={(e) => setT('title', 500)(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Subtitle</label><input type="text" value={subtitle ?? ''} onChange={(e) => setT('subtitle', 500)(e.target.value)} className={inputCls} /></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Items</h3>
        <div className="space-y-3">
          {(items ?? []).map((item, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/60 space-y-2">
              <input type="text" value={item.title} onChange={(e) => updateItem(i, 'title', e.target.value)} className={inputCls} placeholder="Title" />
              <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} className={inputCls} placeholder="Description" />
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = (p.items as TronFeatureItem[]).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = [...(p.items as TronFeatureItem[] || []), { title: 'Feature', description: 'Description.' }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add item</button>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-2">
          <div><label className={labelCls}>Type</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option><option value="scale-in">Scale In</option></select></div>
          <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option><option value="0.5">0.5s</option></select></div>
        </div>
      </section>
    </div>
  );
};

TronFeatures.craft = {
  displayName: 'Tron Features',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    title: 'Everything you need',
    subtitle: 'Powerful tools built for modern businesses',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronFeaturesSettings },
  custom: {
    styleTags: ['dark', 'neon', 'bold'],
    businessTags: ['startup', 'saas', 'tech'],
    featureTags: ['features', 'grid', 'cards'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
