'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState } from 'react';
import { Menu } from 'lucide-react';

type LinkItem = { label: string; href: string };

export const Header = ({
  bgColor = '#0a0f1e',
  logoText = 'BRAND',
  sticky = true,
  links = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ],
  animationType = 'none',
  animateDelay = '0',
}: {
  bgColor?: string;
  logoText?: string;
  sticky?: boolean;
  links?: LinkItem[];
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const enabled = useEditor((state) => state.options.enabled);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    dataAttrs['data-animate-delay'] = animateDelay ?? '0';
  }

  const logoDisplay = logoText?.length ? (
    <>
      <span style={{ color: '#FF6B35' }}>{logoText[0]}</span>
      {logoText.slice(1)}
    </>
  ) : 'BRAND';

  return (
    <header
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      style={{
        background: bgColor,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 50,
        padding: '0 24px',
        height: 64,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '100%',
        outline: isSelected ? '2px solid #f97316' : undefined,
        outlineOffset: '2px',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
        {logoDisplay}
      </div>
      <nav className="hidden md:flex gap-8">
        {(links ?? []).map((link, i) => (
          <a
            key={i}
            href={link.href}
            onMouseEnter={() => setHoveredLink(i)}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              color: hoveredLink === i ? '#fff' : '#94a3b8',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          className="flex md:hidden p-2 text-white"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>
        <button
          type="button"
          style={{
            background: '#FF6B35',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Get Started
        </button>
      </div>
    </header>
  );
};

const HeaderSettings = () => {
  const { actions: { setProp }, bgColor, logoText, sticky, links } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
    logoText: node.data.props.logoText as string,
    sticky: node.data.props.sticky as boolean,
    links: node.data.props.links as LinkItem[],
  }));

  const setT = (key: string, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const updateLink = (index: number, field: 'label' | 'href', value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.links as LinkItem[])];
      arr[index] = { ...arr[index], [field]: value };
      p.links = arr;
    });
  };

  const addLink = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.links as LinkItem[] || [])];
      arr.push({ label: 'Link', href: '#' });
      p.links = arr;
    });
  };

  const removeLink = (index: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = (p.links as LinkItem[]).filter((_, i) => i !== index);
      p.links = arr;
    });
  };

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Background</label>
            <input
              type="color"
              value={bgColor?.startsWith('var') ? '#0a0f1e' : (bgColor ?? '#0a0f1e')}
              onChange={(e) => setT('bgColor', 300)(e.target.value)}
              className="w-full h-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="header-sticky"
              checked={sticky ?? true}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.sticky = e.target.checked; })}
              className="rounded"
            />
            <label htmlFor="header-sticky" className="text-sm text-gray-300">Sticky</label>
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Logo</h3>
        <div>
          <label className={labelCls}>Logo text</label>
          <input
            type="text"
            value={logoText ?? ''}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.logoText = e.target.value; })}
            className={inputCls}
          />
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Links</h3>
        <div className="space-y-2">
          {(links ?? []).map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
                className={`${inputCls} flex-1`}
                placeholder="Label"
              />
              <input
                type="text"
                value={link.href}
                onChange={(e) => updateLink(i, 'href', e.target.value)}
                className={`${inputCls} flex-1`}
                placeholder="href"
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 rounded"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 hover:border-[#FF6B35] rounded"
          >
            + Add link
          </button>
        </div>
      </section>
    </div>
  );
};

Header.craft = {
  displayName: 'Header',
  props: {
    bgColor: '#0a0f1e',
    logoText: 'BRAND',
    sticky: true,
    links: [
      { label: 'Home', href: '#' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Contact', href: '#contact' },
    ],
    animationType: 'none',
    animateDelay: '0',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
  related: { settings: HeaderSettings },
};
