'use client';

import { useNode } from '@craftjs/core';
import React from 'react';
import { Resizable } from 're-resizable';
import { useTheme } from '@/lib/craft/context/ThemeContext';

const tokens = {
  dark: {
    cardBg: 'rgba(255,255,255,0.02)',
    cardBorder: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
  },
  light: {
    cardBg: 'rgba(0,0,0,0.02)',
    cardBorder: 'rgba(0,0,0,0.08)',
    text: '#0a0a0a',
    textSecondary: '#52525b',
  },
};

export interface CardBlockProps {
  width?: number;
  minHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  title?: string;
  description?: string;
}

export const CardBlock = React.memo(function CardBlock() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { width = 300, minHeight = 200, minWidth = 200, maxWidth = 600, title = 'Card title', description = 'Card description' } = useNode((node) => node.data.props as CardBlockProps) ?? {};
  const { theme } = useTheme();

  const t = tokens[theme.colorScheme];

  return (
    <Resizable
      size={{ width: width ?? 300, height: 'auto' }}
      minWidth={minWidth}
      maxWidth={maxWidth}
      minHeight={minHeight}
      enable={isSelected ? { right: true, left: true, bottom: true } : false}
      onResizeStop={(_e, _dir, _ref, d) => {
        setProp((p: Record<string, unknown>) => {
          p.width = Math.round((p.width as number ?? 300) + d.width);
        }, 300);
      }}
      style={{ flexShrink: 0 }}
    >
      <div
        ref={(ref) => { if (ref) connect(drag(ref)); }}
        className={isSelected ? 'outline outline-2 outline-[#FF6B35] outline-offset-0' : ''}
        style={{
          minHeight: `${minHeight ?? 200}px`,
          background: t.cardBg,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 8,
          padding: 24,
          cursor: 'default',
        }}
      >
        <h3 style={{ color: t.text, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
        <p style={{ color: t.textSecondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{description}</p>
      </div>
    </Resizable>
  );
});

const cardBlockCraft = {
  displayName: 'Card',
  props: {
    width: 300,
    minHeight: 200,
    minWidth: 200,
    maxWidth: 600,
    title: 'Card title',
    description: 'Card description',
  },
  related: { settings: CardBlockSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
(CardBlock as unknown as { craft: typeof cardBlockCraft }).craft = cardBlockCraft;

function CardBlockSettings() {
  const { actions: { setProp } } = useNode();
  const { width, minHeight, title, description } = useNode((node) => ({
    width: (node.data.props.width as number) ?? 300,
    minHeight: (node.data.props.minHeight as number) ?? 200,
    title: (node.data.props.title as string) ?? '',
    description: (node.data.props.description as string) ?? '',
  }));
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  return (
    <div className="p-3 space-y-4 text-white">
      <div><label className={labelCls}>Title</label><input value={title} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 1000)} className={inputCls} /></div>
      <div><label className={labelCls}>Description</label><textarea value={description} onChange={(e) => setProp((p: Record<string, unknown>) => { p.description = e.target.value; }, 1000)} className={inputCls} rows={3} /></div>
      <div><label className={labelCls}>Width: {width}px</label><input type="number" min={200} max={600} value={width} onChange={(e) => setProp((p: Record<string, unknown>) => { p.width = Number(e.target.value); }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Min height: {minHeight}px</label><input type="range" min={100} max={500} step={20} value={minHeight} onChange={(e) => setProp((p: Record<string, unknown>) => { p.minHeight = Number(e.target.value); }, 500)} className="w-full" /></div>
    </div>
  );
}
