'use client';

import { useNode, useEditor } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React from 'react';

type CardAnimFrom = 'slide-top' | 'slide-bottom' | 'none';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

const tokens = {
  dark: {
    bg: '#000000',
    text: '#ffffff',
    muted: '#52525b',
    gridColor: 'rgba(255,255,255,0.03)',
    cardBg: 'rgba(255,255,255,0.02)',
    cardBorder: 'rgba(255,255,255,0.08)',
  },
  light: {
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    text: '#0a0a0a',
    textSecondary: '#52525b',
    muted: '#52525b',
    border: 'rgba(0,0,0,0.08)',
    cardBg: 'rgba(0,0,0,0.02)',
    cardBorder: 'rgba(0,0,0,0.08)',
    gridColor: 'rgba(0,0,0,0.06)',
  },
};

// --- PricingCard (editable child node) ---

export interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  ctaText: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animateFrom: CardAnimFrom;
}

export const PricingCard = ({
  name,
  price,
  period,
  description,
  features,
  highlighted,
  ctaText,
  accentColor,
  colorScheme,
  animateFrom,
}: PricingCardProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const t = tokens[colorScheme];
  const rgb = hexToRgb(accentColor ?? '#e11d48');

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-animate-from={animateFrom}
      data-animate-card="pricing"
      className={isSelected ? 'outline outline-2 outline-red-500' : ''}
      style={{
        background: highlighted ? `rgba(${rgb},0.05)` : t.cardBg,
        border: highlighted ? `1px solid ${accentColor}` : `1px solid ${t.cardBorder}`,
        borderRadius: 4,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: highlighted ? `0 0 30px rgba(${rgb}, 0.15)` : undefined,
      }}
    >
      <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, margin: '0 0 16px' }}>{name}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
        <span style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, color: t.text }}>{price}</span>
        <span style={{ fontSize: 16, color: '#71717a' }}>{period}</span>
      </div>
      {description ? <p style={{ fontSize: 14, color: t.muted, marginBottom: 16 }}>{description}</p> : null}
      <div style={{ height: 1, background: `rgba(${rgb}, 0.2)`, marginBottom: 20 }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
        {(features ?? []).map((f, j) => (
          <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#a1a1aa', marginBottom: 8 }}>
            <span style={{ color: accentColor, flexShrink: 0 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        style={{
          width: '100%',
          padding: '12px 20px',
          borderRadius: 4,
          border: 'none',
          background: accentColor,
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {ctaText}
      </button>
    </div>
  );
};

const PricingCardSettings = () => {
  const { actions: { setProp }, name, price, period, description, features, highlighted, ctaText, animateFrom } = useNode((node) => ({
    name: node.data.props.name as string,
    price: node.data.props.price as string,
    period: node.data.props.period as string,
    description: node.data.props.description as string,
    features: node.data.props.features as string[],
    highlighted: node.data.props.highlighted as boolean,
    ctaText: node.data.props.ctaText as string,
    animateFrom: node.data.props.animateFrom as CardAnimFrom,
  }));
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateFeature = (index: number, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.features as string[] ?? [])];
      arr[index] = value;
      p.features = arr;
    });
  };

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Card</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Name</label><input type="text" value={name ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.name = e.target.value; })} className={inputCls} placeholder="Plan name" /></div>
          <div><label className={labelCls}>Price</label><input type="text" value={price ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.price = e.target.value; })} className={inputCls} placeholder="29" /></div>
          <div><label className={labelCls}>Period</label><input type="text" value={period ?? '/mo'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.period = e.target.value; })} className={inputCls} placeholder="/mo" /></div>
          <div><label className={labelCls}>Description</label><input type="text" value={description ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.description = e.target.value; })} className={inputCls} placeholder="Optional" /></div>
          <div><label className={labelCls}>CTA text</label><input type="text" value={ctaText ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.ctaText = e.target.value; })} className={inputCls} placeholder="Get Started" /></div>
          <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={highlighted ?? false} onChange={(e) => setProp((p: Record<string, unknown>) => { p.highlighted = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" /> Highlighted</label>
          <div><label className={labelCls}>Animate from</label><select value={animateFrom ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateFrom = e.target.value; })} className={inputCls}><option value="none">None</option><option value="slide-top">Top</option><option value="slide-bottom">Bottom</option></select></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Features</h3>
        <div className="space-y-2">
          {(features ?? []).map((f, j) => (
            <div key={j} className="flex gap-1">
              <input type="text" value={f} onChange={(e) => updateFeature(j, e.target.value)} className={inputCls} placeholder={`Feature ${j + 1}`} />
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.features = (p.features as string[]).filter((_, i) => i !== j); })} className="text-xs text-red-400 shrink-0">×</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.features = [...(p.features as string[] ?? []), 'New feature']; })} className="text-xs text-gray-400">+ Add feature</button>
        </div>
      </section>
    </div>
  );
};

