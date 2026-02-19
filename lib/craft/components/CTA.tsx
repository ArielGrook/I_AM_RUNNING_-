'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

export const CTA = ({
  children,
  bgColor = 'linear-gradient(135deg, var(--palette-primary, #667eea) 0%, var(--palette-secondary, #764ba2) 100%)',
}: {
  children?: React.ReactNode;
  bgColor?: string;
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {children}
    </section>
  );
};

const CTASettings = () => {
  const {
    actions: { setProp },
    bgColor,
  } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
  }));

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Background</h3>
        <div>
          <input
            type="text"
            value={bgColor ?? ''}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.bgColor = e.target.value; })}
            className="w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white font-mono"
            placeholder="CSS gradient or color"
          />
          <div className="flex gap-1 mt-2 flex-wrap">
            {[
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              'linear-gradient(135deg, #FF6B35 0%, #ff8555 100%)',
              'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
              '#1a1a1a',
            ].map((v) => (
              <button key={v} onClick={() => setProp((p: Record<string, unknown>) => { p.bgColor = v; })}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  bgColor === v ? 'border-[#FF6B35] scale-110' : 'border-gray-600 hover:border-gray-400'
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

CTA.craft = {
  displayName: 'CTA',
  props: {
    bgColor: 'linear-gradient(135deg, var(--palette-primary, #667eea) 0%, var(--palette-secondary, #764ba2) 100%)',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: CTASettings,
  },
};
