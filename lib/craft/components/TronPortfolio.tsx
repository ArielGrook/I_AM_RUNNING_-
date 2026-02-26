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

// ── Tokens (from TronStats) ───────────────────────────────────────────────
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

// ── Interfaces ───────────────────────────────────────────────────────────
export interface PortfolioItem {
  title: string;
  category: string;
  imageBase64?: string;
  imageUrl?: string; // legacy, used if imageBase64 not set
  link?: string;
}

interface TronPortfolioProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  items?: PortfolioItem[];
  showLoadMore?: boolean;
  loadMoreText?: string;
  animationType?: string;
  animateDelay?: string;
}

function normalizePortfolioItem(raw: unknown): PortfolioItem {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const category = String(o.category ?? o.description ?? '');
    return {
      title: String(o.title ?? ''),
      category,
      imageBase64: (o.imageBase64 as string) || undefined,
      imageUrl: (o.imageUrl as string) || undefined,
      link: (o.link as string) || undefined,
    };
  }
  return { title: '', category: '' };
}

const DEFAULT_ITEMS: PortfolioItem[] = [
  { title: 'E-commerce Platform', category: 'Web Design', imageBase64: undefined, link: '#' },
  { title: 'SaaS Dashboard', category: 'UI/UX', imageBase64: undefined, link: '#' },
  { title: 'Mobile Banking App', category: 'Mobile', imageBase64: undefined, link: '#' },
  { title: 'Brand Identity', category: 'Branding', imageBase64: undefined, link: '#' },
  { title: 'Marketing Site', category: 'Web Design', imageBase64: undefined, link: '#' },
  { title: 'Analytics Tool', category: 'SaaS', imageBase64: undefined, link: '#' },
];

// ── PortfolioCard (internal display) ───────────────────────────────────────
interface PortfolioCardProps {
  item: PortfolioItem;
  accentColor: string;
  t: { text: string; textSecondary: string; border: string; cardBg: string };
  hexToRgb: (hex: string) => string;
  enabled: boolean;
}

