'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState } from 'react';

type TestimonialItem = { name: string; role: string; text: string; avatarColor: string };

const DEFAULT_ITEMS: TestimonialItem[] = [
  { name: 'Sarah Johnson', role: 'CEO, TechCorp', text: 'Incredible platform. Saved us months of development time.', avatarColor: '#6366f1' },
  { name: 'Mark Davis', role: 'Founder, StartupXYZ', text: 'The backend blocks are a game changer. Worth every penny.', avatarColor: '#ec4899' },
  { name: 'Anna Smith', role: 'CTO, ScaleUp', text: 'Best investment we made this year. Our site launched in 2 days.', avatarColor: '#10b981' },
];

export const Testimonials = ({
  bgColor = '#0a0f1e',
  title = 'Loved by teams worldwide',
  subtitle = 'See what our customers have to say.',
  items = DEFAULT_ITEMS,
  animationType = 'none',
  animateDelay = '0',
}: {
  bgColor?: string;
  title?: string;
  subtitle?: string;
  items?: TestimonialItem[];
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
      className={`px-4 md:px-8 py-12 md:py-20 w-full max-w-full `}
      style={{ background: bgColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white m-0">{title}</h2>
          <p className="text-lg text-slate-400 leading-relaxed mt-4 mb-0">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(items ?? DEFAULT_ITEMS).map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === i ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hoveredCard === i ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16,
                padding: 28,
              }}
            >
              <div style={{ color: '#f59e0b', fontSize: 14, marginBottom: 16 }}>★★★★★</div>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 24, margin: '0 0 24px' }}>"{item.text}"</p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: item.avatarColor, marginRight: 12, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{item.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSettings = () => {
  const { actions: { setProp }, bgColor, title, subtitle, items, animationType, animateDelay } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    items: node.data.props.items as TestimonialItem[],
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));

  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateItem = (index: number, field: keyof TestimonialItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.items as TestimonialItem[])];
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
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Testimonials</h3>
        <div className="space-y-3">
          {(items ?? []).map((item, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/60 space-y-2">
              <input type="text" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} className={inputCls} placeholder="Name" />
              <input type="text" value={item.role} onChange={(e) => updateItem(i, 'role', e.target.value)} className={inputCls} placeholder="Role" />
              <input type="text" value={item.text} onChange={(e) => updateItem(i, 'text', e.target.value)} className={inputCls} placeholder="Quote" />
              <div className="flex items-center gap-2">
                <label className={labelCls}>Avatar color</label>
                <input type="color" value={item.avatarColor} onChange={(e) => updateItem(i, 'avatarColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
              </div>
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = (p.items as TestimonialItem[]).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = [...(p.items as TestimonialItem[] || []), { name: 'Name', role: 'Role', text: 'Quote', avatarColor: '#6366f1' }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add</button>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div><label className={labelCls}>Background</label><input type="color" value={bgColor ?? '#0a0f1e'} onChange={(e) => setT('bgColor', 300)(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 bg-transparent p-0" /></div>
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

Testimonials.craft = {
  displayName: 'Testimonials',
  props: {
    bgColor: '#0a0f1e',
    title: 'Loved by teams worldwide',
    subtitle: 'See what our customers have to say.',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: TestimonialsSettings },
};
