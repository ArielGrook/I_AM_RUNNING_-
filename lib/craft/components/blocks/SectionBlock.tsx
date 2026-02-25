'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';

const tokens = {
  dark: {
    bg: '#0f172a',
    gridColor: 'rgba(255,255,255,0.03)',
  },
  light: {
    bg: '#ffffff',
    gridColor: 'rgba(0,0,0,0.06)',
  },
};

export interface SectionBlockProps {
  blockType?: string;
  bgType?: 'solid' | 'gradient';
  bgGradient?: string;
  showGrid?: boolean;
  padding?: string;
  minHeight?: number;
  sectionHeight?: number;
  animationType?: string;
  animateDelay?: string;
}

export const SectionBlock = React.memo(function SectionBlock({
  children,
  blockType = 'section',
  bgType = 'solid',
  bgGradient = 'linear-gradient(135deg, #FF6B35, #f59e0b)',
  showGrid = true,
  padding = 'px-4 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20',
  minHeight,
  sectionHeight = 75,
  animationType = 'none',
  animateDelay = '0',
}: SectionBlockProps & { children?: React.ReactNode }) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { theme } = useTheme();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const t = tokens[theme.colorScheme];
  const sectionBg = bgType === 'gradient' ? bgGradient : t.bg;
  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type={blockType}
      className={`w-full max-w-full ${padding} ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: sectionBg,
        backgroundImage: gridLines,
        backgroundSize: showGrid ? '50px 50px' : 'auto',
        minHeight: minHeight != null ? `${minHeight}px` : `${sectionHeight}vh`,
      }}
      {...animAttrs}
    >
      <div className="min-h-full flex flex-col justify-center max-w-6xl mx-auto w-full" style={{ minHeight: `${sectionHeight}vh` }}>
        {children}
      </div>
    </section>
  );
});

const sectionBlockCraft = {
  displayName: 'Section',
  props: {
    blockType: 'section',
    bgType: 'solid',
    bgGradient: 'linear-gradient(135deg, #FF6B35, #f59e0b)',
    showGrid: true,
    padding: 'px-4 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-12 md:py-16 lg:py-20',
    sectionHeight: 75,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: SectionBlockSettings },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
  },
};
(SectionBlock as unknown as { craft: typeof sectionBlockCraft }).craft = sectionBlockCraft;

function SectionBlockSettings() {
  const { actions: { setProp } } = useNode();
  const { blockType, bgType, showGrid, sectionHeight, animationType, animateDelay } = useNode((node) => ({
    blockType: (node.data.props.blockType as string) ?? 'section',
    bgType: (node.data.props.bgType as string) ?? 'solid',
    showGrid: (node.data.props.showGrid as boolean) ?? true,
    sectionHeight: (node.data.props.sectionHeight as number) ?? 75,
    animationType: (node.data.props.animationType as string) ?? 'none',
    animateDelay: (node.data.props.animateDelay as string) ?? '0',
  }));
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  return (
    <div className="p-3 space-y-4 text-white">
      <div><label className={labelCls}>Block type</label><input value={blockType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.blockType = e.target.value; }, 500)} className={inputCls} placeholder="pricing" /></div>
      <div><label className={labelCls}>Background</label><select value={bgType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.bgType = e.target.value; })} className={inputCls}><option value="solid">Solid</option><option value="gradient">Gradient</option></select></div>
      <div className="flex items-center gap-2"><label className={labelCls}>Show grid</label><input type="checkbox" checked={showGrid} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} /></div>
      <div><label className={labelCls}>Section height: {sectionHeight}vh</label><input type="range" min={50} max={100} step={5} value={sectionHeight} onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 500)} className="w-full" /></div>
      <div><label className={labelCls}>Animation</label><select value={animationType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay</label><select value={animateDelay} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0</option><option value="0.1">0.1</option><option value="0.2">0.2</option></select></div>
    </div>
  );
}
