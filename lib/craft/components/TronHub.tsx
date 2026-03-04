'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { useSiteContext } from '@/lib/craft/context/SiteContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { getStoredSession } from '@/lib/auth/clientAuthService';
import { MediaLibrary } from '@/components/craft/MediaLibrary';

// ── Icons ──────────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const ICON_MAP: Record<string, () => React.ReactElement> = {
  user: UserIcon,
  settings: SettingsIcon,
  'credit-card': CreditCardIcon,
  bell: BellIcon,
  shield: ShieldIcon,
  logout: LogoutIcon,
};

// ── Helpers (pattern from HeroTron / TronFeatures) ─────────────────────────
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
      textSecondary: '#a1a1aa',
      border: 'rgba(255,255,255,0.08)',
      cardBg: 'rgba(255,255,255,0.03)',
      gridColor: 'rgba(255,255,255,0.03)',
      inputBg: 'rgba(255,255,255,0.06)',
      inputBorder: 'rgba(255,255,255,0.12)',
    },
    light: {
      bg: lightBg ?? '#ffffff',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      border: 'rgba(0,0,0,0.08)',
      cardBg: 'rgba(0,0,0,0.02)',
      gridColor: 'rgba(0,0,0,0.06)',
      inputBg: 'rgba(0,0,0,0.04)',
      inputBorder: 'rgba(0,0,0,0.12)',
    },
  };
}

// ── Types ──────────────────────────────────────────────────────────────────
interface HubSection {
  id: string;
  icon: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_SECTIONS: HubSection[] = [
  { id: 'account', icon: 'user', label: 'Account', enabled: true },
  { id: 'settings', icon: 'settings', label: 'Settings', enabled: true },
  { id: 'billing', icon: 'credit-card', label: 'Billing', enabled: true },
  { id: 'notifications', icon: 'bell', label: 'Notifications', enabled: true },
  { id: 'privacy', icon: 'shield', label: 'Privacy', enabled: true },
];

interface TronHubProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  animationType?: string;
  animateDelay?: string;
  sections?: HubSection[];
}

// ── Toggle Switch ──────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  disabled,
  accentColor,
  thumbColor = '#fff',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  accentColor: string;
  thumbColor?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? accentColor : 'rgba(128,128,128,0.3)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: thumbColor,
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}

