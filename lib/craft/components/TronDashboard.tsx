'use client';

import { useNode, useEditor } from '@craftjs/core';
import React, { useCallback } from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { useSiteContext } from '@/lib/craft/context/SiteContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { getStoredSession, signOut } from '@/lib/auth/clientAuthService';

// ── Inline SVG Icons (no emoji, no external libs) ─────────────────────────
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
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
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ICONS: Record<string, () => React.ReactElement> = {
  user: UserIcon,
  settings: SettingsIcon,
  'credit-card': CreditCardIcon,
  bell: BellIcon,
  shield: ShieldIcon,
  logout: LogoutIcon,
};

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark: {
      bg: darkBg ?? '#0a0a0a',
      text: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.6)',
      cardBg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
      gridColor: 'rgba(255,255,255,0.03)',
    },
    light: {
      bg: lightBg ?? '#ffffff',
      text: '#0a0a0a',
      textSecondary: 'rgba(0,0,0,0.6)',
      cardBg: 'rgba(0,0,0,0.03)',
      border: 'rgba(0,0,0,0.08)',
      gridColor: 'rgba(0,0,0,0.04)',
    },
  };
}

// ── Interfaces ───────────────────────────────────────────────────────────
interface DashboardSection {
  id: string;
  icon: string;
  label: string;
  content: string;
}

const DEFAULT_SECTIONS: DashboardSection[] = [
  { id: '1', icon: 'user', label: 'Account', content: 'Manage your account settings' },
  { id: '2', icon: 'settings', label: 'Settings', content: 'Configure your preferences' },
  { id: '3', icon: 'credit-card', label: 'Subscription', content: 'Manage your subscription' },
];

interface TronDashboardProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  loginPageSlug?: string;
  sections?: DashboardSection[];
}

