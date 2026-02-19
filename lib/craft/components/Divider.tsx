'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

type DividerStyle = 'solid' | 'dashed' | 'dotted' | 'none';

export const Divider = ({
  height = 40,
  lineColor = '#e5e7eb',
  lineWidth = 1,
  lineStyle = 'solid',
  maxWidth = 100,
}: {
  height?: number;
  lineColor?: string;
  lineWidth?: number;
  lineStyle?: DividerStyle;
  maxWidth?: number;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: `${height}px`,
        width: '100%',
      }}
    >
      {lineStyle !== 'none' && (
        <hr
          style={{
            width: `${maxWidth}%`,
            border: 'none',
            borderTop: `${lineWidth}px ${lineStyle} ${lineColor}`,
            margin: 0,
          }}
        />
      )}
    </div>
  );
};

const DividerSettings = () => {
  const {
    actions: { setProp },
    height, lineColor, lineWidth, lineStyle, maxWidth,
  } = useNode((node) => ({
    height:    node.data.props.height as number,
    lineColor: node.data.props.lineColor as string,
    lineWidth: node.data.props.lineWidth as number,
    lineStyle: node.data.props.lineStyle as DividerStyle,
    maxWidth:  node.data.props.maxWidth as number,
  }));

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Spacer</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Height — {height ?? 40}px</label>
            <input type="range" min="8" max="200" value={height ?? 40}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.height = Number(e.target.value); }, 500)}
              className="w-full accent-[#FF6B35]" />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Width — {maxWidth ?? 100}%</label>
            <input type="range" min="10" max="100" value={maxWidth ?? 100}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.maxWidth = Number(e.target.value); }, 500)}
              className="w-full accent-[#FF6B35]" />
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Line</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Style</label>
            <div className="flex gap-1">
              {(['solid', 'dashed', 'dotted', 'none'] as DividerStyle[]).map((s) => (
                <button key={s} onClick={() => setProp((p: Record<string, unknown>) => { p.lineStyle = s; })}
                  className={`flex-1 py-1 text-[10px] rounded border capitalize transition-colors ${
                    lineStyle === s ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
          {lineStyle !== 'none' && (
            <>
              <div>
                <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Thickness — {lineWidth ?? 1}px</label>
                <input type="range" min="1" max="8" value={lineWidth ?? 1}
                  onChange={(e) => setProp((p: Record<string, unknown>) => { p.lineWidth = Number(e.target.value); }, 500)}
                  className="w-full accent-[#FF6B35]" />
              </div>
              <div>
                <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Color</label>
                <input type="color" value={lineColor ?? '#e5e7eb'}
                  onChange={(e) => setProp((p: Record<string, unknown>) => { p.lineColor = e.target.value; }, 300)}
                  className="w-full h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

Divider.craft = {
  displayName: 'Divider',
  props: {
    height: 40,
    lineColor: '#e5e7eb',
    lineWidth: 1,
    lineStyle: 'solid',
    maxWidth: 100,
  },
  rules: {
    canDrag: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: DividerSettings,
  },
};
