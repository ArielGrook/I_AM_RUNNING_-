'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { buildGridTokens as buildTokens } from '../tokens';

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

// ── Service Icons ─────────────────────────────────────────────────────────
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  code: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  design: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/>
      <circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  marketing: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  support: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  analytics: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  seo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  hosting: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  ),
  security: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

const ICON_KEYS = Object.keys(SERVICE_ICONS);

// ── Types ─────────────────────────────────────────────────────────────────
interface ServiceItem {
  iconKey: string;
  title: string;
  description: string;
  tag?: string;   // e.g. "Popular", "New", price like "$99/mo"
  showTag?: boolean;
}

export interface TronServicesProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  label?: string;
  showLabel?: boolean;
  title?: string;
  subtitle?: string;
  layoutStyle?: 'cards' | 'steps' | 'horizontal';
  columns?: 2 | 3;
  items?: ServiceItem[];
  animationType?: string;
  animateDelay?: string;
}

// ── Default items ─────────────────────────────────────────────────────────
const DEFAULT_ITEMS: ServiceItem[] = [
  { iconKey: 'design',    title: 'UI/UX Design',       description: 'Beautiful, conversion-focused designs tailored to your brand and audience.',    tag: 'Popular', showTag: true  },
  { iconKey: 'code',      title: 'Web Development',    description: 'Fast, scalable websites and web apps built with modern technologies.',          tag: 'From $999', showTag: true  },
  { iconKey: 'marketing', title: 'Digital Marketing',  description: 'Data-driven campaigns that grow your audience and convert visitors to clients.', tag: 'New',      showTag: false },
  { iconKey: 'seo',       title: 'SEO Optimization',   description: 'Rank higher on search engines and get more organic traffic to your site.',     tag: '',         showTag: false },
  { iconKey: 'analytics', title: 'Analytics & Reports', description: 'Deep insights into your traffic, conversions, and user behavior patterns.',   tag: '',         showTag: false },
  { iconKey: 'support',   title: '24/7 Support',        description: 'Round-the-clock expert support to keep your business running smoothly.',      tag: 'Pro',      showTag: false },
];

