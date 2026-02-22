'use client';

import { useNode, useEditor } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React, { useState, useEffect, useRef } from 'react';

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

export type MediaType = 'none' | 'image' | 'video';
export type TabsPosition = 'left' | 'right';

export interface ShowcaseTabProps {
  tabTitle: string;
  contentTitle: string;
  contentText: string;
  mediaType: MediaType;
  mediaUrl: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  isActive?: boolean;
  onSelect?: () => void;
  tabsPosition?: TabsPosition;
}

// --- ShowcaseTab: tab button (left or right panel) ---
export const ShowcaseTab = ({
  tabTitle,
  accentColor,
  colorScheme,
  isActive = false,
  onSelect,
  tabsPosition = 'right',
}: ShowcaseTabProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const t = tokens[colorScheme];
  const rgb = hexToRgb(accentColor);

  const isRight = tabsPosition === 'right';
  const borderStyle = isRight
    ? { borderLeftWidth: 2, borderLeftStyle: 'solid' as const, borderLeftColor: isActive ? accentColor : 'transparent' }
    : { borderRightWidth: 2, borderRightStyle: 'solid' as const, borderRightColor: isActive ? accentColor : 'transparent' };

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.()}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      className={`${isSelected ? 'craft-node-selected' : ''} md:w-full flex-shrink-0 max-md:!border-l-0 max-md:!border-r-0 md:!border-b-0 md:!py-6 md:!px-8`}
      style={{
        padding: '14px 20px',
        borderBottomWidth: 2,
        borderBottomStyle: 'solid',
        borderBottomColor: isActive ? accentColor : 'transparent',
        textAlign: 'left',
        fontSize: 'clamp(13px, 1.6vw, 15px)',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? accentColor : t.textSecondary,
        background: isActive ? `rgba(${rgb}, 0.06)` : 'transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        width: '100%',
        ...borderStyle,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = t.text;
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = t.textSecondary;
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {tabTitle || 'Tab'}
    </div>
  );
};

const ShowcaseTabSettings = () => {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props) as Record<string, unknown>;
  const tabTitle = (props.tabTitle as string) ?? '';
  const contentTitle = (props.contentTitle as string) ?? '';
  const contentText = (props.contentText as string) ?? '';
  const mediaType = (props.mediaType as MediaType) ?? 'none';
  const mediaUrl = (props.mediaUrl as string) ?? '';

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-4 space-y-3 text-white">
      <div><label className={labelCls}>Название кнопки (tab title)</label><input value={tabTitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.tabTitle = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Content title</label><input value={contentTitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.contentTitle = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Content text</label><textarea value={contentText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.contentText = e.target.value; }, 1000)} className={inputCls} rows={3} /></div>
      <div>
        <label className={labelCls}>Media type — Нет / Изображение (jpg, png, gif, webp, svg) / Видео (mp4, webm, mov)</label>
        <select value={mediaType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.mediaType = e.target.value; })} className={inputCls}>
          <option value="none">Нет</option>
          <option value="image">Изображение</option>
          <option value="video">Видео</option>
        </select>
      </div>
      {mediaType !== 'none' && (
        <div><label className={labelCls}>Media URL</label><input value={mediaUrl} onChange={(e) => setProp((p: Record<string, unknown>) => { p.mediaUrl = e.target.value; }, 500)} className={inputCls} placeholder="https://... или путь к файлу" /></div>
      )}
    </div>
  );
};

