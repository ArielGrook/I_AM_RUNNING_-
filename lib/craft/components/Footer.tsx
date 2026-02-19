'use client';

import { useNode, Element } from '@craftjs/core';
import React from 'react';
import { Text } from './Text';

export const Footer = ({ bgColor = 'var(--palette-secondary, #1a1a1a)' }: { bgColor?: string }) => {
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
      <Element
        is={Text}
        text="© 2026 Your Brand. All rights reserved."
        fontSize={14}
        color="#999999"
        textAlign="center"
      />
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
    </div>
  );
};

Footer.craft = {
  displayName: 'Footer',
  props: {
    bgColor: 'var(--palette-secondary, #1a1a1a)',
  },
  related: {
    settings: FooterSettings,
  },
};
