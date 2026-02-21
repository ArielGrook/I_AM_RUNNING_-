'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState } from 'react';

type TronFAQItem = { question: string; answer: string };

const DEFAULT_ITEMS: TronFAQItem[] = [
  { question: 'How do I get started?', answer: 'Sign up for an account and follow the onboarding guide. You can be up and running in minutes.' },
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and wire transfer for enterprise plans.' },
  { question: 'Can I cancel anytime?', answer: 'Yes. You can cancel your subscription at any time. No long-term commitment required.' },
  { question: 'Do you offer technical support?', answer: 'Yes. All plans include email support. Pro and Enterprise include priority and dedicated support.' },
];

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

export const TronFAQ = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  title = 'Frequently asked questions',
  subtitle = 'Everything you need to know',
  items = DEFAULT_ITEMS,
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
  items?: TronFAQItem[];
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const tokens = colorScheme === 'dark'
    ? { bg: '#000000', text: '#ffffff', muted: '#52525b', accent: accentColor }
    : { bg: '#ffffff', text: '#0a0a0a', muted: '#52525b', accent: accentColor };
  const rgb = hexToRgb(accentColor ?? '#e11d48');
  const gridColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const gridLines =
    `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`;

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
      style={{ background: tokens.bg, backgroundImage: gridLines, backgroundSize: '50px 50px' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: tokens.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: tokens.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>
        <div>
          {list.map((item, i) => {
            const isOpen = activeIndex === i;
            return (
              <div
                key={i}
                {...(isOpen ? { 'data-mobile-dropdown': '' } : {})}
                style={{
                  borderBottom: `1px solid rgba(${rgb}, 0.15)`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!enabled) e.currentTarget.style.background = `rgba(${rgb}, 0.03)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  <span style={{ fontSize: 16, fontWeight: 500, color: tokens.text }}>{item.question}</span>
                  <span
                    style={{
                      flexShrink: 0,
                      display: 'inline-block',
                      transition: 'transform 0.2s ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: tokens.accent,
                    }}
                  >
                    ▼
                  </span>
                </button>
                <div
                  style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? 200 : 0,
                    transition: 'max-height 0.25s ease',
                  }}
                >
                  <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.6, paddingTop: 12, paddingBottom: 16, margin: 0 }}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const TronFAQSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, title, subtitle, items, animationType, animateDelay } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    items: node.data.props.items as TronFAQItem[],
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateItem = (index: number, field: keyof TronFAQItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.items as TronFAQItem[])];
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
              <input type="text" value={item.question} onChange={(e) => updateItem(i, 'question', e.target.value)} className={inputCls} placeholder="Question" />
              <textarea value={item.answer} onChange={(e) => updateItem(i, 'answer', e.target.value)} className={inputCls} rows={2} placeholder="Answer" />
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = (p.items as TronFAQItem[]).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = [...(p.items as TronFAQItem[] || []), { question: '', answer: '' }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add item</button>
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

TronFAQ.craft = {
  displayName: 'Tron FAQ',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronFAQSettings },
  custom: {
    styleTags: ['dark', 'neon', 'accordion'],
    businessTags: ['faq', 'support', 'tech'],
    featureTags: ['faq', 'accordion'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
