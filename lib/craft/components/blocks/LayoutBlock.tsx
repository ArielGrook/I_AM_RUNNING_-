'use client';

import { useNode } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React from 'react';

export interface LayoutBlockProps {
  layout?: 'grid' | 'flex';
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  alignment?: 'start' | 'center' | 'end' | 'stretch';
}

const colClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export const LayoutBlock = React.memo(function LayoutBlock({
  children,
  layout = 'grid',
  columns = 3,
  gap = 24,
  alignment = 'stretch',
}: LayoutBlockProps & { children?: React.ReactNode }) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);

  const alignClass = alignment === 'start' ? 'items-start' : alignment === 'end' ? 'items-end' : alignment === 'center' ? 'items-center' : 'items-stretch';

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`w-full ${layout === 'grid' ? `grid ${colClasses[columns] ?? colClasses[3]}` : 'flex flex-wrap'} ${alignClass} ${isSelected ? 'craft-node-selected' : ''}`}
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
});

const layoutBlockCraft = {
  displayName: 'Layout',
  props: { layout: 'grid', columns: 3, gap: 24, alignment: 'stretch' },
  related: { settings: LayoutBlockSettings },
  rules: { canDrag: () => true, canMoveIn: () => true },
};
(LayoutBlock as unknown as { craft: typeof layoutBlockCraft }).craft = layoutBlockCraft;

function LayoutBlockSettings() {
  const { actions: { setProp } } = useNode();
  const { layout, columns, gap, alignment } = useNode((node) => ({
    layout: (node.data.props.layout as string) ?? 'grid',
    columns: (node.data.props.columns as number) ?? 3,
    gap: (node.data.props.gap as number) ?? 24,
    alignment: (node.data.props.alignment as string) ?? 'stretch',
  }));
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  return (
    <div className="p-3 space-y-4 text-white">
      <div><label className={labelCls}>Layout</label><select value={layout} onChange={(e) => setProp((p: Record<string, unknown>) => { p.layout = e.target.value; })} className={inputCls}><option value="grid">Grid</option><option value="flex">Flex</option></select></div>
      <div><label className={labelCls}>Columns</label><select value={columns} onChange={(e) => setProp((p: Record<string, unknown>) => { p.columns = Number(e.target.value); })} className={inputCls}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></div>
      <div><label className={labelCls}>Gap: {gap}px</label><input type="range" min={0} max={64} step={4} value={gap} onChange={(e) => setProp((p: Record<string, unknown>) => { p.gap = Number(e.target.value); }, 500)} className="w-full" /></div>
      <div><label className={labelCls}>Align</label><select value={alignment} onChange={(e) => setProp((p: Record<string, unknown>) => { p.alignment = e.target.value; })} className={inputCls}><option value="stretch">Stretch</option><option value="start">Start</option><option value="center">Center</option><option value="end">End</option></select></div>
    </div>
  );
}
