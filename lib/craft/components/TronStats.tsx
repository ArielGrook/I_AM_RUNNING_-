'use client';

import { useNode, useEditor } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React, { useEffect, useRef, useState } from 'react';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

const tokens = {
  dark: {
    bg: '#0a0a0a',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    border: 'rgba(255,255,255,0.08)',
    gridColor: 'rgba(255,255,255,0.03)',
  },
  light: {
    bg: '#ffffff',
    text: '#0a0a0a',
    textSecondary: '#52525b',
    border: 'rgba(0,0,0,0.08)',
    gridColor: 'rgba(0,0,0,0.06)',
  },
};

// Cubic ease-out: 1 - (1-t)^3
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
  hasDividerRight?: boolean;
}

export const StatItem = ({
  value,
  suffix,
  label,
  accentColor,
  colorScheme,
  hasDividerRight = false,
}: StatItemProps) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const t = tokens[colorScheme];
  const rgb = hexToRgb(accentColor ?? '#e11d48');

  const [displayValue, setDisplayValue] = useState(enabled ? value : 0);
  const hasAnimated = useRef(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (enabled) {
      setDisplayValue(value);
      return;
    }
    const el = elRef.current;
    if (!el || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;

        const start = performance.now();
        const duration = 2000;

        const tick = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);
          setDisplayValue(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, value]);

  useEffect(() => {
    if (enabled) setDisplayValue(value);
  }, [enabled, value]);

  return (
    <div
      ref={(ref) => {
        elRef.current = ref;
        if (ref) connect(drag(ref));
      }}
      className={`${isSelected ? 'craft-node-selected' : ''} flex flex-col items-center text-center w-full max-sm:!border-r-0`}
      style={{
        borderRight: hasDividerRight ? `1px solid ${t.border}` : undefined,
        padding: '16px 24px',
        cursor: 'default',
        transition: 'box-shadow 200ms',
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        if (!enabled) e.currentTarget.style.boxShadow = `0 0 30px rgba(${rgb}, 0.15)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 'clamp(48px, 7vw, 80px)',
            fontWeight: 800,
            color: accentColor,
            lineHeight: 1,
          }}
        >
          {displayValue}
        </span>
        <span
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 700,
            color: accentColor,
            opacity: 0.8,
            lineHeight: 1,
          }}
        >
          {suffix}
        </span>
      </div>
      <div
        contentEditable={enabled}
        suppressContentEditableWarning
        onBlur={(e) => setProp((p: Record<string, unknown>) => { p.label = e.currentTarget.textContent ?? ''; }, 1000)}
        dangerouslySetInnerHTML={{ __html: label || '' }}
        className="text-sm sm:text-xs sm:uppercase sm:tracking-widest"
        style={{
          color: t.textSecondary,
          marginTop: 8,
          outline: 'none',
          minWidth: 0,
          width: '100%',
          wordBreak: 'normal',
          overflowWrap: 'break-word',
        }}
      />
    </div>
  );
};

const StatItemSettings = () => {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props) as Record<string, unknown>;
  const value = (props.value as number) ?? 0;
  const suffix = (props.suffix as string) ?? '';
  const label = (props.label as string) ?? '';
  const animationType = (props.animationType as string) ?? 'none';
  const animateDelay = (props.animateDelay as string) ?? '0';

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-4 space-y-3 text-white">
      <div>
        <label className={labelCls}>Value</label>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.value = Number(e.target.value) || 0; }, 500)}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Suffix (max 2)</label>
        <input
          type="text"
          maxLength={2}
          value={suffix}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.suffix = e.target.value.slice(0, 2); }, 500)}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.label = e.target.value; }, 1000)}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Animation type</label>
        <select
          value={animationType}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })}
          className={inputCls}
        >
          <option value="none">None</option>
          <option value="fade-in">Fade In</option>
          <option value="slide-up">Slide Up</option>
          <option value="scale-in">Scale In</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Animation delay</label>
        <select
          value={animateDelay}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })}
          className={inputCls}
        >
          <option value="0">0s</option>
          <option value="0.1">0.1s</option>
          <option value="0.2">0.2s</option>
          <option value="0.5">0.5s</option>
        </select>
      </div>
    </div>
  );
};

StatItem.craft = {
  displayName: 'Stat Item',
  props: {
    value: 0,
    suffix: '',
    label: 'Label',
    accentColor: '#e11d48',
    colorScheme: 'dark' as const,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: StatItemSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// --- Default items ---

const DEFAULT_ITEMS = [
  { value: 150, suffix: '+', label: 'Проектов завершено' },
  { value: 98, suffix: '%', label: 'Довольных клиентов' },
  { value: 3, suffix: 'K', label: 'Часов сэкономлено' },
  { value: 12, suffix: 'M', label: 'Строк кода' },
];

type StatItemData = { value: number; suffix: string; label: string };

// --- TronStats (section) ---

export const TronStats = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  showGrid = true,
  sectionHeight = 75,
  items = DEFAULT_ITEMS,
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  showGrid?: boolean;
  sectionHeight?: number;
  items?: StatItemData[];
}) => {
  const { id: sectionId, connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { query } = useEditor();

  const t = tokens[colorScheme];
  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';
  const backgroundStyle = {
    background: t.bg,
    backgroundImage: gridLines,
    backgroundSize: showGrid ? '50px 50px' : 'auto',
  };

  const getNodeSafe = typeof query?.getNode === 'function' ? query.getNode.bind(query) : () => null;
  const itemCount = Math.max(1, Math.min(6, items?.length ?? 4));

  return (
    <section
      id="stats"
      key={`${colorScheme}-${showGrid}`}
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="stats"
      className={`w-full max-w-full py-20 px-4 sm:px-8 lg:px-16 ${isSelected ? 'craft-node-selected' : ''}`}
      style={{ ...backgroundStyle, minHeight: `${sectionHeight}vh` }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: `${sectionHeight}vh` }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: itemCount }, (_, i) => {
            const statId = `${sectionId}-stat-${i}`;
            const node = getNodeSafe(statId);
            const exists = node != null && node.data?.props;
            const data = items?.[i] ?? DEFAULT_ITEMS[i] ?? DEFAULT_ITEMS[0];
            const hasDividerRight = i % 4 !== 3;
            const itemProps = exists
              ? { ...node.data.props, accentColor, colorScheme, hasDividerRight }
              : {
                  value: data.value,
                  suffix: data.suffix,
                  label: data.label,
                  accentColor,
                  colorScheme,
                  animationType: 'none',
                  animateDelay: '0',
                  hasDividerRight,
                };
            return (
              <Element
                key={statId}
                id={statId}
                is={StatItem}
                canvas
                {...itemProps}
              />
            );
          })}
        </div>
      </div>
      </div>
    </section>
  );
};

const TronStatsSettings = () => {
  const { actions: { setProp } } = useNode();
  const { items = DEFAULT_ITEMS, colorScheme, accentColor, showGrid, sectionHeight } = useNode((node) => ({
    items: node.data.props.items as StatItemData[] | undefined,
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    showGrid: node.data.props.showGrid as boolean,
    sectionHeight: (node.data.props.sectionHeight as number) ?? 75,
  }));

  const setT = (key: string, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const currentItems = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const canAdd = currentItems.length < 6;
  const canRemove = currentItems.length > 1;

  const addItem = () => {
    if (!canAdd) return;
    setProp(
      (p: Record<string, unknown>) => {
        const list = (p.items as StatItemData[]) ?? DEFAULT_ITEMS;
        p.items = [...list, { value: 0, suffix: '', label: 'New stat' }];
      },
      0
    );
  };

  const removeItem = () => {
    if (!canRemove) return;
    setProp(
      (p: Record<string, unknown>) => {
        const list = (p.items as StatItemData[]) ?? DEFAULT_ITEMS;
        p.items = list.slice(0, -1);
      },
      0
    );
  };

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Color scheme</label>
            <select
              value={colorScheme ?? 'dark'}
              onChange={(e) => setT('colorScheme', 300)(e.target.value)}
              className={inputCls}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={`${labelCls} shrink-0 w-20`}>Accent</label>
            <input
              type="color"
              value={accentColor ?? '#e11d48'}
              onChange={(e) => setT('accentColor', 300)(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#a1a1aa', fontSize: 12 }}>Show Grid</label>
            <input
              type="checkbox"
              checked={showGrid ?? true}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#a1a1aa' }}>Высота секции: {sectionHeight ?? 75}vh</label>
            <input type="range" min={50} max={100} step={5} value={sectionHeight ?? 75} onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 500)} style={{ width: '100%' }} />
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Items</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addItem}
            disabled={!canAdd}
            className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555] disabled:opacity-50 transition-all"
          >
            + Add
          </button>
          <button
            type="button"
            onClick={removeItem}
            disabled={!canRemove}
            className="px-2 py-1.5 text-xs rounded bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50 transition-all"
          >
            × Remove
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">{currentItems.length} / 6 items</p>
      </section>
    </div>
  );
};

TronStats.craft = {
  displayName: 'Tron Stats',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    showGrid: true,
    sectionHeight: 75,
    items: DEFAULT_ITEMS,
    'data-block-type': 'stats',
  },
  related: { settings: TronStatsSettings },
  custom: {
    styleTags: ['dark', 'neon', 'bold'],
    businessTags: ['startup', 'saas', 'tech'],
    featureTags: ['stats', 'counters'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
