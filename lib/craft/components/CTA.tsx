'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const CTA = ({
  bgColor = 'linear-gradient(135deg, var(--palette-primary, #667eea) 0%, var(--palette-secondary, #764ba2) 100%)',
  headline = 'Ready to get started?',
  subheadline = 'Join thousands of users building amazing websites',
  ctaText = 'Start Free Trial',
}: {
  bgColor?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        background: bgColor,
        padding: '80px 40px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontSize: 42, fontWeight: 800, color: '#fff', margin: '0 0 16px', lineHeight: 1.15 }}>
          {headline}
        </h2>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)', margin: '0 0 32px', lineHeight: 1.5 }}>
          {subheadline}
        </p>
        <button
          style={{
            background: '#fff',
            color: 'var(--palette-primary, #667eea)',
            border: 'none',
            padding: '14px 40px',
            borderRadius: 10,
            fontSize: 17,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {ctaText}
        </button>
      </div>
    </section>
  );
};

const CTASettings = () => {
  const {
    actions: { setProp },
    headline, subheadline, ctaText,
  } = useNode((node) => ({
    headline:    node.data.props.headline as string,
    subheadline: node.data.props.subheadline as string,
    ctaText:     node.data.props.ctaText as string,
  }));

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Headline</label>
            <input type="text" value={headline ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.headline = e.target.value; })}
              className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white" />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Subheadline</label>
            <textarea value={subheadline ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.subheadline = e.target.value; })} rows={2}
              className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white resize-none" />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">CTA Button Text</label>
            <input type="text" value={ctaText ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.ctaText = e.target.value; })}
              className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white" />
          </div>
        </div>
      </section>
    </div>
  );
};

CTA.craft = {
  displayName: 'CTA',
  props: {
    bgColor: 'linear-gradient(135deg, var(--palette-primary, #667eea) 0%, var(--palette-secondary, #764ba2) 100%)',
    headline: 'Ready to get started?',
    subheadline: 'Join thousands of users building amazing websites',
    ctaText: 'Start Free Trial',
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
  related: {
    settings: CTASettings,
  },
};
