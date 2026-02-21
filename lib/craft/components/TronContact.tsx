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
  subtitle = "We'd love to hear from you. Send us a message.",
  placeholderName = 'Name',
  placeholderEmail = 'Email',
  placeholderMessage = 'Message',
  submitButtonText = 'Submit',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
  placeholderName?: string;
  placeholderEmail?: string;
  placeholderMessage?: string;
  submitButtonText?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);

  const tokens = {
    dark: {
      bg: '#000000',
      text: '#ffffff',
      muted: '#52525b',
      accent: accentColor,
      gridColor: 'rgba(255,255,255,0.03)',
      border: 'rgba(255,255,255,0.08)',
      cardBg: 'rgba(255,255,255,0.02)',
      cardBorder: 'rgba(255,255,255,0.08)',
    },
    light: {
      bg: '#ffffff',
      bgSecondary: '#f8fafc',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      accent: accentColor,
      border: 'rgba(0,0,0,0.08)',
      cardBg: 'rgba(0,0,0,0.02)',
      cardBorder: 'rgba(0,0,0,0.08)',
      gridColor: 'rgba(0,0,0,0.06)',
      muted: '#52525b',
    },
  };
  const t = tokens[colorScheme];
  const rgb = hexToRgb(accentColor ?? '#e11d48');
  const gridLines =
    `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`;

  const fieldStyle: React.CSSProperties = {
    background: t.cardBg,
    border: `1px solid ${t.cardBorder}`,
    color: t.text,
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
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-20 `}
      style={{ background: t.bg, backgroundImage: gridLines, backgroundSize: '50px 50px' }}
    >
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: t.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: t.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder={placeholderName}
            className="placeholder:text-[#52525b]"
            style={fieldStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = t.accent;
              e.currentTarget.style.boxShadow = `0 0 10px rgba(${rgb}, 0.2)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = t.cardBorder;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <input
            type="email"
            name="email"
            placeholder={placeholderEmail}
            className="placeholder:text-[#52525b]"
            style={fieldStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = t.accent;
              e.currentTarget.style.boxShadow = `0 0 10px rgba(${rgb}, 0.2)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = t.cardBorder;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <textarea
            name="message"
            placeholder={placeholderMessage}
            rows={4}
            className="placeholder:text-[#52525b]"
            style={{ ...fieldStyle, resize: 'vertical', minHeight: 120 }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = t.accent;
              e.currentTarget.style.boxShadow = `0 0 10px rgba(${rgb}, 0.2)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = t.cardBorder;
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
              background: t.accent,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {submitButtonText}
          </button>
        </form>
      </div>
    </section>
  );
};

const TronContactSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, title, subtitle, placeholderName, placeholderEmail, placeholderMessage, submitButtonText } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    placeholderName: node.data.props.placeholderName as string,
    placeholderEmail: node.data.props.placeholderEmail as string,
    placeholderMessage: node.data.props.placeholderMessage as string,
    submitButtonText: node.data.props.submitButtonText as string,
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
          <div><label className={labelCls}>Placeholder Name</label><input type="text" value={placeholderName ?? ''} onChange={(e) => setT('placeholderName', 500)(e.target.value)} className={inputCls} placeholder="Name" /></div>
          <div><label className={labelCls}>Placeholder Email</label><input type="text" value={placeholderEmail ?? ''} onChange={(e) => setT('placeholderEmail', 500)(e.target.value)} className={inputCls} placeholder="Email" /></div>
          <div><label className={labelCls}>Placeholder Message</label><input type="text" value={placeholderMessage ?? ''} onChange={(e) => setT('placeholderMessage', 500)(e.target.value)} className={inputCls} placeholder="Message" /></div>
          <div><label className={labelCls}>Submit button text</label><input type="text" value={submitButtonText ?? ''} onChange={(e) => setT('submitButtonText', 500)(e.target.value)} className={inputCls} placeholder="Submit" /></div>
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
    placeholderName: 'Name',
    placeholderEmail: 'Email',
    placeholderMessage: 'Message',
    submitButtonText: 'Submit',
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
