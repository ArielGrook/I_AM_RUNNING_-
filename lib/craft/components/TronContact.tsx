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

// ── SVG Icons (no emojis) ─────────────────────────────────────────────────
const CONTACT_ICONS: Record<string, React.ReactNode> = {
  email: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  phone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.1 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
    </svg>
  ),
  location: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
};

// ── Tokens base (bg comes from props darkBg/lightBg) ─────────────────────
function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark: {
      bg: darkBg ?? '#0a0a0a',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      border: 'rgba(255,255,255,0.08)',
      cardBg: 'rgba(255,255,255,0.03)',
      gridColor: 'rgba(255,255,255,0.03)',
    },
    light: {
      bg: lightBg ?? '#ffffff',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      border: 'rgba(0,0,0,0.08)',
      cardBg: 'rgba(0,0,0,0.02)',
      gridColor: 'rgba(0,0,0,0.06)',
    },
  };
}

// ── Interfaces ───────────────────────────────────────────────────────────
interface ContactInfo {
  iconKey: 'email' | 'phone' | 'location';
  label: string;
  value: string;
}

interface TronContactProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  title?: string;
  subtitle?: string;
  contactInfo?: ContactInfo[];
  namePlaceholder?: string;
  emailPlaceholder?: string;
  messagePlaceholder?: string;
  submitText?: string;
  animationType?: string;
  animateDelay?: string;
}

const DEFAULT_CONTACT_INFO: ContactInfo[] = [
  { iconKey: 'email', label: 'Email', value: 'hello@company.com' },
  { iconKey: 'phone', label: 'Phone', value: '+1 (555) 000-0000' },
  { iconKey: 'location', label: 'Address', value: 'San Francisco, CA' },
];

function normalizeContactItem(item: unknown): ContactInfo {
  if (item && typeof item === 'object' && 'iconKey' in item) return item as ContactInfo;
  const legacy = item as { icon?: string; label?: string; value?: string };
  const iconMap: Record<string, ContactInfo['iconKey']> = { '📧': 'email', '✉': 'email', '📞': 'phone', '📍': 'location' };
  return {
    iconKey: iconMap[legacy?.icon ?? ''] ?? 'email',
    label: legacy?.label ?? 'Label',
    value: legacy?.value ?? 'Value',
  };
}

// ── Main component ────────────────────────────────────────────────────────
export const TronContact = React.memo(function TronContact() {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsMobile((entry?.contentRect?.width ?? 0) < 768);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const props = useNode((node) => node.data.props as Partial<TronContactProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    title = 'Get in touch',
    subtitle = "Have a question? We'd love to hear from you.",
    contactInfo = DEFAULT_CONTACT_INFO,
    namePlaceholder = 'Your name',
    emailPlaceholder = 'your@email.com',
    messagePlaceholder = 'Tell us about your project...',
    submitText = 'Send message',
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'dark';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme], accent: accentColor };

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const list = (Array.isArray(contactInfo) ? contactInfo : DEFAULT_CONTACT_INFO).map(normalizeContactItem);
  const titleWords = (title ?? '').split(' ');
  const firstWord = titleWords[0] ?? '';
  const restWords = titleWords.slice(1).join(' ');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 16px',
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    color: t.text,
    fontSize: 14,
    outline: 'none',
    marginBottom: 16,
  };

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      key={`${scheme}-${showGrid}`}
      data-block-type="contact"
      className={`w-full max-w-full py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: showGrid ? '50px 50px' : 'auto',
        minHeight: `${sectionHeight}vh`,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 32 : 64,
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
        {...animAttrs}
      >
        {/* Left column — info */}
        <div style={{ width: '100%' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 700,
              color: t.text,
              marginBottom: 16,
              marginTop: 0,
            }}
          >
            <span style={{ color: t.accent }}>{firstWord}</span>
            {restWords ? ` ${restWords}` : ''}
          </h2>
          <p
            style={{
              fontSize: 16,
              color: t.textSecondary,
              lineHeight: 1.6,
              marginBottom: 0,
            }}
          >
            {subtitle}
          </p>
          {list.map((item, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: i === 0 ? 32 : 20, width: '100%' }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `rgba(${hexToRgb(t.accent)}, 0.12)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: t.accent,
                  flexShrink: 0,
                }}
              >
                {CONTACT_ICONS[item.iconKey] ?? CONTACT_ICONS.email}
              </div>
              <div>
                <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 15, color: t.text, fontWeight: 500 }}>
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right column — form card */}
        <div
          style={{
            width: '100%',
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            padding: '32px 24px',
          }}
        >
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <input
              type="text"
              placeholder={namePlaceholder}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
              readOnly={enabled}
            />
            <input
              type="email"
              placeholder={emailPlaceholder}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
              readOnly={enabled}
            />
            <textarea
              placeholder={messagePlaceholder}
              rows={5}
              style={{
                ...inputStyle,
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: 120,
              }}
              readOnly={enabled}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px 24px',
                background: t.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: enabled ? 'default' : 'pointer',
              }}
            >
              {submitText}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
});

