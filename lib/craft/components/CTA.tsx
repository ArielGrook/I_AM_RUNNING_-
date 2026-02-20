'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';

export const CTA = ({
  gradientFrom = '#FF6B35',
  gradientTo = '#f59e0b',
  badgeText = '🚀 Limited Time Offer',
  title = 'Ready to Get Started?',
  subtitle = 'Join 2,000+ businesses. First month completely free.',
  primaryBtnText = 'Start for Free',
  secondaryBtnText = 'Watch Demo',
  animationType = 'none',
  animateDelay = '0',
}: {
  gradientFrom?: string;
  gradientTo?: string;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  primaryBtnText?: string;
  secondaryBtnText?: string;
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const gradient = `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`;
  const gridLines = 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)';

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    dataAttrs['data-animate-delay'] = animateDelay ?? '0';
  }

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      className="px-4 md:px-8 py-12 md:py-24 text-center w-full max-w-full"
      style={{
        backgroundImage: `${gridLines}, ${gradient}`,
        backgroundSize: '40px 40px, 100% 100%',
        backgroundRepeat: 'repeat, no-repeat',
        outline: isSelected ? '2px solid #f97316' : undefined,
        outlineOffset: '2px',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {badgeText && (
          <div className="inline-flex py-1 px-4 rounded-full text-sm text-white bg-white/20 mb-6">{badgeText}</div>
        )}
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 mt-0">{title}</h2>
        <p className="text-lg text-white/80 mb-10 mt-0">{subtitle}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button type="button" style={{ background: '#fff', color: '#FF6B35', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>{primaryBtnText}</button>
          <button type="button" style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', padding: '14px 32px', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{secondaryBtnText}</button>
        </div>
      </div>
    </section>
  );
};

const CTASettings = () => {
  const { actions: { setProp }, gradientFrom, gradientTo, badgeText, title, subtitle, primaryBtnText, secondaryBtnText, animationType, animateDelay } = useNode((node) => ({
    gradientFrom: node.data.props.gradientFrom as string,
    gradientTo: node.data.props.gradientTo as string,
    badgeText: node.data.props.badgeText as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    primaryBtnText: node.data.props.primaryBtnText as string,
    secondaryBtnText: node.data.props.secondaryBtnText as string,
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));

  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Badge</label><input type="text" value={badgeText ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.badgeText = e.target.value; })} className={inputCls} /></div>
          <div><label className={labelCls}>Title</label><input type="text" value={title ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; })} className={inputCls} /></div>
          <div><label className={labelCls}>Subtitle</label><input type="text" value={subtitle ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; })} className={inputCls} /></div>
          <div><label className={labelCls}>Primary button</label><input type="text" value={primaryBtnText ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.primaryBtnText = e.target.value; })} className={inputCls} /></div>
          <div><label className={labelCls}>Secondary button</label><input type="text" value={secondaryBtnText ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.secondaryBtnText = e.target.value; })} className={inputCls} /></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Gradient</h3>
        <div className="space-y-2 flex items-center gap-2">
          <label className={`${labelCls} shrink-0 w-16`}>From</label>
          <input type="color" value={gradientFrom ?? '#FF6B35'} onChange={(e) => setT('gradientFrom', 300)(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
          <label className={`${labelCls} shrink-0 w-16`}>To</label>
          <input type="color" value={gradientTo ?? '#f59e0b'} onChange={(e) => setT('gradientTo', 300)(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-2">
          <div><label className={labelCls}>Type</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option><option value="slide-left">Slide Left</option><option value="scale-in">Scale In</option><option value="blur-in">Blur In</option></select></div>
          <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option><option value="0.3">0.3s</option><option value="0.5">0.5s</option><option value="0.8">0.8s</option><option value="1">1s</option></select></div>
        </div>
      </section>
    </div>
  );
};

CTA.craft = {
  displayName: 'CTA',
  props: {
    gradientFrom: '#FF6B35',
    gradientTo: '#f59e0b',
    badgeText: '🚀 Limited Time Offer',
    title: 'Ready to Get Started?',
    subtitle: 'Join 2,000+ businesses. First month completely free.',
    primaryBtnText: 'Start for Free',
    secondaryBtnText: 'Watch Demo',
    animationType: 'none',
    animateDelay: '0',
  },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: CTASettings },
};
