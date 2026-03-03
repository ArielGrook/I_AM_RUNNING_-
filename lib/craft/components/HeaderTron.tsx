'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useState, useContext, useEffect } from 'react';

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const CreditCardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const DROPDOWN_ICONS: Record<string, () => React.ReactElement> = {
  user: UserIcon,
  settings: SettingsIcon,
  'credit-card': CreditCardIcon,
  bell: BellIcon,
  shield: ShieldIcon,
  logout: LogoutIcon,
};

const DEFAULT_DROPDOWN_SECTIONS = [
  { icon: 'user', label: 'Account', pageLink: '' },
  { icon: 'settings', label: 'Settings', pageLink: '' },
  { icon: 'credit-card', label: 'Subscription', pageLink: '' },
];

function findPageLink(
  label: string,
  pages: Array<{ id: string; name: string; slug: string }>,
  explicitPageLink?: string
): string {
  if (explicitPageLink?.trim()) {
    const trimmed = explicitPageLink.trim().replace(/^\//, '');
    const found = pages.find(
      (p) =>
        (p.slug ?? '') === trimmed ||
        (p.name ?? '').toLowerCase().replace(/\s+/g, '-') === trimmed
    );
    if (found) return found.slug ?? trimmed;
  }
  const normalized = label.toLowerCase().replace(/\s+/g, '-');
  const found = pages.find(
    (p) =>
      (p.slug ?? '').toLowerCase() === normalized ||
      (p.name ?? '').toLowerCase().replace(/\s+/g, '-') === normalized ||
      (p.slug ?? '').toLowerCase().includes(normalized) ||
      (p.name ?? '').toLowerCase().includes(normalized)
  );
  return found?.slug ?? '';
}

function DashboardDropdownItem({
  icon,
  label,
  href,
  onClick,
  color,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick: (e: React.MouseEvent) => void;
  color: string;
  disabled?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onClick(e);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          opacity: disabled ? 0.4 : 1,
          textDecoration: 'none',
        }}
        onMouseOver={(e) => {
          if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {icon}
      </a>
      {showTooltip && (
        <span
          style={{
            position: 'absolute',
            left: '100%',
            marginLeft: 8,
            whiteSpace: 'nowrap',
            fontSize: 12,
            color,
            background: 'rgba(0,0,0,0.8)',
            padding: '4px 8px',
            borderRadius: 4,
            zIndex: 1001,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
import { PagesContext } from '@/lib/craft/context/PagesContext';
import { useSiteContext } from '@/lib/craft/context/SiteContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { LinkPicker, handleLinkClick } from '@/lib/craft/shared/LinkPicker';
import { getStoredSession } from '@/lib/auth/clientAuthService';

type NavLinkType = 'section' | 'page' | 'external';
type NavLinkItem = { label: string; href: string; type?: NavLinkType };

function hexToRgb(hex: string): string {
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

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
  ctaHrefType = 'external',
  showCta = true,
  sticky = true,
  animationType = 'none',
  animateDelay = '0',
  showThemeToggle = false,
  showLanguageToggle = false,
  availableLanguages = ['en'],
  supabaseUrl = '',
  supabaseAnonKey = '',
  profilePageLink = '',
  loginLink = '',
}: {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  logoText?: string;
  navLinks?: NavLinkItem[];
  ctaText?: string;
  ctaHref?: string;
  ctaHrefType?: 'section' | 'page' | 'external';
  showCta?: boolean;
  sticky?: boolean;
  animationType?: string;
  animateDelay?: string;
  showThemeToggle?: boolean;
  showLanguageToggle?: boolean;
  availableLanguages?: string[];
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  profilePageLink?: string;
  loginLink?: string;
}) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { navigateTo } = useContext(PagesContext);
  const siteCtx = useSiteContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);
  const [session, setSession] = useState<ReturnType<typeof getStoredSession>>(null);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [dropdownSections, setDropdownSections] = useState<Array<{ id: string; icon: string; label: string }>>(DEFAULT_DROPDOWN_SECTIONS);

  useEffect(() => {
    if (enabled) return;
    setSession(getStoredSession());
    const onAuthChanged = () => setSession(getStoredSession());
    window.addEventListener('iam_auth_changed', onAuthChanged);
    return () => window.removeEventListener('iam_auth_changed', onAuthChanged);
  }, [enabled]);

  useEffect(() => {
    if (!avatarDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-avatar-dropdown]')) setAvatarDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [avatarDropdownOpen]);

  useEffect(() => {
    if (!avatarDropdownOpen) return;
    try {
      const stored = localStorage.getItem('iam_dashboard_sections');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setDropdownSections(parsed);
      }
    } catch {
      // noop
    }
  }, [avatarDropdownOpen]);

  const user = session?.user;
  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';
  const initials = `${(firstName as string)?.[0] ?? ''}${(lastName as string)?.[0] ?? ''}`.toUpperCase() || '?';
  const showAvatar = !enabled && !!session;
  const showLoginBtn = !enabled && !session && !!loginLink;
  const toHref = (slugOrUrl: string) =>
    !slugOrUrl ? '#' : slugOrUrl.startsWith('#') || slugOrUrl.startsWith('http') ? slugOrUrl : `/${slugOrUrl}`;
  const pages = siteCtx?.pages ?? [];
  const profileFallbackSlug =
    profilePageLink?.trim()
      ? undefined
      : pages.find((p) => /profile|cabinet/i.test(p.slug || '') || /profile|cabinet/i.test(p.name || ''))?.slug ?? pages[0]?.slug ?? '';
  const effectiveProfileHref = profilePageLink?.trim() ? toHref(profilePageLink) : (profileFallbackSlug ? toHref(profileFallbackSlug) : '#');

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    handleLinkClick(e, href, enabled, siteCtx.navigateToPage || navigateTo);
  };

  const profilePageSlug = profilePageLink?.trim() || '__first__';

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
            {/* Desktop: theme toggle */}
            {!enabled && (showThemeToggle || siteCtx.showThemeToggle) && (
              <button
                onClick={siteCtx.toggleTheme}
                className="hidden md:flex"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `rgba(${hexToRgb(accentColor)}, 0.1)`,
                  border: `1px solid rgba(${hexToRgb(accentColor)}, 0.2)`,
                  color: t.text,
                  cursor: 'pointer',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${hexToRgb(accentColor)}, 0.2)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(${hexToRgb(accentColor)}, 0.1)`; }}
              >
                {siteCtx.colorScheme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            )}
            {/* Desktop: language select */}
            {!enabled && (showLanguageToggle || siteCtx.showLanguageToggle) && siteCtx.availableLanguages.length > 1 && (
              <select
                value={siteCtx.language}
                onChange={(e) => siteCtx.setLanguage(e.target.value)}
                className="hidden md:block"
                style={{
                  background: `rgba(${hexToRgb(accentColor)}, 0.1)`,
                  border: `1px solid rgba(${hexToRgb(accentColor)}, 0.2)`,
                  color: t.text,
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 13,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {siteCtx.availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
            )}
            {/* Auth: single Avatar OR Login OR CTA — avatar + dropdown as one connected island */}
            {showAvatar && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div
                  data-avatar-dropdown
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    zIndex: 50,
                    padding: avatarDropdownOpen ? 4 : 0,
                    borderRadius: avatarDropdownOpen ? 24 : '50%',
                    background: avatarDropdownOpen ? 'rgba(15,15,15,0.95)' : 'transparent',
                    border: avatarDropdownOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    backdropFilter: avatarDropdownOpen ? 'blur(12px)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !enabled && setAvatarDropdownOpen(!avatarDropdownOpen)}
                    onKeyDown={(e) => e.key === 'Enter' && !enabled && setAvatarDropdownOpen(!avatarDropdownOpen)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: enabled ? 'default' : 'pointer',
                      background: t.accent,
                      flexShrink: 0,
                      color: '#fff',
                      fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
                      fontWeight: 700,
                      fontSize: 13,
                      border: 'none',
                    }}
                  >
                    {initials}
                  </div>
                  {!enabled && avatarDropdownOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {dropdownSections.map((section) => {
                        const IconComp = DROPDOWN_ICONS[section.icon] ?? UserIcon;
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => {
                              setAvatarDropdownOpen(false);
                              window.dispatchEvent(
                                new CustomEvent('iam_navigate', {
                                  detail: { page: profilePageSlug },
                                })
                              );
                              setTimeout(() => {
                                window.dispatchEvent(
                                  new CustomEvent('iam_dashboard_open_section', {
                                    detail: { sectionId: section.id },
                                  })
                                );
                              }, 100);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'rgba(255,255,255,0.7)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            title={section.label}
                          >
                            <IconComp />
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarDropdownOpen(false);
                          localStorage.removeItem('iam_client_session');
                          localStorage.removeItem('iam_session');
                          Object.keys(localStorage).forEach((key) => {
                            if (key.includes('supabase') || key.includes('sb-')) localStorage.removeItem(key);
                          });
                          window.dispatchEvent(new Event('iam_auth_changed'));
                          window.dispatchEvent(new CustomEvent('iam_navigate', { detail: { page: '__first__' } }));
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ff4444',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,68,68,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        title="Logout"
                      >
                        <LogoutIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!showAvatar && showLoginBtn && (
              <a
                href={toHref(loginLink)}
                className="flex shrink-0 items-center"
                onClick={(e) => handleLinkClick(e, toHref(loginLink), enabled, siteCtx.navigateToPage)}
                style={{ background: t.accent, color: '#ffffff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
              >
                Login
              </a>
            )}
            {!showAvatar && !showLoginBtn && showCta && (
              <a
                href={ctaHref}
                className="flex shrink-0 items-center"
                onClick={(e) => handleNavClick(e, ctaHref)}
                onTouchEnd={(e) => handleNavClick(e as any, ctaHref)}
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
            {/* Mobile: theme toggle (before hamburger) */}
            {!enabled && (showThemeToggle || siteCtx.showThemeToggle) && (
              <button
                onClick={siteCtx.toggleTheme}
                className="flex md:hidden"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: `rgba(${hexToRgb(accentColor)}, 0.1)`,
                  border: `1px solid rgba(${hexToRgb(accentColor)}, 0.2)`,
                  color: t.text,
                  cursor: 'pointer',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {siteCtx.colorScheme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            )}
            {/* Hamburger */}
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
                style={{ color: t.text, textDecoration: 'none', borderBottom: `1px solid ${t.border}`, cursor: 'pointer' }}
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
  const { actions: { setProp }, colorScheme, accentColor, darkBg, lightBg, logoText, ctaText, ctaHref, ctaHrefType, navLinks, showCta, sticky, animationType, animateDelay, showThemeToggle, showLanguageToggle, availableLanguages, profilePageLink, loginLink } = useNode((node) => ({
    colorScheme: node.data.props.colorScheme as string,
    accentColor: node.data.props.accentColor as string,
    darkBg: (node.data.props.darkBg as string) ?? '#0a0a0a',
    lightBg: (node.data.props.lightBg as string) ?? '#ffffff',
    logoText: node.data.props.logoText as string,
    ctaText: node.data.props.ctaText as string,
    ctaHref: node.data.props.ctaHref as string,
    ctaHrefType: (node.data.props.ctaHrefType as 'section' | 'page' | 'external') ?? 'external',
    navLinks: node.data.props.navLinks as NavLinkItem[],
    showCta: node.data.props.showCta as boolean | undefined,
    sticky: node.data.props.sticky as boolean | undefined,
    animationType: node.data.props.animationType as string,
    animateDelay: node.data.props.animateDelay as string,
    showThemeToggle: node.data.props.showThemeToggle as boolean | undefined,
    showLanguageToggle: node.data.props.showLanguageToggle as boolean | undefined,
    availableLanguages: (node.data.props.availableLanguages as string[]) ?? ['en'],
    profilePageLink: (node.data.props.profilePageLink as string) ?? '',
    loginLink: (node.data.props.loginLink as string) ?? '',
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
          <LinkPicker
            label="CTA Button Link"
            value={{ type: ctaHrefType, href: ctaHref }}
            onChange={(val) => {
              setProp((p: Record<string, unknown>) => {
                p.ctaHref = val.href;
                p.ctaHrefType = val.type;
              }, 0);
            }}
          />
          <div>
            <label className={labelCls}>Login Page</label>
            <select
              value={loginLink ?? ''}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.loginLink = e.target.value; }, 300)}
              className={inputCls}
            >
              <option value="">— not set —</option>
              {pages.map((page) => (
                <option key={page.id} value={page.slug}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Profile Page</label>
            <select
              value={profilePageLink ?? ''}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.profilePageLink = e.target.value; }, 300)}
              className={inputCls}
            >
              <option value="">— not set —</option>
              {pages.map((page) => (
                <option key={page.id} value={page.slug}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>
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
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Client Features</h3>
        <div className="space-y-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#d4d4d8' }}>Show theme switcher</span>
            <input
              type="checkbox"
              checked={showThemeToggle ?? false}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.showThemeToggle = e.target.checked; })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#d4d4d8' }}>Show language switcher</span>
            <input
              type="checkbox"
              checked={showLanguageToggle ?? false}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.showLanguageToggle = e.target.checked; })}
            />
          </div>
          {showLanguageToggle && (
            <div>
              <label className={labelCls}>Available Languages (comma-separated)</label>
              <input
                type="text"
                value={(availableLanguages ?? ['en']).join(', ')}
                onChange={(e) => {
                  const langs = e.target.value.split(',').map((l) => l.trim()).filter((l) => l.length > 0);
                  setProp((p: Record<string, unknown>) => { p.availableLanguages = langs.length > 0 ? langs : ['en']; }, 500);
                }}
                className={inputCls}
                placeholder="en, es, fr"
              />
            </div>
          )}
        </div>
      </section>
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
    ctaHrefType: 'external' as const,
    showCta: true,
    sticky: true,
    animationType: 'none',
    animateDelay: '0',
    showThemeToggle: false,
    showLanguageToggle: false,
    availableLanguages: ['en'],
    supabaseUrl: '',
    supabaseAnonKey: '',
    profilePageLink: '',
    loginLink: '',
  },
  related: { settings: HeaderTronSettings },
  custom: { styleTags: ['dark', 'minimal', 'bold'], businessTags: ['startup', 'saas', 'agency', 'tech', 'finance'], featureTags: ['header', 'navigation', 'sticky'], supportsTheme: true, supportsColorPreset: true },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
