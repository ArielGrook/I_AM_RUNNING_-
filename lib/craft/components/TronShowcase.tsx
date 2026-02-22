'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

const tokens = {
  dark: {
    bg: '#0a0a0a',
    bgSecondary: '#111111',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    border: 'rgba(255,255,255,0.08)',
    gridColor: 'rgba(255,255,255,0.03)',
  },
  light: {
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    text: '#0a0a0a',
    textSecondary: '#52525b',
    border: 'rgba(0,0,0,0.08)',
    gridColor: 'rgba(0,0,0,0.06)',
  },
};

export interface Tab {
  id: string;
  tabTitle: string;
  contentTitle: string;
  contentText: string;
}

export interface TronShowcaseProps {
  tabs?: Tab[];
  sectionLabel?: string;
  tabsPosition?: 'left' | 'right';
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  showGrid?: boolean;
}

const DEFAULT_TABS: Tab[] = [
  { id: '1', tabTitle: 'Преимущества', contentTitle: 'Почему выбирают нас', contentText: 'Мы создаём решения которые работают на результат. Качество, скорость и надёжность — основа каждого проекта.' },
  { id: '2', tabTitle: 'Цены', contentTitle: 'Прозрачные тарифы', contentText: 'Никаких скрытых платежей. Гибкие пакеты под любой бюджет. Платишь только за результат.' },
  { id: '3', tabTitle: 'Опыт', contentTitle: '5 лет на рынке', contentText: 'За это время реализованы десятки проектов в разных нишах. Каждый проект — новый опыт.' },
];

