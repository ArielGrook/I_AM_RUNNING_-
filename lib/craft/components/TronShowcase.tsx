'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from './TronStats';

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

// ── Tokens (copy from TronStats, bg from darkBg/lightBg) ───────────────────
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

// ── Interfaces ───────────────────────────────────────────────────────────
interface ShowcaseBullet {
  text: string;
}

interface ShowcaseTab {
  label: string;
  description: string;
  title: string;
  body: string;
  bullets?: ShowcaseBullet[];
  imageBase64?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  ctaText?: string;
  ctaShow?: boolean;
}

interface TronShowcaseProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  title?: string;
  subtitle?: string;
  layoutStyle?: 'tabs-left' | 'tabs-top';
  items?: ShowcaseTab[];
  animationType?: string;
  animateDelay?: string;
}

const DEFAULT_ITEMS: ShowcaseTab[] = [
  {
    label: 'Lightning Fast',
    description: 'Optimized for speed',
    title: 'Performance that scales',
    body: 'Our infrastructure is built for speed. Every component is optimized to ensure your site loads instantly, even under heavy traffic.',
    bullets: [
      { text: 'Sub-100ms response times' },
      { text: 'Global CDN with 200+ edge nodes' },
      { text: 'Automatic image optimization' },
    ],
    imageBase64: undefined,
    ctaText: 'See benchmarks',
    ctaShow: false,
  },
  {
    label: 'Secure by Default',
    description: 'Enterprise-grade security',
    title: 'Security you can trust',
    body: 'Security is not an afterthought. Every component ships with best practices built in, so you can focus on building, not patching.',
    bullets: [
      { text: 'SOC 2 Type II certified' },
      { text: 'End-to-end encryption' },
      { text: 'Automatic vulnerability scanning' },
    ],
    imageBase64: undefined,
    ctaText: 'Read security docs',
    ctaShow: false,
  },
  {
    label: 'Easy to Customize',
    description: 'No code required',
    title: 'Your brand, your way',
    body: 'Change colors, fonts, layouts and more with just a few clicks. No design skills or code knowledge required.',
    bullets: [
      { text: 'Visual drag-and-drop editor' },
      { text: 'Unlimited color schemes' },
      { text: 'Custom fonts and typography' },
    ],
    imageBase64: undefined,
    ctaText: 'Start customizing',
    ctaShow: true,
  },
];