// ── Main component ────────────────────────────────────────────────────────
export const TronDashboard = React.memo(function TronDashboard() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();
  const siteCtx = useSiteContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [activeSectionId, setActiveSectionId] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<ReturnType<typeof getStoredSession>>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setIsMobile(el.getBoundingClientRect().width < 520);
    check();
    const observer = new ResizeObserver(([e]) => setIsMobile((e?.contentRect?.width ?? 0) < 520));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (enabled) return;
    setSession(getStoredSession());
    const onAuthChanged = () => setSession(getStoredSession());
    window.addEventListener('iam_auth_changed', onAuthChanged);
    return () => window.removeEventListener('iam_auth_changed', onAuthChanged);
  }, [enabled]);

  React.useEffect(() => {
    if (enabled || !loginPageSlug?.trim()) return;
    const s = getStoredSession();
    if (!s) {
      window.dispatchEvent(
        new CustomEvent('iam_navigate', {
          detail: { page: loginPageSlug.trim().replace(/^\//, '') },
        })
      );
    }
  }, [enabled, loginPageSlug]);

  const props = useNode((node) => node.data.props as Partial<TronDashboardProps>) ?? {};
  const {
    colorScheme: propColorScheme,
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    supabaseUrl = '',
    supabaseAnonKey = '',
    loginPageSlug = '',
    sections = DEFAULT_SECTIONS,
  } = props;

  const colorScheme = propColorScheme ?? siteCtx?.colorScheme ?? theme.colorScheme ?? 'dark';
  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme;
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme], accent: accentColor };

  const activeId = activeSectionId ?? sections[0]?.id ?? null;
  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];

  const handleLogout = useCallback(async () => {
    if (enabled || !supabaseUrl || !supabaseAnonKey) return;
    try {
      await signOut(supabaseUrl, supabaseAnonKey);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('iam_navigate', { detail: { page: '__first__' } }));
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('iam_client_session');
        window.dispatchEvent(new Event('iam_auth_changed'));
        window.dispatchEvent(new CustomEvent('iam_navigate', { detail: { page: '__first__' } }));
      }
    }
  }, [enabled, supabaseUrl, supabaseAnonKey]);

  const user = session?.user as { user_metadata?: { first_name?: string; last_name?: string }; email?: string } | undefined;
  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';
  const displayName = `${(firstName as string) ?? ''} ${(lastName as string) ?? ''}`.trim() || 'User';
  const displayEmail = user?.email ?? '';

  const sidebarWidth = isMobile ? 56 : 240;

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      data-block-type="user_dashboard"
      className={`w-full ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        minHeight: enabled ? '60vh' : `${sectionHeight}vh`,
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
      }}
    >
      {/* Left sidebar */}
      <aside
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          background: t.cardBg,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? 8 : 16,
          gap: isMobile ? 8 : 16,
        }}
      >
        {/* Avatar + name (desktop only) */}
        {!isMobile && (
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: t.accent,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'ui-monospace, monospace',
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              {displayName.slice(0, 2).toUpperCase() || '?'}
            </div>
            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: t.text }}>{displayName}</div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>{displayEmail}</div>
          </div>
        )}

        {/* Section buttons */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sections.map((section) => {
            const IconComp = ICONS[section.icon] ?? UserIcon;
            const isActive = section.id === activeId;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => !enabled && setActiveSectionId(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 0 : 12,
                  padding: isMobile ? 12 : '10px 12px',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  background: isActive ? `rgba(${hexToRgb(accentColor)}, 0.15)` : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
                  borderRadius: 8,
                  cursor: enabled ? 'default' : 'pointer',
                  color: isActive ? t.accent : t.textSecondary,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!enabled && !isActive) {
                    e.currentTarget.style.background = `rgba(${hexToRgb(accentColor)}, 0.08)`;
                    e.currentTarget.style.color = t.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = t.textSecondary;
                  }
                }}
              >
                <IconComp />
                {!isMobile && (
                  <EditableText
                    value={section.label}
                    fieldKey={`section-label-${section.id}`}
                    tag="span"
                    style={{ fontSize: 14, fontWeight: 500 }}
                    enabled={enabled}
                    onSave={(val) =>
                      setProp((p: Record<string, unknown>) => {
                        const arr = [...((p.sections as DashboardSection[]) ?? [])];
                        const idx = arr.findIndex((s) => s.id === section.id);
                        if (idx >= 0) arr[idx] = { ...arr[idx], label: val };
                        p.sections = arr;
                      }, 0)
                    }
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={enabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 0 : 12,
            padding: isMobile ? 12 : '10px 12px',
            justifyContent: isMobile ? 'center' : 'flex-start',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: enabled ? 'default' : 'pointer',
            color: '#f87171',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => !enabled && (e.currentTarget.style.background = 'rgba(248,113,113,0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogoutIcon />
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 500 }}>Logout</span>}
        </button>
      </aside>

      {/* Right content */}
      <div
        style={{
          flex: 1,
          padding: isMobile ? 16 : 32,
          overflowY: 'auto',
        }}
      >
        {activeSection && (
          <>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: t.text,
                marginBottom: 16,
              }}
            >
              <EditableText
                value={activeSection.label}
                fieldKey={`section-title-${activeSection.id}`}
                tag="span"
                style={{ color: t.text }}
                enabled={enabled}
                onSave={(val) =>
                  setProp((p: Record<string, unknown>) => {
                    const arr = [...((p.sections as DashboardSection[]) ?? [])];
                    const idx = arr.findIndex((s) => s.id === activeSection.id);
                    if (idx >= 0) arr[idx] = { ...arr[idx], label: val };
                    p.sections = arr;
                  }, 0)
                }
              />
            </h2>
            <p style={{ fontSize: 16, color: t.textSecondary, lineHeight: 1.6 }}>
              <EditableText
                value={activeSection.content}
                fieldKey={`section-content-${activeSection.id}`}
                tag="span"
                style={{ color: t.textSecondary }}
                enabled={enabled}
                onSave={(val) =>
                  setProp((p: Record<string, unknown>) => {
                    const arr = [...((p.sections as DashboardSection[]) ?? [])];
                    const idx = arr.findIndex((s) => s.id === activeSection.id);
                    if (idx >= 0) arr[idx] = { ...arr[idx], content: val };
                    p.sections = arr;
                  }, 0)
                }
              />
            </p>
          </>
        )}
      </div>
    </section>
  );
});

// ── Settings panel ────────────────────────────────────────────────────────
const TronDashboardSettings = () => {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronDashboardProps>) ?? {};
  const siteCtx = useSiteContext();
  const pages = siteCtx?.pages ?? [];
  const { sections = DEFAULT_SECTIONS, darkBg = '#0a0a0a', lightBg = '#ffffff', sectionHeight = 80, loginPageSlug = '' } = props;

  const updateSection = (index: number, field: keyof DashboardSection, value: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.sections as DashboardSection[]) ?? [])];
      arr[index] = { ...arr[index], [field]: value };
      p.sections = arr;
    }, 300);
  };

  const removeSection = (index: number) => {
    setProp((p: Record<string, unknown>) => {
      p.sections = (p.sections as DashboardSection[]).filter((_, i) => i !== index);
    }, 0);
  };

  const addSection = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.sections as DashboardSection[]) ?? []), { id: String(Date.now()), icon: 'user', label: 'New Section', content: 'Section content' }];
      p.sections = arr;
    }, 0);
  };

  const iconKeys = Object.keys(ICONS).filter((k) => k !== 'logout');

  return (
    <div className="p-3 space-y-0">
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Sections</h3>
        <div className="space-y-2">
          {(sections ?? DEFAULT_SECTIONS).map((sec, i) => (
            <div
              key={sec.id}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div className="flex gap-2 items-center mb-2">
                <select
                  value={sec.icon}
                  onChange={(e) => updateSection(i, 'icon', e.target.value)}
                  className={inputCls}
                  style={{ width: 120 }}
                >
                  {iconKeys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={sec.label}
                  onChange={(e) => updateSection(i, 'label', e.target.value)}
                  className={inputCls}
                  placeholder="Label"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={() => removeSection(i)} style={{ color: '#f87171', cursor: 'pointer' }}>×</button>
              </div>
              <input
                type="text"
                value={sec.content}
                onChange={(e) => updateSection(i, 'content', e.target.value)}
                className={inputCls}
                placeholder="Content"
              />
            </div>
          ))}
          <button type="button" onClick={addSection} style={{ color: '#FF6B35', fontWeight: 600 }}>+ Add Section</button>
        </div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={darkBg} onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)} />
            <span className="text-xs text-zinc-500 font-mono">{darkBg}</span>
          </div>
          <label className={labelCls}>Background (light)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={lightBg} onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)} />
            <span className="text-xs text-zinc-500 font-mono">{lightBg}</span>
          </div>
        </div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Auth</h3>
        <div>
          <label className={labelCls}>Login page (redirect when unauthenticated)</label>
          <select
            value={loginPageSlug}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.loginPageSlug = e.target.value; }, 300)} className={inputCls}
          >
            <option value="">— not set —</option>
            {pages.map((p) => (
              <option key={p.id} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Size</h3>
        <label className={labelCls}>Section height (vh)</label>
        <input
          type="range"
          min={40}
          max={100}
          value={sectionHeight}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)} />
        <span className="text-xs text-zinc-500 ml-2">{sectionHeight}</span>
      </div>
    </div>
  );
};

const tronDashboardCraft = {
  displayName: 'Tron Dashboard',
  props: {
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    supabaseUrl: '',
    supabaseAnonKey: '',
    loginPageSlug: '',
    sections: DEFAULT_SECTIONS,
    sectionHeight: 80,
  },
  related: { settings: TronDashboardSettings },
  custom: {
    block_type: 'user_dashboard',
    variant_name: 'default',
    style_tags: ['dark', 'minimal'],
    business_tags: ['ecommerce', 'startup', 'saas', 'education'],
    feature_tags: ['dashboard', 'auth'],
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
(TronDashboard as unknown as { craft: typeof tronDashboardCraft }).craft = tronDashboardCraft;
