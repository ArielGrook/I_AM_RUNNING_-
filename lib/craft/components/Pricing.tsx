'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState } from 'react';

type PlanItem = {
  name: string;
  price: string;
  period: string;
  highlighted: boolean;
  description: string;
  features: string[];
};

const DEFAULT_PLANS: PlanItem[] = [
  { name: 'Starter', price: '$29', period: '/mo', highlighted: false, description: 'Perfect for small projects', features: ['5 projects', '10GB storage', 'Email support', 'Basic analytics'] },
  { name: 'Pro', price: '$79', period: '/mo', highlighted: true, description: 'Best for growing businesses', features: ['25 projects', '50GB storage', 'Priority support', 'Advanced analytics', 'Custom domain'] },
  { name: 'Enterprise', price: '$199', period: '/mo', highlighted: false, description: 'For large scale operations', features: ['Unlimited projects', '500GB storage', 'Dedicated support', 'SLA guarantee', 'Custom integrations'] },
];

export const Pricing = ({
  bgColor = '#0f172a',
  title = 'Simple, transparent pricing',
  subtitle = 'Choose the plan that fits your team.',
  plans = DEFAULT_PLANS,
  animationType = 'none',
  animateDelay = '0',
}: {
  bgColor?: string;
  title?: string;
  subtitle?: string;
  plans?: PlanItem[];
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    dataAttrs['data-animate-delay'] = animateDelay ?? '0';
  }

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      className="px-4 md:px-8 py-12 md:py-20 w-full max-w-full"
      style={{
        background: bgColor,
        outline: isSelected ? '2px solid #f97316' : undefined,
        outlineOffset: '2px',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white m-0">{title}</h2>
          <p className="text-lg text-slate-400 leading-relaxed mt-4 mb-0">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {(plans ?? DEFAULT_PLANS).map((plan, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              className="relative rounded-2xl p-6 md:p-7"
              style={{
                background: plan.highlighted ? 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(245,158,11,0.1))' : hoveredCard === i ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${plan.highlighted ? 'rgba(255,107,53,0.4)' : hoveredCard === i ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 md:-translate-y-3 bg-[#FF6B35] text-white rounded-full py-1 px-4 text-xs font-semibold whitespace-nowrap">Most Popular</div>
              )}
              <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {plan.price}
                <span style={{ fontSize: 16, color: '#64748b', fontWeight: 400 }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: 14, color: '#64748b', margin: '12px 0 24px' }}>{plan.description}</p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}>
                {(plan.features ?? []).map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 14, color: '#94a3b8' }}>
                    <span style={{ color: '#10b981' }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 24,
                  border: plan.highlighted ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  background: plan.highlighted ? '#FF6B35' : 'transparent',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Get started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingSettings = () => {
  const { actions: { setProp }, bgColor, title, subtitle, plans, animationType, animateDelay } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    plans: node.data.props.plans as PlanItem[],
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
          <div><label className={labelCls}>Title</label><input type="text" value={title ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; })} className={inputCls} /></div>
          <div><label className={labelCls}>Subtitle</label><input type="text" value={subtitle ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; })} className={inputCls} /></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Plans</h3>
        <div className="space-y-3">
          {(plans ?? []).map((plan, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/60 space-y-2">
              <input type="text" value={plan.name} onChange={(e) => setProp((p: Record<string, unknown>) => { const arr = [...(p.plans as PlanItem[])]; arr[i] = { ...arr[i], name: e.target.value }; p.plans = arr; })} className={inputCls} placeholder="Plan name" />
              <input type="text" value={plan.price} onChange={(e) => setProp((p: Record<string, unknown>) => { const arr = [...(p.plans as PlanItem[])]; arr[i] = { ...arr[i], price: e.target.value }; p.plans = arr; })} className={inputCls} placeholder="Price" />
              <input type="text" value={plan.period} onChange={(e) => setProp((p: Record<string, unknown>) => { const arr = [...(p.plans as PlanItem[])]; arr[i] = { ...arr[i], period: e.target.value }; p.plans = arr; })} className={inputCls} placeholder="/mo" />
              <input type="text" value={plan.description} onChange={(e) => setProp((p: Record<string, unknown>) => { const arr = [...(p.plans as PlanItem[])]; arr[i] = { ...arr[i], description: e.target.value }; p.plans = arr; })} className={inputCls} placeholder="Description" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={plan.highlighted} onChange={(e) => setProp((p: Record<string, unknown>) => { const arr = [...(p.plans as PlanItem[])]; arr[i] = { ...arr[i], highlighted: e.target.checked }; p.plans = arr; })} />
                <span className="text-xs text-gray-400">Highlighted (Most Popular)</span>
              </label>
              <div><label className={labelCls}>Features (one per line)</label><textarea value={(plan.features ?? []).join('\n')} onChange={(e) => setProp((p: Record<string, unknown>) => { const arr = [...(p.plans as PlanItem[])]; arr[i] = { ...arr[i], features: e.target.value.split('\n').filter(Boolean) }; p.plans = arr; })} className={inputCls} rows={3} /></div>
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.plans = (p.plans as PlanItem[]).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.plans = [...(p.plans as PlanItem[] || []), { name: 'Plan', price: '$0', period: '/mo', highlighted: false, description: '', features: [] }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add plan</button>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div><label className={labelCls}>Background</label><input type="color" value={bgColor ?? '#0f172a'} onChange={(e) => setT('bgColor', 300)(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 bg-transparent p-0" /></div>
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

Pricing.craft = {
  displayName: 'Pricing',
  props: {
    bgColor: '#0f172a',
    title: 'Simple, transparent pricing',
    subtitle: 'Choose the plan that fits your team.',
    plans: DEFAULT_PLANS,
    animationType: 'none',
    animateDelay: '0',
  },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: PricingSettings },
};
