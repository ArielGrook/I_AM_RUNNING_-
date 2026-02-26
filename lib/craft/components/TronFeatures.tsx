'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

// ── Tokens (from TronStats, bg from darkBg/lightBg) ────────────────────────
const tokens = {
  dark: {
    bg: '#0a0a0a',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    border: 'rgba(255,255,255,0.08)',
    cardBg: 'rgba(255,255,255,0.03)',
    gridColor: 'rgba(255,255,255,0.03)',
  },
  light: {
    bg: '#ffffff',
    text: '#0a0a0a',
    textSecondary: '#52525b',
    border: 'rgba(0,0,0,0.08)',
    cardBg: 'rgba(0,0,0,0.02)',
    gridColor: 'rgba(0,0,0,0.06)',
  },
};

function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark: { ...tokens.dark, bg: darkBg ?? '#0a0a0a' },
    light: { ...tokens.light, bg: lightBg ?? '#ffffff' },
  };
}

// ── Feature Icons ──────────────────────────────────────────────────────────
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  zap: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  layers: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  settings: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  globe: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  trending: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
};

// ── Interfaces ───────────────────────────────────────────────────────────
interface FeatureItem {
  iconKey: string;
  title: string;
  description: string;
}

interface TronFeaturesProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  items?: FeatureItem[];
  cardStyle?: 'border' | 'filled' | 'minimal';
  animationType?: string;
  animateDelay?: string;
}

// ── FeatureCardDisplay (internal, with hover) ──────────────────────────────
interface FeatureCardDisplayProps {
  item: FeatureItem;
  cardStyle: 'border' | 'filled' | 'minimal';
  cardStyles: Record<string, React.CSSProperties>;
  accentColor: string;
  t: { text: string; textSecondary: string };
  hexToRgb: (hex: string) => string;
  enabled: boolean;
}

function FeatureCardDisplay({ item, cardStyle, cardStyles, accentColor, t, hexToRgb, enabled }: FeatureCardDisplayProps) {
  const [hovered, setHovered] = React.useState(false);
  const baseStyle = cardStyles[cardStyle ?? 'border'] ?? cardStyles.border;

  return (
    <div
      onMouseEnter={() => !enabled && setHovered(true)}
      onMouseLeave={() => !enabled && setHovered(false)}
      style={{
        ...baseStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 12px 40px rgba(${hexToRgb(accentColor)}, 0.15)` : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: `rgba(${hexToRgb(accentColor)}, 0.12)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          marginBottom: 16,
        }}
      >
        {FEATURE_ICONS[item.iconKey] ?? FEATURE_ICONS.zap}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: t.text, margin: 0, marginBottom: 8 }}>{item.title}</h3>
      <p style={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.6, margin: 0 }}>{item.description}</p>
    </div>
  );
}

const DEFAULT_ITEMS: FeatureItem[] = [
  { iconKey: 'zap', title: 'Lightning Fast', description: 'Optimized for performance. Your site loads in milliseconds.' },
  { iconKey: 'shield', title: 'Secure by Default', description: 'Enterprise-grade security built into every component.' },
  { iconKey: 'layers', title: 'Fully Modular', description: 'Mix and match components to build any layout you need.' },
  { iconKey: 'settings', title: 'Easy to Customize', description: 'Change colors, fonts, and layouts without touching code.' },
  { iconKey: 'globe', title: 'Global CDN', description: 'Your content delivered fast to visitors worldwide.' },
  { iconKey: 'trending', title: 'Analytics Built-in', description: 'Track performance and user behavior out of the box.' },
];

