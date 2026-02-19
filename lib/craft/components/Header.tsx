'use client';

import { useNode, Element } from '@craftjs/core';
import React from 'react';
import { Text } from './Text';
import { Button } from './Button';

export const Header = ({
  bgColor = 'var(--palette-secondary, #1a1a1a)',
  sticky = true,
}: {
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
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 100,
      }}
    >
      <Element id="header-logo" is={Text} text="Brand" fontSize={24} color="#FF6B35" />
      <Element id="header-cta" is={Button} text="Get Started" />
    </header>
  );
};

const HeaderSettings = () => {
  const {
    actions: { setProp },
    bgColor,
    sticky,
  } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
    sticky: node.data.props.sticky as boolean,
  }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm mb-2 text-gray-300">Background Color</label>
        <input
          type="color"
          value={bgColor ?? '#1a1a1a'}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.bgColor = e.target.value;
            })
          }
          className="w-full h-10 rounded bg-gray-700 border border-gray-600"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={sticky ?? true}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.sticky = e.target.checked;
            })
          }
          className="rounded"
        />
        <label className="text-sm text-gray-300">Sticky (fixed on scroll)</label>
      </div>
    </div>
  );
};

Header.craft = {
  displayName: 'Header',
  props: {
    bgColor: 'var(--palette-secondary, #1a1a1a)',
    sticky: true,
  },
  related: {
    settings: HeaderSettings,
  },
};
