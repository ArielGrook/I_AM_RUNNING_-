'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';

function useCountUp(target: string, duration: number = 2000, isVisible: boolean = true) {
  const [display, setDisplay] = React.useState('0');

  React.useEffect(() => {
    if (!isVisible) return;

    const match = target.match(/(\d+)/);
    if (!match) {
      setDisplay(target);
      return;
    }

    const end = parseInt(match[1], 10);
    const numStr = match[0];
    const idx = target.indexOf(numStr);
    const prefix = target.slice(0, idx);
    const suffix = target.slice(idx + numStr.length);

    if (end === 0) {
      setDisplay(target);
      return;
    }

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * end);
      setDisplay(`${prefix}${current}${suffix}`);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, isVisible]);

  return display;
}

function useInView(threshold: number = 0.3) {
  const [inView, setInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

interface StatItemDisplayProps {
  value: string;
  label: string;
  prefix?: string;
  accentColor: string;
  textSecondary: string;
  delay?: number;
  enabled: boolean;
  index: number;
  onSaveValue: (val: string) => void;
  onSaveLabel: (val: string) => void;
}

function StatItemDisplay({ value, label, prefix, accentColor, textSecondary, delay = 0, enabled, index, onSaveValue, onSaveLabel }: StatItemDisplayProps) {
  const { ref, inView } = useInView();
  const shouldAnimate = !enabled && inView;
  const fullValue = (prefix && prefix !== '' ? prefix : '') + value;
  const displayValue = useCountUp(fullValue, 2000, shouldAnimate);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center text-center px-4 py-6"
      style={{
        opacity: enabled ? 1 : (inView ? 1 : 0),
        transform: enabled ? 'none' : (inView ? 'translateY(0)' : 'translateY(20px)'),
        transition: enabled ? 'none' : `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div
        style={{
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 700,
          lineHeight: 1,
          color: accentColor,
          marginBottom: 8,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {enabled ? (
          <EditableText
            value={fullValue}
            fieldKey={`stat-${index}-value`}
            tag="span"
            style={{ color: accentColor }}
            enabled={enabled}
            onSave={(val) => {
              const prefixPart = prefix && prefix !== '' ? prefix : '';
              const valOnly = prefixPart && val.startsWith(prefixPart) ? val.slice(prefixPart.length) : val;
              onSaveValue(valOnly);
            }}
          />
        ) : (
          displayValue
        )}
      </div>
      <div
        style={{
          fontSize: 14,
          color: textSecondary,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {enabled ? (
          <EditableText
            value={label}
            fieldKey={`stat-${index}-label`}
            tag="span"
            style={{ color: textSecondary }}
            enabled={enabled}
            onSave={onSaveLabel}
          />
        ) : (
          label
        )}
      </div>
    </div>
  );
}

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
  darkBg?: string;
  lightBg?: string;
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
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const props = useNode((node) => node.data.props as Partial<TronStatsProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 60,
    showGrid = true,
    columns = 4,
    items = DEFAULT_ITEMS,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'light';
  const t = {
    ...tokens[scheme],
    accent: accentColor,
    bg: scheme === 'dark' ? (darkBg ?? '#0a0a0a') : (lightBg ?? '#ffffff'),
  };

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const animAttrs = !enabled && animationType !== 'none'
    ? { 'data-animate': animationType, 'data-animate-delay': animateDelay }
    : {};

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      key={`${scheme}-${showGrid}`}
      id="stats"
      data-block-type="stats"
      className={`w-full max-w-full py-20 px-4 sm:px-8 lg:px-16 flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: showGrid ? '50px 50px' : 'auto',
        minHeight: `${sectionHeight}vh`,
      }}
    >
      <div
        className="max-w-6xl mx-auto w-full"
        {...animAttrs}
      >
        <div className={COLUMNS_CLASS[columns] ?? COLUMNS_CLASS[4]}>
          {list.map((item, i) => (
            <StatItemDisplay
              key={i}
              value={item.value}
              label={item.label}
              prefix={item.prefix}
              accentColor={t.accent}
              textSecondary={t.textSecondary}
              delay={i * 150}
              enabled={enabled}
              index={i}
              onSaveValue={(val) => setProp((p: Record<string, unknown>) => {
                const stats = [...((p.items as StatItem[]) ?? [])];
                stats[i] = { ...stats[i], value: val };
                p.items = stats;
              }, 0)}
              onSaveLabel={(val) => setProp((p: Record<string, unknown>) => {
                const stats = [...((p.items as StatItem[]) ?? [])];
                stats[i] = { ...stats[i], label: val };
                p.items = stats;
              }, 0)}
            />
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
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    animationType = 'none',
    animateDelay = '0',
  } = useNode((node) => ({
    items: (node.data.props.items as StatItem[]) ?? DEFAULT_ITEMS,
    columns: (node.data.props.columns as 2 | 3 | 4) ?? 4,
    sectionHeight: (node.data.props.sectionHeight as number) ?? 60,
    showGrid: (node.data.props.showGrid as boolean) ?? true,
    darkBg: (node.data.props.darkBg as string) ?? '#0a0a0a',
    lightBg: (node.data.props.lightBg as string) ?? '#ffffff',
    animationType: (node.data.props.animationType as string) ?? 'none',
    animateDelay: (node.data.props.animateDelay as string) ?? '0',
  }));

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
    <div className="p-3 space-y-0">
      {/* CONTENT */}
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Content</h3>
        <div className="space-y-4">
          {list.map((item, i) => (
            <div
              key={i}
              style={{
                background: 'var(--settings-card-bg, rgba(0,0,0,0.03))',
                border: '1px solid var(--settings-border, rgba(0,0,0,0.08))',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
              className="space-y-2"
            >
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

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={darkBg ?? '#0a0a0a'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{darkBg ?? '#0a0a0a'}</span>
          </div>
          <label className={labelCls} style={{ marginTop: 12 }}>Background (light mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={lightBg ?? '#ffffff'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{lightBg ?? '#ffffff'}</span>
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className={sectionCls}>
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
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Size</h3>
        <div>
          <label className={labelCls}>Section height: {sectionHeight}vh</label>
          <input
            type="range"
            min={40}
            max={100}
            step={5}
            value={sectionHeight}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)}
            className="settings-slider"
          />
        </div>
      </div>

      {/* DISPLAY */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Display</h3>
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
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Animation</h3>
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
    colorScheme: 'light',
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
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
      className={`flex flex-col items-center text-center w-full ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        padding: '16px 24px',
        cursor: 'default',
        minWidth: 0,
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
(StatItem as unknown as { craft: { displayName: string; props: Record<string, unknown>; rules: Record<string, () => boolean> } }).craft = {
  displayName: 'Stat Item',
  props: { value: 0, suffix: '', label: 'Label', accentColor: '#FF6B35', colorScheme: 'light' as const },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
