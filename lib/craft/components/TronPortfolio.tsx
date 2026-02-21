'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useEffect } from 'react';

type TronPortfolioItem = { imageUrl: string; title: string; description: string };

const DEFAULT_ITEMS: TronPortfolioItem[] = [
  { imageUrl: '', title: 'Project One', description: 'Short description.' },
  { imageUrl: '', title: 'Project Two', description: 'Short description.' },
  { imageUrl: '', title: 'Project Three', description: 'Short description.' },
];

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

export const TronPortfolio = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  title = 'Our Work',
  subtitle = 'Selected projects and case studies',
  items = DEFAULT_ITEMS,
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
  items?: TronPortfolioItem[];
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const [activeIndex, setActiveIndex] = useState(0);
  const [perPage, setPerPage] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      if (w < 768) setPerPage(1);
      else if (w < 1024) setPerPage(2);
      else setPerPage(3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const tokens = colorScheme === 'dark'
    ? { bg: '#000000', text: '#ffffff', muted: '#52525b', accent: accentColor }
    : { bg: '#ffffff', text: '#0a0a0a', muted: '#52525b', accent: accentColor };

  const list = items ?? DEFAULT_ITEMS;
  const maxIndex = Math.max(0, Math.ceil(list.length / perPage) - 1);
  const clampedIndex = Math.min(activeIndex, maxIndex);
  const rgb = hexToRgb(accentColor ?? '#e11d48');

  const gridLines =
    'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)';

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    dataAttrs['data-animate-delay'] = animateDelay ?? '0';
  }

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-20 ${isSelected ? 'outline outline-2 outline-red-500' : ''}`}
      style={{
        background: tokens.bg,
        backgroundImage: gridLines,
        backgroundSize: '50px 50px',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: tokens.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: tokens.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Previous"
            disabled={clampedIndex <= 0}
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            style={{
              background: 'transparent',
              border: `1px solid ${tokens.accent}`,
              color: tokens.accent,
              width: 40,
              height: 40,
              borderRadius: 4,
              cursor: clampedIndex <= 0 ? 'not-allowed' : 'pointer',
              opacity: clampedIndex <= 0 ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            ←
          </button>

          <div className="flex-1 overflow-hidden">
            <div
              className="flex"
              style={{
                transform: `translateX(-${clampedIndex * 100}%)`,
                transition: 'transform 400ms ease',
              }}
            >
              {list.map((item, i) => (
                <div
                  key={i}
                  style={{
                    minWidth: `${100 / perPage}%`,
                    padding: '0 8px',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '16/9',
                      background: item.imageUrl ? 'transparent' : 'rgba(255,255,255,0.05)',
                      border: `1px solid rgba(${rgb}, 0.2)`,
                      borderRadius: 4,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#52525b', fontSize: 14 }}>Add image</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: tokens.text, margin: '12px 0 4px' }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: tokens.muted, margin: 0 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Next"
            disabled={clampedIndex >= maxIndex}
            onClick={() => setActiveIndex((i) => Math.min(maxIndex, i + 1))}
            style={{
              background: 'transparent',
              border: `1px solid ${tokens.accent}`,
              color: tokens.accent,
              width: 40,
              height: 40,
              borderRadius: 4,
              cursor: clampedIndex >= maxIndex ? 'not-allowed' : 'pointer',
              opacity: clampedIndex >= maxIndex ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
};

const TronPortfolioSettings = () => {
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
    items: node.data.props.items as TronPortfolioItem[],
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));

  const setT = (key: string, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateItem = (index: number, field: keyof TronPortfolioItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.items as TronPortfolioItem[])];
      arr[index] = { ...arr[index], [field]: value };
      p.items = arr;
    });
  };

  return (
    <div className="p-3 space-y-5 text-white">
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
              <input type="text" value={item.imageUrl} onChange={(e) => updateItem(i, 'imageUrl', e.target.value)} className={inputCls} placeholder="Image URL" />
              <input type="text" value={item.title} onChange={(e) => updateItem(i, 'title', e.target.value)} className={inputCls} placeholder="Title" />
              <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} className={inputCls} placeholder="Description" />
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = (p.items as TronPortfolioItem[]).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = [...(p.items as TronPortfolioItem[] || []), { imageUrl: '', title: 'Project', description: 'Description.' }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add item</button>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-2">
          <div><label className={labelCls}>Type</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
          <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
        </div>
      </section>
    </div>
  );
};

TronPortfolio.craft = {
  displayName: 'Tron Portfolio',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    title: 'Our Work',
    subtitle: 'Selected projects and case studies',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronPortfolioSettings },
  custom: {
    styleTags: ['dark', 'neon', 'creative'],
    businessTags: ['portfolio', 'agency', 'creative', 'photographer'],
    featureTags: ['portfolio', 'carousel', 'gallery', 'interactive'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
