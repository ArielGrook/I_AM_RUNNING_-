'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

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
  showGrid = true,
  title = 'Our Work',
  subtitle = 'Selected projects and case studies',
  items = DEFAULT_ITEMS,
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  showGrid?: boolean;
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
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      if (w <= 0) return;
      if (w < 768) setPerPage(1);
      else if (w < 1024) setPerPage(2);
      else setPerPage(3);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const list = items ?? DEFAULT_ITEMS;
  const maxIndex = Math.max(0, Math.ceil(list.length / perPage) - 1);
  const clampedIndex = Math.min(activeIndex, maxIndex);
  const rgb = hexToRgb(accentColor ?? '#e11d48');

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';
  const backgroundStyle = {
    background: t.bg,
    backgroundImage: gridLines,
    backgroundSize: showGrid ? '50px 50px' : 'auto',
    backgroundPosition: '0 0',
  };

  return (
    <section
      id="portfolio"
      key={`${colorScheme}-${showGrid}`}
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="portfolio"
      className="w-full max-w-full px-4 md:px-8"
      style={{ ...backgroundStyle, minHeight: '75vh', paddingTop: '100px', paddingBottom: '100px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '75vh' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: t.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: t.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Previous"
            disabled={clampedIndex <= 0}
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            style={{
              background: 'transparent',
            border: `1px solid ${t.accent}`,
            color: t.accent,
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

          <div ref={carouselRef} className="flex-1 overflow-hidden min-w-0">
            <div
              className="flex"
              style={{
                transform: `translateX(-${clampedIndex * (perPage / list.length) * 100}%)`,
                transition: 'transform 400ms ease',
                width: `${(list.length / perPage) * 100}%`,
              }}
            >
              {list.map((item, i) => (
                <div
                  key={i}
                  style={{
                    width: `${100 / list.length}%`,
                    minWidth: `${100 / list.length}%`,
                    padding: '0 8px',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '16/9',
                      background: item.imageUrl ? 'transparent' : t.cardBg,
                      border: `1px solid ${t.cardBorder}`,
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
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: t.text, margin: '12px 0 4px' }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: t.muted, margin: 0 }}>{item.description}</p>
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
            border: `1px solid ${t.accent}`,
            color: t.accent,
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
      </div>
    </section>
  );
};

const TronPortfolioSettings = () => {
  const {
    actions: { setProp },
    colorScheme,
    accentColor,
    showGrid,
    title,
    subtitle,
    items,
    animationType,
    animateDelay,
  } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    showGrid: node.data.props.showGrid as boolean,
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
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Color scheme</label><select value={colorScheme ?? 'dark'} onChange={(e) => setT('colorScheme', 300)(e.target.value)} className={inputCls}><option value="dark">Dark</option><option value="light">Light</option></select></div>
          <div className="flex items-center gap-2"><label className={`${labelCls} shrink-0 w-20`}>Accent</label><input type="color" value={accentColor ?? '#e11d48'} onChange={(e) => setT('accentColor', 300)(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0" /><span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#a1a1aa', fontSize: 12 }}>Show Grid</label>
            <input type="checkbox" checked={showGrid ?? true} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} />
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
              <div className="flex items-center gap-2 flex-wrap">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                ) : null}
                <label className="cursor-pointer">
                  <span className="inline-block px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-gray-300 hover:border-gray-500">
                    {item.imageUrl ? 'Change image' : 'Upload image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const supabase = getSupabaseClient();
                      const path = `portfolio/${Date.now()}-${file.name}`;
                      const { error } = await supabase.storage.from('project-assets').upload(path, file);
                      if (!error) {
                        const { data: urlData } = supabase.storage.from('project-assets').getPublicUrl(path);
                        setProp((p: Record<string, unknown>) => {
                          const arr = [...(p.items as TronPortfolioItem[])];
                          arr[i] = { ...arr[i], imageUrl: urlData.publicUrl };
                          p.items = arr;
                        });
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
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
    showGrid: true,
    title: 'Our Work',
    subtitle: 'Selected projects and case studies',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
    'data-block-type': 'portfolio',
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
