'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';

const tokens = {
  dark: {
    bg: '#0a0a0a',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    border: 'rgba(255,255,255,0.08)',
    cardBg: 'rgba(255,255,255,0.03)',
    gridColor: 'rgba(255,255,255,0.03)',
  },
  light: {
    bg: '#ffffff',
    text: '#0a0a0a',
    textSecondary: '#52525b',
    border: 'rgba(0,0,0,0.08)',
    cardBg: 'rgba(0,0,0,0.02)',
    gridColor: 'rgba(0,0,0,0.06)',
  },
};

export interface StatItem {
  value: string;
  label: string;
  prefix?: string;
}

export interface TronStatsProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  columns?: 2 | 3 | 4;
  items?: StatItem[];
  animationType?: string;
  animateDelay?: string;
}

const DEFAULT_ITEMS: StatItem[] = [
  { value: '500+', label: 'Happy clients' },
  { value: '99%', label: 'Uptime SLA' },
  { value: '24/7', label: 'Support' },
  { value: '3x', label: 'Faster delivery', prefix: '' },
];

const COLUMNS_CLASS = {
  2: 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-8',
  3: 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8',
  4: 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8',
} as const;

export const TronStats = React.memo(function TronStats() {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const props = useNode((node) => node.data.props as Partial<TronStatsProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    sectionHeight = 60,
    showGrid = true,
    columns = 4,
    items = DEFAULT_ITEMS,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'dark';
  const t = { ...tokens[scheme], accent: accentColor };

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      key={`${scheme}-${showGrid}`}
      data-block-type="stats"
      data-animate={!enabled && animationType !== 'none' ? animationType : undefined}
      data-animate-delay={!enabled && animationType !== 'none' ? animateDelay : undefined}
      className={`w-full max-w-full py-20 px-4 sm:px-8 lg:px-16 flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: showGrid ? '50px 50px' : 'auto',
        minHeight: `${sectionHeight}vh`,
      }}
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className={COLUMNS_CLASS[columns] ?? COLUMNS_CLASS[4]}>
          {list.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center w-full max-sm:!border-r-0"
              style={{
                borderRight: i < list.length - 1 ? `1px solid ${t.border}` : undefined,
                padding: '16px 24px',
                cursor: 'default',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 2,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  fontSize: 'clamp(36px, 5vw, 64px)',
                  fontWeight: 700,
                  color: accentColor,
                  lineHeight: 1,
                }}
              >
                {item.prefix != null && item.prefix !== '' && (
                  <span style={{ fontSize: '0.6em' }}>{item.prefix}</span>
                )}
                <span>{item.value}</span>
              </div>
              <div
                style={{
                  color: t.textSecondary,
                  fontSize: 14,
                  marginTop: 8,
                  minWidth: 0,
                  width: '100%',
                  wordBreak: 'break-word',
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

function TronStatsSettings() {
  const { actions: { setProp } } = useNode();
  const {
    items = DEFAULT_ITEMS,
    columns = 4,
    sectionHeight = 60,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = useNode((node) => ({
    items: (node.data.props.items as StatItem[]) ?? DEFAULT_ITEMS,
    columns: (node.data.props.columns as 2 | 3 | 4) ?? 4,
    sectionHeight: (node.data.props.sectionHeight as number) ?? 60,
    showGrid: (node.data.props.showGrid as boolean) ?? true,
    animationType: (node.data.props.animationType as string) ?? 'none',
    animateDelay: (node.data.props.animateDelay as string) ?? '0',
  }));

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const canAdd = list.length < 8;
  const canRemove = list.length > 1;

  const updateItem = (index: number, field: keyof StatItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as StatItem[]) ?? [])];
      arr[index] = { ...arr[index], [field]: value };
      p.items = arr;
    }, 500);
  };

  const addItem = () => {
    if (!canAdd) return;
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.items as StatItem[]) ?? []), { value: '0', label: 'New stat' }];
      p.items = arr;
    }, 0);
  };

  const removeItem = () => {
    if (!canRemove) return;
    setProp((p: Record<string, unknown>) => {
      const arr = ((p.items as StatItem[]) ?? []).slice(0, -1);
      p.items = arr;
    }, 0);
  };

  return (
    <div className="p-3 space-y-0 text-white">
      {/* CONTENT */}
      <div className="border-t border-gray-700 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-4">
          {list.map((item, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/50 space-y-2">
              <div>
                <label className={labelCls}>Value</label>
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => updateItem(i, 'value', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Label</label>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateItem(i, 'label', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Prefix</label>
                <input
                  type="text"
                  value={item.prefix ?? ''}
                  onChange={(e) => updateItem(i, 'prefix', e.target.value)}
                  placeholder="$"
                  className={inputCls}
                />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addItem}
              disabled={!canAdd}
              className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555] disabled:opacity-50"
            >
              + Add
            </button>
            <button
              type="button"
              onClick={removeItem}
              disabled={!canRemove}
              className="px-2 py-1.5 text-xs rounded bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50"
            >
              × Remove
            </button>
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div>
          <label className={labelCls}>Columns</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setProp((p: Record<string, unknown>) => { p.columns = n; })}
                style={{
                  flex: 1,
                  padding: '4px 0',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: columns === n ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                  background: columns === n ? 'rgba(255,107,53,0.15)' : 'transparent',
                  color: columns === n ? '#FF6B35' : '#a1a1aa',
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SIZE */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Size</h3>
        <div>
          <label className={labelCls}>Section height: {sectionHeight}vh</label>
          <input
            type="range"
            min={40}
            max={100}
            step={5}
            value={sectionHeight}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)}
            className="w-full"
          />
        </div>
      </div>

      {/* DISPLAY */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Display</h3>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })}
            className="rounded border-gray-600 bg-gray-700"
          />
          Show grid
        </label>
      </div>

      {/* ANIMATION */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Type</label>
            <select
              value={animationType}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })}
              className={inputCls}
            >
              <option value="none">none</option>
              <option value="fade-in">fade-in</option>
              <option value="slide-up">slide-up</option>
              <option value="slide-down">slide-down</option>
              <option value="slide-left">slide-left</option>
              <option value="slide-right">slide-right</option>
              <option value="scale-in">scale-in</option>
              <option value="blur-in">blur-in</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay</label>
            <select
              value={animateDelay}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })}
              className={inputCls}
            >
              <option value="0">0</option>
              <option value="0.1">0.1</option>
              <option value="0.2">0.2</option>
              <option value="0.3">0.3</option>
              <option value="0.5">0.5</option>
              <option value="0.8">0.8</option>
              <option value="1">1</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

const tronStatsCraft = {
  displayName: 'Tron Stats',
  props: {
    colorScheme: 'dark',
    accentColor: '#FF6B35',
    sectionHeight: 60,
    showGrid: true,
    columns: 4 as const,
    animationType: 'none',
    animateDelay: '0',
    items: DEFAULT_ITEMS,
  },
  related: { settings: TronStatsSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['saas', 'startup', 'agency'],
    featureTags: ['stats'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronStats as unknown as { craft: typeof tronStatsCraft }).craft = tronStatsCraft;

/** Minimal StatItem for backward compatibility with pages that have StatItem nodes. */
export const StatItem = React.memo(function StatItem(props: { value?: number; suffix?: string; label?: string; accentColor?: string; colorScheme?: 'dark' | 'light' }) {
  const { value = 0, suffix = '', label = '', accentColor = '#FF6B35', colorScheme = 'dark' } = props;
  const t = tokens[colorScheme];
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`flex flex-col items-center text-center w-full max-sm:!border-r-0 ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        padding: '16px 24px',
        cursor: 'default',
        minWidth: 0,
        borderRight: `1px solid ${t.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, color: accentColor, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 'clamp(22px, 3vw, 38px)', fontWeight: 700, color: accentColor, opacity: 0.8, lineHeight: 1 }}>{suffix}</span>
      </div>
      <div style={{ color: t.textSecondary, fontSize: 14, marginTop: 8 }}>{label}</div>
    </div>
  );
});
StatItem.craft = {
  displayName: 'Stat Item',
  props: { value: 0, suffix: '', label: 'Label', accentColor: '#FF6B35', colorScheme: 'dark' as const },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
