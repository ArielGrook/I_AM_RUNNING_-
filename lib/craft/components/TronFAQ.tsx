'use client';

import { useNode, useEditor } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React, { useState } from 'react';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

const tokens = {
  dark: { bg: '#000000', text: '#ffffff', muted: '#52525b', accent: '#e11d48', gridColor: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', cardBg: 'rgba(255,255,255,0.02)', cardBorder: 'rgba(255,255,255,0.08)' },
  light: { bg: '#ffffff', text: '#0a0a0a', textSecondary: '#52525b', muted: '#52525b', accent: '#e11d48', border: 'rgba(0,0,0,0.08)', cardBg: 'rgba(0,0,0,0.02)', cardBorder: 'rgba(0,0,0,0.08)', gridColor: 'rgba(0,0,0,0.06)' },
};

// --- FAQItem (editable child node) ---
export interface FAQItemProps {
  question: string;
  answer: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

export const FAQItem = ({ question, answer, accentColor, colorScheme, animationType, animateDelay }: FAQItemProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [isOpen, setIsOpen] = useState(false);
  const t = tokens[colorScheme];
  const accent = accentColor ?? '#e11d48';
  const rgb = hexToRgb(accent);
  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }
  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...(isOpen ? { 'data-mobile-dropdown': '' } : {})}
      {...animAttrs}
      className=""
      style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.15s' }}
      onMouseEnter={(e) => { if (!enabled) e.currentTarget.style.background = t.cardBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
      >
        <span style={{ fontSize: 16, fontWeight: 500, color: t.text }}>{question || 'Question'}</span>
        <span style={{ flexShrink: 0, display: 'inline-block', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: accent }}>▼</span>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: isOpen ? 200 : 0, transition: 'max-height 0.25s ease' }}>
        <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.6, paddingTop: 12, paddingBottom: 16, margin: 0 }}>{answer || 'Answer'}</p>
      </div>
    </div>
  );
};

const FAQItemSettings = () => {
  const { actions: { setProp } } = useNode();
  const { question, answer, animationType, animateDelay } = useNode((n) => n.data.props as FAQItemProps) ?? {};
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Question</label><input type="text" value={question ?? ''} onChange={(e) => setT('question', 500)(e.target.value)} className={inputCls} placeholder="Question" /></div>
      <div><label className={labelCls}>Answer</label><textarea value={answer ?? ''} onChange={(e) => setT('answer', 500)(e.target.value)} className={inputCls} rows={3} placeholder="Answer" /></div>
      <div><label className={labelCls}>Animation</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
};

FAQItem.craft = {
  displayName: 'FAQ Item',
  props: { question: 'How do I get started?', answer: 'Sign up and follow the guide.', accentColor: '#e11d48', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: FAQItemSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

const DEFAULT_FAQ_PROPS: Omit<FAQItemProps, 'accentColor' | 'colorScheme'>[] = [
  { question: 'How do I get started?', answer: 'Sign up for an account and follow the onboarding guide. You can be up and running in minutes.', animationType: 'none', animateDelay: '0' },
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and wire transfer for enterprise plans.', animationType: 'none', animateDelay: '0' },
  { question: 'Can I cancel anytime?', answer: 'Yes. You can cancel your subscription at any time. No long-term commitment required.', animationType: 'none', animateDelay: '0' },
  { question: 'Do you offer technical support?', answer: 'Yes. All plans include email support. Pro and Enterprise include priority and dedicated support.', animationType: 'none', animateDelay: '0' },
];

const NUM_FAQ = 4;

// --- TronFAQ section ---
export const TronFAQ = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  title = 'Frequently asked questions',
  subtitle = 'Everything you need to know',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
}) => {
  const { id: sectionId, connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const editor = useEditor();
  const query = editor?.query;
  const t = tokens[colorScheme];
  const gridLines =
    `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`;
  const getNodeSafe = typeof query?.getNode === 'function' ? query.getNode.bind(query) : () => null;
  const faqIds = Array.from({ length: NUM_FAQ }, (_, i) => `${sectionId}-faq-${i}`);

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-20 `}
      style={{ background: t.bg, backgroundImage: gridLines, backgroundSize: '50px 50px' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: t.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: t.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>
        <div>
          {faqIds.map((faqId, i) => {
            const node = getNodeSafe(faqId);
            const props = node?.data?.props
              ? { ...node.data.props, accentColor, colorScheme }
              : { ...DEFAULT_FAQ_PROPS[i], accentColor, colorScheme };
            return <Element key={faqId} id={faqId} is={FAQItem} canvas {...(props as FAQItemProps)} />;
          })}
        </div>
      </div>
    </section>
  );
};

const TronFAQSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, title, subtitle } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
  }));
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Color scheme</label><select value={colorScheme ?? 'dark'} onChange={(e) => setT('colorScheme', 300)(e.target.value)} className={inputCls}><option value="dark">Dark</option><option value="light">Light</option></select></div>
          <div className="flex items-center gap-2"><label className={`${labelCls} shrink-0 w-20`}>Accent</label><input type="color" value={accentColor ?? '#e11d48'} onChange={(e) => setT('accentColor', 300)(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0" /><span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Title</label><input type="text" value={title ?? ''} onChange={(e) => setT('title', 500)(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Subtitle</label><input type="text" value={subtitle ?? ''} onChange={(e) => setT('subtitle', 500)(e.target.value)} className={inputCls} /></div>
        </div>
      </section>
    </div>
  );
};

TronFAQ.craft = {
  displayName: 'Tron FAQ',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know',
  },
  related: { settings: TronFAQSettings },
  custom: {
    styleTags: ['dark', 'neon', 'accordion'],
    businessTags: ['faq', 'support', 'tech'],
    featureTags: ['faq', 'accordion'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
