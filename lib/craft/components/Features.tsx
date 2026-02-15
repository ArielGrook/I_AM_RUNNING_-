'use client';

import { useNode, Element } from '@craftjs/core';
import React from 'react';
import { Container } from './Container';
import { Text } from './Text';

export const Features = () => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        padding: '80px 40px',
        background: '#f9fafb',
      }}
    >
      <Element
        is={Text}
        text="Features"
        fontSize={48}
        textAlign="center"
        color="#1a1a1a"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '32px',
          marginTop: '40px',
        }}
      >
        <Element
          id="feature-1"
          is={Container}
          canvas
          background="#ffffff"
          padding={32}
        >
          <Element is={Text} text="🚀 Fast" fontSize={24} color="#1a1a1a" />
          <Element
            is={Text}
            text="Lightning-fast performance"
            fontSize={16}
            color="#666666"
          />
        </Element>
        <Element
          id="feature-2"
          is={Container}
          canvas
          background="#ffffff"
          padding={32}
        >
          <Element is={Text} text="🎨 Beautiful" fontSize={24} color="#1a1a1a" />
          <Element
            is={Text}
            text="Stunning designs out of the box"
            fontSize={16}
            color="#666666"
          />
        </Element>
        <Element
          id="feature-3"
          is={Container}
          canvas
          background="#ffffff"
          padding={32}
        >
          <Element is={Text} text="⚡ Easy" fontSize={24} color="#1a1a1a" />
          <Element
            is={Text}
            text="No code required"
            fontSize={16}
            color="#666666"
          />
        </Element>
      </div>
    </section>
  );
};

const FeaturesSettings = () => (
  <div className="p-4 text-gray-300 text-sm">
    Edit individual feature cards by selecting them on the canvas
  </div>
);

Features.craft = {
  displayName: 'Features',
  props: {},
  related: {
    settings: FeaturesSettings,
  },
};
