'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState } from 'react';

type FeatureItem = { icon: string; title: string; description: string };

const DEFAULT_ITEMS: FeatureItem[] = [
  { icon: '⚡', title: 'Lightning Fast', description: 'Optimized for speed. Under 1s load time.' },
  { icon: '🔒', title: 'Secure by Default', description: 'Enterprise-grade security built in.' },
  { icon: '🎯', title: 'Easy to Use', description: 'No learning curve. Build in minutes.' },
  { icon: '📱', title: 'Mobile First', description: 'Perfect on every device and screen size.' },
  { icon: '🚀', title: 'Deploy Instantly', description: 'One click to go live on your domain.' },
  { icon: '💡', title: 'AI Powered', description: 'Smart tools that help you build faster.' },
];

export const Features = ({
  bgColor = '#0f172a',
  title = 'Everything you need',
  subtitle = 'Powerful tools built for modern businesses',
  columns = 3,
  items = DEFAULT_ITEMS,
  animationType = 'none',
  animateDelay = '0',
}: {
  bgColor?: string;
  title?: string;
  subtitle?: string;
  columns?: number;
  items?: FeatureItem[];
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const enabled = useEditor((state) => state.options.enabled);
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
      style={{
        background: bgColor,
        padding: '80px 24px',
        maxWidth: '100%',
        outline: isSelected ? '2px solid #f97316' : undefined,
        outlineOffset: '2px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.7, marginTop: 16, marginBottom: 0 }}>{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(items ?? DEFAULT_ITEMS).map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              className="transition-all duration-200"
              style={{
                background: hoveredCard === i ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hoveredCard === i ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16,
                padding: 28,
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.2)', textAlign: 'center', lineHeight: '48px', fontSize: 22, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 8, margin: '0 0 8px' }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturesSettings = () => {
  const { actions: { setProp }, bgColor, title, subtitle, columns, items } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    columns: node.data.props.columns as number,
    items: node.data.props.items as FeatureItem[],
  }));

  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateItem = (index: number, field: keyof FeatureItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.items as FeatureItem[])];
      arr[index] = { ...arr[index], [field]: value };
      p.items = arr;
    });
  };

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
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div>
          <label className={labelCls}>Columns</label>
          <div className="flex gap-1">
            {[2, 3, 4].map((c) => (
              <button key={c} onClick={() => setProp((p: Record<string, unknown>) => { p.columns = c; })} className={`flex-1 py-1 text-xs rounded border ${columns === c ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400'}`}>{c}</button>
            ))}
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Items</h3>
        <div className="space-y-3">
          {(items ?? []).map((item, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/60 space-y-2">
              <input type="text" value={item.icon} onChange={(e) => updateItem(i, 'icon', e.target.value)} className={inputCls} placeholder="Icon" />
              <input type="text" value={item.title} onChange={(e) => updateItem(i, 'title', e.target.value)} className={inputCls} placeholder="Title" />
              <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} className={inputCls} placeholder="Description" />
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = (p.items as FeatureItem[]).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = [...(p.items as FeatureItem[] || []), { icon: '•', title: 'Feature', description: 'Description.' }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add item</button>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div><label className={labelCls}>Background</label><input type="color" value={bgColor ?? '#0f172a'} onChange={(e) => setT('bgColor', 300)(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 bg-transparent p-0" /></div>
      </section>
    </div>
  );
};

Features.craft = {
  displayName: 'Features',
  props: {
    bgColor: '#0f172a',
    title: 'Everything you need',
    subtitle: 'Powerful tools built for modern businesses',
    columns: 3,
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: FeaturesSettings },
};