// ── Component ─────────────────────────────────────────────────────────────
export const TronServices = React.memo(function TronServices() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [hovered, setHovered] = React.useState<number | null>(null);

  // ResizeObserver 520px
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setIsMobile(el.getBoundingClientRect().width < 520);
    check();
    const observer = new ResizeObserver(([e]) => setIsMobile(e.contentRect.width < 520));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // GSAP stagger on scroll
  React.useEffect(() => {
    if (typeof window === 'undefined' || enabled) return;
    let ctx: { revert?: () => void } = {};
    const init = async () => {
      try {
        const gsapModule = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        const gsap = (gsapModule as unknown as { gsap: typeof import('gsap').gsap }).gsap
          || (gsapModule as unknown as { default: typeof import('gsap').gsap }).default;
        if (!gsap) return;
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          const cards = containerRef.current?.querySelectorAll('.tron-service-card');
          if (!cards?.length) return;
          gsap.fromTo(cards,
            { opacity: 0, y: 32 },
            {
              opacity: 1, y: 0, duration: 0.55, ease: 'power2.out',
              stagger: 0.08,
              scrollTrigger: {
                trigger: containerRef.current,
                start: 'top 80%',
                once: true,
              },
            }
          );
        });
      } catch { /* degrade */ }
    };
    init();
    return () => { if (ctx?.revert) ctx.revert(); };
  }, [enabled]);

  // ── Props ──────────────────────────────────────────────────────────────
  const props = useNode((node) => node.data.props as Partial<TronServicesProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 70,
    showGrid = true,
    label = 'What we do',
    showLabel = true,
    title = 'Our Services',
    subtitle = 'Everything your business needs to grow online — from strategy to execution.',
    layoutStyle = 'cards',
    columns = 3,
    items = DEFAULT_ITEMS,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'dark';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme] };
  const rgb = hexToRgb(accentColor);

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const list = Array.isArray(items) && items.length > 0 ? items : DEFAULT_ITEMS;
  const cols = isMobile ? 1 : (columns ?? 3);

  // ── Card layout ────────────────────────────────────────────────────────
  const renderCards = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: isMobile ? 16 : 24,
    }}>
      {list.map((item, i) => {
        const isHovered = hovered === i;
        return (
          <div
            key={i}
            className="tron-service-card"
            onMouseEnter={() => !enabled && setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: 'relative',
              padding: isMobile ? '24px 20px' : '32px 28px',
              borderRadius: 16,
              background: isHovered
                ? `rgba(${rgb}, 0.07)`
                : t.cardBg,
              border: `1px solid ${isHovered ? `rgba(${rgb}, 0.25)` : t.border}`,
              transition: 'all 0.25s ease',
              transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: isHovered ? `0 16px 48px rgba(${rgb}, 0.12)` : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              cursor: 'default',
              overflow: 'hidden',
            }}
          >
            {/* Accent top line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 2,
              background: isHovered ? accentColor : 'transparent',
              borderRadius: '16px 16px 0 0',
              transition: 'background 0.25s ease',
            }} />

            {/* Tag badge */}
            {item.showTag && item.tag && (
              <div style={{
                position: 'absolute', top: 16, right: 16,
                padding: '3px 10px', borderRadius: 100,
                background: `rgba(${rgb}, 0.15)`,
                color: accentColor,
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.04em',
              }}>
                {item.tag}
              </div>
            )}

            {/* Icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `rgba(${rgb}, ${isHovered ? 0.15 : 0.08})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accentColor,
              marginBottom: 20,
              transition: 'background 0.25s ease',
              flexShrink: 0,
            }}>
              {SERVICE_ICONS[item.iconKey] ?? SERVICE_ICONS.code}
            </div>

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <EditableText
                value={item.title ?? ''}
                fieldKey={`service-title-${i}`}
                tag="h3"
                style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: 0 }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => {
                  const arr = [...((p.items as ServiceItem[]) ?? [])];
                  arr[i] = { ...arr[i], title: val };
                  p.items = arr;
                }, 0)}
              />
            </div>

            {/* Description */}
            <EditableText
              value={item.description ?? ''}
              fieldKey={`service-desc-${i}`}
              tag="p"
              style={{ fontSize: 14, lineHeight: 1.65, color: t.textSecondary, margin: 0, flex: 1 }}
              enabled={enabled}
              onSave={(val) => setProp((p: Record<string, unknown>) => {
                const arr = [...((p.items as ServiceItem[]) ?? [])];
                arr[i] = { ...arr[i], description: val };
                p.items = arr;
              }, 0)}
            />
          </div>
        );
      })}
    </div>
  );

  // ── Steps layout (numbered process) ───────────────────────────────────
  const renderSteps = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {list.map((item, i) => {
        const isLast = i === list.length - 1;
        return (
          <div
            key={i}
            className="tron-service-card"
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 16 : 32,
              alignItems: isMobile ? 'flex-start' : 'flex-start',
              paddingBottom: isLast ? 0 : 40,
              marginBottom: isLast ? 0 : 0,
              position: 'relative',
            }}
          >
            {/* Step number + line */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `rgba(${rgb}, 0.12)`,
                border: `2px solid rgba(${rgb}, 0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accentColor,
                fontSize: 16, fontWeight: 800,
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              {!isLast && !isMobile && (
                <div style={{
                  width: 1, flex: 1, minHeight: 40,
                  background: `linear-gradient(to bottom, rgba(${rgb}, 0.3), transparent)`,
                  marginTop: 8,
                }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : (isMobile ? 0 : 40) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ color: accentColor }}>
                  {SERVICE_ICONS[item.iconKey] ?? SERVICE_ICONS.code}
                </div>
                <EditableText
                  value={item.title ?? ''}
                  fieldKey={`step-title-${i}`}
                  tag="h3"
                  style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: 0 }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => {
                    const arr = [...((p.items as ServiceItem[]) ?? [])];
                    arr[i] = { ...arr[i], title: val };
                    p.items = arr;
                  }, 0)}
                />
                {item.showTag && item.tag && (
                  <span style={{
                    padding: '2px 10px', borderRadius: 100,
                    background: `rgba(${rgb}, 0.12)`, color: accentColor,
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {item.tag}
                  </span>
                )}
              </div>
              <EditableText
                value={item.description ?? ''}
                fieldKey={`step-desc-${i}`}
                tag="p"
                style={{ fontSize: 15, lineHeight: 1.65, color: t.textSecondary, margin: 0 }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => {
                  const arr = [...((p.items as ServiceItem[]) ?? [])];
                  arr[i] = { ...arr[i], description: val };
                  p.items = arr;
                }, 0)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Horizontal layout (compact list) ──────────────────────────────────
  const renderHorizontal = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {list.map((item, i) => {
        const isHovered = hovered === i;
        return (
          <div
            key={i}
            className="tron-service-card"
            onMouseEnter={() => !enabled && setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 12 : 24,
              padding: isMobile ? '20px 16px' : '20px 28px',
              borderRadius: 12,
              background: isHovered ? `rgba(${rgb}, 0.05)` : 'transparent',
              border: `1px solid ${isHovered ? `rgba(${rgb}, 0.15)` : 'transparent'}`,
              transition: 'all 0.2s ease',
              cursor: 'default',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `rgba(${rgb}, 0.1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accentColor,
            }}>
              {SERVICE_ICONS[item.iconKey] ?? SERVICE_ICONS.code}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <EditableText
                  value={item.title ?? ''}
                  fieldKey={`horiz-title-${i}`}
                  tag="span"
                  style={{ fontSize: 16, fontWeight: 700, color: t.text }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => {
                    const arr = [...((p.items as ServiceItem[]) ?? [])];
                    arr[i] = { ...arr[i], title: val };
                    p.items = arr;
                  }, 0)}
                />
                {item.showTag && item.tag && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 100,
                    background: `rgba(${rgb}, 0.12)`, color: accentColor,
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {item.tag}
                  </span>
                )}
              </div>
              <EditableText
                value={item.description ?? ''}
                fieldKey={`horiz-desc-${i}`}
                tag="p"
                style={{ fontSize: 14, lineHeight: 1.55, color: t.textSecondary, margin: 0 }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => {
                  const arr = [...((p.items as ServiceItem[]) ?? [])];
                  arr[i] = { ...arr[i], description: val };
                  p.items = arr;
                }, 0)}
              />
            </div>
            {!isMobile && (
              <div style={{
                color: isHovered ? accentColor : t.textSecondary,
                transition: 'color 0.2s ease',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      id="services"
      data-block-type="services"
      className={`w-full relative overflow-hidden ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        minHeight: `${sectionHeight}vh`,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Grid */}
      <div key={scheme} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: showGrid
          ? `linear-gradient(${t.gridColor} 1px, transparent 1px),
             linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
          : 'none',
        backgroundSize: showGrid ? '50px 50px' : 'auto',
      }} />

      {/* Content */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          width: '100%',
          maxWidth: 1200, margin: '0 auto',
          padding: isMobile ? '60px 20px' : '80px 40px',
        }}
        {...animAttrs}
      >
        {/* Header */}
        <div style={{ marginBottom: isMobile ? 40 : 56, textAlign: 'center' }}>
          {showLabel && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
            }}>
              <div style={{ width: 32, height: 2, background: accentColor, borderRadius: 1 }} />
              <EditableText
                value={label ?? ''}
                fieldKey="label"
                tag="span"
                style={{
                  color: accentColor, fontSize: 13, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => { p.label = val; }, 0)}
              />
              <div style={{ width: 32, height: 2, background: accentColor, borderRadius: 1 }} />
            </div>
          )}
          <EditableText
            value={title ?? ''}
            fieldKey="title"
            tag="h2"
            style={{
              fontSize: isMobile ? 28 : 44, fontWeight: 800,
              letterSpacing: '-0.02em', lineHeight: 1.1,
              color: t.text, margin: '0 0 16px',
            }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.title = val; }, 0)}
          />
          <EditableText
            value={subtitle ?? ''}
            fieldKey="subtitle"
            tag="p"
            style={{
              fontSize: 16, lineHeight: 1.65,
              color: t.textSecondary, margin: '0 auto',
              maxWidth: 560,
            }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
          />
        </div>

        {/* Services */}
        {layoutStyle === 'cards' && renderCards()}
        {layoutStyle === 'steps' && renderSteps()}
        {layoutStyle === 'horizontal' && renderHorizontal()}
      </div>
    </section>
  );
});

