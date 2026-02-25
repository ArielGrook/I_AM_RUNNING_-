'use client';

import { useNode } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React from 'react';

export interface LayoutBlockProps {
  columns?: 1 | 2 | 3 | 4;
  minCardWidth?: number;
  gap?: number;
  alignment?: 'start' | 'center' | 'end' | 'stretch';
}

export const LayoutBlock = React.memo(function LayoutBlock({
  children,
  columns = 3,
  gap = 24,
  alignment = 'stretch',
}: LayoutBlockProps & { children?: React.ReactNode }) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);

  const alignItems = alignment === 'center' ? 'center' : alignment === 'end' ? 'flex-end' : alignment === 'start' ? 'flex-start' : 'stretch';

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`w-full flex flex-wrap items-start ${isSelected ? 'craft-node-selected' : ''}`}
      style={{ gap: `${gap}px`, alignItems }}
    >
      {children}
    </div>
  );
});

const layoutBlockCraft = {
  displayName: 'Layout',
  props: { columns: 3, minCardWidth: 280, gap: 24, alignment: 'stretch' },
  related: { settings: LayoutBlockSettings },
  rules: { canDrag: () => true, canMoveIn: () => true },
};
(LayoutBlock as unknown as { craft: typeof layoutBlockCraft }).craft = layoutBlockCraft;

function LayoutBlockSettings() {
  const { actions: { setProp } } = useNode();
  const { columns, gap, alignment } = useNode((node) => ({
    columns: (node.data.props.columns as number) ?? 3,
    gap: (node.data.props.gap as number) ?? 24,
    alignment: (node.data.props.alignment as string) ?? 'stretch',
  }));
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  const accentColor = '#FF6B35';
  return (
    <div className="p-3 space-y-4 text-white">
      <div>
        <label className={labelCls}>Columns</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setProp((p: Record<string, unknown>) => { p.columns = n; })}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid',
                borderColor: columns === n ? accentColor : 'rgba(255,255,255,0.15)',
                background: columns === n ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: columns === n ? accentColor : '#a1a1aa',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div><label className={labelCls}>Gap: {gap}px</label><input type="range" min={0} max={64} step={4} value={gap} onChange={(e) => setProp((p: Record<string, unknown>) => { p.gap = Number(e.target.value); }, 500)} className="w-full" /></div>
      <div><label className={labelCls}>Align</label><select value={alignment} onChange={(e) => setProp((p: Record<string, unknown>) => { p.alignment = e.target.value; })} className={inputCls}><option value="stretch">Stretch</option><option value="start">Start</option><option value="center">Center</option><option value="end">End</option></select></div>
    </div>
  );
}
