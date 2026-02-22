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
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    border: 'rgba(255,255,255,0.08)',
    gridColor: 'rgba(255,255,255,0.03)',
    cardBg: 'rgba(255,255,255,0.03)',
  },
  light: {
    bg: '#ffffff',
    text: '#0a0a0a',
    textSecondary: '#52525b',
    border: 'rgba(0,0,0,0.08)',
    gridColor: 'rgba(0,0,0,0.06)',
    cardBg: 'rgba(0,0,0,0.02)',
  },
};

export type MediaType = 'none' | 'image' | 'video';
export type ImagePosition = 'top' | 'bottom' | 'right';

export interface ShowcaseTabProps {
  tabTitle: string;
  contentTitle: string;
  contentText: string;
  mediaType: MediaType;
  mediaUrl: string;
  imagePosition: ImagePosition;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  isActive?: boolean;
  onSelect?: () => void;
}

// --- ShowcaseTab: renders the tab button in the left panel ---
export const ShowcaseTab = ({
  tabTitle,
  accentColor,
  colorScheme,
  isActive = false,
  onSelect,
}: ShowcaseTabProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const t = tokens[colorScheme];

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.()}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      className={`${isSelected ? 'craft-node-selected' : ''} md:border-l-2 border-b-2 md:border-b-0 border-b-transparent flex-shrink-0 md:flex-shrink`}
      style={{
        padding: '16px 20px',
        borderLeftColor: isActive ? accentColor : t.border,
        borderBottomColor: isActive ? accentColor : t.border,
        fontSize: 'clamp(14px, 1.8vw, 16px)',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? accentColor : t.textSecondary,
        background: isActive ? `rgba(${hexToRgb(accentColor)}, 0.06)` : 'transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = t.text;
          e.currentTarget.style.borderLeftColor = `rgba(${hexToRgb(accentColor)}, 0.4)`;
          e.currentTarget.style.borderBottomColor = `rgba(${hexToRgb(accentColor)}, 0.4)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = t.textSecondary;
          e.currentTarget.style.borderLeftColor = t.border;
          e.currentTarget.style.borderBottomColor = t.border;
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
  const imagePosition = (props.imagePosition as ImagePosition) ?? 'top';

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-4 space-y-3 text-white">
      <div><label className={labelCls}>Tab title</label><input value={tabTitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.tabTitle = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Content title</label><input value={contentTitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.contentTitle = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Content text</label><textarea value={contentText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.contentText = e.target.value; }, 1000)} className={inputCls} rows={3} /></div>
      <div>
        <label className={labelCls}>Media type</label>
        <select value={mediaType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.mediaType = e.target.value; })} className={inputCls}>
          <option value="none">None</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </div>
      {mediaType !== 'none' && (
        <div><label className={labelCls}>Media URL</label><input value={mediaUrl} onChange={(e) => setProp((p: Record<string, unknown>) => { p.mediaUrl = e.target.value; }, 500)} className={inputCls} placeholder="https://..." /></div>
      )}
      {mediaType !== 'none' && (
        <div>
          <label className={labelCls}>Image position</label>
          <select value={imagePosition} onChange={(e) => setProp((p: Record<string, unknown>) => { p.imagePosition = e.target.value; })} className={inputCls}>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="right">Right</option>
          </select>
        </div>
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
    imagePosition: 'top' as ImagePosition,
    accentColor: '#e11d48',
    colorScheme: 'dark' as const,
  },
  related: { settings: ShowcaseTabSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// --- Default tabs ---
type TabData = { tabTitle: string; contentTitle: string; contentText: string; mediaType: MediaType; mediaUrl?: string; imagePosition?: ImagePosition };
const DEFAULT_TABS: TabData[] = [
  { tabTitle: 'Преимущества', contentTitle: 'Почему выбирают нас', contentText: 'Мы создаём решения которые работают...', mediaType: 'none' },
  { tabTitle: 'Цены', contentTitle: 'Прозрачные тарифы', contentText: 'Без скрытых платежей...', mediaType: 'none' },
  { tabTitle: 'Опыт', contentTitle: '5 лет на рынке', contentText: 'За это время мы...', mediaType: 'none' },
];

// --- TronShowcase (section) ---
export const TronShowcase = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  showGrid = true,
  sectionLabel = 'ЧТО МЫ ПРЕДЛАГАЕМ',
  tabs = DEFAULT_TABS,
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  showGrid?: boolean;
  sectionLabel?: string;
  tabs?: TabData[];
  animationType?: string;
  animateDelay?: string;
}) => {
  const { id: sectionId, connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { query, actions } = useEditor();

  const tabCount = Math.max(2, Math.min(8, tabs?.length ?? 3));
  const tabIds = Array.from({ length: tabCount }, (_, i) => `${sectionId}-tab-${i}`);

  const [activeTab, setActiveTab] = useState<string>(tabIds[0]);
  const [displayedTabId, setDisplayedTabId] = useState<string>(tabIds[0]);
  const [leaving, setLeaving] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when tabIds change (e.g. after load)
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
  const imagePosition = (displayedProps.imagePosition as ImagePosition) ?? 'top';
  const displayedTabTitle = (displayedProps.tabTitle as string) ?? '';

  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const setDisplayedTabProp = (key: string, value: unknown, throttleMs?: number) => {
    if (!displayedTabId) return;
    actions?.setProp?.(displayedTabId, (p: Record<string, unknown>) => { p[key] = value; }, throttleMs ?? 0);
  };

  const mediaBlock = mediaType !== 'none' && mediaUrl && (
    <div style={{ borderRadius: 4, border: `1px solid ${t.border}`, overflow: 'hidden', flexShrink: 0 }}>
      {mediaType === 'image' && <img src={mediaUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />}
      {mediaType === 'video' && <video src={mediaUrl} autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }} />}
    </div>
  );

  const textBlock = (
    <>
      <div
        contentEditable={enabled}
        suppressContentEditableWarning
        onBlur={(e) => setDisplayedTabProp('contentTitle', e.currentTarget.textContent ?? '', 1000)}
        dangerouslySetInnerHTML={{ __html: contentTitle || '' }}
        style={{
          fontSize: 'clamp(24px, 3.5vw, 36px)',
          fontWeight: 700,
          color: t.text,
          outline: 'none',
        }}
      />
      <div
        contentEditable={enabled}
        suppressContentEditableWarning
        onBlur={(e) => setDisplayedTabProp('contentText', e.currentTarget.textContent ?? '', 1000)}
        dangerouslySetInnerHTML={{ __html: contentText || '' }}
        style={{
          fontSize: 15,
          lineHeight: 1.7,
          color: t.textSecondary,
          marginTop: 12,
          outline: 'none',
        }}
      />
    </>
  );

  const contentLayout =
    imagePosition === 'top' ? (
      <>
        {mediaBlock}
        <div>{textBlock}</div>
      </>
    ) : imagePosition === 'bottom' ? (
      <>
        <div>{textBlock}</div>
        {mediaBlock}
      </>
    ) : (
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>{textBlock}</div>
        {mediaBlock && <div style={{ flex: '0 0 240px' }}>{mediaBlock}</div>}
      </div>
    );

  return (
    <section
      id="showcase"
      key={`${colorScheme}-${showGrid}`}
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="showcase"
      className={`w-full max-w-full py-16 px-4 sm:px-8 lg:px-16 ${isSelected ? 'craft-node-selected' : ''}`}
      style={backgroundStyle}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Left: tabs — horizontal scroll on mobile */}
        <div className="w-full md:w-[40%] flex flex-col flex-shrink-0">
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.15em',
              color: accentColor,
              marginBottom: 24,
              textTransform: 'uppercase',
            }}
          >
            {sectionLabel}
          </div>
          <div className="craft-showcase-tabs-scroll flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-0 md:gap-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            {tabIds.map((tabId) => {
              const node = getNodeSafe(tabId);
              const exists = node != null && node.data?.props;
              const data = tabs?.[tabIds.indexOf(tabId)] ?? DEFAULT_TABS[tabIds.indexOf(tabId)] ?? DEFAULT_TABS[0];
              const itemProps = exists
                ? { ...node.data.props, accentColor, colorScheme, isActive: activeTab === tabId, onSelect: () => handleSelectTab(tabId) }
                : {
                    tabTitle: data.tabTitle,
                    contentTitle: data.contentTitle,
                    contentText: data.contentText,
                    mediaType: data.mediaType ?? 'none',
                    mediaUrl: data.mediaUrl ?? '',
                    imagePosition: (data.imagePosition as ImagePosition) ?? 'top',
                    accentColor,
                    colorScheme,
                    isActive: activeTab === tabId,
                    onSelect: () => handleSelectTab(tabId),
                  };
              return (
                <Element key={tabId} id={tabId} is={ShowcaseTab} canvas {...itemProps} />
              );
            })}
          </div>
        </div>

        {/* Right: content panel */}
        <div className="w-full md:w-[60%] flex-shrink-0 relative">
          <div
            style={{
              border: `1px solid ${t.border}`,
              borderRadius: 4,
              background: t.cardBg,
              padding: '32px 40px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                padding: '4px 10px',
                fontSize: 11,
                background: `rgba(${hexToRgb(accentColor)}, 0.1)`,
                border: `1px solid rgba(${hexToRgb(accentColor)}, 0.3)`,
                color: accentColor,
                borderRadius: 2,
                letterSpacing: '0.08em',
              }}
            >
              {displayedTabTitle || 'Tab'}
            </div>
            <div
              style={{
                transition: leaving ? 'opacity 150ms ease, transform 150ms ease' : 'none',
                opacity: leaving ? 0 : 1,
                transform: leaving ? 'translateY(10px)' : 'translateY(0)',
              }}
            >
              <div
                key={displayedTabId}
                style={{
                  transition: 'opacity 250ms ease, transform 250ms ease',
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
                }}
              >
                {contentLayout}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TronShowcaseSettings = () => {
  const { actions: { setProp } } = useNode();
  const { sectionLabel, tabs = DEFAULT_TABS, colorScheme, accentColor, showGrid, animationType, animateDelay } = useNode((node) => ({
    sectionLabel: node.data.props.sectionLabel as string | undefined,
    tabs: node.data.props.tabs as TabData[] | undefined,
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    showGrid: node.data.props.showGrid as boolean,
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
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
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-2">
          <div><label className={labelCls}>Type</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option><option value="scale-in">Scale In</option></select></div>
          <div><label className={labelCls}>Delay</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option><option value="0.5">0.5s</option></select></div>
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
    tabs: DEFAULT_TABS,
    animationType: 'none',
    animateDelay: '0',
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
