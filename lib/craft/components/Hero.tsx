'use client';

import { useNode, Element } from '@craftjs/core';
import React from 'react';
import { Container } from './Container';
import { Text } from './Text';

export const Hero = ({
  background = 'linear-gradient(135deg, var(--palette-primary, #FF6B35) 0%, var(--palette-accent, #ff8555) 100%)',
  minHeight = 400,
}: {
  background?: string;
  minHeight?: number;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        background,
        minHeight: `${minHeight}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <Element
        id="hero-content"
        is={Container}
        canvas
        background="transparent"
        padding={20}
      >
        <Element
          is={Text}
          text="Welcome to Your Website"
          fontSize={48}
          color="#ffffff"
          textAlign="center"
        />
        <Element
          is={Text}
          text="Build beautiful pages without code"
          fontSize={24}
          color="#ffffff"
          textAlign="center"
        />
      </Element>
    </div>
  );
};

const HeroSettings = () => {
  const {
    actions: { setProp },
    minHeight,
  } = useNode((node) => ({
    minHeight: node.data.props.minHeight as number,
  }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm mb-2 text-gray-300">
          Min Height: {minHeight ?? 400}px
        </label>
        <input
          type="range"
          min="200"
          max="800"
          value={minHeight ?? 400}
          onChange={(e) =>
            setProp((props: Record<string, unknown>) => {
              props.minHeight = Number(e.target.value);
            })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm text-amber-400">
          Background gradient - will be added later via GradientBuilder
        </label>
      </div>
    </div>
  );
};

Hero.craft = {
  displayName: 'Hero',
  props: {
    background: 'linear-gradient(135deg, var(--palette-primary, #FF6B35) 0%, var(--palette-accent, #ff8555) 100%)',
    minHeight: 400,
  },
  related: {
    settings: HeroSettings,
  },
};
