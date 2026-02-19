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
  const enabled = useEditor((state) => state.options.enabled);

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
      style={{
        backgroundImage: `${gridLines}, ${gradient}`,
        backgroundSize: '40px 40px, 100% 100%',
        backgroundRepeat: 'repeat, no-repeat',
        padding: '100px 24px',
        textAlign: 'center',
        maxWidth: '100%',
        outline: isSelected ? '2px solid #f97316' : undefined,
        outlineOffset: '2px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {badgeText && (
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 9999, padding: '4px 16px', fontSize: 13, color: '#fff', marginBottom: 24, display: 'inline-flex' }}>{badgeText}</div>
        )}
        <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#fff', marginBottom: 16, marginTop: 0 }}>{title}</h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 40, marginTop: 0 }}>{subtitle}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" style={{ background: '#fff', color: '#FF6B35', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>{primaryBtnText}</button>
          <button type="button" style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', padding: '14px 32px', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{secondaryBtnText}</button>
        </div>
      </div>
    </section>
  );
};

const CTASettings = () => {
  const { actions: { setProp }, gradientFrom, gradientTo, badgeText, title, subtitle, primaryBtnText, secondaryBtnText } = useNode((node) => ({
    gradientFrom: node.data.props.gradientFrom as string,
    gradientTo: node.data.props.gradientTo as string,
    badgeText: node.data.props.badgeText as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    primaryBtnText: node.data.props.primaryBtnText as string,
    secondaryBtnText: node.data.props.secondaryBtnText as string,
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
