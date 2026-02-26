'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { PagesContext } from '@/lib/craft/context/PagesContext';

// ── Interfaces ─────────────────────────────────────────────────────────────
interface NavLink {
  label: string;
  href: string;
}

interface HeaderTronProps {
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  brandName?: string;
  navLinks?: NavLink[];
  ctaText?: string;
  showCta?: boolean;
  sticky?: boolean;
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' },
];

// ── Tokens (darkBg/lightBg from props, like TronContact) ───────────────────
function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark: {
      bg: darkBg ?? '#0a0a0a',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      border: 'rgba(255,255,255,0.08)',
    },
    light: {
      bg: lightBg ?? '#ffffff',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      border: 'rgba(0,0,0,0.08)',
    },
  };
}

// ── Hamburger SVG icons ─────────────────────────────────────────────────────
const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Main component ──────────────────────────────────────────────────────────
export const HeaderTron = React.memo(function HeaderTron() {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();
  const { navigateTo } = React.useContext(PagesContext);

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsMobile((entry?.contentRect?.width ?? 0) < 520);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const props = useNode((node) => node.data.props as Partial<HeaderTronProps>) ?? {};
  const {
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    brandName = 'Brand',
    navLinks = DEFAULT_NAV_LINKS,
    ctaText = 'Get Started',
    showCta = true,
    sticky = true,
  } = props;

  const accentColor = propAccent ?? theme?.accentColor ?? '#FF6B35';
  const colorScheme = theme?.colorScheme ?? 'dark';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[colorScheme], accent: accentColor };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (enabled) {
      e.preventDefault();
      return;
    }
    if (href.startsWith('#')) {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    } else if (href.startsWith('/')) {
      e.preventDefault();
      navigateTo?.(href.replace(/^\//, ''));
    } else {
      e.preventDefault();
      window.open(href, '_blank');
    }
  };

  const links = Array.isArray(navLinks) ? navLinks : DEFAULT_NAV_LINKS;
  const firstLetter = brandName?.[0] ?? 'B';
  const restBrand = brandName?.slice(1) ?? 'rand';

  return (
    <header
      ref={(ref) => {
        if (ref) {
          connect(drag(ref as HTMLDivElement));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = ref;
        }
      }}
      data-block-type="header"
      className={`w-full ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 100,
        background: t.bg,
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo / Brand */}
          <div className="shrink-0" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: t.accent }}>{firstLetter}</span>
            <span style={{ color: t.text }}>{restBrand}</span>
          </div>

          {/* Desktop nav */}
          {!isMobile && (
            <nav className="flex items-center gap-8">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: t.textSecondary,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = t.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = t.textSecondary; }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* CTA (desktop) + Hamburger (mobile) */}
          <div className="flex items-center gap-3 shrink-0">
            {!isMobile && showCta && (
              <a
                href="#"
                onClick={(e) => handleNavClick(e, '#')}
                style={{
                  background: accentColor,
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                {ctaText}
              </a>
            )}
            {isMobile && (
              <button
                type="button"
                className="p-2 border-0 bg-transparent cursor-pointer"
                style={{ color: t.text }}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => {
                  if (!enabled) setMobileMenuOpen(!mobileMenuOpen);
                }}
              >
                {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown — only when !enabled */}
      {isMobile && mobileMenuOpen && !enabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: t.bg,
            borderBottom: `1px solid ${t.border}`,
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            zIndex: 50,
          }}
        >
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              onClick={(e) => {
                handleNavClick(e, link.href);
                setMobileMenuOpen(false);
              }}
              style={{
                padding: '12px 0',
                color: t.text,
                fontSize: 15,
                borderBottom: `1px solid ${t.border}`,
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          ))}
          {showCta && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                marginTop: 12,
                padding: '12px 24px',
                background: accentColor,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {ctaText}
            </button>
          )}
        </div>
      )}
    </header>
  );
});

// ── Settings ──────────────────────────────────────────────────────────────
function HeaderTronSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<HeaderTronProps>) ?? {};
  const {
    brandName = 'Brand',
    navLinks = DEFAULT_NAV_LINKS,
    ctaText = 'Get Started',
    showCta = true,
    sticky = true,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
  } = props;

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  const links = Array.isArray(navLinks) ? navLinks : DEFAULT_NAV_LINKS;

  const updateLink = (i: number, field: 'label' | 'href', value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.navLinks as NavLink[]) ?? [])];
      if (arr[i]) arr[i] = { ...arr[i], [field]: value };
      p.navLinks = arr;
    }, 500);
  };

  const removeLink = (i: number) => {
    setProp((p: Record<string, unknown>) => {
      p.navLinks = ((p.navLinks as NavLink[]) ?? []).filter((_, idx) => idx !== i);
    }, 0);
  };

  const addLink = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.navLinks as NavLink[]) ?? []), { label: 'New Link', href: '#' }];
      p.navLinks = arr;
    }, 0);
  };

  return (
    <div className="p-3 space-y-0 text-white">
      {/* BRAND */}
      <div className="border-t border-gray-700 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Brand</h3>
        <div>
          <label className={labelCls}>Brand name</label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.brandName = e.target.value; }, 500)}
            className={inputCls}
            placeholder="Brand"
          />
        </div>
      </div>

      {/* NAV LINKS */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Nav Links</h3>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-center p-2 rounded bg-gray-800/50">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
                className={inputCls}
                placeholder="Label"
              />
              <input
                type="text"
                value={link.href}
                onChange={(e) => updateLink(i, 'href', e.target.value)}
                className={inputCls}
                placeholder="# or URL"
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                title="Remove link"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555]"
          >
            + Add link
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">CTA</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>CTA text</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.ctaText = e.target.value; }, 500)}
              className={inputCls}
              placeholder="Get Started"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={showCta}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.showCta = e.target.checked; })}
              className="rounded border-gray-600 bg-gray-700"
            />
            Show CTA button
          </label>
        </div>
      </div>

      {/* DISPLAY */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Display</h3>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={sticky}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sticky = e.target.checked; })}
            className="rounded border-gray-600 bg-gray-700"
          />
          Sticky header
        </label>
      </div>

      {/* COLORS */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={darkBg ?? '#0a0a0a'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)}
              style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{darkBg ?? '#0a0a0a'}</span>
          </div>
          <label className={labelCls} style={{ marginTop: 12 }}>Background (light mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={lightBg ?? '#ffffff'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)}
              style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{lightBg ?? '#ffffff'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ──────────────────────────────────────────────────────────
const headerTronCraft = {
  displayName: 'Header Tron',
  props: {
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    brandName: 'Brand',
    sticky: true,
    showCta: true,
    ctaText: 'Get Started',
    navLinks: [
      { label: 'Features', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  related: { settings: HeaderTronSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['saas', 'startup', 'agency'],
    featureTags: ['header', 'navigation'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(HeaderTron as unknown as { craft: typeof headerTronCraft }).craft = headerTronCraft;
