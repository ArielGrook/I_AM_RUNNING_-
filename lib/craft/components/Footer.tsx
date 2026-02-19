'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState } from 'react';

type LinkItem = { label: string; href: string };

export const Footer = ({
  bgColor = '#020617',
  logoText = 'BRAND',
  tagline = 'Build websites that convert.',
  copyright: copyrightText = '© 2026 Brand Inc. All rights reserved.',
  links = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  animationType = 'none',
  animateDelay = '0',
}: {
  bgColor?: string;
  logoText?: string;
  tagline?: string;
  copyright?: string;
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
    <footer
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      {...dataAttrs}
      style={{
        background: bgColor,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '60px 24px 32px',
        maxWidth: '100%',
        outline: isSelected ? '2px solid #f97316' : undefined,
        outlineOffset: '2px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, maxWidth: 1200, margin: '0 auto' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{logoDisplay}</div>
          <p style={{ fontSize: 14, color: '#475569', maxWidth: 240, marginTop: 8, margin: '8px 0 0' }}>{tagline}</p>
        </div>
        <div style={{ display: 'flex', gap: 48 }}>
          {['Product', 'Company', 'Legal'].map((title, colIndex) => (
            <div key={title}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(links ?? []).slice(colIndex * 2, colIndex * 2 + 2).map((link, i) => {
                  const idx = colIndex * 2 + i;
                  return (
                    <a
                      key={idx}
                      href={link.href}
                      onMouseEnter={() => setHoveredLink(idx)}
                      onMouseLeave={() => setHoveredLink(null)}
                      style={{
                        fontSize: 14,
                        color: hoveredLink === idx ? '#fff' : '#64748b',
                        textDecoration: 'none',
                      }}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 48, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24 }}>
        <span style={{ fontSize: 14, color: '#475569' }}>{copyrightText}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {['X', 'GH', 'in'].map((icon, i) => (
            <div
              key={i}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

const FooterSettings = () => {
  const { actions: { setProp }, bgColor, logoText, tagline, copyright, links } = useNode((node) => ({
    bgColor: node.data.props.bgColor as string,
    logoText: node.data.props.logoText as string,
    tagline: node.data.props.tagline as string,
    copyright: node.data.props.copyright as string,
    links: node.data.props.links as LinkItem[],
  }));

  const setT = (key: string, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Style</h3>
        <div>
          <label className={labelCls}>Background</label>
          <input type="color" value={bgColor ?? '#020617'} onChange={(e) => setT('bgColor', 300)(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Logo text</label><input type="text" value={logoText ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.logoText = e.target.value; })} className={inputCls} /></div>
          <div><label className={labelCls}>Tagline</label><input type="text" value={tagline ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.tagline = e.target.value; })} className={inputCls} /></div>
          <div><label className={labelCls}>Copyright</label><input type="text" value={copyright ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.copyright = e.target.value; })} className={inputCls} /></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Links</h3>
        <div className="space-y-2">
          {(links ?? []).map((link, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={link.label} onChange={(e) => setProp((p: Record<string, unknown>) => { const arr = [...(p.links as LinkItem[])]; arr[i] = { ...arr[i], label: e.target.value }; p.links = arr; })} className={`${inputCls} flex-1`} />
              <input type="text" value={link.href} onChange={(e) => setProp((p: Record<string, unknown>) => { const arr = [...(p.links as LinkItem[])]; arr[i] = { ...arr[i], href: e.target.value }; p.links = arr; })} className={`${inputCls} flex-1`} />
              <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.links = (p.links as LinkItem[]).filter((_, j) => j !== i); })} className="px-2 text-red-400 text-xs">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.links = [...(p.links as LinkItem[] || []), { label: 'Link', href: '#' }]; })} className="w-full py-1.5 text-xs border border-dashed border-gray-600 text-gray-400 rounded">+ Add link</button>
        </div>
      </section>
    </div>
  );
};

Footer.craft = {
  displayName: 'Footer',
  props: {
    bgColor: '#020617',
    logoText: 'BRAND',
    tagline: 'Build websites that convert.',
    copyright: '© 2026 Brand Inc. All rights reserved.',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Contact', href: '#' },
    ],
    animationType: 'none',
    animateDelay: '0',
  },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: FooterSettings },
};
