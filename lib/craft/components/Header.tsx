'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const Header = ({
  children,
  bgColor = 'var(--palette-secondary, #1a1a1a)',
  sticky = true,
}: {
  children?: React.ReactNode;
  bgColor?: string;
  sticky?: boolean;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <header
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        background: bgColor,
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 100,
      }}
    >
      {children}
    </header>
  );
};

const HeaderSettings = () => {
  const {
    actions: { setProp },
    bgColor, sticky,
  } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
    sticky:  node.data.props.sticky as boolean,
  }));

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Background</label>
            <input
              type="color"
              value={bgColor?.startsWith('var') ? '#1a1a1a' : (bgColor ?? '#1a1a1a')}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.bgColor = e.target.value; }, 300)}
              className="w-full h-10 rounded cursor-pointer border-0 bg-transparent p-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="header-sticky"
              checked={sticky ?? true}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.sticky = e.target.checked; })}
              className="rounded"
            />
            <label htmlFor="header-sticky" className="text-sm text-gray-300">Sticky on scroll</label>
          </div>
        </div>
      </section>
    </div>
  );
};

Header.craft = {
  displayName: 'Header',
  props: {
    bgColor: 'var(--palette-secondary, #1a1a1a)',
    sticky: true,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: HeaderSettings,
  },
};
