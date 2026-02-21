'use client';

import { useNode, useEditor } from '@craftjs/core';
import { Element } from '@craftjs/core';
import React, { useState, useEffect, useRef } from 'react';

const CARD_WIDTH = 320;
const GAP = 24;
const NUM_CARDS = 3;

type RowDirection = 'left' | 'right';

const tokens = {
  dark: { bg: '#000000', text: '#ffffff', muted: '#52525b', accent: '#e11d48', gridColor: 'rgba(255,255,255,0.03)', cardBg: 'rgba(255,255,255,0.02)', cardBorder: 'rgba(255,255,255,0.08)' },
  light: { bg: '#ffffff', text: '#0a0a0a', textSecondary: '#52525b', muted: '#52525b', accent: '#e11d48', border: 'rgba(0,0,0,0.08)', cardBg: 'rgba(0,0,0,0.02)', cardBorder: 'rgba(0,0,0,0.08)', gridColor: 'rgba(0,0,0,0.06)' },
};

// --- TestimonialCard (editable child node) ---
export interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarUrl: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

function TestimonialCardContent({ quote, author, role, company, accentColor, colorScheme }: Pick<TestimonialCardProps, 'quote' | 'author' | 'role' | 'company' | 'accentColor' | 'colorScheme'>) {
  const t = tokens[colorScheme];
  return (
    <>
      <p style={{ fontSize: 14, color: '#a1a1aa', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 16px' }}>"{quote}"</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: t.text, margin: 0 }}>{author}</p>
      <p style={{ fontSize: 13, color: t.accent, marginTop: 4, marginBottom: 0 }}>{role}{company ? `, ${company}` : ''}</p>
    </>
  );
}

export const TestimonialCard = ({ quote, author, role, company, avatarUrl, accentColor, colorScheme, animationType, animateDelay }: TestimonialCardProps) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const t = tokens[colorScheme];
  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }
  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...animAttrs}
      className=""
      style={{ width: CARD_WIDTH, flexShrink: 0, border: `1px solid ${t.cardBorder}`, borderRadius: 4, padding: 24, background: t.cardBg }}
    >
      <TestimonialCardContent quote={quote} author={author} role={role} company={company} accentColor={accentColor} colorScheme={colorScheme} />
    </div>
  );
};

const TestimonialCardSettings = () => {
  const { actions: { setProp } } = useNode();
  const { quote, author, role, company, avatarUrl, animationType, animateDelay } = useNode((n) => n.data.props as TestimonialCardProps) ?? {};
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Quote</label><textarea value={quote ?? ''} onChange={(e) => setT('quote', 500)(e.target.value)} className={inputCls} rows={2} /></div>
      <div><label className={labelCls}>Author</label><input type="text" value={author ?? ''} onChange={(e) => setT('author', 500)(e.target.value)} className={inputCls} /></div>
      <div><label className={labelCls}>Role</label><input type="text" value={role ?? ''} onChange={(e) => setT('role', 500)(e.target.value)} className={inputCls} /></div>
      <div><label className={labelCls}>Company</label><input type="text" value={company ?? ''} onChange={(e) => setT('company', 500)(e.target.value)} className={inputCls} /></div>
      <div><label className={labelCls}>Avatar URL</label><input type="text" value={avatarUrl ?? ''} onChange={(e) => setT('avatarUrl', 500)(e.target.value)} className={inputCls} placeholder="https://" /></div>
      <div><label className={labelCls}>Animation</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
};

