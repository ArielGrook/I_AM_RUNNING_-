'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

const FEATURES = [
  { icon: '🚀', title: 'Fast', desc: 'Lightning-fast performance' },
  { icon: '🎨', title: 'Beautiful', desc: 'Stunning designs out of the box' },
  { icon: '⚡', title: 'Easy', desc: 'No code required' },
];

export const Features = ({
  sectionTitle = 'Features',
  bgColor = 'var(--palette-bg, #f9fafb)',
}: {
  sectionTitle?: string;
  bgColor?: string;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{ padding: '80px 40px', background: bgColor }}
    >
      <h2
        style={{
          fontSize: 48,
          textAlign: 'center',
          color: 'var(--palette-text, #1a1a1a)',
          margin: '0 0 40px',
          fontWeight: 700,
        }}
      >
        {sectionTitle}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '32px',
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              background: 'var(--palette-surface, #ffffff)',
              padding: 32,
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ fontSize: 24, color: 'var(--palette-text, #1a1a1a)', margin: '0 0 8px', fontWeight: 600 }}>
              {f.title}
            </h3>
            <p style={{ fontSize: 16, color: '#666666', margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const FeaturesSettings = () => {
  const {
    actions: { setProp },
    sectionTitle,
    bgColor,
  } = useNode((node) => ({
    sectionTitle: node.data.props.sectionTitle as string,
    bgColor:      node.data.props.bgColor as string,
  }));

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div>
          <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Section Title</label>
          <input
            type="text"
            value={sectionTitle ?? 'Features'}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionTitle = e.target.value; })}
            className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white"
          />
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div>
          <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Background</label>
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
    sectionTitle: 'Features',
    bgColor: 'var(--palette-bg, #f9fafb)',
  },
  rules: {
    canDrag: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: FeaturesSettings,
  },
};