function PortfolioCard({ item, accentColor, t, hexToRgb, enabled }: PortfolioCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => !enabled && setHovered(true)}
      onMouseLeave={() => !enabled && setHovered(false)}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: t.cardBg,
        border: `1px solid ${hovered ? `rgba(${hexToRgb(accentColor)}, 0.3)` : t.border}`,
        transition: 'border-color 0.2s',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
        {(item.imageBase64 || item.imageUrl) ? (
          <img
            src={item.imageBase64 || item.imageUrl}
            alt={item.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.4s ease',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `rgba(${hexToRgb(accentColor)}, 0.05)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={accentColor}
              strokeWidth="1.5"
              opacity={0.4}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(${hexToRgb(accentColor)}, 0.7)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: hovered ? 'scale(1)' : 'scale(0.7)',
              transition: 'transform 0.3s ease',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 20px' }}>
        <div
          style={{
            color: accentColor,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          {item.category}
        </div>
        <div style={{ color: t.text, fontSize: 16, fontWeight: 600 }}>{item.title}</div>
        {item.link && (
          <a
            href={item.link}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 10,
              color: accentColor,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
            onClick={(e) => enabled && e.preventDefault()}
          >
            View
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export const TronPortfolio = React.memo(function TronPortfolio() {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  const props = useNode((node) => node.data.props as Partial<TronPortfolioProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    title = 'Our work',
    subtitle = 'A selection of projects we are proud of.',
    columns = 3,
    items = DEFAULT_ITEMS,
    showLoadMore = false,
    loadMoreText = 'Load more',
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
  }, [colorScheme]);

  const accentColor = propAccent ?? theme?.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme?.colorScheme ?? 'dark';
  const tokensBuilt = buildTokens(darkBg, lightBg);
  const t = {
    ...tokensBuilt[scheme],
    accent: accentColor,
    bg: scheme === 'dark' ? (darkBg ?? '#0a0a0a') : (lightBg ?? '#ffffff'),
  };

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const rawList = (Array.isArray(items) ? items : DEFAULT_ITEMS).map(normalizePortfolioItem);
  const titleWords = (title ?? '').split(' ');
  const firstWord = titleWords[0] ?? '';
  const restWords = titleWords.slice(1).join(' ');
  const gridCols = isMobile ? 1 : (columns ?? 3);

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      key={scheme}
      data-block-type="portfolio"
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
            gridTemplateColumns: isMobile ? '1fr' : `repeat(${gridCols}, 1fr)`,
            gap: isMobile ? 16 : 24,
            alignItems: 'start',
            width: '100%',
          }}
        >
          {rawList.map((item, i) => (
            <PortfolioCard
              key={i}
              item={item}
              accentColor={accentColor}
              t={t}
              hexToRgb={hexToRgb}
              enabled={enabled}
            />
          ))}
        </div>

        {showLoadMore && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
            <button
              type="button"
              style={{
                padding: '12px 32px',
                background: 'transparent',
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                color: t.text,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'default',
              }}
            >
              {loadMoreText ?? 'Load more'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
});

// ── Settings ──────────────────────────────────────────────────────────────
function TronPortfolioSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronPortfolioProps>) ?? {};
  const {
    title = 'Our work',
    subtitle = 'A selection of projects we are proud of.',
    items = DEFAULT_ITEMS,
    columns = 3,
    showLoadMore = false,
    loadMoreText = 'Load more',
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  const rawList = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const list = rawList.map(normalizePortfolioItem);

  const updateItem = (i: number, field: keyof PortfolioItem, value: string | undefined) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as PortfolioItem[]) ?? [])];
      if (arr[i]) arr[i] = { ...arr[i], [field]: value };
      p.items = arr;
    }, 500);
  };

  const addItem = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as PortfolioItem[]) ?? []), { title: 'New Project', category: 'Category', link: '#' }];
      p.items = arr;
    }, 0);
  };

  const removeItem = (i: number) => {
    setProp((p: Record<string, unknown>) => {
      p.items = ((p.items as PortfolioItem[]) ?? []).filter((_, idx) => idx !== i);
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
            <input
              type="text"
              value={title}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 500)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; }, 500)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Items</h3>
        <div className="space-y-4">
          {list.map((item, i) => (
            <div key={i} className="p-3 rounded bg-gray-800/50 space-y-3">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(i, 'title', e.target.value)}
                  className={inputCls}
                  placeholder="Title"
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  value={item.category}
                  onChange={(e) => updateItem(i, 'category', e.target.value)}
                  className={inputCls}
                  placeholder="Category"
                  style={{ width: 100 }}
                />
                <input
                  type="text"
                  value={item.link ?? ''}
                  onChange={(e) => updateItem(i, 'link', e.target.value || undefined)}
                  className={inputCls}
                  placeholder="Link"
                  style={{ width: 100 }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.imageBase64 && (
                  <img
                    src={item.imageBase64}
                    alt=""
                    style={{ width: 48, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: 'rgba(255,107,53,0.1)',
                    border: '1px solid rgba(255,107,53,0.3)',
                    color: '#FF6B35',
                    fontSize: 11,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.imageBase64 ? '↺ Change image' : '+ Upload image'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        setProp((p: Record<string, unknown>) => {
                          const items = [...((p.items as PortfolioItem[]) ?? [])];
                          if (items[i]) items[i] = { ...items[i], imageBase64: base64 };
                          p.items = items;
                        }, 0);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {item.imageBase64 && (
                  <button
                    type="button"
                    onClick={() => updateItem(i, 'imageBase64', undefined)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#71717a',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 0,
                    }}
                    title="Remove photo"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555]"
          >
            + Add project
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
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
      </div>

      {/* DISPLAY */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Display</h3>
        <div className="space-y-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#d4d4d8' }}>Show Load more</span>
            <input
              type="checkbox"
              checked={showLoadMore ?? false}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.showLoadMore = e.target.checked; })}
              className="rounded border-gray-600 bg-gray-700"
            />
          </div>
          {showLoadMore && (
            <div>
              <label className={labelCls}>Load more text</label>
              <input
                type="text"
                value={loadMoreText ?? 'Load more'}
                onChange={(e) => setProp((p: Record<string, unknown>) => { p.loadMoreText = e.target.value; }, 500)}
                className={inputCls}
                placeholder="Load more"
              />
            </div>
          )}
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
          <label className={labelCls} style={{ marginTop: 12 }}>
            Background (light mode)
          </label>
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
                <option key={v} value={v}>
                  {v}s
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ──────────────────────────────────────────────────────────
const tronPortfolioCraft = {
  displayName: 'Tron Portfolio',
  props: {
    colorScheme: 'dark',
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 80,
    showGrid: true,
    title: 'Our work',
    subtitle: 'A selection of projects we are proud of.',
    columns: 3 as const,
    showLoadMore: false,
    loadMoreText: 'Load more',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronPortfolioSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['agency', 'freelance', 'studio'],
    featureTags: ['portfolio', 'gallery'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronPortfolio as unknown as { craft: typeof tronPortfolioCraft }).craft = tronPortfolioCraft;
