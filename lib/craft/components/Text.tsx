'use client';

import { useNode } from '@craftjs/core';
import ContentEditable from 'react-contenteditable';
import React, { useState, useEffect } from 'react';

const FONT_FAMILIES = [
  { value: 'inherit', label: 'Default' },
  { value: "'Inter', system-ui, sans-serif", label: 'Inter' },
  { value: "'Space Grotesk', monospace", label: 'Space Grotesk' },
  { value: "'Georgia', serif", label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Courier' },
  { value: "system-ui, sans-serif", label: 'System' },
];

export const Text = ({
  text = 'Click to edit',
  fontSize = 16,
  fontWeight = '400',
  fontFamily = 'inherit',
  lineHeight = 1.5,
  letterSpacing = 0,
  textAlign = 'left',
  color = 'var(--palette-text, #000000)',
}: {
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  color?: string;
}) => {
  const {
    connectors: { connect, drag },
    actions: { setProp },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const [editable, setEditable] = useState(false);

  useEffect(() => {
    if (!selected) setEditable(false);
  }, [selected]);

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onDoubleClick={(e) => {
        if (selected) {
          e.stopPropagation();
          setEditable(true);
        }
      }}
      className={editable ? 'craft-inline-editing' : ''}
    >
      <ContentEditable
        disabled={!editable}
        html={text ?? 'Click to edit'}
        onChange={(e) =>
          setProp((props: Record<string, unknown>) => {
            props.text = (e.target as { value: string }).value.replace(
              /<\/?[^>]+(>|$)/g,
              ''
            );
          }, 1000)
        }
        tagName="p"
        style={{
          fontSize: `${fontSize ?? 16}px`,
          fontWeight: fontWeight ?? '400',
          fontFamily: fontFamily ?? 'inherit',
          lineHeight: lineHeight ?? 1.5,
          letterSpacing: `${letterSpacing ?? 0}px`,
          textAlign: (textAlign as React.CSSProperties['textAlign']) ?? 'left',
          color: color ?? '#000000',
          outline: 'none',
          cursor: editable ? 'text' : 'default',
          userSelect: editable ? 'text' : 'none',
          margin: 0,
        }}
      />
      {selected && !editable && (
        <div style={{
          position: 'absolute',
          bottom: -18,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 9,
          color: '#FF6B35',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: 0.7,
          fontFamily: 'system-ui',
        }}>
          Double-click to edit
        </div>
      )}
    </div>
  );
};

const TextSettings = () => {
  const {
    actions: { setProp },
    fontSize, fontWeight, fontFamily, lineHeight, letterSpacing, textAlign, color,
  } = useNode((node) => ({
    fontSize:      node.data.props.fontSize as number,
    fontWeight:    node.data.props.fontWeight as string,
    fontFamily:    node.data.props.fontFamily as string,
    lineHeight:    node.data.props.lineHeight as number,
    letterSpacing: node.data.props.letterSpacing as number,
    textAlign:     node.data.props.textAlign as string,
    color:         node.data.props.color as string,
  }));

  const set = (key: string) => (val: string | number) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; });
  const setT = (key: string, ms: number) => (val: string | number) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  return (
    <div className="p-3 space-y-5 text-white">
      {/* Typography */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Typography</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Font Family</label>
            <select value={fontFamily ?? 'inherit'} onChange={(e) => set('fontFamily')(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white">
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Font Size — {fontSize ?? 16}px
            </label>
            <input type="range" min="10" max="96" value={fontSize ?? 16}
              onChange={(e) => setT('fontSize', 500)(Number(e.target.value))}
              className="w-full accent-[#FF6B35]" />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Weight</label>
            <div className="flex gap-1">
              {['300', '400', '500', '600', '700', '800'].map((w) => (
                <button key={w} onClick={() => set('fontWeight')(w)}
                  className={`flex-1 py-1 text-[10px] rounded border transition-colors ${
                    fontWeight === w ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}>{w}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Align</label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map((a) => (
                <button key={a} onClick={() => set('textAlign')(a)}
                  className={`flex-1 py-1 text-xs rounded border capitalize transition-colors ${
                    textAlign === a ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}>{a}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Spacing</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Line Height — {(lineHeight ?? 1.5).toFixed(1)}
            </label>
            <input type="range" min="0.8" max="3" step="0.1" value={lineHeight ?? 1.5}
              onChange={(e) => setT('lineHeight', 500)(Number(e.target.value))}
              className="w-full accent-[#FF6B35]" />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Letter Spacing — {letterSpacing ?? 0}px
            </label>
            <input type="range" min="-2" max="10" step="0.5" value={letterSpacing ?? 0}
              onChange={(e) => setT('letterSpacing', 500)(Number(e.target.value))}
              className="w-full accent-[#FF6B35]" />
          </div>
        </div>
      </section>

      {/* Color */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Color</h3>
        <div className="flex gap-2 items-center">
          <input type="color"
            value={color?.startsWith('var') ? '#000000' : (color ?? '#000000')}
            onChange={(e) => setT('color', 300)(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0" />
          <span className="text-xs text-gray-400 font-mono truncate">{color}</span>
        </div>
        <div className="flex gap-1 mt-2">
          {['var(--palette-text)', 'var(--palette-primary)', '#ffffff', '#000000'].map((c) => (
            <button key={c} onClick={() => set('color')(c)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                color === c ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-gray-600 text-gray-400 hover:border-gray-400'
              }`}>{c.replace('var(--palette-', '').replace(')', '')}</button>
          ))}
        </div>
      </section>
    </div>
  );
};

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Click to edit',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: 'left',
    color: 'var(--palette-text, #000000)',
  },
  rules: {
    canDrag: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: TextSettings,
  },
};
