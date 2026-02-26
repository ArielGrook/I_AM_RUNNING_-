'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';

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
  items?: FAQItem[];
  animationType?: string;
  animateDelay?: string;
}

const DEFAULT_ITEMS: FAQItem[] = [
  { question: 'How does it work?', answer: 'Our platform allows you to build professional websites in minutes using pre-built components.' },
  { question: 'Can I customize the design?', answer: 'Yes, every component is fully customizable — colors, fonts, layouts and more.' },
  { question: 'What is included in the price?', answer: 'All plans include hosting, SSL certificate, and 24/7 support.' },
  { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time with no hidden fees.' },
];

// ── Main component ────────────────────────────────────────────────────────
export const TronFAQ = React.memo(function TronFAQ() {
  const { connectors: { connect, drag } } = useNode();
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
    sectionHeight = 70,
    showGrid = true,
    title = 'Frequently asked questions',
    subtitle = 'Everything you need to know about our product.',
    items = DEFAULT_ITEMS,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'dark';

  const tokens = {
    dark: {
      bg: darkBg ?? '#0a0a0a',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      accent: accentColor,
      border: 'rgba(255,255,255,0.08)',
      cardBg: 'rgba(255,255,255,0.03)',
      gridColor: 'rgba(255,255,255,0.03)',
    },
    light: {
      bg: lightBg ?? '#ffffff',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      accent: accentColor,
      border: 'rgba(0,0,0,0.08)',
      cardBg: 'rgba(0,0,0,0.02)',
      gridColor: 'rgba(0,0,0,0.06)',
    },
  };
  const t = tokens[scheme];

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

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
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      key={`${scheme}-${showGrid}`}
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
          maxWidth: isMobile ? '100%' : 800,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: `${sectionHeight}vh`,
        }}
        {...animAttrs}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 800,
              color: t.text,
              margin: 0,
            }}
          >
            <span style={{ color: t.accent }}>{firstWord}</span>
            {restWords ? ` ${restWords}` : ''}
          </h2>
          <p style={{ fontSize: 16, color: t.textSecondary, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {list.map((item, i) => (
            <div
              key={i}
              style={{
                borderBottom: `1px solid ${t.border}`,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => !enabled && setOpenIndex(openIndex === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 0',
                  background: 'none',
                  border: 'none',
                  cursor: enabled ? 'default' : 'pointer',
                  textAlign: 'left',
                  color: t.text,
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                <span>{item.question || 'Question'}</span>
                <span
                  style={{
                    color: accentColor,
                    fontSize: 22,
                    fontWeight: 300,
                    flexShrink: 0,
                    marginLeft: 16,
                    transition: 'transform 0.3s ease',
                    transform: (enabled ? 0 === i : openIndex === i) ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  +
                </span>
              </button>

              <div
                style={{
                  maxHeight: (enabled ? 0 === i : openIndex === i) ? 500 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.35s ease',
                }}
              >
                <p
                  style={{
                    paddingBottom: 20,
                    color: t.textSecondary,
                    fontSize: 15,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {item.answer || 'Answer'}
                </p>
              </div>
            </div>
          ))}
        </div>
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
    subtitle = 'Everything you need to know about our product.',
    items = DEFAULT_ITEMS,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 70,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const setT = (key: keyof TronFAQProps, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
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
        </div>
      </div>

      {/* FAQ ITEMS */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">FAQ items</h3>
        <div className="space-y-3">
          {list.map((item, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/50 space-y-2">
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
                className="text-xs text-red-400 hover:text-red-300"
              >
                × Remove
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
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)}
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
TronFAQ.craft = {
  displayName: 'Tron FAQ',
  props: {
    colorScheme: 'dark',
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 70,
    showGrid: true,
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know about our product.',
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
