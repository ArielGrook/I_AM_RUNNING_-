'use client';

import { useNode } from '@craftjs/core';
import React from 'react';

// ── Icon-button toggle helper ──────────────────────────
function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; icon: string; title: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">{label}</label>
      <div className="flex gap-1 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-all ${
              value === opt.value
                ? 'bg-[#FF6B35] text-white shadow-sm'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
            }`}
          >
            {opt.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export const Container = ({
  children,
  background = 'var(--palette-bg, #ffffff)',
  padding = 20,
  margin = 0,
  flexDirection = 'column',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  gap = 0,
  flexWrap = 'nowrap',
  borderRadius = 0,
  borderWidth = 0,
  borderColor = '#e5e7eb',
  shadow = 'none',
  dataAnimate = '',
  dataAnimateType = '',
  dataAnimateDelay = '',
}: {
  children?: React.ReactNode;
  background?: string;
  padding?: number;
  margin?: number;
  flexDirection?: React.CSSProperties['flexDirection'];
  justifyContent?: React.CSSProperties['justifyContent'];
  alignItems?: React.CSSProperties['alignItems'];
  gap?: number;
  flexWrap?: React.CSSProperties['flexWrap'];
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: string;
  dataAnimate?: string;
  dataAnimateType?: string;
  dataAnimateDelay?: string;
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const SHADOWS: Record<string, string> = {
    none: 'none',
    sm: '0 1px 3px rgba(0,0,0,0.1)',
    md: '0 4px 12px rgba(0,0,0,0.1)',
    lg: '0 10px 30px rgba(0,0,0,0.15)',
    xl: '0 20px 50px rgba(0,0,0,0.2)',
  };

  // Build GSAP data attributes (preserved for future animations)
  const dataAttrs: Record<string, string> = {};
  if (dataAnimate) dataAttrs['data-animate'] = dataAnimate;
  if (dataAnimateType) dataAttrs['data-animate-type'] = dataAnimateType;
  if (dataAnimateDelay) dataAttrs['data-animate-delay'] = dataAnimateDelay;

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      style={{
        background,
        padding: `${padding}px`,
        margin: `${margin}px`,
        minHeight: '100px',
        display: 'flex',
        flexDirection,
        justifyContent,
        alignItems,
        gap: `${gap}px`,
        flexWrap,
        borderRadius: `${borderRadius}px`,
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
        boxShadow: SHADOWS[shadow] ?? 'none',
      }}
    >
      {children}
    </div>
  );
};

const DIRECTION_OPTS = [
  { value: 'column',         icon: '↓', title: 'Column' },
  { value: 'row',            icon: '→', title: 'Row' },
  { value: 'column-reverse', icon: '↑', title: 'Column Reverse' },
  { value: 'row-reverse',    icon: '←', title: 'Row Reverse' },
] as const;

const JUSTIFY_OPTS = [
  { value: 'flex-start',    icon: '⇤',  title: 'Start' },
  { value: 'center',        icon: '⇔',  title: 'Center' },
  { value: 'flex-end',      icon: '⇥',  title: 'End' },
  { value: 'space-between', icon: '↔',  title: 'Space Between' },
  { value: 'space-around',  icon: '⟺', title: 'Space Around' },
  { value: 'space-evenly',  icon: '≡',  title: 'Space Evenly' },
] as const;

const ALIGN_OPTS = [
  { value: 'stretch',    icon: '⇕',  title: 'Stretch' },
  { value: 'flex-start', icon: '⤒',  title: 'Start' },
  { value: 'center',     icon: '⊕',  title: 'Center' },
  { value: 'flex-end',   icon: '⤓',  title: 'End' },
  { value: 'baseline',   icon: '⌇',  title: 'Baseline' },
] as const;

const WRAP_OPTS = [
  { value: 'nowrap',       icon: '—',  title: 'No Wrap' },
  { value: 'wrap',         icon: '↩',  title: 'Wrap' },
  { value: 'wrap-reverse', icon: '↪',  title: 'Wrap Reverse' },
] as const;

const ContainerSettings = () => {
  const {
    actions: { setProp },
    background,
    padding,
    margin,
    flexDirection,
    justifyContent,
    alignItems,
    gap,
    flexWrap,
    borderRadius,
    borderWidth,
    borderColor,
    shadow,
  } = useNode((node) => ({
    background:     node.data.props.background as string,
    padding:        node.data.props.padding as number,
    margin:         node.data.props.margin as number,
    flexDirection:  node.data.props.flexDirection as string,
    justifyContent: node.data.props.justifyContent as string,
    alignItems:     node.data.props.alignItems as string,
    gap:            node.data.props.gap as number,
    flexWrap:       node.data.props.flexWrap as string,
    borderRadius:   node.data.props.borderRadius as number,
    borderWidth:    node.data.props.borderWidth as number,
    borderColor:    node.data.props.borderColor as string,
    shadow:         node.data.props.shadow as string,
  }));

  const set = <K extends string>(key: K) =>
    (val: string | number) =>
      setProp((p: Record<string, unknown>) => { p[key] = val; });

  const setThrottled = <K extends string>(key: K, ms: number) =>
    (val: string | number) =>
      setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  return (
    <div className="p-3 space-y-5 text-white">

      {/* ── Layout ── */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Layout
        </h3>
        <div className="space-y-3">
          <ToggleGroup
            label="Direction"
            options={DIRECTION_OPTS as unknown as { value: string; icon: string; title: string }[]}
            value={flexDirection ?? 'column'}
            onChange={set('flexDirection')}
          />
          <ToggleGroup
            label="Justify"
            options={JUSTIFY_OPTS as unknown as { value: string; icon: string; title: string }[]}
            value={justifyContent ?? 'flex-start'}
            onChange={set('justifyContent')}
          />
          <ToggleGroup
            label="Align"
            options={ALIGN_OPTS as unknown as { value: string; icon: string; title: string }[]}
            value={alignItems ?? 'stretch'}
            onChange={set('alignItems')}
          />
          <ToggleGroup
            label="Wrap"
            options={WRAP_OPTS as unknown as { value: string; icon: string; title: string }[]}
            value={flexWrap ?? 'nowrap'}
            onChange={set('flexWrap')}
          />
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Gap — {gap ?? 0}px
            </label>
            <input
              type="range" min="0" max="80" value={gap ?? 0}
              onChange={(e) => setThrottled('gap', 500)(Number(e.target.value))}
              className="w-full accent-[#FF6B35]"
            />
          </div>
        </div>
      </section>

      {/* ── Spacing ── */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Spacing
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Padding — {padding ?? 20}px
            </label>
            <input
              type="range" min="0" max="120" value={padding ?? 20}
              onChange={(e) => setThrottled('padding', 500)(Number(e.target.value))}
              className="w-full accent-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Margin — {margin ?? 0}px
            </label>
            <input
              type="range" min="0" max="120" value={margin ?? 0}
              onChange={(e) => setThrottled('margin', 500)(Number(e.target.value))}
              className="w-full accent-[#FF6B35]"
            />
          </div>
        </div>
      </section>

      {/* ── Border & Shadow ── */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Border & Shadow</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Border Radius — {borderRadius ?? 0}px
            </label>
            <input type="range" min="0" max="50" value={borderRadius ?? 0}
              onChange={(e) => setThrottled('borderRadius', 500)(Number(e.target.value))}
              className="w-full accent-[#FF6B35]" />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Border Width — {borderWidth ?? 0}px
            </label>
            <input type="range" min="0" max="8" value={borderWidth ?? 0}
              onChange={(e) => setThrottled('borderWidth', 500)(Number(e.target.value))}
              className="w-full accent-[#FF6B35]" />
          </div>
          {(borderWidth ?? 0) > 0 && (
            <div>
              <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Border Color</label>
              <input type="color" value={borderColor ?? '#e5e7eb'}
                onChange={(e) => setThrottled('borderColor', 300)(e.target.value)}
                className="w-full h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
            </div>
          )}
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Shadow</label>
            <div className="flex gap-1">
              {['none', 'sm', 'md', 'lg', 'xl'].map((s) => (
                <button key={s} onClick={() => set('shadow')(s)}
                  className={`flex-1 py-1 text-[10px] rounded border uppercase transition-colors ${
                    shadow === s ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Colors ── */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Colors
        </h3>
        <div>
          <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
            Background
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={background?.startsWith('var') ? '#ffffff' : (background ?? '#ffffff')}
              onChange={(e) => setThrottled('background', 300)(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <input
              type="text"
              value={background ?? '#ffffff'}
              onChange={(e) => setThrottled('background', 300)(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white font-mono"
              placeholder="var(--palette-bg) or #hex"
            />
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {[
              'var(--palette-bg)',
              'var(--palette-primary)',
              'var(--palette-secondary)',
              'transparent',
            ].map((v) => (
              <button
                key={v}
                onClick={() => set('background')(v)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                  background === v
                    ? 'border-[#FF6B35] text-[#FF6B35]'
                    : 'border-gray-600 text-gray-400 hover:border-gray-400'
                }`}
              >
                {v.replace('var(--palette-', '').replace(')', '')}
              </button>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    background: 'var(--palette-bg, #ffffff)',
    padding: 20,
    margin: 0,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 0,
    flexWrap: 'nowrap',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#e5e7eb',
    shadow: 'none',
    dataAnimate: '',
    dataAnimateType: '',
    dataAnimateDelay: '',
  },
  rules: {
    canDrop: () => true,
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: ContainerSettings,
  },
};
