'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const Hero = ({
  children,
  background = 'linear-gradient(135deg, var(--palette-primary, #FF6B35) 0%, var(--palette-accent, #ff8555) 100%)',
  minHeight = 500,
  textAlign = 'center',
}: {
  children?: React.ReactNode;
  background?: string;
  minHeight?: number;
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
        textAlign,
        maxWidth: '100%',
      }}
    >
      {children}
    </div>
  );
};

const HeroSettings = () => {
  const {
    actions: { setProp },
    background, minHeight, textAlign,
  } = useNode((node) => ({
    background:  node.data.props.background as string,
    minHeight:   node.data.props.minHeight as number,
    textAlign:   node.data.props.textAlign as string,
  }));

  const set = (key: string) => (val: string | number | boolean) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; });

  return (
    <div className="p-3 space-y-5 text-white">
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
            <input type="range" min="200" max="900" value={minHeight ?? 500}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.minHeight = Number(e.target.value); }, 500)}
              className="w-full accent-[#FF6B35]" />
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Background</h3>
        <div>
          <input
            type="text"
            value={background ?? ''}
            onChange={(e) => set('background')(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white font-mono"
            placeholder="CSS gradient or color"
          />
          <div className="flex gap-1 mt-2 flex-wrap">
            {[
              'linear-gradient(135deg, #FF6B35 0%, #ff8555 100%)',
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              '#1a1a1a',
              '#ffffff',
            ].map((v) => (
              <button key={v} onClick={() => set('background')(v)}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  background === v ? 'border-[#FF6B35] scale-110' : 'border-gray-600 hover:border-gray-400'
                }`}
                style={{ background: v }}
                title={v}
              />
            ))}
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
    textAlign: 'center',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: HeroSettings,
  },
};