// ── Tab content panel (shared by tabs-left, tabs-top, accordion) ───────────
function TabContentPanel({
  item,
  itemIndex,
  t,
  accentColor,
  enabled,
  constrainTextWidth,
  onSaveTitle,
  onSaveBody,
  onSaveBullet,
  onSaveCta,
}: {
  item: ShowcaseTab;
  itemIndex: number;
  t: Record<string, string>;
  accentColor: string;
  enabled: boolean;
  constrainTextWidth?: boolean;
  onSaveTitle: (val: string) => void;
  onSaveBody: (val: string) => void;
  onSaveBullet: (bi: number, val: string) => void;
  onSaveCta: (val: string) => void;
}) {
  const textContent = (
    <>
      <h3
        style={{
          fontSize: 'clamp(20px, 3vw, 32px)',
          fontWeight: 700,
          color: t.text,
          marginBottom: 12,
          marginTop: 0,
        }}
      >
        {enabled ? (
          <EditableText value={item.title ?? ''} fieldKey={`showcase-${itemIndex}-title`} tag="span" style={{ color: t.text, fontWeight: 700 }} enabled={enabled} onSave={onSaveTitle} />
        ) : (
          item.title || 'Title'
        )}
      </h3>
      <p
        style={{
          color: t.textSecondary,
          fontSize: 15,
          lineHeight: 1.75,
          marginBottom: 20,
          marginTop: 0,
        }}
      >
        {enabled ? (
          <EditableText value={item.body ?? ''} fieldKey={`showcase-${itemIndex}-body`} tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={onSaveBody} />
        ) : (
          item.body || 'Body text'
        )}
      </p>
      {item.bullets?.map((b, bi) => (
        <div
          key={bi}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              flexShrink: 0,
              background: `rgba(${hexToRgb(accentColor)}, 0.12)`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
            }}
          >
            ✓
          </span>
          <span style={{ color: t.text, fontSize: 14 }}>
            {enabled ? (
              <EditableText value={b.text ?? ''} fieldKey={`showcase-${itemIndex}-bullet-${bi}`} tag="span" style={{ color: t.text }} enabled={enabled} onSave={(val) => onSaveBullet(bi, val)} />
            ) : (
              b.text
            )}
          </span>
        </div>
      ))}
      {((item.ctaShow || enabled) && (item.ctaText || enabled)) && (
        <button
          type="button"
          style={{
            marginTop: 24,
            padding: '12px 28px',
            background: accentColor,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: enabled ? 'default' : 'pointer',
          }}
        >
          {enabled ? (
            <EditableText value={item.ctaText ?? ''} fieldKey={`showcase-${itemIndex}-cta`} tag="span" style={{ color: '#fff', fontWeight: 600 }} enabled={enabled} onSave={onSaveCta} />
          ) : (
            item.ctaText
          )}
        </button>
      )}
    </>
  );

  return (
    <>
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${t.border}`,
          marginBottom: 28,
          aspectRatio: '16/9',
          maxHeight: 340,
          background: `rgba(${hexToRgb(accentColor)}, 0.03)`,
          position: 'relative',
        }}
      >
        {item.mediaType === 'video' && item.videoUrl ? (
          (() => {
            const embedUrl = getEmbedUrl(item.videoUrl);
            return embedUrl ? (
              <iframe
                src={embedUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                allowFullScreen
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: t.textSecondary,
                  fontSize: 13,
                }}
              >
                Invalid video URL
              </div>
            );
          })()
        ) : item.imageBase64 ? (
          <img
            src={item.imageBase64}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.3">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ color: t.textSecondary, fontSize: 12, opacity: 0.5 }}>
              Add image or video
            </span>
          </div>
        )}
      </div>
      {constrainTextWidth ? (
        <div style={{ maxWidth: '100%', paddingLeft: 4, paddingRight: 4 }}>
          {textContent}
        </div>
      ) : (
        textContent
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export const TronShowcase = React.memo(function TronShowcase() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const props = useNode((node) => node.data.props as Partial<TronShowcaseProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    title = 'Everything you need',
    subtitle = 'Explore the features that make our platform stand out.',
    layoutStyle = 'tabs-left',
    items = DEFAULT_ITEMS,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'dark';
  const t = {
    ...tokens[scheme],
    accent: accentColor,
    bg: scheme === 'dark' ? (darkBg ?? '#0a0a0a') : (lightBg ?? '#ffffff'),
  };

  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;

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
    if (list.length === 0) return;
    if (activeIndex >= list.length) setActiveIndex(list.length - 1);
  }, [list.length, activeIndex]);

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const displayActiveIndex = enabled ? 0 : activeIndex;
  const effectiveActiveIndex = isMobile
    ? displayActiveIndex
    : Math.max(0, Math.min(displayActiveIndex, list.length - 1));
  const effectiveActiveItem = effectiveActiveIndex >= 0 ? (list[effectiveActiveIndex] ?? list[0]) : null;

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      data-block-type="showcase"
      className={`w-full max-w-full py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        minHeight: `${sectionHeight}vh`,
        position: 'relative',
      }}
    >
      {/* Grid overlay — key заставляет перемонтировать при смене темы */}
      <div
        key={scheme}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: showGrid
            ? `linear-gradient(${t.gridColor} 1px, transparent 1px),
               linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
            : 'none',
          backgroundSize: showGrid ? '50px 50px' : 'auto',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
        {...animAttrs}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <EditableText
            value={title ?? ''}
            fieldKey="title"
            tag="h2"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: t.text, margin: 0, marginBottom: 16 }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.title = val; }, 0)}
          />
          <EditableText
            value={subtitle ?? ''}
            fieldKey="subtitle"
            tag="p"
            style={{ fontSize: 16, color: t.textSecondary, lineHeight: 1.6, margin: 0 }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
          />
        </div>

        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((item, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${displayActiveIndex === i
                    ? `rgba(${hexToRgb(accentColor)}, 0.3)`
                    : t.border}`,
                  marginBottom: 0,
                  overflow: 'hidden',
                  background: displayActiveIndex === i
                    ? `rgba(${hexToRgb(accentColor)}, 0.03)`
                    : t.cardBg,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    !enabled && setActiveIndex(displayActiveIndex === i ? -1 : i)
                  }
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: enabled ? 'default' : 'pointer',
                    color: t.text,
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {enabled ? (
                    <EditableText value={item.label ?? ''} fieldKey={`showcase-${i}-label`} tag="span" style={{ color: t.text, fontWeight: 500 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as ShowcaseTab[]) ?? [])];
                      items[i] = { ...items[i], label: val };
                      p.items = items;
                    }, 0)} />
                  ) : (
                    item.label
                  )}
                  <span
                    style={{
                      transform: displayActiveIndex === i ? 'rotate(45deg)' : 'rotate(0)',
                      transition: 'transform 0.3s',
                      color: accentColor,
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: displayActiveIndex === i ? 600 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.35s ease',
                  }}
                >
                  <div style={{ padding: '0 20px 20px' }}>
                    <TabContentPanel
                      item={item}
                      itemIndex={i}
                      t={t}
                      accentColor={accentColor}
                      enabled={enabled}
                      onSaveTitle={(val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as ShowcaseTab[]) ?? [])];
                        items[i] = { ...items[i], title: val };
                        p.items = items;
                      }, 0)}
                      onSaveBody={(val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as ShowcaseTab[]) ?? [])];
                        items[i] = { ...items[i], body: val };
                        p.items = items;
                      }, 0)}
                      onSaveBullet={(bi, val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as ShowcaseTab[]) ?? [])];
                        const bullets = [...(items[i]?.bullets ?? [])];
                        bullets[bi] = { ...bullets[bi], text: val };
                        items[i] = { ...items[i], bullets };
                        p.items = items;
                      }, 0)}
                      onSaveCta={(val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as ShowcaseTab[]) ?? [])];
                        items[i] = { ...items[i], ctaText: val };
                        p.items = items;
                      }, 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : layoutStyle === 'tabs-left' ? (
          <div
            style={{
              display: 'flex',
              gap: isMobile ? 0 : 48,
              alignItems: 'flex-start',
              maxWidth: 1100,
              margin: '0 auto',
              width: '100%',
            }}
          >
            <div
              style={{
                width: 280,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {list.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => !enabled && setActiveIndex(i)}
                  style={{
                    textAlign: 'left',
                    padding: '16px 20px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: enabled ? 'default' : 'pointer',
                    background:
                      effectiveActiveIndex === i
                        ? `rgba(${hexToRgb(accentColor)}, 0.08)`
                        : 'transparent',
                    borderLeft: `3px solid ${effectiveActiveIndex === i ? accentColor : 'transparent'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: effectiveActiveIndex === i ? accentColor : t.text,
                      marginBottom: 4,
                      transition: 'color 0.2s',
                    }}
                  >
                    {enabled ? (
                      <EditableText value={item.label ?? ''} fieldKey={`showcase-${i}-label`} tag="span" style={{ color: effectiveActiveIndex === i ? accentColor : t.text, fontWeight: 600 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as ShowcaseTab[]) ?? [])];
                        items[i] = { ...items[i], label: val };
                        p.items = items;
                      }, 0)} />
                    ) : (
                      item.label
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: t.textSecondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {enabled ? (
                      <EditableText value={item.description ?? ''} fieldKey={`showcase-${i}-desc`} tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as ShowcaseTab[]) ?? [])];
                        items[i] = { ...items[i], description: val };
                        p.items = items;
                      }, 0)} />
                    ) : (
                      item.description
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {effectiveActiveItem && (
                <TabContentPanel
                  item={effectiveActiveItem}
                  itemIndex={effectiveActiveIndex}
                  t={t}
                  accentColor={accentColor}
                  enabled={enabled}
                  constrainTextWidth
                  onSaveTitle={(val) => setProp((p: Record<string, unknown>) => {
                    const items = [...((p.items as ShowcaseTab[]) ?? [])];
                    items[effectiveActiveIndex] = { ...items[effectiveActiveIndex], title: val };
                    p.items = items;
                  }, 0)}
                  onSaveBody={(val) => setProp((p: Record<string, unknown>) => {
                    const items = [...((p.items as ShowcaseTab[]) ?? [])];
                    items[effectiveActiveIndex] = { ...items[effectiveActiveIndex], body: val };
                    p.items = items;
                  }, 0)}
                  onSaveBullet={(bi, val) => setProp((p: Record<string, unknown>) => {
                    const items = [...((p.items as ShowcaseTab[]) ?? [])];
                    const bullets = [...(items[effectiveActiveIndex]?.bullets ?? [])];
                    bullets[bi] = { ...bullets[bi], text: val };
                    items[effectiveActiveIndex] = { ...items[effectiveActiveIndex], bullets };
                    p.items = items;
                  }, 0)}
                  onSaveCta={(val) => setProp((p: Record<string, unknown>) => {
                    const items = [...((p.items as ShowcaseTab[]) ?? [])];
                    items[effectiveActiveIndex] = { ...items[effectiveActiveIndex], ctaText: val };
                    p.items = items;
                  }, 0)}
                />
              )}
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                gap: 4,
                flexWrap: 'wrap',
                borderBottom: `1px solid ${t.border}`,
                marginBottom: 40,
              }}
            >
              {list.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => !enabled && setActiveIndex(i)}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    cursor: enabled ? 'default' : 'pointer',
                    background: 'transparent',
                    color: effectiveActiveIndex === i ? accentColor : t.textSecondary,
                    borderBottom: `2px solid ${effectiveActiveIndex === i ? accentColor : 'transparent'}`,
                    fontSize: 14,
                    fontWeight: effectiveActiveIndex === i ? 600 : 400,
                    marginBottom: -1,
                    transition: 'all 0.2s',
                  }}
                >
                  {enabled ? (
                    <EditableText value={item.label ?? ''} fieldKey={`showcase-${i}-label`} tag="span" style={{ color: effectiveActiveIndex === i ? accentColor : t.textSecondary, fontWeight: effectiveActiveIndex === i ? 600 : 400 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as ShowcaseTab[]) ?? [])];
                      items[i] = { ...items[i], label: val };
                      p.items = items;
                    }, 0)} />
                  ) : (
                    item.label
                  )}
                </button>
              ))}
            </div>
            {effectiveActiveItem && (
              <TabContentPanel
                item={effectiveActiveItem}
                itemIndex={effectiveActiveIndex}
                t={t}
                accentColor={accentColor}
                enabled={enabled}
                onSaveTitle={(val) => setProp((p: Record<string, unknown>) => {
                  const items = [...((p.items as ShowcaseTab[]) ?? [])];
                  items[effectiveActiveIndex] = { ...items[effectiveActiveIndex], title: val };
                  p.items = items;
                }, 0)}
                onSaveBody={(val) => setProp((p: Record<string, unknown>) => {
                  const items = [...((p.items as ShowcaseTab[]) ?? [])];
                  items[effectiveActiveIndex] = { ...items[effectiveActiveIndex], body: val };
                  p.items = items;
                }, 0)}
                onSaveBullet={(bi, val) => setProp((p: Record<string, unknown>) => {
                  const items = [...((p.items as ShowcaseTab[]) ?? [])];
                  const bullets = [...(items[effectiveActiveIndex]?.bullets ?? [])];
                  bullets[bi] = { ...bullets[bi], text: val };
                  items[effectiveActiveIndex] = { ...items[effectiveActiveIndex], bullets };
                  p.items = items;
                }, 0)}
                onSaveCta={(val) => setProp((p: Record<string, unknown>) => {
                  const items = [...((p.items as ShowcaseTab[]) ?? [])];
                  items[effectiveActiveIndex] = { ...items[effectiveActiveIndex], ctaText: val };
                  p.items = items;
                }, 0)}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
});

// ── Settings ─────────────────────────────────────────────────────────────
function TronShowcaseSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronShowcaseProps>) ?? {};
  const {
    title = 'Everything you need',
    subtitle = 'Explore the features that make our platform stand out.',
    layoutStyle = 'tabs-left',
    items = DEFAULT_ITEMS,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const setT = (key: keyof TronShowcaseProps, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;

  const updateItem = (index: number, field: keyof ShowcaseTab, value: unknown) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as ShowcaseTab[]) ?? [])];
      if (arr[index]) {
        arr[index] = { ...arr[index], [field]: value };
        p.items = arr;
      }
    }, 500);
  };

  const updateBullet = (tabIndex: number, bulletIndex: number, text: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as ShowcaseTab[]) ?? [])];
      const tab = arr[tabIndex];
      if (tab?.bullets) {
        const bullets = [...tab.bullets];
        bullets[bulletIndex] = { ...bullets[bulletIndex], text };
        arr[tabIndex] = { ...tab, bullets };
        p.items = arr;
      }
    }, 500);
  };

  const addBullet = (tabIndex: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as ShowcaseTab[]) ?? [])];
      const tab = arr[tabIndex];
      if (tab) {
        const bullets = [...(tab.bullets ?? []), { text: 'New bullet' }];
        arr[tabIndex] = { ...tab, bullets };
        p.items = arr;
      }
    }, 0);
  };

  const removeBullet = (tabIndex: number, bulletIndex: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as ShowcaseTab[]) ?? [])];
      const tab = arr[tabIndex];
      if (tab?.bullets) {
        const bullets = tab.bullets.filter((_, i) => i !== bulletIndex);
        arr[tabIndex] = { ...tab, bullets };
        p.items = arr;
      }
    }, 0);
  };

  const removeItem = (index: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = ((p.items as ShowcaseTab[]) ?? []).filter((_, i) => i !== index);
      p.items = arr;
    }, 0);
  };

  const addItem = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [
        ...((p.items as ShowcaseTab[]) ?? []),
        {
          label: 'New tab',
          description: 'Short description',
          title: 'Tab title',
          body: 'Body text here.',
          bullets: [],
          imageBase64: undefined,
          mediaType: 'image' as const,
          videoUrl: undefined,
          ctaText: 'Learn more',
          ctaShow: false,
        },
      ];
      p.items = arr;
    }, 0);
  };

  return (
    <div className="p-3 space-y-0 text-white">
      {/* 1. CONTENT */}
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title} onChange={(e) => setT('title', 500)(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <input type="text" value={subtitle} onChange={(e) => setT('subtitle', 500)(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* 2. LAYOUT */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['tabs-left', 'tabs-top'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setProp((p: Record<string, unknown>) => { p.layoutStyle = v; })}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid',
                borderColor: layoutStyle === v ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                background: layoutStyle === v ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: layoutStyle === v ? '#FF6B35' : '#a1a1aa',
                cursor: 'pointer',
              }}
            >
              {v === 'tabs-left' ? 'Tabs left' : 'Tabs top'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ITEMS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Tabs</h3>
        <div className="space-y-4">
          {list.map((item, i) => (
            <div
              key={i}
              style={{
                background: 'var(--settings-card-bg, rgba(0,0,0,0.03))',
                border: '1px solid var(--settings-border, rgba(0,0,0,0.08))',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-400">Tab {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={list.length <= 1}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
                >
                  ×
                </button>
              </div>
              <div>
                <label className={labelCls}>Label</label>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateItem(i, 'label', e.target.value)}
                  className={inputCls}
                  placeholder="Tab label"
                />
              </div>
              <div>
                <label className={labelCls}>Description (tabs-left)</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  className={inputCls}
                  placeholder="Short description"
                />
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(i, 'title', e.target.value)}
                  className={inputCls}
                  placeholder="Content title"
                />
              </div>
              <div>
                <label className={labelCls}>Body</label>
                <textarea
                  value={item.body}
                  onChange={(e) => updateItem(i, 'body', e.target.value)}
                  className={inputCls}
                  rows={3}
                  placeholder="Body text"
                />
              </div>
              <div>
                <label className={labelCls}>Bullets</label>
                <div className="space-y-2 mt-1">
                  {(item.bullets ?? []).map((b, bi) => (
                    <div key={bi} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={b.text}
                        onChange={(e) => updateBullet(i, bi, e.target.value)}
                        className={inputCls}
                        placeholder="Bullet text"
                      />
                      <button
                        type="button"
                        onClick={() => removeBullet(i, bi)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addBullet(i)}
                    className="text-xs text-[#FF6B35] hover:underline"
                  >
                    + Add bullet
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={item.ctaShow ?? false}
                    onChange={(e) => updateItem(i, 'ctaShow', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  Show CTA
                </label>
                {item.ctaShow && (
                  <input
                    type="text"
                    value={item.ctaText ?? ''}
                    onChange={(e) => updateItem(i, 'ctaText', e.target.value)}
                    className={inputCls}
                    placeholder="Button text"
                    style={{ flex: 1 }}
                  />
                )}
              </div>
              <div>
                <label className={labelCls}>Media</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {(['image', 'video'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as ShowcaseTab[]) ?? [])];
                        if (items[i]) items[i] = { ...items[i], mediaType: type };
                        p.items = items;
                      }, 0)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 500,
                        background: (item.mediaType ?? 'image') === type ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
                        color: (item.mediaType ?? 'image') === type ? '#FF6B35' : '#a1a1aa',
                      }}
                    >
                      {type === 'image' ? '🖼 Image' : '▶ Video'}
                    </button>
                  ))}
                </div>
                {(item.mediaType ?? 'image') === 'image' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.imageBase64 && (
                      <img
                        src={item.imageBase64}
                        alt=""
                        style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
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
                      }}
                    >
                      {item.imageBase64 ? '↺ Change' : '+ Upload image'}
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
                              const items = [...((p.items as ShowcaseTab[]) ?? [])];
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
                        style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                {item.mediaType === 'video' && (
                  <input
                    type="text"
                    placeholder="YouTube or Vimeo URL"
                    value={item.videoUrl ?? ''}
                    onChange={(e) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as ShowcaseTab[]) ?? [])];
                      if (items[i]) items[i] = { ...items[i], videoUrl: e.target.value };
                      p.items = items;
                    }, 500)}
                    className={inputCls}
                  />
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded hover:border-gray-500"
          >
            + Add tab
          </button>
        </div>
      </div>

      {/* 4. COLORS */}
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

      {/* 5. SIZE */}
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

      {/* 6. DISPLAY */}
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

      {/* 7. ANIMATION */}
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
              <option value="rotate-in">Rotate In</option>
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
const tronShowcaseCraft = {
  displayName: 'Tron Showcase',
  props: {
    colorScheme: 'dark' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 80,
    showGrid: true,
    title: 'Everything you need',
    subtitle: 'Explore the features that make our platform stand out.',
    layoutStyle: 'tabs-left' as const,
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronShowcaseSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['saas', 'startup', 'agency'],
    featureTags: ['showcase', 'features', 'tabs'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronShowcase as unknown as { craft: typeof tronShowcaseCraft }).craft = tronShowcaseCraft;
