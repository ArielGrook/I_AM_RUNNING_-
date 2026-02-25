'use client';

import { useNode, useEditor } from '@craftjs/core';
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
  height?: number;
  minHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  title?: string;
  description?: string;
}

export const CardBlock = React.memo(function CardBlock() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { width = 300, height = 240, minHeight = 200, minWidth = 200, maxWidth = 600, title = 'Card title', description = 'Card description' } = useNode((node) => node.data.props as CardBlockProps) ?? {};
  const { theme } = useTheme();

  const t = tokens[theme.colorScheme];
  const accentColor = theme.accentColor ?? '#FF6B35';

  return (
    <Resizable
      size={{ width: width ?? 300, height: height ?? 240 }}
      className="cic-resizable"
      minWidth={200}
      maxWidth={800}
      minHeight={150}
      enable={enabled && isSelected ? {
        right: true, bottom: true, bottomRight: true,
        left: true, top: true, topLeft: true, topRight: true, bottomLeft: true,
      } : {}}
      onResizeStart={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onResizeStop={(_e, _dir, ref) => {
        const newW = ref ? parseFloat((ref as HTMLElement).style.width) : NaN;
        const newH = ref ? parseFloat((ref as HTMLElement).style.height) : NaN;
        setProp((p: Record<string, unknown>) => {
          if (!isNaN(newW)) p.width = Math.round(newW);
          if (!isNaN(newH)) p.height = Math.round(newH);
        }, 300);
      }}
      handleStyles={enabled && isSelected ? {
        right: { width: 2, background: 'rgba(255,255,255,0.2)', cursor: 'col-resize', zIndex: 10 },
        left: { width: 2, background: 'rgba(255,255,255,0.2)', cursor: 'col-resize', zIndex: 10 },
        bottom: { height: 2, background: 'rgba(255,255,255,0.2)', cursor: 'row-resize', zIndex: 10 },
        top: { height: 2, background: 'rgba(255,255,255,0.2)', cursor: 'row-resize', zIndex: 10 },
        bottomRight: { width: 5, height: 5, background: 'rgba(255,255,255,0.5)', borderRadius: 1, cursor: 'nwse-resize', zIndex: 20, bottom: 1, right: 1 },
        bottomLeft: { width: 5, height: 5, background: 'rgba(255,255,255,0.5)', borderRadius: 1, cursor: 'nesw-resize', zIndex: 20, bottom: 1, left: 1 },
        topRight: { width: 5, height: 5, background: 'rgba(255,255,255,0.5)', borderRadius: 1, cursor: 'nesw-resize', zIndex: 20, top: 1, right: 1 },
        topLeft: { width: 5, height: 5, background: 'rgba(255,255,255,0.5)', borderRadius: 1, cursor: 'nwse-resize', zIndex: 20, top: 1, left: 1 },
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
          background: t.cardBg,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 8,
          padding: 24,
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
    height: 240,
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
  const { width, height, title, description } = useNode((node) => ({
    width: (node.data.props.width as number) ?? 300,
    height: (node.data.props.height as number) ?? 240,
    title: (node.data.props.title as string) ?? '',
    description: (node.data.props.description as string) ?? '',
  }));
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  return (
    <div className="p-3 space-y-4 text-white">
      <div><label className={labelCls}>Title</label><input value={title} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 1000)} className={inputCls} /></div>
      <div><label className={labelCls}>Description</label><textarea value={description} onChange={(e) => setProp((p: Record<string, unknown>) => { p.description = e.target.value; }, 1000)} className={inputCls} rows={3} /></div>
      <div><label className={labelCls}>Width: {width}px</label><input type="range" min={200} max={800} step={10} value={width} onChange={(e) => setProp((p: Record<string, unknown>) => { p.width = Number(e.target.value); }, 300)} className="w-full" /></div>
      <div><label className={labelCls}>Height: {height}px</label><input type="range" min={150} max={600} step={10} value={height} onChange={(e) => setProp((p: Record<string, unknown>) => { p.height = Number(e.target.value); }, 300)} className="w-full" /></div>
    </div>
  );
}
