'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { useAuth } from '@/lib/hooks/useAuth';
import { MediaLibrary } from '@/components/craft/MediaLibrary';

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
  description: string;
  category: string;
  imageBase64?: string;
  imageUrl?: string;
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
  visibleCards?: 2 | 3;
  items?: PortfolioItem[];
  autoplay?: boolean;
  autoplaySpeed?: number;
  animationType?: string;
  animateDelay?: string;
}

function normalizePortfolioItem(raw: unknown): PortfolioItem {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    return {
      title: String(o.title ?? ''),
      description: String(o.description ?? ''),
      category: String(o.category ?? ''),
      imageBase64: (o.imageBase64 as string) || undefined,
      imageUrl: (o.imageUrl as string) || undefined,
    };
  }
  return { title: '', description: '', category: '' };
}

const DEFAULT_ITEMS: PortfolioItem[] = [
  { title: 'E-commerce Platform', category: 'Web Design', description: 'Full stack e-commerce solution built for scale.', imageBase64: undefined },
  { title: 'SaaS Dashboard', category: 'UI/UX', description: 'Analytics dashboard with real-time data visualization.', imageBase64: undefined },
  { title: 'Mobile Banking App', category: 'Mobile', description: 'Secure banking experience for modern users.', imageBase64: undefined },
  { title: 'Brand Identity', category: 'Branding', description: 'Complete visual identity system for a tech startup.', imageBase64: undefined },
  { title: 'Marketing Site', category: 'Web Design', description: 'High-converting landing page with A/B testing.', imageBase64: undefined },
  { title: 'Analytics Tool', category: 'SaaS', description: 'Data analytics platform for enterprise clients.', imageBase64: undefined },
];

// ── PortfolioCard (internal display) ───────────────────────────────────────
interface PortfolioCardProps {
  item: PortfolioItem;
  index: number;
  accentColor: string;
  t: { text: string; textSecondary: string; border: string; cardBg: string };
  hexToRgb: (hex: string) => string;
  enabled: boolean;
  onSaveCategory: (val: string) => void;
  onSaveTitle: (val: string) => void;
  onSaveDescription: (val: string) => void;
}

