'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const Hero = ({
  background = 'linear-gradient(135deg, var(--palette-primary, #FF6B35) 0%, var(--palette-accent, #ff8555) 100%)',
  minHeight = 500,
  headline = 'Welcome to Your Website',
  subheadline = 'Build beautiful pages without code',
  ctaText = 'Get Started',
  ctaShow = true,
  textAlign = 'center',
}: {
  background?: string;
  minHeight?: number;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaShow?: boolean;
  textAlign?: 'left' | 'center' | 'right';
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
        padding: '60px 40px',
      }}
    >
      <div style={{ maxWidth: 720, width: '100%', textAlign }}>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', margin: '0 0 16px', lineHeight: 1.15 }}>
          {headline}
        </h1>
        <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.85)', margin: '0 0 32px', lineHeight: 1.5 }}>
          {subheadline}
        </p>
        {ctaShow && (
          <button
            style={{
              background: '#fff',
              color: 'var(--palette-primary, #FF6B35)',
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
        )}
      </div>
    </div>
  );
};

const HeroSettings = () => {
  const {
    actions: { setProp },
    headline, subheadline, ctaText, ctaShow, minHeight, textAlign,
  } = useNode((node) => ({
    headline:    node.data.props.headline as string,
    subheadline: node.data.props.subheadline as string,
    ctaText:     node.data.props.ctaText as string,
    ctaShow:     node.data.props.ctaShow as boolean,
    minHeight:   node.data.props.minHeight as number,
    textAlign:   node.data.props.textAlign as string,
  }));

  const set = (key: string) => (val: string | number | boolean) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; });

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Headline</label>
            <input type="text" value={headline ?? ''} onChange={(e) => set('headline')(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white" />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Subheadline</label>
            <textarea value={subheadline ?? ''} onChange={(e) => set('subheadline')(e.target.value)} rows={2}
              className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white resize-none" />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">CTA Button</label>
            <div className="flex gap-2 items-center">
              <input type="text" value={ctaText ?? ''} onChange={(e) => set('ctaText')(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white" />
              <label className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <input type="checkbox" checked={ctaShow ?? true} onChange={(e) => set('ctaShow')(e.target.checked)} className="rounded" />
                Show
              </label>
            </div>
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Text Align</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button key={a} onClick={() => set('textAlign')(a)}
                  className={`flex-1 py-1 text-xs rounded border capitalize transition-colors ${
                    textAlign === a ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Min Height — {minHeight ?? 500}px
            </label>
            <input type="range" min="300" max="900" value={minHeight ?? 500}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.minHeight = Number(e.target.value); }, 500)}
              className="w-full accent-[#FF6B35]" />
          </div>
        </div>
      </section>
    </div>
  );
};

Hero.craft = {
  displayName: 'Hero',
  props: {
    background: 'linear-gradient(135deg, var(--palette-primary, #FF6B35) 0%, var(--palette-accent, #ff8555) 100%)',
    minHeight: 500,
    headline: 'Welcome to Your Website',
    subheadline: 'Build beautiful pages without code',
    ctaText: 'Get Started',
    ctaShow: true,
    textAlign: 'center',
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
  related: {
    settings: HeroSettings,
  },
};
