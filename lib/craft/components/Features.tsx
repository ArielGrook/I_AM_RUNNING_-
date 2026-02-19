'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const Features = ({
  children,
  bgColor = 'var(--palette-bg, #f9fafb)',
  columns = 3,
  gap = 32,
}: {
  children?: React.ReactNode;
  bgColor?: string;
  columns?: number;
  gap?: number;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        padding: '80px 40px',
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        maxWidth: '100%',
      }}
    >
      {children}
    </section>
  );
};

const FeaturesSettings = () => {
  const {
    actions: { setProp },
    bgColor, columns, gap,
  } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
    columns: node.data.props.columns as number,
    gap:     node.data.props.gap as number,
  }));

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Columns</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((c) => (
                <button key={c} onClick={() => setProp((p: Record<string, unknown>) => { p.columns = c; })}
                  className={`flex-1 py-1 text-xs rounded border transition-colors ${
                    columns === c ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Gap — {gap ?? 32}px</label>
            <input type="range" min="0" max="80" value={gap ?? 32}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.gap = Number(e.target.value); }, 500)}
              className="w-full accent-[#FF6B35]" />
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Background</h3>
        <div>
          <input
            type="color"
            value={bgColor?.startsWith('var') ? '#f9fafb' : (bgColor ?? '#f9fafb')}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.bgColor = e.target.value; }, 300)}
            className="w-full h-10 rounded cursor-pointer border-0 bg-transparent p-0"
          />
        </div>
      </section>
    </div>
  );
};

Features.craft = {
  displayName: 'Features',
  props: {
    bgColor: 'var(--palette-bg, #f9fafb)',
    columns: 3,
    gap: 32,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: FeaturesSettings,
  },
};
