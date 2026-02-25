'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { Resizable } from 're-resizable';
import { useTheme } from '@/lib/craft/context/ThemeContext';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255, 107, 53';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

const tokens = {
  dark: {
    text: '#ffffff',
    muted: '#52525b',
    cardBg: 'rgba(255,255,255,0.02)',
    cardBorder: 'rgba(255,255,255,0.08)',
  },
  light: {
    text: '#0a0a0a',
    muted: '#52525b',
    cardBg: 'rgba(0,0,0,0.02)',
    cardBorder: 'rgba(0,0,0,0.08)',
  },
};

export interface PricingCardBlockProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  ctaText: string;
  width?: number;
  height?: number;
  minHeight?: number;
  minWidth?: number;
  maxWidth?: number;
}

const DEFAULT_FEATURES = ['Feature 1', 'Feature 2'];

export const PricingCardBlock = React.memo(function PricingCardBlock() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const props = useNode((node) => node.data.props as Partial<PricingCardBlockProps>) ?? {};
  const {
    name = 'Pro',
    price = '79',
    period = '/mo',
    description = '',
    features = DEFAULT_FEATURES,
    highlighted = false,
    ctaText = 'Get Started',
    width = 300,
    height = 440,
    minHeight = 400,
    minWidth = 200,
    maxWidth = 600,
  } = props;

  const { theme } = useTheme();
  const accentColor = theme.accentColor ?? '#FF6B35';
  const t = tokens[theme.colorScheme];
  const rgb = hexToRgb(accentColor);

  return (
    <Resizable
      size={{ width: width ?? 300, height: height ?? 440 }}
      minWidth={minWidth ?? 200}
      maxWidth={maxWidth ?? 600}
      minHeight={150}
      enable={enabled && isSelected ? {
        right: true, bottom: true, bottomRight: true,
        left: true, top: true, topLeft: true, topRight: true, bottomLeft: true,
      } : {}}
      onResizeStop={(_e, _dir, ref) => {
        const newW = ref ? parseFloat((ref as HTMLElement).style.width) : NaN;
        const newH = ref ? parseFloat((ref as HTMLElement).style.height) : NaN;
        setProp((p: Record<string, unknown>) => {
          if (!isNaN(newW)) p.width = Math.round(newW);
          if (!isNaN(newH)) p.height = Math.round(newH);
        }, 300);
      }}
      handleStyles={enabled && isSelected ? {
        right: { width: 3, background: 'rgba(255,255,255,0.3)', cursor: 'col-resize', zIndex: 10 },
        left: { width: 3, background: 'rgba(255,255,255,0.3)', cursor: 'col-resize', zIndex: 10 },
        bottom: { height: 3, background: 'rgba(255,255,255,0.3)', cursor: 'row-resize', zIndex: 10 },
        top: { height: 3, background: 'rgba(255,255,255,0.3)', cursor: 'row-resize', zIndex: 10 },
        bottomRight: { width: 8, height: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 2, cursor: 'nwse-resize', zIndex: 20, bottom: 2, right: 2 },
        bottomLeft: { width: 8, height: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 2, cursor: 'nesw-resize', zIndex: 20, bottom: 2, left: 2 },
        topRight: { width: 8, height: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 2, cursor: 'nesw-resize', zIndex: 20, top: 2, right: 2 },
        topLeft: { width: 8, height: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 2, cursor: 'nwse-resize', zIndex: 20, top: 2, left: 2 },
      } : {
        right: {}, left: {}, bottom: {}, top: {},
        bottomRight: {}, bottomLeft: {}, topRight: {}, topLeft: {},
      }}
      style={{ display: 'inline-flex', minWidth: 200 }}
    >
      <div
        ref={(ref) => { if (ref) connect(ref); }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: `${height ?? 440}px`,
          background: highlighted ? `rgba(${rgb},0.05)` : t.cardBg,
          border: highlighted ? `1px solid ${accentColor}` : `1px solid ${t.cardBorder}`,
          borderRadius: 8,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: highlighted ? `0 0 30px rgba(${rgb}, 0.15)` : undefined,
          cursor: 'default',
          outline: isSelected ? '1px solid rgba(255,255,255,0.4)' : 'none',
          outlineOffset: '-1px',
        }}
      >
        {enabled && (
          <div
            ref={(ref) => { if (ref) drag(ref); }}
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 32,
              height: 4,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
              cursor: 'grab',
              zIndex: 20,
            }}
          />
        )}
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, margin: '0 0 16px' }}>{name}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
          <span style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: t.text }}>{price}</span>
          <span style={{ fontSize: 14, color: t.muted }}>{period}</span>
        </div>
        {description ? <p style={{ fontSize: 14, color: t.muted, marginBottom: 16 }}>{description}</p> : null}
        <div style={{ height: 1, background: `rgba(${rgb}, 0.2)`, marginBottom: 20 }} />
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
          {(features ?? []).map((f, j) => (
            <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: t.muted, marginBottom: 8 }}>
              <span style={{ color: accentColor, flexShrink: 0 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
        <button
          type="button"
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 8,
            border: 'none',
            background: accentColor,
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {ctaText}
        </button>
      </div>
    </Resizable>
  );
});

