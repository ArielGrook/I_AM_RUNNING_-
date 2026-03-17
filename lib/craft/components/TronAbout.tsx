'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { buildGridTokens as buildTokens } from '../tokens';

// ── Interfaces ───────────────────────────────────────────────────────────
export interface TronAboutProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  headline?: string;
  body?: string;
  animationType?: string;
  animateDelay?: string;
}

// ── Main component ────────────────────────────────────────────────────────
export const TronAbout = React.memo(function TronAbout() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const props = useNode((node) => node.data.props as Partial<TronAboutProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 60,
    showGrid = true,
    headline = 'About Us',
    body = 'We build products that help teams ship faster. Our mission is to make professional web development accessible to everyone.',
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

  const animAttrs = !enabled && animationType !== 'none'
    ? { 'data-animate': animationType, 'data-animate-delay': animateDelay }
    : {};

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      id="about"
      data-block-type="about"
      data-block-category="content"
      className={`w-full max-w-full py-20 px-4 sm:px-8 lg:px-16 flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: showGrid ? '50px 50px' : 'auto',
        minHeight: `${sectionHeight}vh`,
      }}
    >
      <div
        className="max-w-3xl mx-auto w-full text-center"
        {...animAttrs}
      >
        <EditableText
          value={headline ?? ''}
          fieldKey="headline"
          tag="h2"
          style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.2,
            color: t.text,
            margin: '0 0 16px',
          }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.headline = val; }, 500)}
        />
        <EditableText
          value={body ?? ''}
          fieldKey="body"
          tag="p"
          style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            lineHeight: 1.7,
            color: t.textSecondary,
            margin: 0,
          }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.body = val; }, 500)}
        />
      </div>
    </section>
  );
});

// ── Settings ───────────────────────────────────────────────────────────────
function TronAboutSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronAboutProps>) ?? {};
  const {
    headline = 'About Us',
    body = 'We build products that help teams ship faster.',
    animationType = 'none',
    animateDelay = '0',
    showGrid = true,
    sectionHeight = 60,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
  } = props;

  const setT = (key: keyof TronAboutProps, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  return (
    <div className="p-3 space-y-0">
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Headline</label>
            <input type="text" value={headline} onChange={(e) => setT('headline', 500)(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Body</label>
            <textarea
              value={body}
              onChange={(e) => setT('body', 500)(e.target.value)}
              className={inputCls}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Display</h3>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" checked={showGrid} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
          Show grid
        </label>
      </div>

      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Size</h3>
        <div>
          <label className={labelCls}>Section height: {sectionHeight}vh</label>
          <input
            type="range"
            min={40}
            max={100}
            step={5}
            value={sectionHeight}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)}
            className="settings-slider"
          />
        </div>
      </div>

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

      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Animation</h3>
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
const tronAboutCraft = {
  displayName: 'Tron About',
  props: {
    colorScheme: 'dark' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 60,
    showGrid: true,
    headline: 'About Us',
    body: 'We build products that help teams ship faster. Our mission is to make professional web development accessible to everyone.',
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronAboutSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['startup', 'saas', 'agency'],
    featureTags: ['about'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronAbout as unknown as { craft: typeof tronAboutCraft }).craft = tronAboutCraft;
