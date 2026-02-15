'use client';

import { useNode, Element } from '@craftjs/core';
import React from 'react';
import { Text } from './Text';
import { Button } from './Button';
import { Container } from './Container';

export const CTA = ({
  bgColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}: {
  bgColor?: string;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        background: bgColor,
        padding: '80px 40px',
        textAlign: 'center',
      }}
    >
      <Element id="cta-content" is={Container} canvas background="transparent">
        <Element
          is={Text}
          text="Ready to get started?"
          fontSize={42}
          color="#ffffff"
          textAlign="center"
        />
        <Element
          is={Text}
          text="Join thousands of users building amazing websites"
          fontSize={20}
          color="#ffffff"
          textAlign="center"
        />
        <Element
          is={Button}
          text="Start Free Trial"
          bgColor="#ffffff"
          textColor="#667eea"
        />
      </Element>
    </section>
  );
};

const CTASettings = () => (
  <div className="p-4 space-y-4">
    <div className="text-amber-400 text-sm">
      Gradient background will be customizable via GradientBuilder (coming soon)
    </div>
  </div>
);

CTA.craft = {
  displayName: 'CTA',
  props: {
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  related: {
    settings: CTASettings,
  },
};
