'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from './TronStats';
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
export interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  text: string;
  rating: number;
  avatarBase64?: string;
  avatarUrl?: string;
}

interface TronTestimonialsProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  showSecondRowMobile?: boolean;
  title?: string;
  subtitle?: string;
  speed?: number;
  items?: TestimonialItem[];
  animationType?: string;
  animateDelay?: string;
}

// Legacy format: { quote, author, role } — normalize to new format
function normalizeTestimonialItem(raw: unknown): TestimonialItem {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const name = (o.name ?? o.author ?? '') as string;
    const text = (o.text ?? o.quote ?? '') as string;
    const role = (o.role ?? '') as string;
    const company = (o.company ?? '') as string;
    const rating = typeof o.rating === 'number' ? o.rating : 5;
    const avatarBase64 = (o.avatarBase64 as string) || undefined;
    const avatarUrl = (o.avatarUrl as string) || undefined;
    return { name: String(name ?? ''), role: String(role ?? ''), company: String(company ?? ''), text: String(text ?? ''), rating, avatarBase64, avatarUrl };
  }
  return { name: '', role: '', company: '', text: '', rating: 5 };
}

// ── CSS animation injection ───────────────────────────────────────────────
const STYLE_ID = 'testimonials-animation';

function useTestimonialsAnimation() {
  React.useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes scrollLeft {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes scrollRight {
        0% { transform: translateX(-50%); }
        100% { transform: translateX(0); }
      }
      .testimonials-track-left {
        animation: scrollLeft var(--scroll-duration) linear infinite;
      }
      .testimonials-track-right {
        animation: scrollRight var(--scroll-duration) linear infinite;
      }
      .testimonials-track-left:hover,
      .testimonials-track-right:hover {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);
}

// ── TestimonialCard (internal display) ────────────────────────────────────
interface TestimonialCardDisplayProps {
  item: TestimonialItem;
  index: number;
  t: { text: string; textSecondary: string; border: string; cardBg: string };
  accentColor: string;
  enabled: boolean;
  onSaveText: (val: string) => void;
  onSaveName: (val: string) => void;
  onSaveRole: (val: string) => void;
  onSaveCompany: (val: string) => void;
}

function TestimonialCardDisplay({ item, index, t, accentColor, enabled, onSaveText, onSaveName, onSaveRole, onSaveCompany }: TestimonialCardDisplayProps) {
  const [hovered, setHovered] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const avatarSrc = item.avatarUrl ?? item.avatarBase64;
  const showAvatar = avatarSrc && !imgError;
  const initial = (item.name ?? '').charAt(0) || '?';

  return (
    <div
      onMouseEnter={() => !enabled && setHovered(true)}
      onMouseLeave={() => !enabled && setHovered(false)}
      style={{
        width: 300,
        flexShrink: 0,
        background: t.cardBg,
        border: `1px solid ${hovered ? `rgba(${hexToRgb(accentColor)}, 0.3)` : t.border}`,
        borderRadius: 12,
        padding: 24,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            style={{
              color: i < (item.rating ?? 5) ? accentColor : t.border,
              fontSize: 14,
            }}
          >
            ★
          </span>
        ))}
      </div>

      <p
        style={{
          color: t.text,
          fontSize: 14,
          lineHeight: 1.7,
          margin: '0 0 20px 0',
        }}
      >
        {enabled ? (
          <EditableText value={item.text ?? ''} fieldKey={`testimonial-${index}-text`} tag="span" style={{ color: t.text }} enabled={enabled} onSave={onSaveText} />
        ) : (
          <> &quot;{item.text ?? ''}&quot;</>
        )}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: `rgba(${hexToRgb(accentColor)}, 0.15)`,
          }}
        >
          {showAvatar ? (
            <img
              src={avatarSrc!}
              alt={item.name ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accentColor,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {initial}
            </div>
          )}
        </div>
        <div>
          <div style={{ color: t.text, fontSize: 13, fontWeight: 600 }}>
            {enabled ? (
              <EditableText value={item.name ?? ''} fieldKey={`testimonial-${index}-name`} tag="span" style={{ color: t.text, fontWeight: 600 }} enabled={enabled} onSave={onSaveName} />
            ) : (
              item.name ?? ''
            )}
          </div>
          <div style={{ color: t.textSecondary, fontSize: 12 }}>
            {enabled ? (
              <>
                <EditableText value={item.role ?? ''} fieldKey={`testimonial-${index}-role`} tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={onSaveRole} />
                {(item.company ?? '') ? ' · ' : ''}
                <EditableText value={item.company ?? ''} fieldKey={`testimonial-${index}-company`} tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={onSaveCompany} />
              </>
            ) : (
              <>
                {item.role ?? ''}
                {(item.company ?? '') ? ` · ${item.company}` : ''}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_ITEMS: TestimonialItem[] = [
  {
    name: 'Sarah Chen',
    role: 'CTO',
    company: 'Vercel',
    text: 'This platform completely transformed how we build landing pages. What used to take weeks now takes hours.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Founder',
    company: 'Linear',
    text: 'The component quality is outstanding. Every detail is polished and works perfectly out of the box.',
    rating: 5,
  },
  {
    name: 'Elena Rodriguez',
    role: 'Design Lead',
    company: 'Stripe',
    text: "Finally a builder that doesn't sacrifice design quality for ease of use. Absolutely love it.",
    rating: 5,
  },
  {
    name: 'James Park',
    role: 'Product Manager',
    company: 'Notion',
    text: 'Our conversion rates increased 40% after switching to this platform. The components just work.',
    rating: 5,
  },
  {
    name: 'Aisha Patel',
    role: 'CEO',
    company: 'Loom',
    text: "I've tried every website builder out there. This is the only one that actually respects developers.",
    rating: 5,
  },
  {
    name: 'Tom Wilson',
    role: 'Engineer',
    company: 'Figma',
    text: 'The dark mode support and customization options are exactly what we needed for our brand.',
    rating: 5,
  },
];

// ── Main component ────────────────────────────────────────────────────────
export const TronTestimonials = React.memo(function TronTestimonials() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  useTestimonialsAnimation();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  const props = useNode((node) => node.data.props as Partial<TronTestimonialsProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 70,
    showGrid = false,
    showSecondRowMobile = false,
    title = 'Loved by teams worldwide',
    subtitle = 'Join thousands of companies building with our platform.',
    speed = 40,
    items = DEFAULT_ITEMS,
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

  const rawList = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const list = rawList.map(normalizeTestimonialItem);

  const scrollDuration = `${speed ?? 40}s`;
  const scrollDurationRow2 = `${(speed ?? 40) * 1.2}s`;

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      key={`${scheme}-${showGrid}`}
      data-block-type="testimonials"
      className={`w-full max-w-full py-20 px-4 sm:px-8 lg:px-16 flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: showGrid ? '50px 50px' : 'auto',
        minHeight: `${sectionHeight}vh`,
        overflow: 'hidden',
      }}
    >
      <div className="max-w-6xl mx-auto w-full">
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

        <div
          style={{
            overflow: 'hidden',
            position: 'relative',
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
          {...animAttrs}
        >
          {/* Row 1 — left */}
          <div style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}>
            <div
              className="testimonials-track-left"
              style={{ display: 'flex', gap: 20, width: 'max-content' }}
            >
              {[...list, ...list].map((item, i) => {
                const idx = i % list.length;
                return (
                  <TestimonialCardDisplay
                    key={i}
                    item={item}
                    index={idx}
                    t={t}
                    accentColor={accentColor}
                    enabled={enabled}
                    onSaveText={(val) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as TestimonialItem[]) ?? [])];
                      items[idx] = { ...items[idx], text: val };
                      p.items = items;
                    }, 0)}
                    onSaveName={(val) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as TestimonialItem[]) ?? [])];
                      items[idx] = { ...items[idx], name: val };
                      p.items = items;
                    }, 0)}
                    onSaveRole={(val) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as TestimonialItem[]) ?? [])];
                      items[idx] = { ...items[idx], role: val };
                      p.items = items;
                    }, 0)}
                    onSaveCompany={(val) => setProp((p: Record<string, unknown>) => {
                      const items = [...((p.items as TestimonialItem[]) ?? [])];
                      items[idx] = { ...items[idx], company: val };
                      p.items = items;
                    }, 0)}
                  />
                );
              })}
            </div>
          </div>

          {/* Row 2 — right (desktop or mobile if enabled) */}
          {(!isMobile || showSecondRowMobile) && (
            <div
              style={
                {
                  '--scroll-duration': scrollDurationRow2,
                  marginTop: 20,
                } as React.CSSProperties
              }
            >
              <div
                className="testimonials-track-right"
                style={{ display: 'flex', gap: 20, width: 'max-content' }}
              >
                {[...list, ...list].map((item, i) => {
                  const idx = i % list.length;
                  return (
                    <TestimonialCardDisplay
                      key={i}
                      item={item}
                      index={idx}
                      t={t}
                      accentColor={accentColor}
                      enabled={enabled}
                      onSaveText={(val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as TestimonialItem[]) ?? [])];
                        items[idx] = { ...items[idx], text: val };
                        p.items = items;
                      }, 0)}
                      onSaveName={(val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as TestimonialItem[]) ?? [])];
                        items[idx] = { ...items[idx], name: val };
                        p.items = items;
                      }, 0)}
                      onSaveRole={(val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as TestimonialItem[]) ?? [])];
                        items[idx] = { ...items[idx], role: val };
                        p.items = items;
                      }, 0)}
                      onSaveCompany={(val) => setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as TestimonialItem[]) ?? [])];
                        items[idx] = { ...items[idx], company: val };
                        p.items = items;
                      }, 0)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

// ── TestimonialCard (backward compatibility) ───────────────────────────────
export interface TestimonialCardProps {
  quote?: string;
  author?: string;
  role?: string;
  company?: string;
  avatarUrl?: string;
  accentColor?: string;
  colorScheme?: 'dark' | 'light';
}

export const TestimonialCard = React.memo(function TestimonialCard({
  quote = '',
  author = '',
  role = '',
  company = '',
  accentColor = '#FF6B35',
  colorScheme = 'dark',
}: TestimonialCardProps) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const scheme = (colorScheme ?? 'dark') as 'dark' | 'light';
  const tokensBuilt = buildTokens('#0a0a0a', '#ffffff');
  const t = tokensBuilt[scheme];
  const item: TestimonialItem = {
    name: author,
    role,
    company,
    text: quote,
    rating: 5,
  };

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={isSelected ? 'craft-node-selected' : ''}
      style={{ width: 300, flexShrink: 0 }}
    >
      <TestimonialCardDisplay
        item={item}
        index={0}
        t={t}
        accentColor={accentColor ?? '#FF6B35'}
        enabled={false}
        onSaveText={() => {}}
        onSaveName={() => {}}
        onSaveRole={() => {}}
        onSaveCompany={() => {}}
      />
    </div>
  );
});

function TestimonialCardSettings() {
  const { actions: { setProp } } = useNode();
  const { quote = '', author = '', role = '', company = '', accentColor = '#FF6B35', colorScheme = 'dark' } =
    useNode((n) => n.data.props as TestimonialCardProps) ?? {};
  const setT = (key: keyof TestimonialCardProps, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  return (
    <div className="p-3 space-y-3">
      <div><label className={labelCls}>Quote</label><textarea value={quote} onChange={(e) => setT('quote', 500)(e.target.value)} className={inputCls} rows={2} /></div>
      <div><label className={labelCls}>Author</label><input type="text" value={author} onChange={(e) => setT('author', 500)(e.target.value)} className={inputCls} /></div>
      <div><label className={labelCls}>Role</label><input type="text" value={role} onChange={(e) => setT('role', 500)(e.target.value)} className={inputCls} /></div>
      <div><label className={labelCls}>Company</label><input type="text" value={company} onChange={(e) => setT('company', 500)(e.target.value)} className={inputCls} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <label className={labelCls}>Accent</label>
        <input type="color" value={accentColor} onChange={(e) => setT('accentColor', 300)(e.target.value)} />
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{accentColor}</span>
      </div>
    </div>
  );
}

(TestimonialCard as unknown as { craft: Record<string, unknown> }).craft = {
  displayName: 'Testimonial Card',
  props: {
    quote: 'This product changed how we work.',
    author: 'Jane Doe',
    role: 'CEO',
    company: 'Acme Inc',
    accentColor: '#FF6B35',
    colorScheme: 'dark',
  },
  related: { settings: TestimonialCardSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// ── Settings ──────────────────────────────────────────────────────────────
function TronTestimonialsSettings() {
  const { actions: { setProp } } = useNode();
  const { user } = useAuth();
  const [showMedia, setShowMedia] = React.useState<number | null>(null);
  const props = useNode((node) => node.data.props as Partial<TronTestimonialsProps>) ?? {};
  const {
    title = 'Loved by teams worldwide',
    subtitle = 'Join thousands of companies building with our platform.',
    items = DEFAULT_ITEMS,
    speed = 40,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 70,
    showGrid = false,
    showSecondRowMobile = false,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const rawList = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const list = rawList.map(normalizeTestimonialItem);

  const updateItem = (i: number, field: keyof TestimonialItem, value: string | number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as TestimonialItem[]) ?? [])];
      if (arr[i]) arr[i] = { ...arr[i], [field]: value };
      p.items = arr;
    }, 500);
  };

  const removeItem = (i: number) => {
    setProp((p: Record<string, unknown>) => {
      p.items = ((p.items as TestimonialItem[]) ?? []).filter((_, idx) => idx !== i);
    }, 0);
  };

  const addItem = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [
        ...((p.items as TestimonialItem[]) ?? []),
        {
          name: 'New Author',
          role: 'Role',
          company: 'Company',
          text: 'Testimonial text.',
          rating: 5,
        },
      ];
      p.items = arr;
    }, 0);
  };

  return (
    <div className="p-3 space-y-0">
      {/* CONTENT */}
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Content</h3>
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
        <div className="space-y-2">
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
              className="space-y-2"
            >
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                  className={inputCls}
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={item.role}
                  onChange={(e) => updateItem(i, 'role', e.target.value)}
                  className={inputCls}
                  placeholder="Role"
                  style={{ width: 80 }}
                />
                <input
                  type="text"
                  value={item.company}
                  onChange={(e) => updateItem(i, 'company', e.target.value)}
                  className={inputCls}
                  placeholder="Company"
                  style={{ width: 80 }}
                />
                <select
                  value={item.rating}
                  onChange={(e) => updateItem(i, 'rating', Number(e.target.value))}
                  className={inputCls}
                  style={{ width: 50 }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}★
                    </option>
                  ))}
                </select>
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
                value={item.text}
                onChange={(e) => updateItem(i, 'text', e.target.value)}
                className={inputCls}
                placeholder="Testimonial text"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                {(item.avatarUrl ?? item.avatarBase64) && (
                  <img
                    src={item.avatarUrl ?? item.avatarBase64}
                    alt=""
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
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
                  {(item.avatarUrl ?? item.avatarBase64) ? '↺ Change' : '+ Add photo'}
                </button>
                {(item.avatarUrl ?? item.avatarBase64) && (
                  <button
                    type="button"
                    onClick={() =>
                      setProp((p: Record<string, unknown>) => {
                        const items = [...((p.items as TestimonialItem[]) ?? [])];
                        if (items[i]) items[i] = { ...items[i], avatarUrl: undefined, avatarBase64: undefined };
                        p.items = items;
                      }, 0)
                    }
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
            + Add testimonial
          </button>
        </div>
      </div>

      {/* SPEED */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Speed</h3>
        <div>
          <label className={labelCls}>Speed: {speed}s</label>
          <input
            type="range"
            min={20}
            max={80}
            step={5}
            value={speed}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.speed = Number(e.target.value); }, 300)}
            className="settings-slider"
          />
        </div>
      </div>

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Colors</h3>
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
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })}
              className="rounded border-gray-600 bg-gray-700"
            />
            Show grid
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#d4d4d8' }}>Show 2nd row on mobile</span>
            <input
              type="checkbox"
              checked={showSecondRowMobile ?? false}
              onChange={(e) =>
                setProp((p: Record<string, unknown>) => {
                  p.showSecondRowMobile = e.target.checked;
                })
              }
              className="rounded border-gray-600 bg-gray-700"
            />
          </div>
        </div>
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
              const items = [...((p.items as TestimonialItem[]) ?? [])];
              if (items[showMedia] !== undefined) {
                items[showMedia] = { ...items[showMedia], avatarUrl: url, avatarBase64: undefined };
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
const tronTestimonialsCraft = {
  displayName: 'Tron Testimonials',
  props: {
    colorScheme: 'dark',
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 70,
    showGrid: false,
    showSecondRowMobile: false,
    title: 'Loved by teams worldwide',
    subtitle: 'Join thousands of companies building with our platform.',
    speed: 40,
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronTestimonialsSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['saas', 'startup', 'agency'],
    featureTags: ['testimonials', 'social-proof'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronTestimonials as unknown as { craft: typeof tronTestimonialsCraft }).craft = tronTestimonialsCraft;