// ── Main component ──────────────────────────────────────────────────────────
export const TronFeatures = React.memo(function TronFeatures() {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  const props = useNode((node) => node.data.props as Partial<TronFeaturesProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 70,
    showGrid = true,
    title = 'Everything you need',
    subtitle = 'Powerful features to build better products faster.',
    columns = 3,
    items = DEFAULT_ITEMS,
    cardStyle = 'border',
    animationType = 'none',
    animateDelay = '0',
  } = props;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const checkWidth = () => {
      setIsMobile(el.getBoundingClientRect().width < 520);
    };
    checkWidth();
    const observer = new ResizeObserver(([entry]) => {
      setIsMobile((entry?.contentRect?.width ?? 0) < 520);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [colorScheme, cardStyle]);

  const accentColor = propAccent ?? theme?.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme?.colorScheme ?? 'dark';
  const t = {
    ...tokens[scheme],
    accent: accentColor,
    bg: scheme === 'dark' ? (darkBg ?? '#0a0a0a') : (lightBg ?? '#ffffff'),
  };

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const cardStyles: Record<string, React.CSSProperties> = {
    border: {
      background: scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      padding: 28,
    },
    filled: {
      background: scheme === 'dark'
        ? `rgba(${hexToRgb(accentColor)}, 0.1)`
        : `rgba(${hexToRgb(accentColor)}, 0.08)`,
      border: `1px solid rgba(${hexToRgb(accentColor)}, 0.2)`,
      borderRadius: 12,
      padding: 28,
    },
    minimal: {
      background: 'transparent',
      border: 'none',
      borderTop: `2px solid ${accentColor}`,
      borderRadius: 0,
      padding: '28px 0',
    },
  };

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const titleWords = (title ?? '').split(' ');
  const firstWord = titleWords[0] ?? '';
  const restWords = titleWords.slice(1).join(' ');

  return (
    <section
      key={`${scheme}-${cardStyle}`}
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      data-block-type="features"
      className={`w-full max-w-full py-20 px-4 sm:px-8 lg:px-16 flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: showGrid ? '50px 50px' : 'auto',
        minHeight: `${sectionHeight}vh`,
      }}
    >
      <div className="max-w-6xl mx-auto w-full" {...animAttrs}>
        <div className="text-center mb-12 md:mb-16">
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 700,
              color: t.text,
              margin: 0,
            }}
          >
            <span style={{ color: t.accent }}>{firstWord}</span>
            {restWords ? ` ${restWords}` : ''}
          </h2>
          <p
            style={{
              fontSize: 16,
              color: t.textSecondary,
              marginTop: 12,
              marginBottom: 0,
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : `repeat(${columns ?? 3}, 1fr)`,
            gap: isMobile ? 16 : 24,
            alignItems: 'start',
            width: '100%',
          }}
        >
          {list.map((item, i) => (
            <FeatureCardDisplay
              key={i}
              item={item}
              cardStyle={cardStyle}
              cardStyles={cardStyles}
              accentColor={accentColor}
              t={t}
              hexToRgb={hexToRgb}
              enabled={enabled}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

// ── FeatureCard (backward compatibility, minimal) ───────────────────────────
export interface FeatureCardProps {
  title: string;
  description: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  cardWidth?: number;
  cardMinHeight?: number;
}

export const FeatureCard = React.memo(function FeatureCard({
  title,
  description,
  accentColor,
  colorScheme,
}: FeatureCardProps) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const t = colorScheme === 'dark' ? tokens.dark : tokens.light;

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={isSelected ? 'craft-node-selected' : ''}
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: 28,
        cursor: 'default',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: `rgba(${hexToRgb(accentColor)}, 0.12)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          marginBottom: 16,
        }}
      >
        {FEATURE_ICONS.zap}
      </div>
      <h3 style={{ color: t.text, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: t.textSecondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{description}</p>
    </div>
  );
});

const FeatureCardSettings = () => {
  const { actions: { setProp } } = useNode();
  const { title = '', description = '' } = useNode((node) => node.data.props as Record<string, unknown>) ?? {};
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-4 space-y-3 text-white">
      <div><label className={labelCls}>Title</label><input value={(title as string) ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Description</label><textarea value={(description as string) ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.description = e.target.value; }, 500)} className={inputCls} rows={3} /></div>
    </div>
  );
};

