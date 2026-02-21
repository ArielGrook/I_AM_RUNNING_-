'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';

type TronPlanItem = { name: string; price: string; features: string[]; highlighted?: boolean; ctaText: string };
type CardAnimFrom = 'slide-top' | 'slide-bottom' | 'none';

const DEFAULT_CARD_ANIMATIONS: CardAnimFrom[] = ['slide-top', 'slide-bottom', 'slide-top'];

const DEFAULT_PLANS: TronPlanItem[] = [
  { name: 'Starter', price: '29', features: ['Up to 5 projects', 'Basic support', '1GB storage'], highlighted: false, ctaText: 'Get Started' },
  { name: 'Pro', price: '79', features: ['Unlimited projects', 'Priority support', '10GB storage', 'Analytics'], highlighted: true, ctaText: 'Get Started' },
  { name: 'Enterprise', price: '199', features: ['Everything in Pro', 'Dedicated manager', 'Custom integrations'], highlighted: false, ctaText: 'Contact us' },
];

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '225, 29, 72';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

export const TronPricing = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  title = 'Simple pricing',
  subtitle = 'Choose the plan that fits your team',
  plans = DEFAULT_PLANS,
  cardAnimations = DEFAULT_CARD_ANIMATIONS,
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
  plans?: TronPlanItem[];
  cardAnimations?: CardAnimFrom[];
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const tokens = colorScheme === 'dark'
    ? { bg: '#000000', text: '#ffffff', muted: '#52525b', accent: accentColor }
    : { bg: '#ffffff', text: '#0a0a0a', muted: '#52525b', accent: accentColor };
  const rgb = hexToRgb(accentColor ?? '#e11d48');
  const gridColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const gridLines =
    `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`;

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    dataAttrs['data-animate-delay'] = animateDelay ?? '0';
  }

  const list = plans ?? DEFAULT_PLANS;

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      className={`w-full max-w-full px-4 md:px-8 py-12 md:py-20 ${isSelected ? 'outline outline-2 outline-red-500' : ''}`}
      style={{ background: tokens.bg, backgroundImage: gridLines, backgroundSize: '50px 50px' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: tokens.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: tokens.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {list.map((plan, i) => (
            <div
              key={i}
              data-animate-from={cardAnimations[i] ?? 'none'}
              data-animate-card="pricing"
              style={{
                border: plan.highlighted ? `1px solid ${tokens.accent}` : `1px solid rgba(${rgb}, 0.2)`,
                borderRadius: 4,
                padding: 28,
                background: colorScheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                boxShadow: plan.highlighted ? `0 0 30px rgba(${rgb}, 0.15)` : undefined,
              }}
            >
              <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: tokens.accent, margin: '0 0 16px' }}>{plan.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                <span style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, color: tokens.text }}>{plan.price}</span>
                <span style={{ fontSize: 16, color: '#71717a' }}>/mo</span>
              </div>
              <div style={{ height: 1, background: `rgba(${rgb}, 0.2)`, marginBottom: 20 }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                {(plan.features ?? []).map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#a1a1aa', marginBottom: 8 }}>
                    <span style={{ color: tokens.accent, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 4,
                  border: 'none',
                  background: tokens.accent,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {plan.ctaText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TronPricingSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, title, subtitle, plans, cardAnimations, animationType, animateDelay } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    plans: node.data.props.plans as TronPlanItem[],
    cardAnimations: node.data.props.cardAnimations as CardAnimFrom[],
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updatePlan = (index: number, field: keyof TronPlanItem, value: string | string[] | boolean) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.plans as TronPlanItem[])];
      arr[index] = { ...arr[index], [field]: value };
      p.plans = arr;
    });
  };

  const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.plans as TronPlanItem[])];
      const features = [...(arr[planIndex].features ?? [])];
      features[featureIndex] = value;
      arr[planIndex] = { ...arr[planIndex], features };
      p.plans = arr;
    });
  };

  const addFeature = (planIndex: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.plans as TronPlanItem[])];
      arr[planIndex].features = [...(arr[planIndex].features ?? []), 'New feature'];
      p.plans = arr;
    });
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.plans as TronPlanItem[])];
      arr[planIndex].features = (arr[planIndex].features ?? []).filter((_, j) => j !== featureIndex);
      p.plans = arr;
    });
  };

  const updateCardAnimation = (index: number, value: CardAnimFrom) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.cardAnimations as CardAnimFrom[] ?? DEFAULT_CARD_ANIMATIONS)];
      arr[index] = value;
      p.cardAnimations = arr;
    });
  };

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Color scheme</label><select value={colorScheme ?? 'dark'} onChange={(e) => setT('colorScheme', 300)(e.target.value)} className={inputCls}><option value="dark">Dark</option><option value="light">Light</option></select></div>
          <div className="flex items-center gap-2"><label className={`${labelCls} shrink-0 w-20`}>Accent</label><input type="color" value={accentColor ?? '#e11d48'} onChange={(e) => setT('accentColor', 300)(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0" /><span className="text-[10px] font-mono text-gray-500 truncate">{accentColor}</span></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Title</label><input type="text" value={title ?? ''} onChange={(e) => setT('title', 500)(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Subtitle</label><input type="text" value={subtitle ?? ''} onChange={(e) => setT('subtitle', 500)(e.target.value)} className={inputCls} /></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Plans</h3>
        <div className="space-y-3">
          {(plans ?? []).map((plan, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/60 space-y-2">
              <input type="text" value={plan.name} onChange={(e) => updatePlan(i, 'name', e.target.value)} className={inputCls} placeholder="Plan name" />
              <input type="text" value={plan.price} onChange={(e) => updatePlan(i, 'price', e.target.value)} className={inputCls} placeholder="Price" />
              <input type="text" value={plan.ctaText} onChange={(e) => updatePlan(i, 'ctaText', e.target.value)} className={inputCls} placeholder="Button text" />
              <div>
                <label className={labelCls}>Animate from</label>
                <select value={(cardAnimations ?? [])[i] ?? 'none'} onChange={(e) => updateCardAnimation(i, e.target.value as CardAnimFrom)} className={inputCls}>
                  <option value="none">None</option>
                  <option value="slide-top">Top</option>
                  <option value="slide-bottom">Bottom</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={plan.highlighted ?? false} onChange={(e) => updatePlan(i, 'highlighted', e.target.checked)} className="rounded border-gray-600 bg-gray-700" /> Highlighted</label>
              {(plan.features ?? []).map((f, j) => (
                <div key={j} className="flex gap-1">
                  <input type="text" value={f} onChange={(e) => updateFeature(i, j, e.target.value)} className={inputCls} placeholder={`Feature ${j + 1}`} />
                  <button type="button" onClick={() => removeFeature(i, j)} className="text-xs text-red-400 shrink-0">×</button>
                </div>
              ))}
              <button type="button" onClick={() => addFeature(i)} className="text-xs text-gray-400">+ Add feature</button>
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.plans = (p.plans as TronPlanItem[]).filter((_, j) => j !== i); p.cardAnimations = (p.cardAnimations as CardAnimFrom[] ?? []).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove plan</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.plans = [...(p.plans as TronPlanItem[] || []), { name: 'Plan', price: '99', features: ['Feature 1'], highlighted: false, ctaText: 'Get Started' }]; p.cardAnimations = [...(p.cardAnimations as CardAnimFrom[] ?? []), 'none']; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add plan</button>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-2">
          <div><label className={labelCls}>Type</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
          <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
        </div>
      </section>
    </div>
  );
};

TronPricing.craft = {
  displayName: 'Tron Pricing',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    title: 'Simple pricing',
    subtitle: 'Choose the plan that fits your team',
    plans: DEFAULT_PLANS,
    cardAnimations: DEFAULT_CARD_ANIMATIONS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronPricingSettings },
  custom: {
    styleTags: ['dark', 'neon', 'pricing'],
    businessTags: ['saas', 'pricing', 'tech'],
    featureTags: ['pricing', 'plans'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
