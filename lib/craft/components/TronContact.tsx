'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

export const TronContact = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  title = 'Get in touch',
  subtitle = 'We\'d love to hear from you. Send us a message.',
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const tokens = colorScheme === 'dark'
    ? { bg: '#000000', text: '#ffffff', muted: '#52525b', accent: accentColor }
    : { bg: '#ffffff', text: '#0a0a0a', muted: '#52525b', accent: accentColor };
  const rgb = hexToRgb(accentColor ?? '#e11d48');
  const gridColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const gridLines =
    `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`;

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    dataAttrs['data-animate-delay'] = animateDelay ?? '0';
  }

  const fieldStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid rgba(${rgb}, 0.2)`,
    color: tokens.text,
    borderRadius: 4,
    padding: '12px 16px',
    width: '100%',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-20 ${isSelected ? 'outline outline-2 outline-red-500' : ''}`}
      style={{ background: tokens.bg, backgroundImage: gridLines, backgroundSize: '50px 50px' }}
    >
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: tokens.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: tokens.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="placeholder:text-[#52525b]"
            style={fieldStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = tokens.accent;
              e.currentTarget.style.boxShadow = `0 0 10px rgba(${rgb}, 0.2)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `rgba(${rgb}, 0.2)`;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="placeholder:text-[#52525b]"
            style={fieldStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = tokens.accent;
              e.currentTarget.style.boxShadow = `0 0 10px rgba(${rgb}, 0.2)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `rgba(${rgb}, 0.2)`;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <textarea
            name="message"
            placeholder="Message"
            rows={4}
            className="placeholder:text-[#52525b]"
            style={{ ...fieldStyle, resize: 'vertical', minHeight: 120 }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = tokens.accent;
              e.currentTarget.style.boxShadow = `0 0 10px rgba(${rgb}, 0.2)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `rgba(${rgb}, 0.2)`;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 4,
              border: 'none',
              background: tokens.accent,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  );
};

const TronContactSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, title, subtitle, animationType, animateDelay } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
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
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-2">
          <div><label className={labelCls}>Type</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
          <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
        </div>
      </section>
    </div>
  );
};

TronContact.craft = {
  displayName: 'Tron Contact',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    title: 'Get in touch',
    subtitle: "We'd love to hear from you. Send us a message.",
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronContactSettings },
  custom: {
    styleTags: ['dark', 'neon', 'form'],
    businessTags: ['contact', 'lead', 'tech'],
    featureTags: ['contact', 'form'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