function PortfolioCard({ item, index, accentColor, t, hexToRgb, enabled, onSaveCategory, onSaveTitle, onSaveDescription }: PortfolioCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => !enabled && setHovered(true)}
      onMouseLeave={() => !enabled && setHovered(false)}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: t.cardBg,
        border: `1px solid ${hovered ? `rgba(${hexToRgb(accentColor)},0.3)` : t.border}`,
        transition: 'border-color 0.2s, transform 0.2s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
        {(item.imageUrl ?? item.imageBase64) ? (
          <img
            src={item.imageUrl ?? item.imageBase64}
            alt={item.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
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
              opacity={0.3}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
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
          {enabled ? (
            <EditableText value={item.category ?? ''} fieldKey={`portfolio-${index}-category`} tag="span" style={{ color: accentColor }} enabled={enabled} onSave={onSaveCategory} />
          ) : (
            item.category
          )}
        </div>
        <div style={{ color: t.text, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          {enabled ? (
            <EditableText value={item.title ?? ''} fieldKey={`portfolio-${index}-title`} tag="span" style={{ color: t.text, fontWeight: 600 }} enabled={enabled} onSave={onSaveTitle} />
          ) : (
            item.title
          )}
        </div>
        {(item.description || enabled) && (
          <div style={{ color: t.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
            {enabled ? (
              <EditableText value={item.description ?? ''} fieldKey={`portfolio-${index}-desc`} tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={onSaveDescription} />
            ) : (
              item.description
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export const TronPortfolio = React.memo(function TronPortfolio() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const carouselViewportRef = React.useRef<HTMLDivElement | null>(null);
  const [carouselWidth, setCarouselWidth] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const dragStartXRef = React.useRef(0);
  const autoplayRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

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
    visibleCards = 3,
    items = DEFAULT_ITEMS,
    autoplay = true,
    autoplaySpeed = 5,
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
  }, []);

  React.useEffect(() => {
    const el = carouselViewportRef.current;
    if (!el) return;
    const update = () => setCarouselWidth(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(([entry]) => setCarouselWidth(entry?.contentRect?.width ?? 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const accentColor = propAccent ?? theme?.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme?.colorScheme ?? 'dark';
  const tokensBuilt = buildTokens(darkBg, lightBg);
  const t = {
    ...tokensBuilt[scheme],
    accent: accentColor,
    bg: scheme === 'dark' ? (darkBg ?? '#0a0a0a') : (lightBg ?? '#ffffff'),
  };

  const rawList = (Array.isArray(items) ? items : DEFAULT_ITEMS).map(normalizePortfolioItem);
  const totalItems = rawList.length;
  const visible = isMobile ? 1 : (visibleCards ?? 3);
  const maxIndex = Math.max(0, totalItems - visible);

  const goTo = React.useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
    },
    [maxIndex]
  );

  const goNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const goPrev = React.useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const handleManualNav = React.useCallback(
    (fn: () => void) => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
      fn();
      if (autoplay && !enabled) {
        autoplayRef.current = setInterval(goNext, (autoplaySpeed ?? 5) * 1000);
      }
    },
    [autoplay, autoplaySpeed, enabled, goNext]
  );

  React.useEffect(() => {
    if (!autoplay || enabled) return;
    autoplayRef.current = setInterval(goNext, (autoplaySpeed ?? 5) * 1000);
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [autoplay, autoplaySpeed, enabled, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = dragStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleManualNav(goNext);
      else handleManualNav(goPrev);
    }
  };

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const gap = 20;
  const slideWidth = carouselWidth > 0 ? (carouselWidth - gap * (visible - 1)) / visible : 0;
  const translateX = -currentIndex * (slideWidth + gap);

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      data-block-type="portfolio"
      className={`w-full max-w-full py-20 px-4 sm:px-8 lg:px-16 flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        position: 'relative',
        background: t.bg,
        minHeight: `${sectionHeight}vh`,
      }}
    >
      <div
        key={colorScheme}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: showGrid
            ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
            : 'none',
          backgroundSize: showGrid ? '50px 50px' : 'auto',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div className="max-w-6xl mx-auto w-full" style={{ position: 'relative', zIndex: 1 }} {...animAttrs}>
        <div className="text-center mb-12 md:mb-16">
          <EditableText
            value={title ?? ''}
            fieldKey="title"
            tag="h2"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: t.text, margin: 0 }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.title = val; }, 0)}
          />
          <EditableText
            value={subtitle ?? ''}
            fieldKey="subtitle"
            tag="p"
            style={{ fontSize: 16, color: t.textSecondary, marginTop: 12, marginBottom: 0, lineHeight: 1.6 }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
          />
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <div ref={carouselViewportRef} style={{ overflow: 'hidden', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                gap,
                transform: `translateX(${translateX}px)`,
                transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {rawList.map((item, i) => (
                <div
                  key={i}
                  style={{
                    flexShrink: 0,
                    width: carouselWidth > 0 ? slideWidth : `calc((100% - ${gap * (visible - 1)}px) / ${visible})`,
                  }}
                >
                  <PortfolioCard
                    item={item}
                    index={i}
                    accentColor={accentColor}
                    t={t}
                    hexToRgb={hexToRgb}
                    enabled={enabled}
                    onSaveCategory={(val) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as PortfolioItem[]) ?? [])];
                      items[i] = { ...items[i], category: val };
                      p.items = items;
                    }, 0)}
                    onSaveTitle={(val) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as PortfolioItem[]) ?? [])];
                      items[i] = { ...items[i], title: val };
                      p.items = items;
                    }, 0)}
                    onSaveDescription={(val) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as PortfolioItem[]) ?? [])];
                      items[i] = { ...items[i], description: val };
                      p.items = items;
                    }, 0)}
                  />
                </div>
              ))}
            </div>
          </div>

          {currentIndex > 0 && (
            <button
              type="button"
              onClick={() => handleManualNav(goPrev)}
              style={{
                position: 'absolute',
                left: 8,
                top: '40%',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                color: t.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          {currentIndex < maxIndex && (
            <button
              type="button"
              onClick={() => handleManualNav(goNext)}
              style={{
                position: 'absolute',
                right: 8,
                top: '40%',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                color: t.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>

        {maxIndex >= 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleManualNav(() => goTo(i))}
                style={{
                  width: i === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === currentIndex ? accentColor : t.border,
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'width 0.3s ease, background 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

// ── Settings ──────────────────────────────────────────────────────────────
function TronPortfolioSettings() {
  const { actions: { setProp } } = useNode();
  const { user } = useAuth();
  const [showMedia, setShowMedia] = React.useState<number | null>(null);
  const props = useNode((node) => node.data.props as Partial<TronPortfolioProps>) ?? {};
  const {
    title = 'Our work',
    subtitle = 'A selection of projects we are proud of.',
    items = DEFAULT_ITEMS,
    visibleCards = 3,
    autoplay = true,
    autoplaySpeed = 5,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

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
      const arr = [
        ...((p.items as PortfolioItem[]) ?? []),
        { title: 'New Project', category: 'Category', description: '', imageBase64: undefined },
      ];
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
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
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
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Items</h3>
        <div className="space-y-4">
          {list.slice(0, 12).map((item, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              {/* TITLE — полная ширина, первым */}
              <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', display: 'block', marginBottom: 4 }}>
                Title
              </label>
              <input
                type="text"
                value={item.title ?? ''}
                placeholder="Project title"
                onChange={(e) => updateItem(i, 'title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  marginBottom: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* CATEGORY */}
              <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', display: 'block', marginBottom: 4 }}>
                Category
              </label>
              <input
                type="text"
                value={item.category ?? ''}
                placeholder="e.g. Web Design"
                onChange={(e) => updateItem(i, 'category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  marginBottom: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Description */}
              <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', display: 'block', marginBottom: 4 }}>
                Description
              </label>
              <input
                type="text"
                value={item.description ?? ''}
                placeholder="Short description"
                onChange={(e) => updateItem(i, 'description', e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  marginBottom: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Upload + удалить item */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(item.imageUrl ?? item.imageBase64) && (
                    <img
                      src={item.imageUrl ?? item.imageBase64}
                      alt=""
                      style={{ width: 48, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMedia(i)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: 'rgba(255,107,53,0.1)',
                      border: '1px solid rgba(255,107,53,0.3)',
                      color: '#FF6B35',
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {(item.imageUrl ?? item.imageBase64) ? '↺ Change' : '+ Add image'}
                  </button>
                  {(item.imageUrl ?? item.imageBase64) && (
                    <button
                      type="button"
                      onClick={() => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as PortfolioItem[]) ?? [])];
                        if (items[i]) items[i] = { ...items[i], imageUrl: undefined, imageBase64: undefined };
                        p.items = items;
                      }, 0)}
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
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  style={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    border: 'none',
                    background: 'rgba(239,68,68,0.15)',
                    color: '#f87171',
                    fontSize: 18,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {list.length < 12 && (
            <button
              type="button"
              onClick={addItem}
              className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555]"
            >
              + Add project
            </button>
          )}
        </div>
      </div>

      {/* LAYOUT */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div>
          <label className={labelCls}>Visible cards</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {([2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setProp((p: Record<string, unknown>) => { p.visibleCards = n; })}
                style={{
                  flex: 1,
                  padding: '4px 0',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: visibleCards === n ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                  background: visibleCards === n ? 'rgba(255,107,53,0.15)' : 'transparent',
                  color: visibleCards === n ? '#FF6B35' : '#a1a1aa',
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AUTOPLAY */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Autoplay</h3>
        <div className="space-y-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#d4d4d8' }}>Autoplay</span>
            <input
              type="checkbox"
              checked={autoplay ?? true}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.autoplay = e.target.checked; })}
              className="rounded border-gray-600 bg-gray-700"
            />
          </div>
          {autoplay && (
            <div>
              <label className={labelCls}>Speed: {autoplaySpeed ?? 5}s</label>
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={autoplaySpeed ?? 5}
                onChange={(e) => setProp((p: Record<string, unknown>) => { p.autoplaySpeed = Number(e.target.value); }, 300)}
                className="settings-slider"
              />
            </div>
          )}
        </div>
      </div>

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={darkBg ?? '#0a0a0a'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{darkBg ?? '#0a0a0a'}</span>
          </div>
          <label className={labelCls} style={{ marginTop: 12 }}>Background (light mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={lightBg ?? '#ffffff'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{lightBg ?? '#ffffff'}</span>
          </div>
        </div>
      </div>

      {/* SIZE */}
      <div className={sectionCls}>
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
            className="settings-slider"
          />
        </div>
      </div>

      {/* DISPLAY */}
      <div className={sectionCls}>
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
      <div className={sectionCls}>
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

      {showMedia !== null && user && (
        <MediaLibrary
          userId={user.id}
          accept="image"
          onSelect={(url) => {
            setProp((p: Record<string, unknown>) => {
              const items = [...((p.items as PortfolioItem[]) ?? [])];
              if (items[showMedia] !== undefined) {
                items[showMedia] = { ...items[showMedia], imageUrl: url, imageBase64: undefined };
              }
              p.items = items;
            }, 0);
            setShowMedia(null);
          }}
          onClose={() => setShowMedia(null)}
        />
      )}
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
    visibleCards: 3 as const,
    autoplay: true,
    autoplaySpeed: 5,
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronPortfolioSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['agency', 'freelance', 'studio'],
    featureTags: ['portfolio', 'carousel'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronPortfolio as unknown as { craft: typeof tronPortfolioCraft }).craft = tronPortfolioCraft;
