'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useEffect, useContext } from 'react';
import ContentEditable from 'react-contenteditable';
import * as LucideIcons from 'lucide-react';
import { PagesContext } from '@/lib/craft/context/PagesContext';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
type LinkType = 'none' | 'external' | 'page' | 'section';

const ICON_OPTIONS = [
  'none', 'ArrowRight', 'ArrowLeft', 'ChevronRight', 'Download',
  'ExternalLink', 'Mail', 'Phone', 'Star', 'Heart', 'Zap', 'Check',
  'Plus', 'Send', 'ShoppingCart', 'Play',
];

function DynamicIcon({ name, size = 16 }: { name: string; size?: number }) {
  if (name === 'none') return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export const Button = ({
  text = 'Click me',
  bgColor = 'var(--palette-primary, #FF6B35)',
  textColor = 'var(--palette-bg, #ffffff)',
  borderRadius = 8,
  variant = 'solid',
  iconName = 'none',
  linkType = 'external',
  href = '',
  pageSlug = '',
  sectionId = '',
  size = 'md',
}: {
  text?: string;
  bgColor?: string;
  textColor?: string;
  borderRadius?: number;
  variant?: ButtonVariant;
  iconName?: string;
  linkType?: LinkType;
  href?: string;
  pageSlug?: string;
  sectionId?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const {
    connectors: { connect, drag },
    actions,
  } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { navigateTo } = useContext(PagesContext);
  const [editingField, setEditingField] = useState(false);

  const handleClick = () => {
    if (enabled) return;
    if (linkType === 'page' && pageSlug) {
      navigateTo(pageSlug);
    } else if (linkType === 'section' && sectionId) {
      const sel = sectionId.startsWith('#') ? sectionId : `#${sectionId}`;
      document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' });
    } else if ((linkType === 'external' || linkType === 'none') && href) {
      window.open(href, '_blank');
    }
  };

  useEffect(() => {
    if (!isSelected) setEditingField(false);
  }, [isSelected]);

  const paddingMap = { sm: '8px 20px', md: '12px 32px', lg: '16px 48px' };
  const fontSizeMap = { sm: '14px', md: '16px', lg: '18px' };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: paddingMap[size],
    borderRadius: `${borderRadius}px`,
    fontSize: fontSizeMap[size],
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    textDecoration: 'none',
    ...(variant === 'solid' && {
      background: bgColor,
      color: textColor,
      border: 'none',
    }),
    ...(variant === 'outline' && {
      background: 'transparent',
      color: bgColor,
      border: `2px solid ${bgColor}`,
    }),
    ...(variant === 'ghost' && {
      background: 'transparent',
      color: bgColor,
      border: 'none',
    }),
  };

  const inner = (
    <>
      <DynamicIcon name={iconName} size={parseInt(fontSizeMap[size])} />
      <ContentEditable
        tagName="span"
        html={text ?? ''}
        disabled={!editingField || !enabled}
        onClick={(e) => { e.stopPropagation(); if (enabled && isSelected) setEditingField(true); }}
        onBlur={() => setEditingField(false)}
        onChange={(e) => {
          actions.setProp((p: Record<string, unknown>) => {
            p.text = (e.target as { value: string }).value.replace(/<\/?[^>]+(>|$)/g, '');
          }, 1000);
        }}
        style={{ outline: 'none', cursor: enabled ? 'text' : 'pointer', pointerEvents: 'auto' }}
      />
    </>
  );

  const refFn = (ref: HTMLElement | null) => {
    if (!ref) return;
    if (editingField) connect(ref as unknown as HTMLElement);
    else connect(drag(ref as unknown as HTMLElement));
  };

  return (
    <button
      ref={refFn as (ref: HTMLButtonElement | null) => void}
      type="button"
      style={baseStyle}
      onClick={handleClick}
    >
      {inner}
    </button>
  );
};

const ButtonSettings = () => {
  const {
    actions: { setProp },
    text, bgColor, textColor, borderRadius, variant, iconName, linkType, href, pageSlug, sectionId, size,
  } = useNode((node) => ({
    text:         node.data.props.text as string,
    bgColor:      node.data.props.bgColor as string,
    textColor:    node.data.props.textColor as string,
    borderRadius: node.data.props.borderRadius as number,
    variant:      node.data.props.variant as ButtonVariant,
    iconName:     node.data.props.iconName as string,
    linkType:     node.data.props.linkType as LinkType,
    href:         node.data.props.href as string,
    pageSlug:     node.data.props.pageSlug as string,
    sectionId:    node.data.props.sectionId as string,
    size:         node.data.props.size as string,
  }));
  const { pages } = useContext(PagesContext);

  const set = (key: string) => (val: string | number) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; });
  const setT = (key: string, ms: number) => (val: string | number) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  return (
    <div className="p-3 space-y-5 text-white">

      {/* Content */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Label</label>
            <input
              type="text" value={text ?? 'Click me'}
              onChange={(e) => setT('text', 500)(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white"
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Icon</label>
            <select
              value={iconName ?? 'none'}
              onChange={(e) => set('iconName')(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 border border-gray-600 text-white"
            >
              {ICON_OPTIONS.map((ic) => (
                <option key={ic} value={ic}>{ic === 'none' ? '— None —' : ic}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Style */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Variant</label>
            <div className="flex gap-1">
              {(['solid', 'outline', 'ghost'] as ButtonVariant[]).map((v) => (
                <button key={v} onClick={() => set('variant')(v)}
                  className={`flex-1 py-1 text-xs rounded border capitalize transition-colors ${
                    variant === v ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
                >{v}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Size</label>
            <div className="flex gap-1">
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <button key={s} onClick={() => set('size')(s)}
                  className={`flex-1 py-1 text-xs rounded border uppercase transition-colors ${
                    size === s ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10' : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">
              Border Radius — {borderRadius ?? 8}px
            </label>
            <input type="range" min="0" max="50" value={borderRadius ?? 8}
              onChange={(e) => setT('borderRadius', 500)(Number(e.target.value))}
              className="w-full accent-[#FF6B35]"
            />
          </div>
        </div>
      </section>

      {/* Colors */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Colors</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Primary Color</label>
            <div className="flex gap-2 items-center">
              <input type="color"
                value={bgColor?.startsWith('var') ? '#FF6B35' : (bgColor ?? '#FF6B35')}
                onChange={(e) => setT('bgColor', 300)(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="text-xs text-gray-400 font-mono truncate">{bgColor}</span>
            </div>
          </div>
          {variant === 'solid' && (
            <div>
              <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Text Color</label>
              <div className="flex gap-2 items-center">
                <input type="color"
                  value={textColor?.startsWith('var') ? '#ffffff' : (textColor ?? '#ffffff')}
                  onChange={(e) => setT('textColor', 300)(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs text-gray-400 font-mono truncate">{textColor}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Link */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Link</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Type</label>
            <select
              value={linkType ?? 'external'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.linkType = e.target.value; })}
              className="w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white"
            >
              <option value="external">External URL</option>
              <option value="page">Page in project</option>
              <option value="section">Section on page</option>
              <option value="none">None</option>
            </select>
          </div>
          {linkType === 'page' && (
            <div>
              <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Page</label>
              <select
                value={pageSlug ?? ''}
                onChange={(e) => setProp((p: Record<string, unknown>) => { p.pageSlug = e.target.value; })}
                className="w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.slug}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          {linkType === 'section' && (
            <div>
              <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">Section ID</label>
              <input
                type="text"
                value={sectionId ?? ''}
                onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionId = e.target.value; }, 500)}
                placeholder="#section-id"
                className="w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white font-mono"
              />
            </div>
          )}
          {(linkType === 'external' || linkType === 'none') && (
            <div>
              <label className="block text-xs mb-1.5 text-gray-400 uppercase tracking-wide">URL</label>
              <input
                type="text"
                value={href ?? ''}
                onChange={(e) => setT('href', 500)(e.target.value)}
                placeholder="https://..."
                className="w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white font-mono"
              />
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

Button.craft = {
  displayName: 'Button',
  props: {
    text:         'Click me',
    bgColor:      'var(--palette-primary, #FF6B35)',
    textColor:    'var(--palette-bg, #ffffff)',
    borderRadius: 8,
    variant:      'solid',
    iconName:     'none',
    linkType:     'external',
    href:         '',
    pageSlug:     '',
    sectionId:    '',
    size:         'md',
  },
  rules: {
    canDrag: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: ButtonSettings,
  },
};
