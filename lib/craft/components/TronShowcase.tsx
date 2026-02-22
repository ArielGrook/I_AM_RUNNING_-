'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useEffect, useCallback } from 'react';

export interface ShowcaseTab {
  id: string;
  tabTitle: string;
  contentTitle: string;
  contentText: string;
}

const DEFAULT_TABS: ShowcaseTab[] = [
  {
    id: '1',
    tabTitle: 'Преимущества',
    contentTitle: 'Почему выбирают нас',
    contentText:
      'Мы создаём решения которые работают на результат. Качество, скорость и надёжность — основа каждого проекта.',
  },
  {
    id: '2',
    tabTitle: 'Цены',
    contentTitle: 'Прозрачные тарифы',
    contentText:
      'Никаких скрытых платежей. Гибкие пакеты под любой бюджет. Платишь только за результат.',
  },
  {
    id: '3',
    tabTitle: 'Опыт',
    contentTitle: '5 лет на рынке',
    contentText:
      'За это время реализованы десятки проектов в разных нишах. Каждый проект — новый опыт.',
  },
];

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

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return `rgba(225, 29, 72, ${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const TronShowcase = ({
  tabs = DEFAULT_TABS,
  sectionLabel = 'ЧТО МЫ ПРЕДЛАГАЕМ',
  colorScheme = 'dark',
  accentColor = '#e11d48',
  showGrid = true,
}: {
  tabs?: ShowcaseTab[];
  sectionLabel?: string;
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  showGrid?: boolean;
}) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const safeTabs = Array.isArray(tabs) && tabs.length >= 1 ? tabs : DEFAULT_TABS;
  const firstId = safeTabs[0]?.id ?? '1';
  const [activeId, setActiveId] = useState(firstId);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentOpacity, setContentOpacity] = useState(1);
  const [contentTranslateY, setContentTranslateY] = useState(0);

  useEffect(() => {
    const exists = safeTabs.some((t) => t.id === activeId);
    if (!exists) setActiveId(safeTabs[0]?.id ?? '1');
  }, [safeTabs, activeId]);

  const activeTab = safeTabs.find((t) => t.id === activeId) ?? safeTabs[0];

  const handleTabClick = useCallback(
    (id: string) => {
      if (id === activeId) return;
      setIsTransitioning(true);
      setContentOpacity(0);
      setContentTranslateY(12);
      const t1 = setTimeout(() => {
        setActiveId(id);
        setContentTranslateY(-8);
        const t2 = setTimeout(() => {
          setContentOpacity(1);
          setContentTranslateY(0);
          setIsTransitioning(false);
        }, 250);
        return () => clearTimeout(t2);
      }, 150);
      return () => clearTimeout(t1);
    },
    [activeId]
  );

  const updateTabContent = useCallback(
    (tabId: string, field: 'contentTitle' | 'contentText', value: string) => {
      setProp((p: { tabs?: ShowcaseTab[] }) => {
        const arr = p.tabs ?? DEFAULT_TABS;
        const idx = arr.findIndex((t) => t.id === tabId);
        if (idx >= 0) {
          const next = [...arr];
          next[idx] = { ...next[idx], [field]: value };
          p.tabs = next;
        }
      }, 1000);
    },
    [setProp]
  );

  const t = tokens[colorScheme];
  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';
  const backgroundStyle = {
    background: t.bg,
    backgroundImage: gridLines,
    backgroundSize: showGrid ? '50px 50px' : 'auto',
  };

  return (
    <section
      key={`${colorScheme}-${showGrid}`}
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="showcase"
      data-block-category="content"
      className={`w-full max-w-full flex flex-col md:flex-row min-h-screen ${isSelected ? 'craft-node-selected' : ''}`}
      style={{ minHeight: '100vh', width: '100%', ...backgroundStyle }}
    >
      {/* Left — tabs, 35% (vertical on desktop, horizontal on mobile) */}
      <div
        className="order-1 w-full md:w-[35%] flex flex-row md:flex-col flex-shrink-0 min-h-0 md:min-h-[100vh] overflow-x-auto md:overflow-visible border-b md:border-b-0 md:border-r"
        style={{
          borderColor: t.border,
        }}
      >
        <div
          className="shrink-0 md:w-full p-8 pt-8 pb-4 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: t.textSecondary }}
        >
          {sectionLabel}
        </div>
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible min-h-0 flex-1 md:flex-initial">
          {safeTabs.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className="shrink-0 md:w-full text-left transition-all duration-[200ms] ease-out py-4 px-5 md:py-5 md:px-8 border-b-2 md:border-b-0 border-l-0 md:border-l-2"
                style={{
                  fontSize: 15,
                  color: isActive ? accentColor : '#a1a1aa',
                  background: isActive ? hexToRgba(accentColor, 0.06) : 'transparent',
                  borderLeftColor: isActive ? accentColor : 'transparent',
                  borderBottomColor: isActive ? accentColor : 'transparent',
                }}
              >
                {tab.tabTitle}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right — content, 65% */}
      <div
        className="order-2 w-full md:w-[65%] flex flex-col justify-center min-h-[50vh] md:min-h-[100vh]"
        style={{
          padding: 'clamp(40px, 6vw, 80px)',
        }}
      >
        <span
          style={{
            fontSize: 11,
            border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
            color: accentColor,
            padding: '3px 10px',
            marginBottom: 24,
            display: 'inline-block',
            width: 'fit-content',
          }}
        >
          {activeTab.tabTitle}
        </span>
        <div
          style={{
            opacity: contentOpacity,
            transform: `translateY(${contentTranslateY}px)`,
            transition: isTransitioning ? 'opacity 250ms ease, transform 250ms ease' : 'none',
          }}
        >
          <h2
            contentEditable={enabled}
            suppressContentEditableWarning
            onBlur={(e) =>
              updateTabContent(activeTab.id, 'contentTitle', e.currentTarget.textContent ?? '')
            }
            dangerouslySetInnerHTML={{ __html: activeTab.contentTitle }}
            style={{
              fontSize: 'clamp(32px, 4vw, 56px)',
              fontWeight: 800,
              color: t.text,
              margin: 0,
              marginBottom: 16,
              outline: 'none',
            }}
          />
          <div
            contentEditable={enabled}
            suppressContentEditableWarning
            onBlur={(e) =>
              updateTabContent(activeTab.id, 'contentText', e.currentTarget.textContent ?? '')
            }
            dangerouslySetInnerHTML={{ __html: activeTab.contentText }}
            style={{
              fontSize: 16,
              lineHeight: 1.8,
              color: t.textSecondary,
              margin: 0,
              outline: 'none',
            }}
          />
        </div>
      </div>
    </section>
  );
};

const MAX_TABS = 8;
const MIN_TABS = 2;

const TronShowcaseSettings = () => {
  const {
    actions: { setProp },
    sectionLabel,
    colorScheme,
    accentColor,
    showGrid,
    tabs,
  } = useNode((node) => ({
    sectionLabel: (node.data.props.sectionLabel as string) ?? 'ЧТО МЫ ПРЕДЛАГАЕМ',
    colorScheme: (node.data.props.colorScheme as 'dark' | 'light') ?? 'dark',
    accentColor: (node.data.props.accentColor as string) ?? '#e11d48',
    showGrid: (node.data.props.showGrid as boolean) ?? true,
    tabs: (node.data.props.tabs as ShowcaseTab[]) ?? DEFAULT_TABS,
  }));

  const setT = (key: string, ms?: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms ?? 300);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const safeTabs = Array.isArray(tabs) && tabs.length >= 1 ? tabs : DEFAULT_TABS;

  const updateTab = (index: number, field: keyof ShowcaseTab, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = ((p.tabs as ShowcaseTab[]) ?? DEFAULT_TABS).slice();
      if (arr[index]) {
        arr[index] = { ...arr[index], [field]: value };
        p.tabs = arr;
      }
    }, 500);
  };

  const addTab = () => {
    if (safeTabs.length >= MAX_TABS) return;
    setProp((p: Record<string, unknown>) => {
      const arr = ((p.tabs as ShowcaseTab[]) ?? DEFAULT_TABS).slice();
      arr.push({
        id: String(Date.now()),
        tabTitle: 'Новый таб',
        contentTitle: 'Заголовок',
        contentText: 'Описание.',
      });
      p.tabs = arr;
    });
  };

  const removeTab = (index: number) => {
    if (safeTabs.length <= MIN_TABS) return;
    setProp((p: Record<string, unknown>) => {
      const arr = ((p.tabs as ShowcaseTab[]) ?? DEFAULT_TABS).slice();
      arr.splice(index, 1);
      p.tabs = arr;
    });
  };

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Section label</label>
            <input
              type="text"
              value={sectionLabel}
              onChange={(e) => setT('sectionLabel', 500)(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Color scheme</label>
            <select value={colorScheme} onChange={(e) => setT('colorScheme')(e.target.value)} className={inputCls}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={`${labelCls} shrink-0 w-20`}>Accent</label>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setT('accentColor', 300)(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className={labelCls}>Show grid</label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })}
            />
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Tabs</h3>
        <div className="space-y-2">
          {safeTabs.map((tab, index) => (
            <div key={tab.id} className="flex gap-2 items-center">
              <input
                type="text"
                value={tab.tabTitle}
                onChange={(e) => updateTab(index, 'tabTitle', e.target.value)}
                className={`${inputCls} flex-1 min-w-0`}
                placeholder="Tab title"
              />
              <button
                type="button"
                onClick={() => removeTab(index)}
                disabled={safeTabs.length <= MIN_TABS}
                className="shrink-0 px-2 py-1 text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                title="Remove tab"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTab}
            disabled={safeTabs.length >= MAX_TABS}
            className="text-xs text-[#FF6B35] hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Добавить (макс {MAX_TABS})
          </button>
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
    colorScheme: 'dark',
    accentColor: '#e11d48',
    showGrid: true,
  },
  related: { settings: TronShowcaseSettings },
  custom: {
    styleTags: ['dark', 'bold'],
    businessTags: ['startup', 'saas'],
    featureTags: ['showcase', 'tabs', 'content'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
