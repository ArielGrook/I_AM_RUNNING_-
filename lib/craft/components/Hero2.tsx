'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useCallback } from 'react';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

export const Hero2 = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  badgeText = '✦ New',
  title = 'Build faster.',
  subtitle = 'Create modern websites in minutes.',
  ctaText = 'Get Started',
  ctaHref = '#',
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) {
        const rect = e.currentTarget.getBoundingClientRect();
        setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    },
    [enabled]
  );

  const tokens = colorScheme === 'dark'
    ? { bg: '#0a0a0a', text: '#ffffff', accent: accentColor }
    : { bg: '#ffffff', text: '#0a0a0a', accent: accentColor };

  const spotlightOpacity = colorScheme === 'dark' ? 0.12 : 0.08;
  const rgb = hexToRgb(accentColor);

  const gridColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const gridOnly =
    `linear-gradient(${gridColor} 1px, transparent 1px),
     linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`;
  const withSpotlight =
    `radial-gradient(
       600px circle at ${cursor.x}px ${cursor.y}px,
       rgba(${rgb},${spotlightOpacity}) 0%,
       transparent 60%
     ),
     linear-gradient(${gridColor} 1px, transparent 1px),
     linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`;

  const showSpotlight = isHovered && !enabled;
  const backgroundStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    background: tokens.bg,
    backgroundImage: showSpotlight ? withSpotlight : gridOnly,
    backgroundSize: showSpotlight ? 'auto, 50px 50px, 50px 50px' : '50px 50px, 50px 50px',
  };

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    dataAttrs['data-animate-delay'] = animateDelay ?? '0';
  }

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="hero"
      data-block-category="header"
      {...dataAttrs}
      className={`w-full relative overflow-hidden ${isSelected ? 'outline outline-2 outline-red-500' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={backgroundStyle}
    >
      <div
        style={{
          maxWidth: 800,
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        {badgeText && (
          <span
            style={{
              display: 'inline-block',
              border: `1px solid ${colorScheme === 'dark' ? 'rgba(225,29,72,0.3)' : `rgba(${hexToRgb(accentColor)},0.4)`}`,
              background: colorScheme === 'dark' ? 'rgba(225,29,72,0.08)' : `rgba(${hexToRgb(accentColor)},0.08)`,
              color: accentColor,
              padding: '6px 16px',
              borderRadius: 100,
              fontSize: 13,
              marginBottom: 32,
            }}
          >
            {badgeText}
          </span>
        )}

        <h1
          style={{
            fontSize: 'clamp(40px, 6vw, 80px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: tokens.text,
            marginBottom: 24,
            margin: '0 0 24px 0',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#71717a',
            lineHeight: 1.7,
            maxWidth: 520,
            margin: '0 auto 40px',
          }}
        >
          {subtitle}
        </p>

        <a
          href={ctaHref}
          style={{
            display: 'inline-block',
            background: accentColor,
            color: '#fff',
            padding: '16px 40px',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            boxShadow: `0 0 30px rgba(${hexToRgb(accentColor)},0.35)`,
            transition: 'box-shadow 200ms ease, transform 200ms ease',
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 0 50px rgba(${hexToRgb(accentColor)},0.5)`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `0 0 30px rgba(${hexToRgb(accentColor)},0.35)`;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
};

const Hero2Settings = () => {
  const {
    actions: { setProp },
    colorScheme,
    accentColor,
    badgeText,
    title,
    subtitle,
    ctaText,
    ctaHref,
    animationType,
    animateDelay,
  } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    badgeText: node.data.props.badgeText as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    ctaText: node.data.props.ctaText as string,
    ctaHref: node.data.props.ctaHref as string,
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));

  const setT = (key: string, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Color scheme</label>
            <select
              value={colorScheme ?? 'dark'}
              onChange={(e) => setT('colorScheme', 300)(e.target.value)}
              className={inputCls}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={`${labelCls} shrink-0 w-20`}>Accent</label>
            <input
              type="color"
              value={accentColor ?? '#e11d48'}
              onChange={(e) => setT('accentColor', 300)(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Badge text</label>
            <input type="text" value={badgeText ?? ''} onChange={(e) => setT('badgeText', 500)(e.target.value)} className={inputCls} placeholder="✦ New" />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title ?? ''} onChange={(e) => setT('title', 500)(e.target.value)} className={inputCls} placeholder="Build faster." />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <textarea value={subtitle ?? ''} onChange={(e) => setT('subtitle', 500)(e.target.value)} className={inputCls} rows={2} placeholder="Create modern websites in minutes." />
          </div>
          <div>
            <label className={labelCls}>CTA text</label>
            <input type="text" value={ctaText ?? ''} onChange={(e) => setT('ctaText', 500)(e.target.value)} className={inputCls} placeholder="Get Started" />
          </div>
          <div>
            <label className={labelCls}>CTA link</label>
            <input type="text" value={ctaHref ?? ''} onChange={(e) => setT('ctaHref', 500)(e.target.value)} className={inputCls} placeholder="#" />
          </div>
        </div>
      </section>

      <hr className="border-gray-600 my-4" />

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Type</label>
            <select
              value={animationType ?? 'none'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })}
              className={inputCls}
            >
              <option value="none">None</option>
              <option value="fade-in">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="scale-in">Scale In</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay (s)</label>
            <select
              value={animateDelay ?? '0'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })}
              className={inputCls}
            >
              <option value="0">0s</option>
              <option value="0.1">0.1s</option>
              <option value="0.2">0.2s</option>
              <option value="0.3">0.3s</option>
              <option value="0.5">0.5s</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
};

Hero2.craft = {
  displayName: 'Hero 2',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    badgeText: '✦ New',
    title: 'Build faster.',
    subtitle: 'Create modern websites in minutes.',
    ctaText: 'Get Started',
    ctaHref: '#',
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: Hero2Settings },
  custom: {
    styleTags: ['dark', 'minimal', 'bold'],
    businessTags: ['startup', 'saas', 'tech', 'agency'],
    featureTags: ['hero', 'above-fold', 'fullscreen', 'interactive'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