(FeatureCard as unknown as { craft: Record<string, unknown> }).craft = {
  displayName: 'Feature Card',
  props: {
    title: 'Feature Title',
    description: 'Feature description.',
    accentColor: '#FF6B35',
    colorScheme: 'dark',
  },
  related: { settings: FeatureCardSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// ── Settings ──────────────────────────────────────────────────────────────
function TronFeaturesSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronFeaturesProps>) ?? {};
  const {
    title = 'Everything you need',
    subtitle = 'Powerful features to build better products faster.',
    items = DEFAULT_ITEMS,
    columns = 3,
    cardStyle = 'border',
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 70,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const iconKeys = ['zap', 'shield', 'layers', 'settings', 'globe', 'trending'];

  const updateItem = (i: number, field: keyof FeatureItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as FeatureItem[]) ?? [])];
      if (arr[i]) arr[i] = { ...arr[i], [field]: value };
      p.items = arr;
    }, 500);
  };

  const removeItem = (i: number) => {
    setProp((p: Record<string, unknown>) => {
      p.items = ((p.items as FeatureItem[]) ?? []).filter((_, idx) => idx !== i);
    }, 0);
  };

  const addItem = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as FeatureItem[]) ?? []), { iconKey: 'zap', title: 'New Feature', description: 'Description.' }];
      p.items = arr;
    }, 0);
  };

  return (
    <div className="p-3 space-y-0 text-white">
      {/* CONTENT */}
      <div className="border-t border-gray-700 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <input type="text" value={subtitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; }, 500)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Items</h3>
        <div className="space-y-2">
          {list.map((item, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/50 space-y-2">
              <div className="flex gap-2 items-center">
                <select
                  value={item.iconKey}
                  onChange={(e) => updateItem(i, 'iconKey', e.target.value)}
                  className={inputCls}
                  style={{ width: 100, minWidth: 100 }}
                >
                  {iconKeys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(i, 'title', e.target.value)}
                  className={inputCls}
                  placeholder="Title"
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                  title="Remove"
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(i, 'description', e.target.value)}
                className={inputCls}
                placeholder="Description"
              />
            </div>
          ))}
          <button type="button" onClick={addItem} className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555]">
            + Add feature
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Columns</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {([2, 3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setProp((p: Record<string, unknown>) => { p.columns = n; })}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: columns === n ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                    background: columns === n ? 'rgba(255,107,53,0.15)' : 'transparent',
                    color: columns === n ? '#FF6B35' : '#a1a1aa',
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Card style</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['border', 'filled', 'minimal'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setProp((p: Record<string, unknown>) => { p.cardStyle = s; })}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: cardStyle === s ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                    background: cardStyle === s ? 'rgba(255,107,53,0.15)' : 'transparent',
                    color: cardStyle === s ? '#FF6B35' : '#a1a1aa',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COLORS */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={darkBg ?? '#0a0a0a'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)}
              style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{darkBg ?? '#0a0a0a'}</span>
          </div>
          <label className={labelCls} style={{ marginTop: 12 }}>Background (light mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={lightBg ?? '#ffffff'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)}
              style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{lightBg ?? '#ffffff'}</span>
          </div>
        </div>
      </div>

      {/* SIZE */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Size</h3>
        <div>
          <label className={labelCls}>Section height: {sectionHeight}vh</label>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={sectionHeight}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 500)}
            className="w-full"
          />
        </div>
      </div>

      {/* DISPLAY */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Display</h3>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })}
            className="rounded border-gray-600 bg-gray-700"
          />
          Show grid
        </label>
      </div>

      {/* ANIMATION */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Type</label>
            <select
              value={animationType}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })}
              className={inputCls}
            >
              <option value="none">None</option>
              <option value="fade-in">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="slide-down">Slide Down</option>
              <option value="slide-left">Slide Left</option>
              <option value="slide-right">Slide Right</option>
              <option value="scale-in">Scale In</option>
              <option value="blur-in">Blur In</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay</label>
            <select
              value={animateDelay}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })}
              className={inputCls}
            >
              {['0', '0.1', '0.2', '0.3', '0.5', '0.8', '1'].map((v) => (
                <option key={v} value={v}>{v}s</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ──────────────────────────────────────────────────────────
const tronFeaturesCraft = {
  displayName: 'Tron Features',
  props: {
    colorScheme: 'dark',
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 70,
    showGrid: true,
    title: 'Everything you need',
    subtitle: 'Powerful features to build better products faster.',
    columns: 3,
    cardStyle: 'border',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronFeaturesSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['saas', 'startup', 'agency'],
    featureTags: ['features'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronFeatures as unknown as { craft: typeof tronFeaturesCraft }).craft = tronFeaturesCraft;
