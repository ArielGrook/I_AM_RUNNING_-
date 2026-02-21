'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useCallback } from 'react';

type TronTestimonialItem = { quote: string; author: string; role: string };

const DEFAULT_ITEMS: TronTestimonialItem[] = [
  { quote: 'This product changed how we work. Highly recommend.', author: 'Jane Doe', role: 'CEO, Acme Inc' },
  { quote: 'Fast, reliable, and the support team is amazing.', author: 'John Smith', role: 'CTO, Startup' },
  { quote: 'Best investment we made this year. No regrets.', author: 'Alex Lee', role: 'Founder' },
];

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

export const TronTestimonials = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  title = 'What people say',
  subtitle = 'Trusted by teams worldwide',
  items = DEFAULT_ITEMS,
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
  items?: TronTestimonialItem[];
  animationType?: string;
  animateDelay?: string;
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
  const backgroundImage = hovered && !enabled
    ? `${spotlight}, ${gridLines}`
    : gridLines;
  const backgroundSize = hovered && !enabled ? 'auto, 50px 50px, 50px 50px' : '50px 50px';

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
        background: tokens.bg,
        backgroundImage,
        backgroundSize,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: tokens.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: tokens.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {list.map((item, i) => (
            <div
              key={i}
              style={{
                border: `1px solid rgba(${rgb}, 0.2)`,
                borderRadius: 4,
                padding: 24,
                background: colorScheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                if (enabled) return;
                e.currentTarget.style.borderColor = `rgba(${rgb}, 0.5)`;
                e.currentTarget.style.boxShadow = `0 0 15px rgba(${rgb}, 0.1)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `rgba(${rgb}, 0.2)`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <p style={{ fontSize: 14, color: '#a1a1aa', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 16px' }}>"{item.quote}"</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: tokens.text, margin: 0 }}>{item.author}</p>
              <p style={{ fontSize: 13, color: tokens.accent, marginTop: 4, marginBottom: 0 }}>{item.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TronTestimonialsSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, title, subtitle, items, animationType, animateDelay } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    items: node.data.props.items as TronTestimonialItem[],
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateItem = (index: number, field: keyof TronTestimonialItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.items as TronTestimonialItem[])];
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
              <input type="text" value={item.quote} onChange={(e) => updateItem(i, 'quote', e.target.value)} className={inputCls} placeholder="Quote" />
              <input type="text" value={item.author} onChange={(e) => updateItem(i, 'author', e.target.value)} className={inputCls} placeholder="Author" />
              <input type="text" value={item.role} onChange={(e) => updateItem(i, 'role', e.target.value)} className={inputCls} placeholder="Role" />
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = (p.items as TronTestimonialItem[]).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = [...(p.items as TronTestimonialItem[] || []), { quote: '', author: '', role: '' }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add item</button>
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

TronTestimonials.craft = {
  displayName: 'Tron Testimonials',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    title: 'What people say',
    subtitle: 'Trusted by teams worldwide',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronTestimonialsSettings },
  custom: {
    styleTags: ['dark', 'neon', 'social-proof'],
    businessTags: ['testimonials', 'saas', 'tech'],
    featureTags: ['testimonials', 'social-proof'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