// ── Section: Account ──────────────────────────────────────────────────────
function AccountSection({
  t,
  accentColor,
  enabled,
  session,
  userData,
  setUserData,
}: {
  t: ReturnType<typeof buildTokens>['dark'];
  accentColor: string;
  enabled: boolean;
  session: ReturnType<typeof getStoredSession>;
  userData: { avatarUrl: string | null } | null;
  setUserData: React.Dispatch<React.SetStateAction<{ avatarUrl: string | null } | null>>;
}) {
  const user = session?.user as { user_metadata?: { first_name?: string; last_name?: string; avatar_url?: string }; email?: string; id?: string } | undefined;
  const [firstName, setFirstName] = React.useState(user?.user_metadata?.first_name ?? '');
  const [lastName, setLastName] = React.useState(user?.user_metadata?.last_name ?? '');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const email = user?.email ?? '';
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';
  const avatarUrl = userData?.avatarUrl ?? user?.user_metadata?.avatar_url ?? null;

  const handleSave = () => {
    if (enabled) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.text,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: avatarUrl ? 'transparent' : `rgba(${hexToRgb(accentColor)}, 0.15)`,
            border: `2px solid ${accentColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 700,
            fontSize: 24,
            color: accentColor,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 4 }}>
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User'}
          </div>
          <div style={{ fontSize: 13, color: t.textSecondary }}>{email || 'user@example.com'}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => !enabled && setShowMediaLibrary(true)}
        style={{
          marginTop: 8,
          padding: '8px 16px',
          background: `rgba(${hexToRgb(accentColor)}, 0.1)`,
          border: `1px solid ${accentColor}`,
          borderRadius: 8,
          color: accentColor,
          cursor: enabled ? 'default' : 'pointer',
          fontSize: 13,
          fontWeight: 500,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => { if (!enabled) e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        Change Photo
      </button>
      {showMediaLibrary && session?.user?.id && (
        <MediaLibrary
          userId={session.user.id}
          accept="image"
          onSelect={(url) => {
            setUserData((prev) => (prev ? { ...prev, avatarUrl: url } : { avatarUrl: url }));
            if (typeof window !== 'undefined' && session?.user?.id) {
              localStorage.setItem(`iam_user_avatar_${session.user.id}`, url);
            }
            setShowMediaLibrary(false);
          }}
          onClose={() => setShowMediaLibrary(false)}
        />
      )}

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            style={fieldStyle}
            disabled={enabled}
            onFocus={(e) => { e.currentTarget.style.borderColor = accentColor; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = t.inputBorder; }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            style={fieldStyle}
            disabled={enabled}
            onFocus={(e) => { e.currentTarget.style.borderColor = accentColor; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = t.inputBorder; }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          readOnly
          style={{ ...fieldStyle, opacity: 0.6, cursor: 'default' }}
        />
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={enabled || saving}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            background: accentColor,
            border: 'none',
            color: t.text,
            fontSize: 14,
            fontWeight: 600,
            cursor: enabled ? 'default' : 'pointer',
            transition: 'opacity 0.2s ease',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {saved ? <><CheckIcon /> Saved</> : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Danger zone */}
      <div
        style={{
          borderTop: `1px solid rgba(248,113,113,0.2)`,
          paddingTop: 24,
          marginTop: 8,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f87171', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Danger Zone
        </div>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => !enabled && setConfirmDelete(true)}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(248,113,113,0.4)',
              color: '#f87171',
              fontSize: 14,
              fontWeight: 500,
              cursor: enabled ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { if (!enabled) e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Delete Account
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: t.textSecondary }}>Are you sure?</span>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              style={{ padding: '8px 16px', borderRadius: 8, background: t.cardBg, border: `1px solid ${t.border}`, color: t.text, fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              style={{ padding: '8px 16px', borderRadius: 8, background: '#f87171', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Confirm Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section: Settings ─────────────────────────────────────────────────────
function SettingsSection({
  t,
  accentColor,
  enabled,
}: {
  t: ReturnType<typeof buildTokens>['dark'];
  accentColor: string;
  enabled: boolean;
}) {
  const [localTheme, setLocalTheme] = React.useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = React.useState('en');
  const [emailNotif, setEmailNotif] = React.useState(true);
  const [marketingEmails, setMarketingEmails] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || enabled) return;
    try {
      const stored = localStorage.getItem('iam_user_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.theme) setLocalTheme(parsed.theme);
        if (parsed.language) setLanguage(parsed.language);
        if (typeof parsed.emailNotif === 'boolean') setEmailNotif(parsed.emailNotif);
        if (typeof parsed.marketingEmails === 'boolean') setMarketingEmails(parsed.marketingEmails);
      }
    } catch { /* ignore */ }
  }, [enabled]);

  const persist = (patch: Record<string, unknown>) => {
    if (typeof window === 'undefined' || enabled) return;
    try {
      const stored = localStorage.getItem('iam_user_settings');
      const prev = stored ? JSON.parse(stored) : {};
      localStorage.setItem('iam_user_settings', JSON.stringify({ ...prev, ...patch }));
    } catch { /* ignore */ }
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: `1px solid ${t.border}`,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Theme */}
      <div style={rowStyle}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>Theme</div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>Choose your preferred color scheme</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['dark', 'light'] as const).map((scheme) => (
            <button
              key={scheme}
              type="button"
              onClick={() => { if (!enabled) { setLocalTheme(scheme); persist({ theme: scheme }); } }}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: `1px solid ${localTheme === scheme ? accentColor : t.border}`,
                background: localTheme === scheme ? `rgba(${hexToRgb(accentColor)}, 0.15)` : 'transparent',
                color: localTheme === scheme ? accentColor : t.textSecondary,
                fontSize: 13,
                fontWeight: 500,
                cursor: enabled ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              {scheme === 'dark' ? <MoonIcon /> : <SunIcon />}
              {scheme === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={rowStyle}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>Language</div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>Select your preferred language</div>
        </div>
        <select
          value={language}
          onChange={(e) => { if (!enabled) { setLanguage(e.target.value); persist({ language: e.target.value }); } }}
          disabled={enabled}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: t.inputBg,
            border: `1px solid ${t.inputBorder}`,
            color: t.text,
            fontSize: 13,
            cursor: enabled ? 'default' : 'pointer',
            outline: 'none',
          }}
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="he">עברית</option>
        </select>
      </div>

      {/* Email notifications */}
      <div style={rowStyle}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>Email Notifications</div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>Receive important account updates via email</div>
        </div>
        <ToggleSwitch
          checked={emailNotif}
          onChange={(v) => { setEmailNotif(v); persist({ emailNotif: v }); }}
          accentColor={accentColor}
          thumbColor={t.text}
          disabled={enabled}
        />
      </div>

      {/* Marketing emails */}
      <div style={{ ...rowStyle, borderBottom: 'none' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>Marketing Emails</div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>Receive tips, product updates and offers</div>
        </div>
        <ToggleSwitch
          checked={marketingEmails}
          onChange={(v) => { setMarketingEmails(v); persist({ marketingEmails: v }); }}
          accentColor={accentColor}
          thumbColor={t.text}
          disabled={enabled}
        />
      </div>
    </div>
  );
}

// ── Section: Billing ──────────────────────────────────────────────────────
const MOCK_INVOICES = [
  { id: 'inv_001', date: 'Feb 1, 2026', amount: '$29.00', status: 'Paid', plan: 'Pro' },
  { id: 'inv_002', date: 'Jan 1, 2026', amount: '$29.00', status: 'Paid', plan: 'Pro' },
  { id: 'inv_003', date: 'Dec 1, 2025', amount: '$0.00', status: 'Free', plan: 'Free' },
];

function BillingSection({
  t,
  accentColor,
  enabled,
}: {
  t: ReturnType<typeof buildTokens>['dark'];
  accentColor: string;
  enabled: boolean;
}) {
  const [plan] = React.useState<'Free' | 'Pro' | 'Enterprise'>('Pro');

  const cardStyle: React.CSSProperties = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    padding: '20px 24px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Current plan */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Current Plan</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.text }}>{plan}</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 4 }}>
              {plan === 'Free' ? 'Basic features, 1 site' : plan === 'Pro' ? '$29/month · Unlimited sites' : 'Custom pricing · Everything'}
            </div>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              background: `rgba(${hexToRgb(accentColor)}, 0.15)`,
              border: `1px solid rgba(${hexToRgb(accentColor)}, 0.3)`,
              color: accentColor,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Active
          </span>
        </div>
        <button
          type="button"
          style={{
            marginTop: 16,
            padding: '9px 20px',
            borderRadius: 8,
            background: accentColor,
            border: 'none',
            color: t.text,
            fontSize: 13,
            fontWeight: 600,
            cursor: enabled ? 'default' : 'pointer',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => { if (!enabled) e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          {plan === 'Free' ? 'Upgrade to Pro' : 'Manage Plan'}
        </button>
      </div>

      {/* Payment method */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Payment Method</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 28, borderRadius: 4, background: t.inputBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCardIcon />
            </div>
            <div>
              <div style={{ fontSize: 14, color: t.text }}>•••• •••• •••• 4242</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Expires 12/27</div>
            </div>
          </div>
          <button
            type="button"
            style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${t.border}`, color: t.textSecondary, fontSize: 13, cursor: enabled ? 'default' : 'pointer', transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => { if (!enabled) { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSecondary; }}
          >
            Change
          </button>
        </div>
      </div>

      {/* Billing history */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Billing History</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {MOCK_INVOICES.map((inv, i) => (
            <div
              key={inv.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < MOCK_INVOICES.length - 1 ? `1px solid ${t.border}` : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: t.text }}>{inv.plan} Plan</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>{inv.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{inv.amount}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: inv.status === 'Paid' ? 'rgba(52,211,153,0.12)' : t.cardBg,
                    color: inv.status === 'Paid' ? '#34d399' : t.textSecondary,
                  }}
                >
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section: Notifications ────────────────────────────────────────────────
function NotificationsSection({
  t,
  accentColor,
  enabled,
}: {
  t: ReturnType<typeof buildTokens>['dark'];
  accentColor: string;
  enabled: boolean;
}) {
  const [pushEnabled, setPushEnabled] = React.useState(false);
  const [emailEnabled, setEmailEnabled] = React.useState(true);
  const [prefs, setPrefs] = React.useState({
    newMessages: true,
    accountUpdates: true,
    marketing: false,
    securityAlerts: true,
  });

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: `1px solid ${t.border}`,
  };

  const checkboxStyle = (checked: boolean): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: 4,
    border: `2px solid ${checked ? accentColor : t.inputBorder}`,
    background: checked ? `rgba(${hexToRgb(accentColor)}, 0.15)` : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: enabled ? 'default' : 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    color: accentColor,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={rowStyle}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>Push Notifications</div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>Browser push notifications</div>
        </div>
        <ToggleSwitch checked={pushEnabled} onChange={setPushEnabled} accentColor={accentColor} thumbColor={t.text} disabled={enabled} />
      </div>

      <div style={rowStyle}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>Email Notifications</div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>Receive updates via email</div>
        </div>
        <ToggleSwitch checked={emailEnabled} onChange={setEmailEnabled} accentColor={accentColor} thumbColor={t.text} disabled={enabled} />
      </div>

      <div style={rowStyle}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>SMS Notifications</div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>Coming soon</div>
        </div>
        <ToggleSwitch checked={false} onChange={() => {}} accentColor={accentColor} thumbColor={t.text} disabled />
      </div>

      <div style={{ paddingTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Notification Preferences</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(
            [
              { key: 'newMessages', label: 'New messages' },
              { key: 'accountUpdates', label: 'Account updates' },
              { key: 'marketing', label: 'Marketing & promotions' },
              { key: 'securityAlerts', label: 'Security alerts' },
            ] as { key: keyof typeof prefs; label: string }[]
          ).map(({ key, label }) => (
            <div
              key={key}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: enabled ? 'default' : 'pointer' }}
              onClick={() => !enabled && setPrefs((p) => ({ ...p, [key]: !p[key] }))}
            >
              <div style={checkboxStyle(prefs[key])}>
                {prefs[key] && <CheckIcon />}
              </div>
              <span style={{ fontSize: 14, color: t.text }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section: Privacy ──────────────────────────────────────────────────────
function PrivacySection({
  t,
  accentColor,
  enabled,
}: {
  t: ReturnType<typeof buildTokens>['dark'];
  accentColor: string;
  enabled: boolean;
}) {
  const [exportRequested, setExportRequested] = React.useState(false);
  const [cookiesAccepted, setCookiesAccepted] = React.useState(true);

  const cardStyle: React.CSSProperties = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    padding: '20px 24px',
  };

  const linkStyle: React.CSSProperties = {
    color: accentColor,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'opacity 0.2s ease',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Legal links */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Legal</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a href="#" style={linkStyle} onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
            Privacy Policy ↗
          </a>
          <a href="#" style={linkStyle} onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
            Terms of Service ↗
          </a>
        </div>
      </div>

      {/* Data export */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Data Export</div>
        <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 16 }}>
          Request a copy of all your personal data. You will receive an email with a download link within 24 hours.
        </div>
        {!exportRequested ? (
          <button
            type="button"
            onClick={() => !enabled && setExportRequested(true)}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              background: 'transparent',
              border: `1px solid ${t.border}`,
              color: t.text,
              fontSize: 13,
              fontWeight: 500,
              cursor: enabled ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { if (!enabled) { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.text; }}
          >
            <DownloadIcon /> Request Data Export
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 13 }}>
            <CheckIcon /> Request sent — check your email
          </div>
        )}
      </div>

      {/* Cookie preferences */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Cookie Preferences</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>Analytics Cookies</div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>Help us improve the product</div>
          </div>
          <ToggleSwitch checked={cookiesAccepted} onChange={setCookiesAccepted} accentColor={accentColor} thumbColor={t.text} disabled={enabled} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export const TronHub = React.memo(function TronHub() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();
  const siteCtx = useSiteContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [activeSectionId, setActiveSectionId] = React.useState('account');
  const [session, setSession] = React.useState<ReturnType<typeof getStoredSession>>(null);
  const [userData, setUserData] = React.useState<{ avatarUrl: string | null } | null>(null);
  const [hoveredNav, setHoveredNav] = React.useState<string | null>(null);
  const [contentKey, setContentKey] = React.useState(0);

  const props = useNode((node) => node.data.props as Partial<TronHubProps>) ?? {};
  const {
    colorScheme: propScheme,
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 100,
    showGrid = true,
    sections = DEFAULT_SECTIONS,
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const colorScheme = propScheme ?? theme.colorScheme ?? 'dark';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[colorScheme], accent: accentColor };

  const activeSections = (sections ?? DEFAULT_SECTIONS).filter((s) => s.enabled !== false);

  // ResizeObserver
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setIsMobile(el.getBoundingClientRect().width < 520);
    check();
    const observer = new ResizeObserver(([e]) => setIsMobile((e?.contentRect?.width ?? 0) < 520));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auth session
  React.useEffect(() => {
    if (enabled) return;
    setSession(getStoredSession());
    const onAuthChanged = () => setSession(getStoredSession());
    window.addEventListener('iam_auth_changed', onAuthChanged);
    return () => window.removeEventListener('iam_auth_changed', onAuthChanged);
  }, [enabled]);

  // Load avatar from localStorage when session is available
  React.useEffect(() => {
    if (typeof window === 'undefined' || !session?.user?.id) {
      setUserData(null);
      return;
    }
    try {
      const stored = localStorage.getItem(`iam_user_avatar_${session.user.id}`);
      const metaUrl = (session.user as { user_metadata?: { avatar_url?: string } }).user_metadata?.avatar_url;
      setUserData({ avatarUrl: stored ?? metaUrl ?? null });
    } catch {
      setUserData(null);
    }
  }, [session?.user?.id]);

  // Save sections to localStorage for HeaderTron dropdown
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (enabled) return;
    const sectionsData = activeSections.map((s) => ({ id: s.id, icon: s.icon, label: s.label }));
    localStorage.setItem('iam_dashboard_sections', JSON.stringify(sectionsData));
  }, [sections, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for iam_dashboard_open_section event
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (enabled) return;
    const handler = (e: Event) => {
      const sectionId = (e as CustomEvent).detail?.sectionId as string | undefined;
      if (!sectionId) return;
      if (activeSections.some((s) => s.id === sectionId)) {
        setActiveSectionId(sectionId);
        setContentKey((k) => k + 1);
      }
    };
    window.addEventListener('iam_dashboard_open_section', handler);
    return () => window.removeEventListener('iam_dashboard_open_section', handler);
  }, [sections, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    if (enabled) return;
    localStorage.removeItem('iam_client_session');
    localStorage.removeItem('iam_session');
    Object.keys(localStorage).forEach((key) => {
      if (key.includes('supabase') || key.includes('sb-')) localStorage.removeItem(key);
    });
    window.dispatchEvent(new Event('iam_auth_changed'));
    window.dispatchEvent(new CustomEvent('iam_navigate', { detail: { page: '__first__' } }));
  };

  const handleSectionClick = (sectionId: string) => {
    if (enabled) return;
    setActiveSectionId(sectionId);
    setContentKey((k) => k + 1);
  };

  const user = session?.user as { user_metadata?: { first_name?: string; last_name?: string }; email?: string } | undefined;
  const firstName = (user?.user_metadata?.first_name as string) ?? '';
  const lastName = (user?.user_metadata?.last_name as string) ?? '';
  const displayName = `${firstName} ${lastName}`.trim() || 'User';
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';

  const sidebarWidth = isMobile ? 56 : 220;

  const activeSection = activeSections.find((s) => s.id === activeSectionId) ?? activeSections[0];

  const renderContent = () => {
    const id = activeSection?.id ?? 'account';
    if (id === 'account') return <AccountSection t={t} accentColor={accentColor} enabled={enabled} session={session} userData={userData} setUserData={setUserData} />;
    if (id === 'settings') return <SettingsSection t={t} accentColor={accentColor} enabled={enabled} />;
    if (id === 'billing') return <BillingSection t={t} accentColor={accentColor} enabled={enabled} />;
    if (id === 'notifications') return <NotificationsSection t={t} accentColor={accentColor} enabled={enabled} />;
    if (id === 'privacy') return <PrivacySection t={t} accentColor={accentColor} enabled={enabled} />;
    return (
      <div style={{ color: t.textSecondary, fontSize: 14 }}>
        {activeSection?.label ?? 'Section'} content
      </div>
    );
  };

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      data-block-type="user_dashboard"
      data-block-category="auth"
      className={`w-full ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        position: 'relative',
        background: t.bg,
        minHeight: `${sectionHeight}vh`,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
      }}
    >
      {/* Grid background */}
      {showGrid && (
        <div
          key={colorScheme}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            backgroundImage: `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'relative',
          zIndex: 1,
          width: sidebarWidth,
          flexShrink: 0,
          background: t.cardBg,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? '16px 8px' : '24px 12px',
          gap: 4,
          transition: 'width 0.2s ease',
        }}
      >
        {/* Avatar + name (desktop) */}
        {!isMobile && (
          <div style={{ marginBottom: 20, paddingLeft: 8 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: userData?.avatarUrl ? 'transparent' : `rgba(${hexToRgb(accentColor)}, 0.15)`,
                border: `2px solid rgba(${hexToRgb(accentColor)}, 0.4)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'ui-monospace, monospace',
                fontWeight: 700,
                fontSize: 16,
                color: accentColor,
                marginBottom: 10,
                overflow: 'hidden',
              }}
            >
              {userData?.avatarUrl ? (
                <img src={userData.avatarUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.3 }}>{displayName}</div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>{user?.email ?? ''}</div>
          </div>
        )}

        {/* Nav items */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activeSections.map((section) => {
            const IconComp = ICON_MAP[section.icon] ?? UserIcon;
            const isActive = section.id === (activeSection?.id ?? 'account');
            const isHovered = hoveredNav === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionClick(section.id)}
                onMouseEnter={() => !enabled && setHoveredNav(section.id)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 0 : 10,
                  padding: isMobile ? '12px' : '10px 12px',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  background: isActive
                    ? `rgba(${hexToRgb(accentColor)}, 0.15)`
                    : isHovered
                      ? `rgba(${hexToRgb(accentColor)}, 0.07)`
                      : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
                  borderRadius: 8,
                  cursor: enabled ? 'default' : 'pointer',
                  color: isActive ? accentColor : isHovered ? t.text : t.textSecondary,
                  transition: 'all 0.18s ease',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <IconComp />
                {!isMobile && (
                  <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}>
                    {section.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          onMouseEnter={(e) => { if (!enabled) e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 0 : 10,
            padding: isMobile ? '12px' : '10px 12px',
            justifyContent: isMobile ? 'center' : 'flex-start',
            background: 'transparent',
            border: 'none',
            borderLeft: '3px solid transparent',
            borderRadius: 8,
            cursor: enabled ? 'default' : 'pointer',
            color: '#f87171',
            transition: 'background 0.18s ease',
            width: '100%',
          }}
        >
          <LogoutIcon />
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 400 }}>Logout</span>}
        </button>
      </aside>

      {/* Content area */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          padding: isMobile ? '20px 16px' : '32px 40px',
          overflowY: 'auto',
          minWidth: 0,
        }}
      >
        {/* Section header */}
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: isMobile ? 20 : 26,
              fontWeight: 700,
              color: t.text,
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {activeSection?.label ?? 'Account'}
          </h2>
          <div
            style={{
              width: 32,
              height: 2,
              background: accentColor,
              marginTop: 8,
              borderRadius: 1,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Section content — fade in on change */}
        <div
          key={contentKey}
          style={{
            animation: 'tronhub-fadein 0.22s ease',
          }}
        >
          {renderContent()}
        </div>
      </div>

      {/* Fade-in keyframe injected once */}
      <style>{`
        @keyframes tronhub-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
});

// ── Settings Panel ─────────────────────────────────────────────────────────
const TronHubSettings = () => {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronHubProps>) ?? {};
  const {
    sections = DEFAULT_SECTIONS,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 100,
    showGrid = true,
    animationType = 'fade',
    animateDelay = '0',
  } = props;

  const iconKeys = Object.keys(ICON_MAP).filter((k) => k !== 'logout');

  const toggleSection = (id: string, enabled: boolean) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.sections as HubSection[]) ?? [])];
      const idx = arr.findIndex((s) => s.id === id);
      if (idx >= 0) arr[idx] = { ...arr[idx], enabled };
      p.sections = arr;
    }, 0);
  };

  const updateSectionLabel = (id: string, label: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.sections as HubSection[]) ?? [])];
      const idx = arr.findIndex((s) => s.id === id);
      if (idx >= 0) arr[idx] = { ...arr[idx], label };
      p.sections = arr;
    }, 300);
  };

  const updateSectionIcon = (id: string, icon: string) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.sections as HubSection[]) ?? [])];
      const idx = arr.findIndex((s) => s.id === id);
      if (idx >= 0) arr[idx] = { ...arr[idx], icon };
      p.sections = arr;
    }, 0);
  };

  return (
    <div className="p-3 space-y-0">
      {/* Sections */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Sections</h3>
        <div className="space-y-2">
          {(sections ?? DEFAULT_SECTIONS).map((sec) => (
            <div
              key={sec.id}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={sec.enabled !== false}
                  onChange={(e) => toggleSection(sec.id, e.target.checked)}
                  style={{ flexShrink: 0 }}
                />
                <select
                  value={sec.icon}
                  onChange={(e) => updateSectionIcon(sec.id, e.target.value)}
                  className={inputCls}
                  style={{ width: 110, marginBottom: 0 }}
                >
                  {iconKeys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={sec.label}
                  onChange={(e) => updateSectionLabel(sec.id, e.target.value)}
                  className={inputCls}
                  placeholder="Label"
                  style={{ flex: 1, marginBottom: 0 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Colors</h3>
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

      {/* Size */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Size</h3>
        <label className={labelCls}>Section height (vh): {sectionHeight}</label>
        <input
          type="range"
          min={60}
          max={100}
          value={sectionHeight}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)}
          style={{ width: '100%' }}
        />
      </div>

      {/* Display */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Display</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#d4d4d8' }}>Show grid background</span>
          <input
            type="checkbox"
            checked={showGrid ?? true}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })}
          />
        </div>
      </div>

      {/* Animation */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Animation</h3>
        <label className={labelCls}>Type</label>
        <select
          value={animationType ?? 'fade'}
          onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })}
          className={inputCls}
        >
          <option value="none">None</option>
          <option value="fade">Fade In</option>
          <option value="slide-up">Slide Up</option>
        </select>
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
        </select>
      </div>
    </div>
  );
};

// ── Craft config ───────────────────────────────────────────────────────────
TronHub.craft = {
  displayName: 'Tron Hub',
  props: {
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 100,
    showGrid: true,
    animationType: 'fade',
    animateDelay: '0',
    sections: DEFAULT_SECTIONS,
  },
  related: { settings: TronHubSettings },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
  },
  custom: {
    block_type: 'user_dashboard',
    variant_name: 'default',
    style_tags: ['dark', 'neon_futuristic', 'minimal'],
    business_tags: ['startup', 'agency', 'portfolio', 'ecommerce'],
    feature_tags: ['dashboard', 'auth'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
