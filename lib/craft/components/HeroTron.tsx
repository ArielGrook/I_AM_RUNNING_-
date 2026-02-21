'use client';

import { useNode, useEditor } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React, { useState, useCallback } from 'react';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

const tokens = {
  dark: { bg: '#0a0a0a', text: '#ffffff', accent: '#e11d48', gridColor: 'rgba(255,255,255,0.03)' },
  light: { bg: '#ffffff', text: '#0a0a0a', textSecondary: '#52525b', accent: '#e11d48', border: 'rgba(0,0,0,0.08)', gridColor: 'rgba(0,0,0,0.06)' },
};

/** Avoid "[object Object]" when a prop is accidentally an object. */
function safeStr(val: unknown, fallback: string): string {
  if (typeof val === 'string') return val;
  if (val == null) return fallback;
  if (typeof val === 'object') return fallback;
  return String(val);
}

// --- HeroTronHeading ---
export interface HeroTronHeadingProps {
  text: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

export const HeroTronHeading = ({ text, accentColor, colorScheme, animationType, animateDelay }: HeroTronHeadingProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const t = tokens[colorScheme];
  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }
  return (
    <h1
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...animAttrs}
      className=""
      style={{ fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 800, letterSpacing: '-0.03em', color: t.text, margin: '0 0 24px 0' }}
    >
      {safeStr(text, 'Build faster.')}
    </h1>
  );
};

