'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useEffect } from 'react';
import ContentEditable from 'react-contenteditable';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const Hero = ({
  title = 'Build something',
  titleAccent = 'people love',
  subtitle = 'Create modern landing pages and websites in minutes. No code required.',
  primaryBtnText = 'Get started',
  secondaryBtnText = 'Learn more',
  minHeight = 600,
  badgeText = '✦ New Platform Launch',
  socialProofText = '2,000+ businesses already running',
  gradientFrom = '#0f172a',
  gradientTo = '#1e1b4b',
  animationType = 'none',
}: {
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  primaryBtnText?: string;
  secondaryBtnText?: string;
  minHeight?: number;
  badgeText?: string;
  socialProofText?: string;
  gradientFrom?: string;
  gradientTo?: string;
  animationType?: string;
}) => {
  const {
    connectors: { connect, drag },
    actions,
  } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    if (!isSelected) setEditingField(null);
  }, [isSelected]);

  const baseGradient = `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 50%, ${gradientFrom} 100%)`;
  const gridLines = 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)';
  const radialGlow = 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)';

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Hero Debug]', {
      enabled,
      gradientFrom,
      gradientTo,
      rootStyle: { backgroundImage: baseGradient },
      isSelected,
    });
  }

  return (
    <section
      ref={(ref) => {
        if (ref) {
          if (!editingField) connect(drag(ref));
          else connect(ref);
        }
      }}
      {...dataAttrs}
      className={`flex flex-col items-center justify-center text-center px-4 md:px-8 lg:px-16 py-12 md:py-20 w-full max-w-full relative overflow-hidden ${isSelected ? 'craft-node-selected craft-node-selected--classic' : ''}`}
      style={{
        minHeight: `${minHeight}px`,
        backgroundImage: `${radialGlow}, ${gridLines}, ${baseGradient}`,
        backgroundSize: '100% 100%, 60px 60px, 60px 60px, 100% 100%',
        backgroundPosition: '0 0, 0 0, 0 0, 0 0',
        backgroundRepeat: 'no-repeat, repeat, repeat, no-repeat' as const,
        cursor: editingField ? 'text' : undefined,
      }}
    >
      {badgeText && (
        <div
          style={{
            display: 'inline-flex',
            padding: '4px 12px',
            marginBottom: '24px',
            border: '1px solid rgba(99,102,241,0.4)',
            background: 'rgba(99,102,241,0.1)',
            borderRadius: 9999,
            fontSize: 13,
            color: '#a5b4fc',
          }}
        >
          {badgeText}
        </div>
      )}

      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight max-w-3xl mx-auto p-0">
        <ContentEditable
          tagName="span"
          html={title ?? ''}
          disabled={editingField !== 'title' || !enabled}
          onClick={(e) => { e.stopPropagation(); if (enabled && isSelected) setEditingField('title'); }}
          onBlur={() => setEditingField(null)}
          onChange={(e) => {
            actions.setProp((p: Record<string, unknown>) => {
              p.title = (e.target as { value: string }).value.replace(/<\/?[^>]+(>|$)/g, '');
            }, 1000);
          }}
          style={{ display: 'block', outline: 'none', cursor: enabled ? 'text' : 'default', color: '#fff' }}
        />
        <br />
        <ContentEditable
          tagName="span"
          html={titleAccent ?? ''}
          disabled={editingField !== 'titleAccent' || !enabled}
          onClick={(e) => { e.stopPropagation(); if (enabled && isSelected) setEditingField('titleAccent'); }}
          onBlur={() => setEditingField(null)}
          onChange={(e) => {
            actions.setProp((p: Record<string, unknown>) => {
              p.titleAccent = (e.target as { value: string }).value.replace(/<\/?[^>]+(>|$)/g, '');
            }, 1000);
          }}
          style={{
            display: 'block',
            outline: 'none',
            cursor: enabled ? 'text' : 'default',
            background: 'linear-gradient(135deg, #FF6B35, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        />
      </h1>

      <ContentEditable
        tagName="p"
        html={subtitle ?? ''}
        disabled={editingField !== 'subtitle' || !enabled}
        onClick={(e) => { e.stopPropagation(); if (enabled && isSelected) setEditingField('subtitle'); }}
        onBlur={() => setEditingField(null)}
        onChange={(e) => {
          actions.setProp((p: Record<string, unknown>) => {
            p.subtitle = (e.target as { value: string }).value.replace(/<\/?[^>]+(>|$)/g, '');
          }, 1000);
        }}
        className="text-base md:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto mt-5 py-0 outline-none"
        style={{
          cursor: enabled ? 'text' : 'default',
        }}
      />

      <div className="flex flex-col sm:flex-row gap-3 mt-10 justify-center">
        <button
          type="button"
          style={{
            background: '#FF6B35',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: 8,
            boxShadow: '0 0 20px rgba(255,107,53,0.4)',
            fontWeight: 600,
            fontSize: 15,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ContentEditable
            tagName="span"
            html={primaryBtnText ?? ''}
            disabled={editingField !== 'primaryBtn' || !enabled}
            onClick={(e) => { e.stopPropagation(); if (enabled && isSelected) setEditingField('primaryBtn'); }}
            onBlur={() => setEditingField(null)}
            onChange={(e) => {
              actions.setProp((p: Record<string, unknown>) => {
                p.primaryBtnText = (e.target as { value: string }).value.replace(/<\/?[^>]+(>|$)/g, '');
              }, 1000);
            }}
            style={{ outline: 'none', cursor: enabled ? 'text' : 'pointer', pointerEvents: enabled ? 'auto' : 'none' }}
          />
        </button>
        <button
          type="button"
          style={{
            background: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '14px 32px',
            borderRadius: 8,
            backdropFilter: 'blur(10px)',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          <ContentEditable
            tagName="span"
            html={secondaryBtnText ?? ''}
            disabled={editingField !== 'secondaryBtn' || !enabled}
            onClick={(e) => { e.stopPropagation(); if (enabled && isSelected) setEditingField('secondaryBtn'); }}
            onBlur={() => setEditingField(null)}
            onChange={(e) => {
              actions.setProp((p: Record<string, unknown>) => {
                p.secondaryBtnText = (e.target as { value: string }).value.replace(/<\/?[^>]+(>|$)/g, '');
              }, 1000);
            }}
            style={{ outline: 'none', cursor: enabled ? 'text' : 'pointer', pointerEvents: enabled ? 'auto' : 'none' }}
          />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-12">
        <div className="flex">
          {AVATAR_COLORS.map((color, i) => (
            <div
              key={color}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: color,
                marginLeft: i === 0 ? 0 : -8,
                border: '2px solid #0f172a',
                boxSizing: 'border-box',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span style={{ fontSize: 14, color: '#f59e0b' }}>★★★★★</span>
          <span style={{ fontSize: 14, color: '#64748b' }}>{socialProofText}</span>
        </div>
      </div>
    </section>
  );
};

const HeroSettings = () => {
  const {
    actions: { setProp },
    title,
    titleAccent,
    subtitle,
    primaryBtnText,
    secondaryBtnText,
    minHeight,
    badgeText,
    socialProofText,
    gradientFrom,
    gradientTo,
    animationType,
  } = useNode((node) => ({
    title: node.data.props.title as string,
    titleAccent: node.data.props.titleAccent as string,
    subtitle: node.data.props.subtitle as string,
    primaryBtnText: node.data.props.primaryBtnText as string,
    secondaryBtnText: node.data.props.secondaryBtnText as string,
    minHeight: node.data.props.minHeight as number,
    badgeText: node.data.props.badgeText as string,
    socialProofText: node.data.props.socialProofText as string,
    gradientFrom: node.data.props.gradientFrom as string,
    gradientTo: node.data.props.gradientTo as string,
    animationType: node.data.props.animationType as string,
  }));

  const set = (key: string) => (val: string | number) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; });
  const setT = (key: string, ms: number) => (val: string | number) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title (line 1)</label>
            <input type="text" value={title ?? ''} onChange={(e) => set('title')(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title accent (line 2, gradient)</label>
            <input type="text" value={titleAccent ?? ''} onChange={(e) => set('titleAccent')(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <input type="text" value={subtitle ?? ''} onChange={(e) => set('subtitle')(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Badge text</label>
            <input type="text" value={badgeText ?? ''} onChange={(e) => set('badgeText')(e.target.value)} className={inputCls} placeholder="✦ New Platform Launch" />
          </div>
          <div>
            <label className={labelCls}>Primary button</label>
            <input type="text" value={primaryBtnText ?? ''} onChange={(e) => set('primaryBtnText')(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Secondary button</label>
            <input type="text" value={secondaryBtnText ?? ''} onChange={(e) => set('secondaryBtnText')(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Social proof text</label>
            <input type="text" value={socialProofText ?? ''} onChange={(e) => set('socialProofText')(e.target.value)} className={inputCls} placeholder="2,000+ businesses already running" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Layout</h3>
        <div>
          <label className={labelCls}>Min height — {minHeight ?? 600}px</label>
          <input
            type="number"
            min={400}
            max={1200}
            value={minHeight ?? 600}
            onChange={(e) => set('minHeight')(Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Gradient</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className={`${labelCls} shrink-0 w-20`}>From</label>
            <input
              type="color"
              value={gradientFrom ?? '#0f172a'}
              onChange={(e) => setT('gradientFrom', 300)(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-[10px] font-mono text-gray-500 truncate">{gradientFrom}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className={`${labelCls} shrink-0 w-20`}>To</label>
            <input
              type="color"
              value={gradientTo ?? '#1e1b4b'}
              onChange={(e) => setT('gradientTo', 300)(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-[10px] font-mono text-gray-500 truncate">{gradientTo}</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div>
          <label className={labelCls}>Type (preview only)</label>
          <select
            value={animationType ?? 'none'}
            onChange={(e) => set('animationType')(e.target.value)}
            className={inputCls}
          >
            <option value="none">None</option>
            <option value="fade-in">Fade in</option>
            <option value="slide-up">Slide up</option>
            <option value="scale-in">Scale in</option>
          </select>
        </div>
      </section>
    </div>
  );
};

Hero.craft = {
  displayName: 'Hero',
  props: {
    title: 'Build something',
    titleAccent: 'people love',
    subtitle: 'Create modern landing pages and websites in minutes. No code required.',
    primaryBtnText: 'Get started',
    secondaryBtnText: 'Learn more',
    minHeight: 600,
    badgeText: '✦ New Platform Launch',
    socialProofText: '2,000+ businesses already running',
    gradientFrom: '#0f172a',
    gradientTo: '#1e1b4b',
    animationType: 'none',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
  related: {
    settings: HeroSettings,
  },
};