TestimonialCard.craft = {
  displayName: 'Testimonial Card',
  props: { quote: 'This product changed how we work.', author: 'Jane Doe', role: 'CEO', company: 'Acme Inc', avatarUrl: '', accentColor: '#e11d48', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: TestimonialCardSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

const DEFAULT_CARD_PROPS: Omit<TestimonialCardProps, 'accentColor' | 'colorScheme'>[] = [
  { quote: 'This product changed how we work. Highly recommend.', author: 'Jane Doe', role: 'CEO', company: 'Acme Inc', avatarUrl: '', animationType: 'none', animateDelay: '0' },
  { quote: 'Fast, reliable, and the support team is amazing.', author: 'John Smith', role: 'CTO', company: 'Startup', avatarUrl: '', animationType: 'none', animateDelay: '0' },
  { quote: 'Best investment we made this year. No regrets.', author: 'Alex Lee', role: 'Founder', company: '', avatarUrl: '', animationType: 'none', animateDelay: '0' },
];

// --- TronTestimonials section ---
export const TronTestimonials = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  title = 'What people say',
  subtitle = 'Trusted by teams worldwide',
  doubleRow = false,
  row1Direction = 'left',
  row2Direction = 'right',
  autoplay = true,
  speed = 0.5,
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  title?: string;
  subtitle?: string;
  doubleRow?: boolean;
  row1Direction?: RowDirection;
  row2Direction?: RowDirection;
  autoplay?: boolean;
  speed?: number;
}) => {
  const { id: sectionId, connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const editor = useEditor();
  const query = editor?.query;
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const [offsets, setOffsets] = useState({ offset1: 0, offset2: 0 });
  const pausedRef = useRef(false);
  const maxOffset = NUM_CARDS * (CARD_WIDTH + GAP);
  const getNodeSafe = typeof query?.getNode === 'function' ? query.getNode.bind(query) : () => null;
  const cardIds = Array.from({ length: NUM_CARDS }, (_, i) => `${sectionId}-card-${i}`);

  useEffect(() => {
    if (enabled || !autoplay) return;
    let animFrame: number;
    const animate = () => {
      setOffsets((prev) => {
        if (pausedRef.current) return prev;
        const next1 = row1Direction === 'left'
          ? (prev.offset1 >= maxOffset ? 0 : prev.offset1 + speed)
          : (prev.offset1 <= 0 ? maxOffset : prev.offset1 - speed);
        const next2 = row2Direction === 'left'
          ? (prev.offset2 >= maxOffset ? 0 : prev.offset2 + speed)
          : (prev.offset2 <= 0 ? maxOffset : prev.offset2 - speed);
        return { offset1: next1, offset2: next2 };
      });
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [enabled, autoplay, speed, row1Direction, row2Direction, maxOffset]);

  const t = tokens[colorScheme];
  const gridLines =
    `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`;

  const getCardProps = (cardIndex: number) => {
    const node = getNodeSafe(cardIds[cardIndex]);
    const base = node?.data?.props ? { ...node.data.props, accentColor, colorScheme } : { ...DEFAULT_CARD_PROPS[cardIndex], accentColor, colorScheme };
    return base as TestimonialCardProps;
  };

  const renderRow = (offset: number) => (
    <div
      style={{
        display: 'flex',
        gap: GAP,
        transform: `translateX(-${offset}px)`,
        width: 'max-content',
      }}
    >
      {[...Array(NUM_CARDS * 2)].map((_, i) => {
        const cardIndex = i % NUM_CARDS;
        const props = getCardProps(cardIndex);
        if (i < NUM_CARDS) {
          return (
            <Element
              key={cardIds[cardIndex]}
              id={cardIds[cardIndex]}
              is={TestimonialCard}
              canvas
              {...props}
            />
          );
        }
        return (
          <div
            key={`dup-${i}`}
            style={{ width: CARD_WIDTH, flexShrink: 0, border: `1px solid ${t.cardBorder}`, borderRadius: 4, padding: 24, background: t.cardBg }}
          >
            <TestimonialCardContent quote={props.quote} author={props.author} role={props.role} company={props.company} accentColor={accentColor} colorScheme={colorScheme} />
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`w-full max-w-full py-12 md:py-20 `}
      style={{
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: '50px 50px',
      }}
    >
      <div className="px-4 md:px-8">
        <div className="text-center mb-12 md:mb-16 max-w-6xl mx-auto">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: t.text, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 16, color: t.muted, marginTop: 12, marginBottom: 0 }}>{subtitle}</p>
        </div>
      </div>
      <div
        style={{ width: '100%', overflow: 'hidden' }}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        <div>{renderRow(offsets.offset1)}</div>
        {doubleRow && <div style={{ marginTop: 24 }}>{renderRow(offsets.offset2)}</div>}
      </div>
    </section>
  );
};

const TronTestimonialsSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, title, subtitle, doubleRow, row1Direction, row2Direction, autoplay, speed } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as 'dark' | 'light',
    accentColor: node.data.props.accentColor as string,
    title: node.data.props.title as string,
    subtitle: node.data.props.subtitle as string,
    doubleRow: node.data.props.doubleRow as boolean,
    row1Direction: node.data.props.row1Direction as RowDirection,
    row2Direction: node.data.props.row2Direction as RowDirection,
    autoplay: node.data.props.autoplay as boolean,
    speed: node.data.props.speed as number,
  }));
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

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
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Carousel</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={doubleRow ?? false} onChange={(e) => setProp((p: Record<string, unknown>) => { p.doubleRow = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" /> Double Row</label>
          <div><label className={labelCls}>Row 1 Direction</label><select value={row1Direction ?? 'left'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.row1Direction = e.target.value; })} className={inputCls}><option value="left">Left</option><option value="right">Right</option></select></div>
          <div><label className={labelCls}>Row 2 Direction</label><select value={row2Direction ?? 'right'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.row2Direction = e.target.value; })} className={inputCls}><option value="left">Left</option><option value="right">Right</option></select></div>
          <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={autoplay !== false} onChange={(e) => setProp((p: Record<string, unknown>) => { p.autoplay = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" /> Autoplay</label>
          <div><label className={labelCls}>Speed — {speed ?? 0.5}</label><input type="range" min={0.1} max={2} step={0.1} value={speed ?? 0.5} onChange={(e) => setProp((p: Record<string, unknown>) => { p.speed = parseFloat(e.target.value); })} className="w-full h-2 rounded bg-gray-700 accent-red-500" /></div>
        </div>
      </section>
    </div>
  );
};

TronTestimonials.craft = {
  displayName: 'Tron Testimonials',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    title: 'What people say',
    subtitle: 'Trusted by teams worldwide',
    doubleRow: false,
    row1Direction: 'left',
    row2Direction: 'right',
    autoplay: true,
    speed: 0.5,
  },
  related: { settings: TronTestimonialsSettings },
  custom: {
    styleTags: ['dark', 'neon', 'social-proof'],
    businessTags: ['testimonials', 'saas', 'tech'],
    featureTags: ['testimonials', 'social-proof'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
