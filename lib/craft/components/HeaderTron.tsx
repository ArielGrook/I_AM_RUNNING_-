'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useContext } from 'react';
import { PagesContext } from '@/lib/craft/context/PagesContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from './TronStats';

type NavLinkType = 'section' | 'page' | 'external';
type NavLinkItem = { label: string; href: string; type?: NavLinkType };

function linkTypeFromHref(href: string): NavLinkType {
  if (href.startsWith('#')) return 'section';
  if (href.startsWith('/')) return 'page';
  return 'external';
}

const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { label: 'Features', href: '#features', type: 'section' },
  { label: 'Pricing', href: '#pricing', type: 'section' },
  { label: 'About', href: '#about', type: 'section' },
  { label: 'Contact', href: '#contact', type: 'section' },
];

export const HeaderTron = ({
  colorScheme = 'dark',
  accentColor = '#e11d48',
  darkBg = '#0a0a0a',
  lightBg = '#ffffff',
  logoText = 'BRAND',
  navLinks = DEFAULT_NAV_LINKS,
  ctaText = 'Get Started',
  ctaHref = '#',
  showCta = true,
  sticky = true,
  animationType = 'none',
  animateDelay = '0',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  logoText?: string;
  navLinks?: NavLinkItem[];
  ctaText?: string;
  ctaHref?: string;
  showCta?: boolean;
  sticky?: boolean;
  animationType?: string;
  animateDelay?: string;
}) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { navigateTo } = useContext(PagesContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);

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
      navigateTo(href.replace(/^\//, ''));
    } else {
      e.preventDefault();
      window.open(href, '_blank');
    }
  };

  const tokens = {
    dark: {
      bg: darkBg ?? '#0a0a0a',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      accent: accentColor,
      border: 'rgba(255,255,255,0.08)',
      gridColor: 'rgba(255,255,255,0.03)',
      bgSecondary: '#000000',
      cardBg: 'rgba(255,255,255,0.02)',
      cardBorder: 'rgba(255,255,255,0.08)',
    },
    light: {
      bg: lightBg ?? '#ffffff',
      bgSecondary: '#f8fafc',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      accent: accentColor,
      border: 'rgba(0,0,0,0.08)',
      cardBg: 'rgba(0,0,0,0.02)',
      cardBorder: 'rgba(0,0,0,0.08)',
      gridColor: 'rgba(0,0,0,0.06)',
    },
  };
  const t = tokens[colorScheme];

  const logoDisplay = enabled ? (
    <EditableText value={logoText ?? ''} fieldKey="logoText" tag="span" style={{ color: t.text, fontSize: 20, fontWeight: 800 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.logoText = val; }, 0)} />
  ) : logoText?.length ? (
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
      id="header"
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-block-type="header"
      data-block-category="navigation"
      className="w-full transition-[background] duration-200"
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 100,
        background: t.bg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <div className="shrink-0" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {logoDisplay}
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                onMouseEnter={() => setHoveredNavIndex(i)}
                onMouseLeave={() => setHoveredNavIndex(null)}
                style={{ fontSize: 14, fontWeight: 500, color: hoveredNavIndex === i ? t.text : t.textSecondary, transition: 'color 150ms ease', textDecoration: 'none', cursor: 'pointer' }}
              >
                {enabled ? (
                  <EditableText value={link.label ?? ''} fieldKey={`nav-${i}-label`} tag="span" style={{ color: hoveredNavIndex === i ? t.text : t.textSecondary }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                    const arr = [...((p.navLinks as NavLinkItem[]) ?? [])];
                    arr[i] = { ...arr[i], label: val };
                    p.navLinks = arr;
                  }, 0)} />
                ) : (
                  link.label
                )}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            {showCta && (
              <a
                href={ctaHref}
                className="hidden md:block"
                onClick={(e) => handleNavClick(e, ctaHref)}
                style={{ background: t.accent, color: '#ffffff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, transition: 'opacity 150ms ease, transform 150ms ease', textDecoration: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {enabled ? (
                  <EditableText value={ctaText ?? ''} fieldKey="ctaText" tag="span" style={{ color: '#ffffff', fontWeight: 600 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.ctaText = val; }, 0)} />
                ) : (
                  ctaText
                )}
              </a>
            )}
            <button
              type="button"
              className="flex md:hidden p-2 border-0 bg-transparent cursor-pointer"
              style={{ color: t.text }}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>
              ) : (
                <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {mobileMenuOpen && (
        <div data-mobile-dropdown="" className="md:hidden absolute top-full left-0 right-0 z-50" style={{ background: t.bg, borderBottom: `1px solid ${t.border}`, borderTop: `1px solid ${t.border}` }}>
          <nav className="flex flex-col">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.href}
                onClick={(e) => { handleNavClick(e, link.href); setMobileMenuOpen(false); }}
                className="block px-6 py-3 text-sm font-medium transition-colors duration-150"
                style={{ color: t.text, textDecoration: 'none', borderBottom: i < links.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = t.accent; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = t.text; }}
              >
                {enabled ? (
                  <EditableText value={link.label ?? ''} fieldKey={`nav-mobile-${i}-label`} tag="span" style={{ color: t.text }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => {
                    const arr = [...((p.navLinks as NavLinkItem[]) ?? [])];
                    arr[i] = { ...arr[i], label: val };
                    p.navLinks = arr;
                  }, 0)} />
                ) : (
                  link.label
                )}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

const HeaderTronSettings = () => {
  const { actions: { setProp }, colorScheme, accentColor, darkBg, lightBg, logoText, ctaText, ctaHref, navLinks, showCta, sticky, animationType, animateDelay } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as string,
    accentColor: node.data.props.accentColor as string,
    darkBg: (node.data.props.darkBg as string) ?? '#0a0a0a',
    lightBg: (node.data.props.lightBg as string) ?? '#ffffff',
    logoText: node.data.props.logoText as string,
    ctaText: node.data.props.ctaText as string,
    ctaHref: node.data.props.ctaHref as string,
    navLinks: node.data.props.navLinks as NavLinkItem[],
    showCta: node.data.props.showCta as boolean | undefined,
    sticky: node.data.props.sticky as boolean | undefined,
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
  }));
  const { nodes } = useEditor((s) => ({ nodes: s.nodes }));
  const { pages } = useContext(PagesContext);
  const setT = (key: string, ms: number) => (val: unknown) => setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  const availableSections = React.useMemo(() => {
    const nodeList = nodes ? Object.values(nodes) : [];
    return nodeList
      .filter((n) => (n?.data?.props as Record<string, unknown>)?.['data-block-type'])
      .map((n) => {
        const props = n?.data?.props as Record<string, unknown> | undefined;
        const blockType = props?.['data-block-type'] as string;
        const displayName = (n?.data?.displayName as string) || blockType || n?.id;
        return { id: n?.id ?? '', label: displayName, blockType: blockType ?? '' };
      })
      .filter((s) => s.blockType);
  }, [nodes]);

  const updateLink = (i: number, field: 'label' | 'href' | 'type', value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...(p.navLinks as NavLinkItem[])];
      if (!arr[i]) return;
      if (field === 'type') {
        arr[i] = { ...arr[i], type: value as NavLinkType, href: value === 'section' ? '#' : value === 'page' ? '/' : '' };
      } else {
        arr[i] = { ...arr[i], [field]: value };
      }
      p.navLinks = arr;
    }, 300);
  };

  const links = navLinks ?? DEFAULT_NAV_LINKS;
  return (
    <div className="p-3 space-y-5">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Theme</h3>
        <div className="space-y-2">
          <div><label className={labelCls}>Color Scheme</label><select value={colorScheme ?? 'dark'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.colorScheme = e.target.value; })} className={inputCls}><option value="dark">Dark</option><option value="light">Light</option></select></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <label className={labelCls}>Accent Color</label>
            <input type="color" value={accentColor ?? '#e11d48'} onChange={(e) => setT('accentColor', 300)(e.target.value)} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{accentColor ?? '#e11d48'}</span>
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={darkBg ?? '#0a0a0a'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{darkBg ?? '#0a0a0a'}</span>
          </div>
          <label className={labelCls} style={{ marginTop: 12 }}>Background (light mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={lightBg ?? '#ffffff'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{lightBg ?? '#ffffff'}</span>
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Content</h3>
        <div className="space-y-2">
          <div><label className={labelCls}>Logo Text</label><input type="text" value={logoText ?? ''} onChange={(e) => setT('logoText', 500)(e.target.value)} className={inputCls} placeholder="BRAND" /></div>
          <div><label className={labelCls}>CTA Button Text</label><input type="text" value={ctaText ?? ''} onChange={(e) => setT('ctaText', 500)(e.target.value)} className={inputCls} placeholder="Get Started" /></div>
          <div><label className={labelCls}>CTA Button Link</label><input type="text" value={ctaHref ?? '#'} onChange={(e) => setT('ctaHref', 500)(e.target.value)} className={inputCls} placeholder="#" /></div>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Nav Links</h3>
        <div className="space-y-3">
          {links.map((link, i) => {
            const type = link.type ?? linkTypeFromHref(link.href);
            return (
              <div
                key={i}
                style={{
                  background: 'var(--settings-card-bg, rgba(0,0,0,0.03))',
                  border: '1px solid var(--settings-border, rgba(0,0,0,0.08))',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
                className="space-y-2"
              >
                <div className="flex gap-2 items-center">
                  <input value={link.label} placeholder="Label" className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded px-2 py-1.5 text-xs text-white" onChange={(e) => setProp((p: Record<string, unknown>) => { const arr = [...(p.navLinks as NavLinkItem[])]; if (arr[i]) arr[i] = { ...arr[i], label: e.target.value }; p.navLinks = arr; }, 500)} />
                  <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.navLinks = (p.navLinks as NavLinkItem[]).filter((_, idx) => idx !== i); })} className="text-red-400 hover:text-red-300 text-lg leading-none px-1" title="Remove link">×</button>
                </div>
                <div>
                  <label className={labelCls}>Link type</label>
                  <select value={type} onChange={(e) => updateLink(i, 'type', e.target.value)} className={inputCls}>
                    <option value="section">Section on page</option>
                    <option value="page">Another page</option>
                    <option value="external">External URL</option>
                  </select>
                </div>
                {type === 'section' && (
                  <div>
                    <label className={labelCls}>Section</label>
                    <select value={link.href} onChange={(e) => updateLink(i, 'href', e.target.value)} className={inputCls}>
                      <option value="">Select section...</option>
                      {availableSections.map((s) => (
                        <option key={s.id} value={`#${s.blockType}`}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {type === 'page' && (
                  <div>
                    <label className={labelCls}>Page</label>
                    <select value={link.href} onChange={(e) => updateLink(i, 'href', e.target.value)} className={inputCls}>
                      <option value="">Select page...</option>
                      {pages.map((p) => (
                        <option key={p.id} value={`/${p.slug}`}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {type === 'external' && (
                  <div>
                    <label className={labelCls}>URL</label>
                    <input value={link.href} placeholder="https://..." onChange={(e) => updateLink(i, 'href', e.target.value)} className={inputCls} />
                  </div>
                )}
              </div>
            );
          })}
          {links.length < 6 && <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.navLinks = [...(p.navLinks as NavLinkItem[]), { label: 'New Link', href: '#', type: 'section' }]; })} className="w-full border border-dashed border-[#3a3a3a] rounded py-2 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors mt-1">+ Add Link</button>}
        </div>
      </section>
      <div className={sectionCls}>
        <label className={labelCls}>Display</label>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#d4d4d8' }}>Show CTA button</span>
          <input type="checkbox" checked={showCta ?? true}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.showCta = e.target.checked; })} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#d4d4d8' }}>Sticky header</span>
          <input type="checkbox" checked={sticky ?? true}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sticky = e.target.checked; })} />
        </div>
      </div>
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Animation</h3>
        <div className="space-y-2">
          <div><label className={labelCls}>Type</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option><option value="slide-left">Slide Left</option><option value="scale-in">Scale In</option><option value="blur-in">Blur In</option></select></div>
          <div><label className={labelCls}>Delay (s)</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option><option value="0.3">0.3s</option><option value="0.5">0.5s</option><option value="0.8">0.8s</option><option value="1">1s</option></select></div>
        </div>
      </section>
    </div>
  );
};

HeaderTron.craft = {
  displayName: 'Header Tron',
  props: {
    colorScheme: 'dark',
    accentColor: '#e11d48',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    logoText: 'BRAND',
    navLinks: [{ label: 'Features', href: '#features', type: 'section' }, { label: 'Pricing', href: '#pricing', type: 'section' }, { label: 'About', href: '#about', type: 'section' }, { label: 'Contact', href: '#contact', type: 'section' }],
    'data-block-type': 'header',
    ctaText: 'Get Started',
    ctaHref: '#',
    showCta: true,
    sticky: true,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: HeaderTronSettings },
  custom: { styleTags: ['dark', 'minimal', 'bold'], businessTags: ['startup', 'saas', 'agency', 'tech', 'finance'], featureTags: ['header', 'navigation', 'sticky'], supportsTheme: true, supportsColorPreset: true },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
