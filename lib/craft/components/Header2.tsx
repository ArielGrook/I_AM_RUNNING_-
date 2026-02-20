'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState } from 'react';

type NavLinkItem = { label: string; href: string };

const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export const Header2 = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  logoText = 'BRAND',
  navLinks = DEFAULT_NAV_LINKS,
  ctaText = 'Get Started',
  ctaHref = '#',
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  logoText?: string;
  navLinks?: NavLinkItem[];
  ctaText?: string;
  ctaHref?: string;
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);

  const tokens = {
    dark: {
      bg: 'rgba(10,10,10,0.92)',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      accent: accentColor,
      border: 'rgba(255,255,255,0.08)',
    },
    light: {
      bg: 'rgba(255,255,255,0.92)',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      accent: accentColor,
      border: 'rgba(0,0,0,0.08)',
    },
  };
  const t = tokens[colorScheme];

  const dataAttrs: Record<string, string> = {};
  if (!enabled && animationType && animationType !== 'none') {
    dataAttrs['data-animate'] = animationType;
    if (animateDelay && animateDelay !== '0') {
      dataAttrs['data-animate-delay'] = animateDelay;
    }
  }

  const logoDisplay = logoText?.length ? (
    <>
      <span style={{ color: t.accent }}>{logoText[0]}</span>
      <span style={{ color: t.text }}>{logoText.slice(1)}</span>
    </>
  ) : (
    <>
      <span style={{ color: t.accent }}>B</span>
      <span style={{ color: t.text }}>RAND</span>
    </>
  );

  const links = navLinks ?? DEFAULT_NAV_LINKS;

  return (
    <header
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="header"
      data-block-category="navigation"
      {...dataAttrs}
      className={`w-full sticky top-0 z-50 transition-[background] duration-200 ${isSelected ? 'outline outline-2 outline-red-500 outline-offset-0' : ''}`}
      style={{
        background: t.bg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <div
            className="shrink-0"
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {logoDisplay}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.href}
                onMouseEnter={() => setHoveredNavIndex(i)}
                onMouseLeave={() => setHoveredNavIndex(null)}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: hoveredNavIndex === i ? t.text : t.textSecondary,
                  transition: 'color 150ms ease',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={ctaHref}
              className="hidden md:inline-block"
              style={{
                background: t.accent,
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                transition: 'opacity 150ms ease, transform 150ms ease',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {ctaText}
            </a>

            <button
              type="button"
              className="flex md:hidden p-2 border-0 bg-transparent cursor-pointer"
              style={{ color: t.text }}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="4" y1="4" x2="20" y2="20" />
                  <line x1="20" y1="4" x2="4" y2="20" />
                </svg>
              ) : (
                <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 z-50"
          style={{
            background: t.bg,
            borderBottom: `1px solid ${t.border}`,
            padding: 16,
          }}
        >
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px 16px',
                fontSize: 15,
                color: t.text,
                textDecoration: 'none',
                borderBottom: i < links.length - 1 ? `1px solid ${t.border}` : undefined,
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href={ctaHref}
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'block',
              marginTop: 12,
              background: t.accent,
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center' as const,
              textDecoration: 'none',
            }}
          >
            {ctaText}
          </a>
        </div>
      )}
    </header>
  );
};

const Header2Settings = () => {
  const {
    actions: { setProp },
    colorScheme,
    accentColor,
    logoText,
    ctaText,
    ctaHref,
    navLinks,
    animationType,
    animateDelay,
  } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as string,
    accentColor: node.data.props.accentColor as string,
    logoText: node.data.props.logoText as string,
    ctaText: node.data.props.ctaText as string,
    ctaHref: node.data.props.ctaHref as string,
    navLinks: node.data.props.navLinks as NavLinkItem[],
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));

  const setT = (key: string, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const links = navLinks ?? DEFAULT_NAV_LINKS;

  return (
    <div className="p-3 space-y-5 text-white">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Theme</h3>
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Color Scheme</label>
            <select
              value={colorScheme ?? 'dark'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.colorScheme = e.target.value; })}
              className={inputCls}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Accent Color</label>
            <input
              type="color"
              value={accentColor ?? '#e11d48'}
              onChange={(e) => setT('accentColor', 300)(e.target.value)}
              className="w-full h-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Logo Text</label>
            <input
              type="text"
              value={logoText ?? ''}
              onChange={(e) => setT('logoText', 500)(e.target.value)}
              className={inputCls}
              placeholder="BRAND"
            />
          </div>
          <div>
            <label className={labelCls}>CTA Button Text</label>
            <input
              type="text"
              value={ctaText ?? ''}
              onChange={(e) => setT('ctaText', 500)(e.target.value)}
              className={inputCls}
              placeholder="Get Started"
            />
          </div>
          <div>
            <label className={labelCls}>CTA Button Link</label>
            <input
              type="text"
              value={ctaHref ?? '#'}
              onChange={(e) => setT('ctaHref', 500)(e.target.value)}
              className={inputCls}
              placeholder="#"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Nav Links</h3>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-center mb-2">
              <input
                value={link.label}
                placeholder="Label"
                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded px-2 py-1.5 text-sm text-white"
                onChange={(e) =>
                  setProp(
                    (p: Record<string, unknown>) => {
                      const arr = [...(p.navLinks as NavLinkItem[])];
                      if (arr[i]) arr[i] = { ...arr[i], label: e.target.value };
                      p.navLinks = arr;
                    },
                    500
                  )
                }
              />
              <input
                value={link.href}
                placeholder="#section"
                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded px-2 py-1.5 text-sm text-white"
                onChange={(e) =>
                  setProp(
                    (p: Record<string, unknown>) => {
                      const arr = [...(p.navLinks as NavLinkItem[])];
                      if (arr[i]) arr[i] = { ...arr[i], href: e.target.value };
                      p.navLinks = arr;
                    },
                    500
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  setProp((p: Record<string, unknown>) => {
                    p.navLinks = (p.navLinks as NavLinkItem[]).filter((_, idx) => idx !== i);
                  })
                }
                className="text-red-400 hover:text-red-300 text-lg leading-none px-1"
                title="Remove link"
              >
                ×
              </button>
            </div>
          ))}
          {links.length < 6 && (
            <button
              type="button"
              onClick={() =>
                setProp((p: Record<string, unknown>) => {
                  p.navLinks = [...(p.navLinks as NavLinkItem[]), { label: 'New Link', href: '#' }];
                })
              }
              className="w-full border border-dashed border-[#3a3a3a] rounded py-2 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors mt-1"
            >
              + Add Link
            </button>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Type</label>
            <select
              value={animationType ?? 'none'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })}
              className={inputCls}
            >
              <option value="none">None</option>
              <option value="fade-in">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="slide-left">Slide Left</option>
              <option value="scale-in">Scale In</option>
              <option value="blur-in">Blur In</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay (s)</label>
            <select
              value={animateDelay ?? '0'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })}
              className={inputCls}
            >
              <option value="0">0s</option>
              <option value="0.1">0.1s</option>
              <option value="0.2">0.2s</option>
              <option value="0.3">0.3s</option>
              <option value="0.5">0.5s</option>
              <option value="0.8">0.8s</option>
              <option value="1">1s</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
};

Header2.craft = {
  displayName: 'Header 2',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    logoText: 'BRAND',
    navLinks: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
    ],
    ctaText: 'Get Started',
    ctaHref: '#',
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: Header2Settings },
  custom: {
    styleTags: ['dark', 'minimal', 'bold'],
    businessTags: ['startup', 'saas', 'agency', 'tech', 'finance'],
    featureTags: ['header', 'navigation', 'sticky'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
  },
};
