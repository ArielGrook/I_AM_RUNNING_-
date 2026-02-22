'use client';

import { useNode, useEditor } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React from 'react';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

const tokens = {
  dark: {
    bg: '#000000',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    muted: '#52525b',
    accent: '#e11d48',
    gridColor: 'rgba(255,255,255,0.03)',
    cardBg: 'rgba(255,255,255,0.02)',
    cardBorder: 'rgba(255,255,255,0.08)',
  },
  light: {
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    text: '#0a0a0a',
    textSecondary: '#52525b',
    accent: '#e11d48',
    border: 'rgba(0,0,0,0.08)',
    cardBg: 'rgba(0,0,0,0.02)',
    cardBorder: 'rgba(0,0,0,0.08)',
    gridColor: 'rgba(0,0,0,0.06)',
    muted: '#52525b',
  },
};

// --- FeatureCard (editable child node) ---

export interface FeatureCardProps {
  title: string;
  description: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
}

export const FeatureCard = ({
  title,
  description,
  accentColor,
  colorScheme,
}: FeatureCardProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const t = tokens[colorScheme];

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className=""
      style={{
        background: t.cardBg,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 4,
        padding: 32,
        cursor: 'default',
        transition: 'border-color 200ms, box-shadow 200ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `rgba(${hexToRgb(accentColor)},0.5)`;
        e.currentTarget.style.boxShadow = `0 0 20px rgba(${hexToRgb(accentColor)},0.1)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = t.cardBorder;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ width: 40, height: 2, background: accentColor, marginBottom: 20 }} />
      <h3 style={{ color: t.text, fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{title}</h3>
      <p style={{ color: t.textSecondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{description}</p>
    </div>
  );
};

const FeatureCardSettings = () => {
  const { actions: { setProp } } = useNode();
  const { title = '', description = '' } = useNode((node) => node.data.props) ?? {};
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-4 space-y-3 text-white">
      <div><label className={labelCls}>Title</label><input value={title ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Description</label><textarea value={description ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.description = e.target.value; }, 500)} className={inputCls} rows={3} /></div>
    </div>
  );
};

FeatureCard.craft = {
  displayName: 'Feature Card',
  props: {
    title: 'Feature Title',
    description: 'Feature description here.',
    accentColor: '#e11d48',
    colorScheme: 'dark',
  },
  related: { settings: FeatureCardSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// --- Default content for the 3 card slots ---

const DEFAULT_CARD_0: Omit<FeatureCardProps, 'accentColor' | 'colorScheme'> = { title: 'Lightning Fast', description: 'Under 1s load time.' };
const DEFAULT_CARD_1: Omit<FeatureCardProps, 'accentColor' | 'colorScheme'> = { title: 'Secure by Default', description: 'Enterprise-grade security.' };
const DEFAULT_CARD_2: Omit<FeatureCardProps, 'accentColor' | 'colorScheme'> = { title: 'Easy to Use', description: 'No learning curve.' };
const CARD_DEFAULTS = [DEFAULT_CARD_0, DEFAULT_CARD_1, DEFAULT_CARD_2];

// --- TronFeatures (section with 3 card nodes) ---

export const TronFeatures = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  showGrid = true,
  title = 'Everything you need',
  subtitle = 'Powerful tools built for modern businesses',
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  showGrid?: boolean;
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
  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';
  const backgroundStyle = {
    background: t.bg,
    backgroundImage: gridLines,
    backgroundSize: showGrid ? '50px 50px' : 'auto',
  };

  const cardIds = [`${sectionId}-card-0`, `${sectionId}-card-1`, `${sectionId}-card-2`];
  const getNodeSafe = typeof query?.getNode === 'function' ? query.getNode.bind(query) : () => null;

  return (
    <section
      key={`${colorScheme}-${showGrid}`}
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-20 `}
      style={backgroundStyle}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                is={FeatureCard}
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

const TronFeaturesSettings = () => {
  const {
    actions: { setProp },
    colorScheme,
    accentColor,
    showGrid,
    title,
    subtitle,
    animationType,
    animateDelay,
  } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    showGrid: node.data.props.showGrid as boolean,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));

  const setT = (key: string, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#a1a1aa', fontSize: 12 }}>Show Grid</label>
            <input
              type="checkbox"
              checked={showGrid ?? true}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })}
            />
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
    showGrid: true,
    title: 'Everything you need',
    subtitle: 'Powerful tools built for modern businesses',
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