// ── Settings ──────────────────────────────────────────────────────────────
function TronServicesSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronServicesProps>) ?? {};
  const {
    label = 'What we do',
    showLabel = true,
    title = 'Our Services',
    subtitle = 'Everything your business needs to grow online.',
    layoutStyle = 'cards',
    columns = 3,
    items = DEFAULT_ITEMS,
    showGrid = true,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 70,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const list = Array.isArray(items) && items.length > 0 ? items : DEFAULT_ITEMS;

  const updateItem = (i: number, field: keyof ServiceItem, value: string | boolean) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as ServiceItem[]) ?? [])];
      arr[i] = { ...arr[i], [field]: value };
      p.items = arr;
    }, 300);
  };

  return (
    <div className="p-3 space-y-0">
      {/* CONTENT */}
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Label</label>
            <input type="text" value={label} onChange={(e) => setProp((p: Record<string, unknown>) => { p.label = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <textarea value={subtitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; }, 500)} className={inputCls} rows={2} />
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Layout</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Style</label>
            <select value={layoutStyle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.layoutStyle = e.target.value; })} className={inputCls}>
              <option value="cards">Cards</option>
              <option value="steps">Process steps</option>
              <option value="horizontal">Horizontal list</option>
            </select>
          </div>
          {layoutStyle === 'cards' && (
            <div>
              <label className={labelCls}>Columns</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {([2, 3] as const).map((n) => (
                  <button key={n} onClick={() => setProp((p: Record<string, unknown>) => { p.columns = n; })}
                    style={{
                      flex: 1, padding: '5px 0', fontSize: 12, borderRadius: 6, border: '1px solid',
                      borderColor: columns === n ? '#FF6B35' : 'rgba(255,255,255,0.12)',
                      background: columns === n ? 'rgba(255,107,53,0.12)' : 'transparent',
                      color: columns === n ? '#FF6B35' : '#a1a1aa', cursor: 'pointer',
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ITEMS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Services ({list.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: 10,
            }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <select value={item.iconKey} onChange={(e) => updateItem(i, 'iconKey', e.target.value)}
                  className={inputCls} style={{ width: 110, flexShrink: 0, marginBottom: 0 }}>
                  {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <input type="text" value={item.title} placeholder="Title"
                  onChange={(e) => updateItem(i, 'title', e.target.value)} className={inputCls} style={{ marginBottom: 0 }} />
                <button onClick={() => setProp((p: Record<string, unknown>) => {
                  p.items = ((p.items as ServiceItem[]) ?? []).filter((_, idx) => idx !== i);
                })} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>×</button>
              </div>
              <textarea value={item.description} placeholder="Description" rows={2}
                onChange={(e) => updateItem(i, 'description', e.target.value)} className={inputCls} style={{ marginBottom: 6 }} />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="text" value={item.tag ?? ''} placeholder="Tag (e.g. Popular, $99)" style={{ flex: 1, marginBottom: 0 }}
                  onChange={(e) => updateItem(i, 'tag', e.target.value)} className={inputCls} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a1a1aa', flexShrink: 0 }}>
                  <input type="checkbox" checked={item.showTag ?? false} onChange={(e) => updateItem(i, 'showTag', e.target.checked)} />
                  show
                </label>
              </div>
            </div>
          ))}
          <button onClick={() => setProp((p: Record<string, unknown>) => {
            p.items = [...((p.items as ServiceItem[]) ?? []), { iconKey: 'code', title: 'New Service', description: 'Service description.', tag: '', showTag: false }];
          })} style={{ color: '#FF6B35', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
            + Add service
          </button>
        </div>
      </div>

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Colors</h3>
        {[
          { label: 'Background (dark)', key: 'darkBg', value: darkBg },
          { label: 'Background (light)', key: 'lightBg', value: lightBg },
        ].map(({ label: lbl, key, value }) => (
          <div key={key}>
            <label className={labelCls}>{lbl}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <input type="color" value={value} onChange={(e) => setProp((p: Record<string, unknown>) => { p[key] = e.target.value; }, 300)} />
              <span className="text-xs text-zinc-500 font-mono">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* SIZE */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Size</h3>
        <label className={labelCls}>Section height: {sectionHeight}vh</label>
        <input type="range" min={40} max={100} step={5} value={sectionHeight}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)}
          className="settings-slider" />
      </div>

      {/* DISPLAY */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Display</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showLabel} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showLabel = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show label
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showGrid} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show grid
          </label>
        </div>
      </div>

      {/* ANIMATION */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Animation</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Type</label>
            <select value={animationType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}>
              <option value="none">None</option>
              <option value="fade-in">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="slide-left">Slide Left</option>
              <option value="scale-in">Scale In</option>
              <option value="blur-in">Blur In</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay</label>
            <select value={animateDelay} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}>
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
const tronServicesCraft = {
  displayName: 'Services Tron',
  props: {
    colorScheme: 'dark' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 70,
    showGrid: true,
    label: 'What we do',
    showLabel: true,
    title: 'Our Services',
    subtitle: 'Everything your business needs to grow online — from strategy to execution.',
    layoutStyle: 'cards' as const,
    columns: 3 as const,
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronServicesSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    block_type: 'services',
    variant_name: 'default',
    style_tags: ['dark', 'minimal', 'corporate'],
    business_tags: [
      'agency', 'consulting', 'startup', 'business_card',
      'portfolio', 'health', 'education', 'beauty',
    ],
    feature_tags: ['services'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronServices as unknown as { craft: typeof tronServicesCraft }).craft = tronServicesCraft;