const PricingCardBlockSettings = () => {
  const { actions: { setProp } } = useNode();
  const { name, price, period, description, features, highlighted, ctaText, width, height, minHeight } = useNode((node) => ({
    name: (node.data.props.name as string) ?? 'Pro',
    price: (node.data.props.price as string) ?? '79',
    period: (node.data.props.period as string) ?? '/mo',
    description: (node.data.props.description as string) ?? '',
    features: (node.data.props.features as string[]) ?? DEFAULT_FEATURES,
    highlighted: (node.data.props.highlighted as boolean) ?? false,
    ctaText: (node.data.props.ctaText as string) ?? 'Get Started',
    width: (node.data.props.width as number) ?? 300,
    height: (node.data.props.height as number) ?? 440,
    minHeight: (node.data.props.minHeight as number) ?? 400,
  }));
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateFeature = (index: number, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.features as string[]) ?? [])];
      arr[index] = value;
      p.features = arr;
    }, 500);
  };

  return (
    <div className="p-3 space-y-4 text-white">
      <div><label className={labelCls}>Name</label><input type="text" value={name} onChange={(e) => setProp((p: Record<string, unknown>) => { p.name = e.target.value; }, 1000)} className={inputCls} /></div>
      <div><label className={labelCls}>Price</label><input type="text" value={price} onChange={(e) => setProp((p: Record<string, unknown>) => { p.price = e.target.value; }, 1000)} className={inputCls} /></div>
      <div><label className={labelCls}>Period</label><input type="text" value={period} onChange={(e) => setProp((p: Record<string, unknown>) => { p.period = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Description</label><input type="text" value={description} onChange={(e) => setProp((p: Record<string, unknown>) => { p.description = e.target.value; }, 1000)} className={inputCls} /></div>
      <div><label className={labelCls}>CTA text</label><input type="text" value={ctaText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.ctaText = e.target.value; }, 500)} className={inputCls} /></div>
      <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={highlighted} onChange={(e) => setProp((p: Record<string, unknown>) => { p.highlighted = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" /> Highlighted</label>
      <div><label className={labelCls}>Width: {width}px</label><input type="range" min={200} max={800} step={10} value={width} onChange={(e) => setProp((p: Record<string, unknown>) => { p.width = Number(e.target.value); }, 300)} className="w-full" /></div>
      <div><label className={labelCls}>Height: {height}px</label><input type="range" min={150} max={700} step={10} value={height} onChange={(e) => setProp((p: Record<string, unknown>) => { p.height = Number(e.target.value); }, 300)} className="w-full" /></div>
      <div>
        <label className={labelCls}>Features</label>
        {(features ?? []).map((f, j) => (
          <div key={j} className="flex gap-1 mb-1">
            <input type="text" value={f} onChange={(e) => updateFeature(j, e.target.value)} className={inputCls} />
            <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.features = ((p.features as string[]) ?? []).filter((_, i) => i !== j); })} className="text-xs text-red-400 shrink-0">×</button>
          </div>
        ))}
        <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.features = [...((p.features as string[]) ?? []), 'New feature']; })} className="text-xs text-gray-400">+ Add feature</button>
      </div>
    </div>
  );
};

const pricingCardBlockCraft = {
  displayName: 'Pricing Card',
  props: {
    name: 'Pro',
    price: '79',
    period: '/mo',
    description: '',
    features: DEFAULT_FEATURES,
    highlighted: false,
    ctaText: 'Get Started',
    width: 300,
    height: 440,
    minHeight: 400,
    minWidth: 200,
    maxWidth: 600,
  },
  related: { settings: PricingCardBlockSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
(PricingCardBlock as unknown as { craft: typeof pricingCardBlockCraft }).craft = pricingCardBlockCraft;