ShowcaseTab.craft = {
  displayName: 'Showcase Tab',
  props: {
    tabTitle: 'Tab',
    contentTitle: '',
    contentText: '',
    mediaType: 'none' as MediaType,
    mediaUrl: '',
    accentColor: '#e11d48',
    colorScheme: 'dark' as const,
  },
  related: { settings: ShowcaseTabSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// --- Default tabs ---
type TabData = { tabTitle: string; contentTitle: string; contentText: string; mediaType: MediaType; mediaUrl?: string };
const DEFAULT_TABS: TabData[] = [
  { tabTitle: 'Преимущества', contentTitle: 'Почему выбирают нас', contentText: 'Мы создаём решения которые работают на результат...', mediaType: 'none' },
  { tabTitle: 'Цены', contentTitle: 'Прозрачные тарифы', contentText: 'Никаких скрытых платежей. Платишь только за результат...', mediaType: 'none' },
  { tabTitle: 'Опыт', contentTitle: '5 лет на рынке', contentText: 'За это время реализованы десятки проектов...', mediaType: 'none' },
];

// --- TronShowcase (section) ---
export const TronShowcase = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  showGrid = true,
  sectionLabel = 'ЧТО МЫ ПРЕДЛАГАЕМ',
  tabsPosition = 'right',
  tabs = DEFAULT_TABS,
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  showGrid?: boolean;
  sectionLabel?: string;
  tabsPosition?: TabsPosition;
  tabs?: TabData[];
}) => {
  const { id: sectionId, connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { query, actions } = useEditor();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const tabCount = Math.max(2, Math.min(8, tabs?.length ?? 3));
  const tabIds = Array.from({ length: tabCount }, (_, i) => `${sectionId}-tab-${i}`);

  const [activeTab, setActiveTab] = useState<string>(tabIds[0]);
  const [displayedTabId, setDisplayedTabId] = useState<string>(tabIds[0]);
  const [leaving, setLeaving] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!tabIds.includes(activeTab)) {
      const next = tabIds[0];
      setActiveTab(next);
      setDisplayedTabId(next);
      setContentVisible(true);
    }
  }, [tabIds.join(','), activeTab]);

  const handleSelectTab = (id: string) => {
    if (id === activeTab) return;
    setActiveTab(id);
    setLeaving(true);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      leaveTimerRef.current = null;
      setDisplayedTabId(id);
      setLeaving(false);
      setContentVisible(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setContentVisible(true));
      });
    }, 150);
  };

  useEffect(() => () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  }, []);

  const t = tokens[colorScheme];
  const rgb = hexToRgb(accentColor);
  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';
  const backgroundStyle = {
    background: t.bg,
    backgroundImage: gridLines,
    backgroundSize: showGrid ? '50px 50px' : 'auto',
  };

  const getNodeSafe = typeof query?.getNode === 'function' ? query.getNode.bind(query) : () => null;
  const displayedNode = getNodeSafe(displayedTabId);
  const displayedProps = (displayedNode?.data?.props ?? {}) as Record<string, unknown>;
  const contentTitle = (displayedProps.contentTitle as string) ?? '';
  const contentText = (displayedProps.contentText as string) ?? '';
  const mediaType = (displayedProps.mediaType as MediaType) ?? 'none';
  const mediaUrl = (displayedProps.mediaUrl as string) ?? '';
  const displayedTabTitle = (displayedProps.tabTitle as string) ?? '';

  const setDisplayedTabProp = (key: string, value: unknown, throttleMs?: number) => {
    if (!displayedTabId) return;
    actions?.setProp?.(displayedTabId, (p: Record<string, unknown>) => { p[key] = value; }, throttleMs ?? 0);
  };

  const mediaBlock = mediaType !== 'none' && mediaUrl && (
    <div
      style={{
        marginTop: 32,
        border: `1px solid ${t.border}`,
        borderRadius: 4,
        overflow: 'hidden',
        maxHeight: 400,
        width: '100%',
        boxShadow: `0 8px 40px rgba(${rgb}, 0.15)`,
      }}
    >
      {mediaType === 'image' && <img src={mediaUrl} alt="" style={{ width: '100%', height: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />}
      {mediaType === 'video' && <video src={mediaUrl} autoPlay muted loop playsInline style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />}
    </div>
  );

  const tabsPanel = (
    <div
      className="flex flex-col w-full md:w-[35%] flex-shrink-0 order-1 md:order-none"
      style={{
        background: t.bgSecondary,
        borderLeft: tabsPosition === 'right' ? `1px solid ${t.border}` : 'none',
        borderRight: tabsPosition === 'left' ? `1px solid ${t.border}` : 'none',
      }}
    >
      <div style={{ padding: '32px 32px 16px', fontSize: 11, letterSpacing: '0.15em', color: accentColor, textTransform: 'uppercase' }}>
        {sectionLabel}
      </div>
      <div
        className="craft-showcase-tabs-scroll flex flex-row md:flex-col overflow-x-auto md:overflow-visible min-h-0"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tabIds.map((tabId) => {
          const node = getNodeSafe(tabId);
          const exists = node != null && node.data?.props;
          const data = tabs?.[tabIds.indexOf(tabId)] ?? DEFAULT_TABS[tabIds.indexOf(tabId)] ?? DEFAULT_TABS[0];
          const itemProps = exists
            ? { ...node.data.props, accentColor, colorScheme, isActive: activeTab === tabId, onSelect: () => handleSelectTab(tabId), tabsPosition }
            : {
                tabTitle: data.tabTitle,
                contentTitle: data.contentTitle,
                contentText: data.contentText,
                mediaType: data.mediaType ?? 'none',
                mediaUrl: data.mediaUrl ?? '',
                accentColor,
                colorScheme,
                isActive: activeTab === tabId,
                onSelect: () => handleSelectTab(tabId),
                tabsPosition,
              };
          return (
            <Element key={tabId} id={tabId} is={ShowcaseTab} canvas {...itemProps} />
          );
        })}
      </div>
    </div>
  );

  const contentPanel = (
    <div
      className="flex-1 min-w-0 flex flex-col overflow-hidden px-6 py-7 md:px-14 md:py-12 order-2 md:order-none"
      style={{
        background: t.bg,
        boxShadow: enabled ? `inset 0 0 0 1px rgba(${rgb}, 0.2)` : undefined,
        transition: 'box-shadow 200ms ease',
      }}
    >
      <div style={{ padding: '3px 10px', border: `1px solid rgba(${rgb}, 0.3)`, background: `rgba(${rgb}, 0.08)`, color: accentColor, fontSize: 11, borderRadius: 2, letterSpacing: '0.08em', marginBottom: 24, alignSelf: 'flex-start' }}>
        {displayedTabTitle || 'Tab'}
      </div>
      <div style={{ transition: leaving ? 'opacity 150ms ease, transform 150ms ease' : 'none', opacity: leaving ? 0 : 1, transform: leaving ? 'translateY(8px)' : 'translateY(0)' }}>
        <div
          key={displayedTabId}
          style={{
            transition: 'opacity 250ms ease, transform 250ms ease',
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          <div
            contentEditable={enabled}
            suppressContentEditableWarning
            onBlur={(e) => setDisplayedTabProp('contentTitle', e.currentTarget.textContent ?? '', 1000)}
            dangerouslySetInnerHTML={{ __html: contentTitle || '' }}
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: t.text, outline: 'none' }}
          />
          <div
            contentEditable={enabled}
            suppressContentEditableWarning
            onBlur={(e) => setDisplayedTabProp('contentText', e.currentTarget.textContent ?? '', 1000)}
            dangerouslySetInnerHTML={{ __html: contentText || '' }}
            style={{ fontSize: 15, lineHeight: 1.8, color: t.textSecondary, marginTop: 16, outline: 'none' }}
          />
          {mediaBlock}
        </div>
      </div>
    </div>
  );

  return (
    <section
      id="showcase"
      key={`${colorScheme}-${showGrid}-${tabsPosition}`}
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="showcase"
      className={`w-full max-w-full min-h-[600px] flex flex-col md:flex-row ${isSelected ? 'craft-node-selected' : ''}`}
      style={backgroundStyle}
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
  const { sectionLabel, tabsPosition, tabs = DEFAULT_TABS, colorScheme, accentColor, showGrid } = useNode((node) => ({
    sectionLabel: node.data.props.sectionLabel as string | undefined,
    tabsPosition: node.data.props.tabsPosition as TabsPosition | undefined,
    tabs: node.data.props.tabs as TabData[] | undefined,
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    showGrid: node.data.props.showGrid as boolean,
  }));

  const setT = (key: string, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const currentTabs = Array.isArray(tabs) ? tabs : DEFAULT_TABS;
  const canAdd = currentTabs.length < 8;
  const canRemove = currentTabs.length > 2;

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
        <div className="flex items-center gap-2 mt-3">
          <button type="button" onClick={() => canAdd && setProp((p: Record<string, unknown>) => { const list = (p.tabs as TabData[]) ?? DEFAULT_TABS; p.tabs = [...list, { tabTitle: 'New tab', contentTitle: '', contentText: '', mediaType: 'none' }]; }, 0)} disabled={!canAdd} className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555] disabled:opacity-50">+ Add tab</button>
          <button type="button" onClick={() => canRemove && setProp((p: Record<string, unknown>) => { const list = (p.tabs as TabData[]) ?? DEFAULT_TABS; p.tabs = list.slice(0, -1); }, 0)} disabled={!canRemove} className="px-2 py-1.5 text-xs rounded bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50">× Remove</button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">{currentTabs.length} / 8 tabs</p>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Color scheme</label><select value={colorScheme ?? 'dark'} onChange={(e) => setT('colorScheme', 300)(e.target.value)} className={inputCls}><option value="dark">Dark</option><option value="light">Light</option></select></div>
          <div className="flex items-center gap-2"><label className={`${labelCls} shrink-0 w-20`}>Accent</label><input type="color" value={accentColor ?? '#e11d48'} onChange={(e) => setT('accentColor', 300)(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0" /><span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><label style={{ color: '#a1a1aa', fontSize: 12 }}>Show Grid</label><input type="checkbox" checked={showGrid ?? true} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} /></div>
        </div>
      </section>
    </div>
  );
};

TronShowcase.craft = {
  displayName: 'Tron Showcase',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    showGrid: true,
    sectionLabel: 'ЧТО МЫ ПРЕДЛАГАЕМ',
    tabsPosition: 'right' as TabsPosition,
    tabs: DEFAULT_TABS,
    'data-block-type': 'showcase',
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
