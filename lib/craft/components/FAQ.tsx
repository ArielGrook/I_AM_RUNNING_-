'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const FAQ = ({
  children,
  bgColor = '#ffffff',
  maxWidth = 800,
}: {
  children?: React.ReactNode;
  bgColor?: string;
  maxWidth?: number;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{ padding: '80px 40px', background: bgColor }}
    >
      <div
        style={{
          maxWidth: `${maxWidth}px`,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {children}
      </div>
    </section>
  );
};

const FAQSettings = () => {
  const {
    actions: { setProp },
    bgColor, maxWidth,
  } = useNode((node) => ({
    bgColor:  node.data.props.bgColor as string,
    maxWidth: node.data.props.maxWidth as number,
  }));

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div>
          <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Max Width — {maxWidth ?? 800}px</label>
          <input type="range" min="400" max="1200" value={maxWidth ?? 800}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.maxWidth = Number(e.target.value); }, 500)}
            className="w-full accent-[#FF6B35]" />
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Background</h3>
        <input
          type="color"
          value={bgColor?.startsWith('var') ? '#ffffff' : (bgColor ?? '#ffffff')}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.bgColor = e.target.value; }, 300)}
          className="w-full h-10 rounded cursor-pointer border-0 bg-transparent p-0"
        />
      </section>
    </div>
  );
};

FAQ.craft = {
  displayName: 'FAQ',
  props: {
    bgColor: '#ffffff',
    maxWidth: 800,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: FAQSettings,
  },
};
