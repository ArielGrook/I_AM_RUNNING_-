'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const Footer = ({
  children,
  bgColor = 'var(--palette-secondary, #1a1a1a)',
}: {
  children?: React.ReactNode;
  bgColor?: string;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <footer
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        background: bgColor,
        padding: '40px',
        textAlign: 'center',
      }}
    >
      {children}
    </footer>
  );
};

const FooterSettings = () => {
  const {
    actions: { setProp },
    bgColor,
  } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
  }));

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div>
          <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Background</label>
          <input
            type="color"
            value={bgColor?.startsWith('var') ? '#1a1a1a' : (bgColor ?? '#1a1a1a')}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.bgColor = e.target.value; }, 300)}
            className="w-full h-10 rounded cursor-pointer border-0 bg-transparent p-0"
          />
        </div>
      </section>
    </div>
  );
};

Footer.craft = {
  displayName: 'Footer',
  props: {
    bgColor: 'var(--palette-secondary, #1a1a1a)',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: FooterSettings,
  },
};