PricingCard.craft = {
  displayName: 'Pricing Card',
  props: {
    name: 'Pro',
    price: '79',
    period: '/mo',
    description: '',
    features: ['Feature 1', 'Feature 2'],
    highlighted: false,
    ctaText: 'Get Started',
    accentColor: '#e11d48',
    colorScheme: 'dark',
    animateFrom: 'none' as CardAnimFrom,
  },
  related: { settings: PricingCardSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// --- Default props for the 3 card slots (used when node is first created) ---

const DEFAULT_CARD_0: Omit<PricingCardProps, 'accentColor' | 'colorScheme'> = {
  name: 'Starter',
  price: '29',
  period: '/mo',
  description: '',
  features: ['Up to 5 projects', 'Basic support', '1GB storage'],
  highlighted: false,
  ctaText: 'Get Started',
  animateFrom: 'slide-top',
};

const DEFAULT_CARD_1: Omit<PricingCardProps, 'accentColor' | 'colorScheme'> = {
  name: 'Pro',
  price: '79',
  period: '/mo',
  description: '',
  features: ['Unlimited projects', 'Priority support', '10GB storage', 'Analytics'],
  highlighted: true,
  ctaText: 'Get Started',
  animateFrom: 'slide-bottom',
};

const DEFAULT_CARD_2: Omit<PricingCardProps, 'accentColor' | 'colorScheme'> = {
  name: 'Enterprise',
  price: '199',
  period: '/mo',
  description: '',
  features: ['Everything in Pro', 'Dedicated manager', 'Custom integrations'],
  highlighted: false,
  ctaText: 'Contact us',
  animateFrom: 'slide-top',
};

const CARD_DEFAULTS = [DEFAULT_CARD_0, DEFAULT_CARD_1, DEFAULT_CARD_2];

// --- TronPricing (section with 3 card nodes) ---

export const TronPricing = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  title = 'Simple pricing',
  subtitle = 'Choose the plan that fits your team',
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
  animationType?: string;
  animateDelay?: string;
}) => {
  const { id: sectionId, connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const editor = useEditor();
  const query = editor?.query;
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const t = tokens[colorScheme];
  const gridLines =
    `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`;

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    dataAttrs['data-animate-delay'] = animateDelay ?? '0';
  }

  const cardIds = [`${sectionId}-card-0`, `${sectionId}-card-1`, `${sectionId}-card-2`];

  const getNodeSafe = typeof query?.getNode === 'function' ? query.getNode.bind(query) : () => null;

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-20 ${isSelected ? 'outline outline-2 outline-red-500' : ''}`}
      style={{ background: t.bg, backgroundImage: gridLines, backgroundSize: '50px 50px' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: t.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: t.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cardIds.map((cardId, i) => {
            const node = getNodeSafe(cardId);
            const exists = node != null && node.data?.props;
            const cardProps = exists
              ? { ...node.data.props, accentColor, colorScheme }
              : { ...CARD_DEFAULTS[i], accentColor, colorScheme };
            return (
              <Element
                key={cardId}
                id={cardId}
                is={PricingCard}
                canvas
                {...cardProps}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

const TronPricingSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, title, subtitle, animationType, animateDelay } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
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
          <div><label className={labelCls}>Title</label><input type="text" value={title ?? ''} onChange={(e) => setT('title', 500)(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Subtitle</label><input type="text" value={subtitle ?? ''} onChange={(e) => setT('subtitle', 500)(e.target.value)} className={inputCls} /></div>
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

TronPricing.craft = {
  displayName: 'Tron Pricing',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    title: 'Simple pricing',
    subtitle: 'Choose the plan that fits your team',
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronPricingSettings },
  custom: {
    styleTags: ['dark', 'neon', 'pricing'],
    businessTags: ['saas', 'pricing', 'tech'],
    featureTags: ['pricing', 'plans'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