export const TronShowcase = ({
  tabs = DEFAULT_TABS,
  sectionLabel = 'ЧТО МЫ ПРЕДЛАГАЕМ',
  tabsPosition = 'right',
  colorScheme = 'dark',
  accentColor = '#e11d48',
  showGrid = true,
}: TronShowcaseProps) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const effectiveTabs = (tabs && tabs.length > 0) ? tabs : DEFAULT_TABS;
  const [activeId, setActiveId] = useState<string>(effectiveTabs[0]?.id ?? '1');
  const [visible, setVisible] = useState(true);
  const prevIdRef = useRef(activeId);

  useEffect(() => {
    if (!effectiveTabs.some((t) => t.id === activeId)) {
      setActiveId(effectiveTabs[0]?.id ?? '1');
    }
  }, [effectiveTabs, activeId]);

  useEffect(() => {
    if (prevIdRef.current === activeId) return;
    setVisible(false);
    const t = setTimeout(() => {
      prevIdRef.current = activeId;
      setVisible(true);
    }, 180);
    return () => clearTimeout(t);
  }, [activeId]);

  const updateTab = (id: string, field: keyof Tab, value: string) => {
    setProp(
      (p: TronShowcaseProps) => {
        const list = p.tabs ?? DEFAULT_TABS;
        const idx = list.findIndex((tab) => tab.id === id);
        if (idx >= 0) {
          const next = [...list];
          next[idx] = { ...next[idx], [field]: value };
          p.tabs = next;
        }
      },
      500
    );
  };

  const t = tokens[colorScheme];
  const rgb = hexToRgb(accentColor);
  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const activeTab = effectiveTabs.find((tab) => tab.id === activeId) ?? effectiveTabs[0];

  const tabsPanel = (
    <div
      className="w-full md:w-[35%] flex-shrink-0 flex flex-col order-1 md:order-none craft-showcase-tabs-scroll overflow-x-auto md:overflow-visible"
      style={{
        background: t.bgSecondary,
        borderLeft: tabsPosition === 'right' ? `1px solid ${t.border}` : 'none',
        borderRight: tabsPosition === 'left' ? `1px solid ${t.border}` : 'none',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div style={{ padding: '32px 32px 16px', fontSize: 11, letterSpacing: '0.15em', color: accentColor, textTransform: 'uppercase' }}>
        {sectionLabel}
      </div>
      <div className="flex flex-row md:flex-col flex-shrink-0">
        {effectiveTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className="shrink-0 min-w-[120px] md:min-w-0 md:w-full md:!border-b-0"
            style={{
              padding: '20px 32px',
              textAlign: 'left',
              width: '100%',
              border: 'none',
              borderLeft: tabsPosition === 'right' ? `2px solid ${activeId === tab.id ? accentColor : 'transparent'}` : 'none',
              borderRight: tabsPosition === 'left' ? `2px solid ${activeId === tab.id ? accentColor : 'transparent'}` : 'none',
              borderBottom: `2px solid ${activeId === tab.id ? accentColor : 'transparent'}`,
              background: activeId === tab.id ? `rgba(${rgb}, 0.06)` : 'transparent',
              color: activeId === tab.id ? accentColor : t.textSecondary,
              fontWeight: activeId === tab.id ? 600 : 400,
              fontSize: 15,
              transition: 'all 200ms ease',
              cursor: 'pointer',
            }}
          >
            {tab.tabTitle}
          </button>
        ))}
      </div>
    </div>
  );

  const contentPanel = (
    <div
      className="flex-1 flex flex-col justify-center order-2 md:order-none min-h-[60vh] md:min-h-0"
      style={{
        padding: 'clamp(32px, 5vw, 80px)',
      }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 250ms ease, transform 250ms ease',
        }}
      >
        <span
          style={{
            fontSize: 11,
            padding: '3px 10px',
            border: `1px solid rgba(${rgb}, 0.3)`,
            background: `rgba(${rgb}, 0.08)`,
            color: accentColor,
            letterSpacing: '0.08em',
            borderRadius: 2,
            display: 'inline-block',
            marginBottom: 24,
          }}
        >
          {activeTab?.tabTitle ?? ''}
        </span>

        <div
          contentEditable={enabled}
          suppressContentEditableWarning
          onBlur={(e) => updateTab(activeId, 'contentTitle', e.currentTarget.textContent ?? '')}
          dangerouslySetInnerHTML={{ __html: activeTab?.contentTitle ?? '' }}
          style={{
            fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 800,
            color: t.text,
            marginTop: 24,
            outline: 'none',
          }}
        />

        <div
          contentEditable={enabled}
          suppressContentEditableWarning
          onBlur={(e) => updateTab(activeId, 'contentText', e.currentTarget.textContent ?? '')}
          dangerouslySetInnerHTML={{ __html: activeTab?.contentText ?? '' }}
          style={{
            fontSize: 16,
            lineHeight: 1.8,
            color: t.textSecondary,
            marginTop: 16,
            outline: 'none',
          }}
        />
      </div>
    </div>
  );

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="showcase"
      className={`w-full max-w-full flex flex-col md:flex-row ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        minHeight: '100vh',
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: showGrid ? '50px 50px' : 'auto',
      }}
    >
      {tabsPosition === 'left' ? (
        <>
          {tabsPanel}
          {contentPanel}
        </>
      ) : (
        <>
          {contentPanel}
          {tabsPanel}
        </>
      )}
    </section>
  );
};

const TronShowcaseSettings = () => {
  const { actions: { setProp } } = useNode();
  const { tabs = DEFAULT_TABS, sectionLabel, tabsPosition, colorScheme, accentColor, showGrid } = useNode((node) => ({
    tabs: node.data.props.tabs as Tab[] | undefined,
    sectionLabel: node.data.props.sectionLabel as string | undefined,
    tabsPosition: node.data.props.tabsPosition as 'left' | 'right' | undefined,
    colorScheme: node.data.props.colorScheme as 'dark' | 'light' | undefined,
    accentColor: node.data.props.accentColor as string | undefined,
    showGrid: node.data.props.showGrid as boolean | undefined,
  }));

  const setT = (key: keyof TronShowcaseProps, ms: number) => (val: unknown) =>
    setProp((p: TronShowcaseProps) => { (p as Record<string, unknown>)[key] = val; }, ms);

  const effectiveTabs = (tabs && tabs.length > 0) ? tabs : DEFAULT_TABS;
  const canAdd = effectiveTabs.length < 8;
  const canRemove = effectiveTabs.length > 2;

  const updateTabTitle = (id: string, value: string) => {
    setProp(
      (p: TronShowcaseProps) => {
        const list = p.tabs ?? DEFAULT_TABS;
        const idx = list.findIndex((tab) => tab.id === id);
        if (idx >= 0) {
          const next = [...list];
          next[idx] = { ...next[idx], tabTitle: value };
          p.tabs = next;
        }
      },
      500
    );
  };

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Section label</label><input value={sectionLabel ?? ''} onChange={(e) => setT('sectionLabel', 500)(e.target.value)} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Tabs position</label>
            <select value={tabsPosition ?? 'right'} onChange={(e) => setT('tabsPosition', 300)(e.target.value)} className={inputCls}>
              <option value="right">Табы справа</option>
              <option value="left">Табы слева</option>
            </select>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-gray-500">Tab titles:</p>
          {effectiveTabs.map((tab) => (
            <div key={tab.id}>
              <label className={labelCls}>{tab.tabTitle || 'Tab'}</label>
              <input value={tab.tabTitle} onChange={(e) => updateTabTitle(tab.id, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            disabled={!canAdd}
            onClick={() => {
              if (!canAdd) return;
              setProp((p: TronShowcaseProps) => {
                const list = p.tabs ?? DEFAULT_TABS;
                p.tabs = [...list, { id: String(Date.now()), tabTitle: 'New tab', contentTitle: '', contentText: '' }];
              }, 0);
            }}
            className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555] disabled:opacity-50"
          >
            + Add tab
          </button>
          <button
            type="button"
            disabled={!canRemove}
            onClick={() => {
              if (!canRemove) return;
              setProp((p: TronShowcaseProps) => {
                const list = p.tabs ?? DEFAULT_TABS;
                p.tabs = list.slice(0, -1);
              }, 0);
            }}
            className="px-2 py-1.5 text-xs rounded bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50"
          >
            × Remove
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">{effectiveTabs.length} / 8 tabs</p>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Color scheme</label><select value={colorScheme ?? 'dark'} onChange={(e) => setT('colorScheme', 300)(e.target.value)} className={inputCls}><option value="dark">Dark</option><option value="light">Light</option></select></div>
          <div className="flex items-center gap-2"><label className={`${labelCls} shrink-0 w-20`}>Accent</label><input type="color" value={accentColor ?? '#e11d48'} onChange={(e) => setT('accentColor', 300)(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0" /><span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><label style={{ color: '#a1a1aa', fontSize: 12 }}>Show Grid</label><input type="checkbox" checked={showGrid ?? true} onChange={(e) => setProp((p: TronShowcaseProps) => { (p as Record<string, unknown>).showGrid = e.target.checked; })} /></div>
        </div>
      </section>
    </div>
  );
};

TronShowcase.craft = {
  displayName: 'Tron Showcase',
  props: {
    tabs: DEFAULT_TABS,
    sectionLabel: 'ЧТО МЫ ПРЕДЛАГАЕМ',
    tabsPosition: 'right' as const,
    colorScheme: 'dark' as const,
    accentColor: '#e11d48',
    showGrid: true,
  },
  related: { settings: TronShowcaseSettings },
  custom: {
    styleTags: ['dark', 'neon', 'bold'],
    businessTags: ['startup', 'saas', 'tech'],
    featureTags: ['showcase', 'tabs'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
