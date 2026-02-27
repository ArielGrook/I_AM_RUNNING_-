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
interface FAQItem {
  question: string;
  answer: string;
}

interface TronFAQProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  title?: string;
  subtitle?: string;
  layoutStyle?: 'centered' | 'split';
  showCta?: boolean;
  ctaText?: string;
  items?: FAQItem[];
  animationType?: string;
  animateDelay?: string;
}

const DEFAULT_ITEMS: FAQItem[] = [
  { question: 'How does it work?', answer: 'Our platform allows you to build professional websites in minutes using pre-built components. Simply drag, drop, and customize.' },
  { question: 'Can I customize the design?', answer: 'Yes, every component is fully customizable — colors, fonts, layouts and more. Changes are reflected instantly.' },
  { question: 'What is included in the price?', answer: 'All plans include hosting, SSL certificate, and 24/7 support. No hidden fees.' },
  { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time with no hidden fees or penalties.' },
  { question: 'Do you offer refunds?', answer: 'We offer a 14-day money-back guarantee on all plans, no questions asked.' },
];

// ── Main component ────────────────────────────────────────────────────────
export const TronFAQ = React.memo(function TronFAQ() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsMobile((entry?.contentRect?.width ?? 0) < 520);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const props = useNode((node) => node.data.props as Partial<TronFAQProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    title = 'Frequently asked questions',
    subtitle = "Everything you need to know. Can't find the answer? Contact us.",
    layoutStyle = 'centered',
    showCta = true,
    ctaText = 'Contact support',
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

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const displayOpenIndex = enabled ? 0 : openIndex;

  const accordionItems = list.map((item, i) => {
    const updateItem = (field: 'question' | 'answer', val: string) => {
      setProp((p: Record<string, unknown>) => {
        const arr = [...((p.items as FAQItem[]) ?? [])];
        arr[i] = { ...arr[i], [field]: val };
        p.items = arr;
      }, 0);
    };
    return (
    <div
      key={i}
      style={{
        borderRadius: 12,
        border: `1px solid ${displayOpenIndex === i
          ? `rgba(${hexToRgb(accentColor)}, 0.3)`
          : t.border}`,
        background: displayOpenIndex === i
          ? `rgba(${hexToRgb(accentColor)}, 0.03)`
          : t.cardBg,
        marginBottom: 10,
        overflow: 'hidden',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <button
        type="button"
        onClick={() => !enabled && setOpenIndex(displayOpenIndex === i ? null : i)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          background: 'none',
          border: 'none',
          cursor: enabled ? 'default' : 'pointer',
          textAlign: 'left',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              flexShrink: 0,
              background: displayOpenIndex === i
                ? accentColor
                : `rgba(${hexToRgb(accentColor)}, 0.1)`,
              color: displayOpenIndex === i ? '#fff' : accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span
            style={{
              color: t.text,
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {enabled ? (
              <EditableText value={item.question ?? ''} fieldKey={`faq-${i}-q`} tag="span" style={{ color: t.text, fontWeight: 500 }} enabled={enabled} onSave={(val) => updateItem('question', val)} />
            ) : (
              item.question || 'Question'
            )}
          </span>
        </div>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            flexShrink: 0,
            border: `1px solid ${t.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            transform: displayOpenIndex === i ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          +
        </div>
      </button>
      <div
        style={{
          maxHeight: displayOpenIndex === i ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease',
        }}
      >
        <p
          style={{
            margin: 0,
            padding: '0 24px 24px 68px',
            color: t.textSecondary,
            fontSize: 15,
            lineHeight: 1.75,
          }}
        >
          {enabled ? (
            <EditableText value={item.answer ?? ''} fieldKey={`faq-${i}-a`} tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={(val) => updateItem('answer', val)} />
          ) : (
            item.answer || 'Answer'
          )}
        </p>
      </div>
    </div>
  );
  });

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      key={`${scheme}-${layoutStyle}`}
      data-block-type="faq"
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
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
        {...animAttrs}
      >
        {layoutStyle === 'split' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr',
              gap: isMobile ? 40 : 80,
              alignItems: 'start',
            }}
          >
            <div style={{ position: isMobile ? 'relative' : 'sticky', top: 40 }}>
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
              {showCta && layoutStyle === 'split' && (
                <button
                  type="button"
                  style={{
                    marginTop: 32,
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
                    <EditableText value={ctaText ?? ''} fieldKey="ctaText" tag="span" style={{ color: '#fff', fontWeight: 600 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.ctaText = val; }, 0)} />
                  ) : (
                    ctaText
                  )}
                </button>
              )}
            </div>
            <div>{accordionItems}</div>
          </div>
        ) : (
          <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
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
            <div>{accordionItems}</div>
          </div>
        )}
      </div>
    </section>
  );
});

// ── Settings ─────────────────────────────────────────────────────────────
function TronFAQSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronFAQProps>) ?? {};
  const {
    title = 'Frequently asked questions',
    subtitle = "Everything you need to know. Can't find the answer? Contact us.",
    layoutStyle = 'centered',
    showCta = true,
    ctaText = 'Contact support',
    items = DEFAULT_ITEMS,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const setT = (key: keyof TronFAQProps, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;

  const updateItem = (index: number, field: keyof FAQItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as FAQItem[]) ?? [])];
      arr[index] = { ...arr[index], [field]: value };
      p.items = arr;
    }, 500);
  };

  const removeItem = (index: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = ((p.items as FAQItem[]) ?? []).filter((_, i) => i !== index);
      p.items = arr;
    }, 0);
  };

  const addItem = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as FAQItem[]) ?? []), { question: 'New question?', answer: 'Answer here.' }];
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
          {(['centered', 'split'] as const).map((v) => (
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
              {v === 'centered' ? 'Centered' : 'Split'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CTA (only if layoutStyle=split) */}
      {layoutStyle === 'split' && (
        <div className={sectionCls}>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">CTA</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={showCta}
                onChange={(e) => setProp((p: Record<string, unknown>) => { p.showCta = e.target.checked; })}
                className="rounded border-gray-600 bg-gray-700"
              />
              Show CTA button
            </label>
            {showCta && (
              <div>
                <label className={labelCls}>Button text</label>
                <input type="text" value={ctaText} onChange={(e) => setT('ctaText', 500)(e.target.value)} className={inputCls} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ITEMS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">FAQ items</h3>
        <div className="space-y-3">
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
              <div>
                <label className={labelCls}>Question</label>
                <input
                  type="text"
                  value={item.question}
                  onChange={(e) => updateItem(i, 'question', e.target.value)}
                  className={inputCls}
                  placeholder="Question"
                />
              </div>
              <div>
                <label className={labelCls}>Answer</label>
                <textarea
                  value={item.answer}
                  onChange={(e) => updateItem(i, 'answer', e.target.value)}
                  className={inputCls}
                  rows={3}
                  placeholder="Answer"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded hover:border-gray-500"
          >
            + Add question
          </button>
        </div>
      </div>

      {/* 5. COLORS */}
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

      {/* 6. SIZE */}
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

      {/* 7. DISPLAY */}
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

      {/* 8. ANIMATION */}
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
const tronFAQCraft = {
  displayName: 'Tron FAQ',
  props: {
    colorScheme: 'dark' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 80,
    showGrid: true,
    title: 'Frequently asked questions',
    subtitle: "Everything you need to know. Can't find the answer? Contact us.",
    layoutStyle: 'centered' as const,
    showCta: true,
    ctaText: 'Contact support',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronFAQSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['saas', 'startup', 'agency'],
    featureTags: ['faq'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronFAQ as unknown as { craft: typeof tronFAQCraft }).craft = tronFAQCraft;

/** Minimal FAQItem for backward compatibility with resolver (legacy Element-based FAQ). */
export const FAQItem = React.memo(function FAQItem(props: { question?: string; answer?: string }) {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} style={{ padding: 16, border: '1px dashed rgba(255,255,255,0.2)' }}>
      <strong>{props.question || 'Question'}</strong>
      <p style={{ margin: '8px 0 0', fontSize: 14, color: '#a1a1aa' }}>{props.answer || 'Answer'}</p>
    </div>
  );
});
(FAQItem as unknown as { craft: { displayName: string; props: Record<string, unknown>; rules: Record<string, () => boolean> } }).craft = {
  displayName: 'FAQ Item',
  props: { question: 'Question?', answer: 'Answer.' },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
