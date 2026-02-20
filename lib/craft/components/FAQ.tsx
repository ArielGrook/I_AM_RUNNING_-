'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState } from 'react';

type FAQItem = { question: string; answer: string };

const DEFAULT_ITEMS: FAQItem[] = [
  { question: 'How do I get started?', answer: 'Sign up for free and build your first site in minutes. No credit card required.' },
  { question: 'Can I cancel anytime?', answer: 'Yes. No contracts, no commitments. Cancel from your dashboard anytime.' },
  { question: 'Do I need coding skills?', answer: 'Zero. Our visual editor requires no coding knowledge whatsoever.' },
  { question: 'What happens to my site if I cancel?', answer: 'You keep everything. Export your site as a ZIP file and host it anywhere.' },
  { question: 'Do you offer refunds?', answer: 'Yes. We offer a 14-day money-back guarantee, no questions asked.' },
];

export const FAQ = ({
  bgColor = '#0a0f1e',
  title = 'Frequently asked questions',
  subtitle = 'Everything you need to know.',
  items = DEFAULT_ITEMS,
  animationType = 'none',
  animateDelay = '0',
}: {
  bgColor?: string;
  title?: string;
  subtitle?: string;
  items?: FAQItem[];
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const enabled = useEditor((state) => state.options.enabled);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white m-0">{title}</h2>
          <p className="text-lg text-slate-400 leading-relaxed mt-4 mb-0">{subtitle}</p>
        </div>
        <div>
          {(items ?? DEFAULT_ITEMS).map((item, i) => (
            <div key={i} className="border-b border-white/10">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex justify-between items-center py-5 w-full cursor-pointer text-sm md:text-base font-medium text-white text-left bg-transparent border-0"
              >
                {item.question}
                <span style={{ color: '#FF6B35', fontSize: 20, fontWeight: 300, transition: 'transform 0.2s', transform: openIndex === i ? 'rotate(0deg)' : 'rotate(0deg)' }}>{openIndex === i ? '−' : '+'}</span>
              </button>
              {openIndex === i && (
                <div className="pb-5 text-sm md:text-base text-slate-400 leading-relaxed">{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQSettings = () => {
  const { actions: { setProp }, bgColor, title, subtitle, items } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    items: node.data.props.items as FAQItem[],
  }));

  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateItem = (index: number, field: keyof FAQItem, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.items as FAQItem[])];
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
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Questions</h3>
        <div className="space-y-3">
          {(items ?? []).map((item, i) => (
            <div key={i} className="p-2 rounded bg-gray-800/60 space-y-2">
              <input type="text" value={item.question} onChange={(e) => updateItem(i, 'question', e.target.value)} className={inputCls} placeholder="Question" />
              <input type="text" value={item.answer} onChange={(e) => updateItem(i, 'answer', e.target.value)} className={inputCls} placeholder="Answer" />
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = (p.items as FAQItem[]).filter((_, j) => j !== i); })} className="text-xs text-red-400">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.items = [...(p.items as FAQItem[] || []), { question: 'Question?', answer: 'Answer.' }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add question</button>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div><label className={labelCls}>Background</label><input type="color" value={bgColor ?? '#0a0f1e'} onChange={(e) => setT('bgColor', 300)(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 bg-transparent p-0" /></div>
      </section>
    </div>
  );
};

FAQ.craft = {
  displayName: 'FAQ',
  props: {
    bgColor: '#0a0f1e',
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know.',
    items: DEFAULT_ITEMS,
    animationType: 'none',
    animateDelay: '0',
  },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: FAQSettings },
};