// ── Settings ─────────────────────────────────────────────────────────────
function TronContactSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronContactProps>) ?? {};
  const {
    title = 'Get in touch',
    subtitle = "Have a question? We'd love to hear from you.",
    submitText = 'Send message',
    contactInfo = DEFAULT_CONTACT_INFO,
    namePlaceholder = 'Your name',
    emailPlaceholder = 'your@email.com',
    messagePlaceholder = 'Tell us about your project...',
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const setT = (key: keyof TronContactProps, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const rawList = Array.isArray(contactInfo) ? contactInfo : DEFAULT_CONTACT_INFO;

  const updateContactItem = (index: number, field: keyof ContactInfo, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.contactInfo as ContactInfo[]) ?? [])];
      arr[index] = { ...arr[index], [field]: value };
      p.contactInfo = arr;
    }, 500);
  };

  const removeContactItem = (index: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = ((p.contactInfo as ContactInfo[]) ?? []).filter((_, i) => i !== index);
      p.contactInfo = arr;
    }, 0);
  };

  const addContactItem = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.contactInfo as ContactInfo[]) ?? []), { iconKey: 'email', label: 'Label', value: 'Value' }];
      p.contactInfo = arr;
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
            <input type="text" value={title} onChange={(e) => setT('title', 500)(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <input type="text" value={subtitle} onChange={(e) => setT('subtitle', 500)(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Submit button text</label>
            <input type="text" value={submitText} onChange={(e) => setT('submitText', 500)(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* CONTACT INFO */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Contact info</h3>
        <div className="space-y-2">
          {rawList.map((item, i) => {
            const normalized = normalizeContactItem(item);
            return (
            <div key={i} className="flex gap-2 items-start p-2 rounded bg-gray-800/50">
              <select
                value={normalized.iconKey}
                onChange={(e) => updateContactItem(i, 'iconKey', e.target.value as ContactInfo['iconKey'])}
                className={inputCls}
                style={{ width: 90, minWidth: 90 }}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="location">Address</option>
              </select>
              <input
                type="text"
                value={normalized.label}
                onChange={(e) => updateContactItem(i, 'label', e.target.value)}
                className={inputCls}
                placeholder="Label"
              />
              <input
                type="text"
                value={normalized.value}
                onChange={(e) => updateContactItem(i, 'value', e.target.value)}
                className={inputCls}
                placeholder="Value"
              />
              <button
                type="button"
                onClick={() => removeContactItem(i)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
              >
                ×
              </button>
            </div>
          );})}
          <button
            type="button"
            onClick={addContactItem}
            className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555]"
          >
            + Add
          </button>
        </div>
      </div>

      {/* PLACEHOLDERS */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Placeholders</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Name placeholder</label>
            <input type="text" value={namePlaceholder} onChange={(e) => setT('namePlaceholder', 500)(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email placeholder</label>
            <input type="text" value={emailPlaceholder} onChange={(e) => setT('emailPlaceholder', 500)(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Message placeholder</label>
            <input type="text" value={messagePlaceholder} onChange={(e) => setT('messagePlaceholder', 500)(e.target.value)} className={inputCls} />
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })}
          />
          <span className="text-xs text-gray-400">Show grid</span>
        </label>
      </div>

      {/* ANIMATION */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Animation type</label>
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
const tronContactCraft = {
  displayName: 'Tron Contact',
  props: {
    colorScheme: 'dark',
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 80,
    showGrid: true,
    title: 'Get in touch',
    subtitle: "Have a question? We'd love to hear from you.",
    contactInfo: DEFAULT_CONTACT_INFO,
    namePlaceholder: 'Your name',
    emailPlaceholder: 'your@email.com',
    messagePlaceholder: 'Tell us about your project...',
    submitText: 'Send message',
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronContactSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['startup', 'saas', 'agency'],
    featureTags: ['contact'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronContact as unknown as { craft: typeof tronContactCraft }).craft = tronContactCraft;