const HeroTronHeadingSettings = () => {
  const { actions: { setProp } } = useNode();
  const text = useNode((n) => (n.data.props as { text?: string }).text ?? '');
  const { animationType, animateDelay } = useNode((n) => ({ animationType: (n.data.props as { animationType?: string }).animationType ?? 'none', animateDelay: (n.data.props as { animateDelay?: string }).animateDelay ?? '0' }));
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Text</label><input type="text" value={safeStr(text, '')} onChange={(e) => setProp((p: Record<string, unknown>) => { p.text = e.target.value; }, 1000)} className={inputCls} placeholder="Build faster." /></div>
      <div><label className={labelCls}>Animation</label><select value={animationType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay (s)</label><select value={animateDelay} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
};

HeroTronHeading.craft = {
  displayName: 'Hero Tron Heading',
  props: { text: 'Build faster.', accentColor: '#e11d48', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: HeroTronHeadingSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// --- HeroTronSubheading ---
export interface HeroTronSubheadingProps {
  text: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

export const HeroTronSubheading = ({ text, accentColor, colorScheme, animationType, animateDelay }: HeroTronSubheadingProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const t = tokens[colorScheme];
  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }
  return (
    <p
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...animAttrs}
      className=""
      style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#71717a', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 40px' }}
    >
      {safeStr(text, 'Create modern websites in minutes.')}
    </p>
  );
};

const HeroTronSubheadingSettings = () => {
  const { actions: { setProp } } = useNode();
  const text = useNode((n) => (n.data.props as { text?: string }).text ?? '');
  const { animationType, animateDelay } = useNode((n) => ({ animationType: (n.data.props as { animationType?: string }).animationType ?? 'none', animateDelay: (n.data.props as { animateDelay?: string }).animateDelay ?? '0' }));
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Text</label><textarea value={safeStr(text, '')} onChange={(e) => setProp((p: Record<string, unknown>) => { p.text = e.target.value; }, 1000)} className={inputCls} rows={2} placeholder="Create modern websites in minutes." /></div>
      <div><label className={labelCls}>Animation</label><select value={animationType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay (s)</label><select value={animateDelay} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
};

HeroTronSubheading.craft = {
  displayName: 'Hero Tron Subheading',
  props: { text: 'Create modern websites in minutes.', accentColor: '#e11d48', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: HeroTronSubheadingSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// --- HeroTronButton ---
export type HeroTronButtonStyle = 'filled' | 'outline';

export interface HeroTronButtonProps {
  text: string;
  href: string;
  style: HeroTronButtonStyle;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

export const HeroTronButton = ({ text, href, style: btnStyle, accentColor, colorScheme, animationType, animateDelay }: HeroTronButtonProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const rgb = hexToRgb(accentColor);
  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }
  const isFilled = btnStyle === 'filled';
  const wrapperStyle: React.CSSProperties = {
    display: 'inline-block',
    background: isFilled ? accentColor : 'transparent',
    color: isFilled ? '#fff' : accentColor,
    padding: '16px 40px',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    boxShadow: isFilled ? `0 0 30px rgba(${rgb},0.35)` : 'none',
    border: isFilled ? 'none' : `2px solid ${accentColor}`,
    transition: 'box-shadow 200ms ease, transform 200ms ease',
    textDecoration: 'none',
    cursor: 'pointer',
  };
  return (
    <a
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      href={safeStr(href, '#')}
      {...animAttrs}
      className=""
      style={wrapperStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isFilled ? `0 0 50px rgba(${rgb},0.5)` : `0 0 20px rgba(${rgb},0.2)`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isFilled ? `0 0 30px rgba(${rgb},0.35)` : 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {safeStr(text, 'Get Started')}
    </a>
  );
};

const HeroTronButtonSettings = () => {
  const { actions: { setProp } } = useNode();
  const { text, href, style: btnStyle, animationType, animateDelay } = useNode((n) => ({
    text: (n.data.props as { text?: string }).text ?? '',
    href: (n.data.props as { href?: string }).href ?? '#',
    style: (n.data.props as { style?: HeroTronButtonStyle }).style ?? 'filled',
    animationType: (n.data.props as { animationType?: string }).animationType ?? 'none',
    animateDelay: (n.data.props as { animateDelay?: string }).animateDelay ?? '0',
  }));
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Text</label><input type="text" value={safeStr(text, '')} onChange={(e) => setT('text', 500)(e.target.value)} className={inputCls} placeholder="Get Started" /></div>
      <div><label className={labelCls}>Link</label><input type="text" value={safeStr(href, '')} onChange={(e) => setT('href', 500)(e.target.value)} className={inputCls} placeholder="#" /></div>
      <div><label className={labelCls}>Style</label><select value={btnStyle ?? 'filled'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.style = e.target.value; })} className={inputCls}><option value="filled">Filled</option><option value="outline">Outline</option></select></div>
      <div><label className={labelCls}>Animation</label><select value={animationType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay (s)</label><select value={animateDelay} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
};

HeroTronButton.craft = {
  displayName: 'Hero Tron Button',
  props: { text: 'Get Started', href: '#', style: 'filled' as HeroTronButtonStyle, accentColor: '#e11d48', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: HeroTronButtonSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// --- HeroTron section ---

const DEFAULT_HEADING = { text: 'Build faster.', accentColor: '#e11d48', colorScheme: 'dark' as const, animationType: 'none' as const, animateDelay: '0' as const };
const DEFAULT_SUBHEADING = { text: 'Create modern websites in minutes.', accentColor: '#e11d48', colorScheme: 'dark' as const, animationType: 'none' as const, animateDelay: '0' as const };
const DEFAULT_BUTTON = { text: 'Get Started', href: '#', style: 'filled' as HeroTronButtonStyle, accentColor: '#e11d48', colorScheme: 'dark' as const, animationType: 'none' as const, animateDelay: '0' as const };

export const HeroTron = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  spotlightIntensity = 0.12,
  showGrid = true,
  badgeText = '✦ New',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  spotlightIntensity?: number;
  showGrid?: boolean;
  badgeText?: string;
}) => {
  const { id: sectionId, connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const editor = useEditor();
  const query = editor?.query;
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

  const t = tokens[colorScheme];
  const rgb = hexToRgb(accentColor);
  const spotlightOpacity = colorScheme === 'light' ? 0.05 : 0.08;

  const gridOnly =
    `linear-gradient(${t.gridColor} 1px, transparent 1px),
     linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`;
  const spotlightOnly =
    `radial-gradient(600px circle at ${cursor.x}px ${cursor.y}px, rgba(${rgb},${spotlightOpacity}) 0%, transparent 60%)`;
  const withSpotlight =
    `radial-gradient(600px circle at ${cursor.x}px ${cursor.y}px, rgba(${rgb},${spotlightOpacity}) 0%, transparent 60%),
     linear-gradient(${t.gridColor} 1px, transparent 1px),
     linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`;

  const showSpotlight = isHovered && !enabled;
  let backgroundImage: string;
  let backgroundSize: string;
  if (showSpotlight) {
    backgroundImage = showGrid ? withSpotlight : spotlightOnly;
    backgroundSize = showGrid ? 'auto, 50px 50px, 50px 50px' : 'auto';
  } else {
    backgroundImage = showGrid ? gridOnly : 'none';
    backgroundSize = showGrid ? '50px 50px, 50px 50px' : 'auto';
  }

  const getNodeSafe = typeof query?.getNode === 'function' ? query.getNode.bind(query) : () => null;
  const headingId = `${sectionId}-heading`;
  const subheadingId = `${sectionId}-subheading`;
  const buttonId = `${sectionId}-button`;

  const headingNode = getNodeSafe(headingId);
  const subheadingNode = getNodeSafe(subheadingId);
  const buttonNode = getNodeSafe(buttonId);

  const rawHeading = headingNode?.data?.props ? { ...headingNode.data.props, accentColor, colorScheme } : { ...DEFAULT_HEADING, accentColor, colorScheme };
  const rawSubheading = subheadingNode?.data?.props ? { ...subheadingNode.data.props, accentColor, colorScheme } : { ...DEFAULT_SUBHEADING, accentColor, colorScheme };
  const rawButton = buttonNode?.data?.props ? { ...buttonNode.data.props, accentColor, colorScheme } : { ...DEFAULT_BUTTON, accentColor, colorScheme };
  const headingProps = { ...rawHeading, text: safeStr(rawHeading.text, 'Build faster.') };
  const subheadingProps = { ...rawSubheading, text: safeStr(rawSubheading.text, 'Create modern websites in minutes.') };
  const buttonProps = { ...rawButton, text: safeStr(rawButton.text, 'Get Started'), href: safeStr(rawButton.href, '#') };

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="hero"
      data-block-category="header"
      className={`w-full relative overflow-hidden `}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        background: t.bg,
        backgroundImage,
        backgroundSize,
      }}
    >
      <div style={{ maxWidth: 800, textAlign: 'center', padding: '0 24px' }}>
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
            {safeStr(badgeText, '✦ New')}
          </span>
        )}
        <Element id={headingId} is={HeroTronHeading} canvas {...headingProps} />
        <Element id={subheadingId} is={HeroTronSubheading} canvas {...subheadingProps} />
        <Element id={buttonId} is={HeroTronButton} canvas {...buttonProps} />
      </div>
    </section>
  );
};

const HeroTronSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, spotlightIntensity, showGrid, badgeText } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    spotlightIntensity: node.data.props.spotlightIntensity as number,
    showGrid: node.data.props.showGrid as boolean,
    badgeText: node.data.props.badgeText as string,
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
          <div className="flex items-center gap-2"><input type="checkbox" id="herotron-show-grid" checked={showGrid ?? true} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" /><label htmlFor="herotron-show-grid" className={labelCls}>Show grid</label></div>
          <div><label className={labelCls}>Spotlight intensity — {Math.round((spotlightIntensity ?? 0.12) * 100)}%</label><input type="range" min={0} max={0.3} step={0.01} value={spotlightIntensity ?? 0.12} onChange={(e) => setProp((p: Record<string, unknown>) => { p.spotlightIntensity = parseFloat(e.target.value); }, 300)} className="w-full h-2 rounded bg-gray-700 accent-red-500" /></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Badge text</label><input type="text" value={safeStr(badgeText, '')} onChange={(e) => setT('badgeText', 500)(e.target.value)} className={inputCls} placeholder="✦ New" /></div>
        </div>
      </section>
    </div>
  );
};

HeroTron.craft = {
  displayName: 'Hero Tron',
  props: { colorScheme: 'dark', accentColor: '#e11d48', spotlightIntensity: 0.12, showGrid: true, badgeText: '✦ New' },
  related: { settings: HeroTronSettings },
  custom: { styleTags: ['dark', 'minimal', 'bold'], businessTags: ['startup', 'saas', 'tech', 'agency'], featureTags: ['hero', 'above-fold', 'fullscreen', 'interactive'], supportsTheme: true, supportsColorPreset: true },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
