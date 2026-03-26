'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { useSiteContext } from '@/lib/craft/context/SiteContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { LinkPicker, handleLinkClick } from '@/lib/craft/shared/LinkPicker';
import { signUp as clientSignUp } from '@/lib/auth/clientAuthService';
import { buildBaseTokens as buildTokens } from '../tokens';

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

// ── Google Icon (inline SVG) ─────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// ── Interfaces ───────────────────────────────────────────────────────────
interface TronRegisterProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  title?: string;
  subtitle?: string;
  googleButtonText?: string;
  firstNameLabel?: string;
  lastNameLabel?: string;
  submitButtonText?: string;
  footerText?: string;
  footerLinkText?: string;
  googleButtonLink?: string;
  googleButtonLinkType?: 'section' | 'page' | 'external';
  submitButtonLink?: string;
  submitButtonLinkType?: 'section' | 'page' | 'external';
  footerLink?: string;
  footerLinkType?: 'section' | 'page' | 'external';
  animationType?: string;
  animateDelay?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

// ── Main component ───────────────────────────────────────────────────────
export const TronRegister = React.memo(function TronRegister() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();
  const siteCtx = useSiteContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const checkWidth = () => setIsMobile(el.getBoundingClientRect().width < 520);
    checkWidth();
    const observer = new ResizeObserver(([entry]) => {
      setIsMobile((entry?.contentRect?.width ?? 0) < 520);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const props = useNode((node) => node.data.props as Partial<TronRegisterProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    title = 'Create account',
    subtitle = 'Join us today',
    googleButtonText = 'Continue with Google',
    firstNameLabel = 'First Name',
    lastNameLabel = 'Last Name',
    submitButtonText = 'Create Account',
    footerText = 'Already have an account?',
    footerLinkText = 'Sign in',
    googleButtonLink = '',
    googleButtonLinkType = 'external',
    submitButtonLink = '',
    submitButtonLinkType = 'external',
    footerLink = '',
    footerLinkType = 'external',
    animationType = 'none',
    animateDelay = '0',
    supabaseUrl = '',
    supabaseAnonKey = '',
  } = props;

  const hasCredentials = Boolean(supabaseUrl?.trim() && supabaseAnonKey?.trim());

  const handleSubmit = React.useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (enabled || !hasCredentials || loading) return;
      setErrorMsg('');
      setLoading(true);
      try {
        const { error } = await clientSignUp(supabaseUrl!, supabaseAnonKey!, {
          email,
          password,
          firstName,
          lastName,
        });
        if (error) {
          setErrorMsg(error.message ?? 'Sign up failed');
          return;
        }
        setSuccessMsg('Registration successful! Redirecting...');
        setTimeout(() => {
          const pages = siteCtx?.pages ?? [];
          if (submitButtonLink?.trim()) {
            const trimmed = submitButtonLink.trim();
            const slug = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
            const page = pages.find(
              (p) =>
                (p.slug ?? '') === slug ||
                (p.name ?? '').toLowerCase().replace(/\s+/g, '-') === slug
            );
            const targetSlug = page?.slug ?? '__first__';
            window.dispatchEvent(new CustomEvent('iam_navigate', { detail: { page: targetSlug } }));
          } else {
            window.dispatchEvent(new CustomEvent('iam_navigate', { detail: { page: '__first__' } }));
          }
        }, 1000);
      } finally {
        setLoading(false);
      }
    },
    [enabled, hasCredentials, loading, supabaseUrl, supabaseAnonKey, email, password, firstName, lastName, submitButtonLinkType, submitButtonLink, siteCtx]
  );

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'light';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme], accent: accentColor };

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    height: 48,
    padding: '0 16px',
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    color: t.text,
    fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
    fontSize: 13,
    outline: 'none',
    pointerEvents: enabled ? 'none' : 'auto',
  };

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      id="register"
      data-block-type="register"
      className={`w-full max-w-full flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        minHeight: '100vh',
        position: 'relative',
        padding: isMobile ? 16 : 24,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: '32px 28px',
          boxSizing: 'border-box',
        }}
        {...animAttrs}
      >
        <EditableText
          value={title ?? ''}
          fieldKey="title"
          tag="h1"
          style={{ fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 6, marginTop: 0, fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace' }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.title = val; }, 0)}
        />
        <EditableText
          value={subtitle ?? ''}
          fieldKey="subtitle"
          tag="p"
          style={{ fontSize: 13, color: t.textSecondary, marginBottom: 24, marginTop: 0, fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace' }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
        />

        <a
          href={enabled ? undefined : (googleButtonLink || '#')}
          onClick={(e) => handleLinkClick(e, googleButtonLink || '#', enabled, siteCtx.navigateToPage)}
          onTouchEnd={(e) => handleLinkClick(e as React.TouchEvent, googleButtonLink || '#', enabled, siteCtx.navigateToPage)}
          style={{
            width: '100%',
            height: 48,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: enabled ? 'default' : 'pointer',
            marginBottom: 20,
            pointerEvents: enabled ? 'none' : 'auto',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          <GoogleIcon />
          <span style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 13, color: t.text }}>
            {enabled ? (
              <EditableText value={googleButtonText ?? ''} fieldKey="googleButtonText" tag="span" style={{ color: t.text, fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 13 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.googleButtonText = val; }, 0)} />
            ) : googleButtonText}
          </span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 11, color: t.textSecondary }}>or</span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ flex: isMobile ? undefined : 1, minWidth: 0 }}>
            <input
              type="text"
              placeholder={firstNameLabel}
              readOnly={enabled}
              value={enabled ? undefined : firstName}
              onChange={(e) => !enabled && setFirstName(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', height: 48 }}
            />
          </div>
          <div style={{ flex: isMobile ? undefined : 1, minWidth: 0 }}>
            <input
              type="text"
              placeholder={lastNameLabel}
              readOnly={enabled}
              value={enabled ? undefined : lastName}
              onChange={(e) => !enabled && setLastName(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', height: 48 }}
            />
          </div>
        </div>

        <input
          type="email"
          placeholder="Email"
          readOnly={enabled}
          value={enabled ? undefined : email}
          onChange={(e) => !enabled && setEmail(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            readOnly={enabled}
            value={enabled ? undefined : password}
            onChange={(e) => !enabled && setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => !enabled && setShowPassword((prev) => !prev)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: enabled ? 'default' : 'pointer',
              color: t.textSecondary,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {enabled ? (
          <a
            href="#"
            style={{
              width: '100%',
              height: 48,
              background: t.accent,
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'default',
              marginBottom: 20,
              pointerEvents: 'none',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <EditableText value={submitButtonText ?? ''} fieldKey="submitButtonText" tag="span" style={{ color: '#ffffff', fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 13, fontWeight: 600 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.submitButtonText = val; }, 0)} />
          </a>
        ) : (
          <button
            type="button"
            disabled={loading || !hasCredentials}
            onClick={handleSubmit}
            style={{
              width: '100%',
              height: 48,
              background: t.accent,
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: loading || !hasCredentials ? 'not-allowed' : 'pointer',
              marginBottom: errorMsg ? 8 : 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            {loading ? 'Creating account...' : submitButtonText}
          </button>
        )}
        {!enabled && errorMsg && (
          <p style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 12, color: '#f87171', marginBottom: 20 }}>{errorMsg}</p>
        )}
        {!enabled && successMsg && (
          <p style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 12, color: '#34d399', marginBottom: 20 }}>{successMsg}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 12 }}>
          <EditableText value={footerText ?? ''} fieldKey="footerText" tag="span" style={{ color: t.textSecondary, fontSize: 12 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.footerText = val; }, 0)} />
          <a
            href={enabled ? undefined : (footerLink || '#')}
            onClick={(e) => handleLinkClick(e, footerLink || '#', enabled, siteCtx.navigateToPage)}
            onTouchEnd={(e) => handleLinkClick(e as React.TouchEvent, footerLink || '#', enabled, siteCtx.navigateToPage)}
            style={{ color: t.accent, fontSize: 12, cursor: enabled ? 'default' : 'pointer', textDecoration: 'none' }}
          >
            {enabled ? (
              <EditableText value={footerLinkText ?? ''} fieldKey="footerLinkText" tag="span" style={{ color: t.accent, fontSize: 12 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.footerLinkText = val; }, 0)} />
            ) : footerLinkText}
          </a>
        </div>
      </div>
    </section>
  );
});

// ── Settings ─────────────────────────────────────────────────────────────
function TronRegisterSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronRegisterProps>) ?? {};
  const {
    googleButtonText = 'Continue with Google',
    submitButtonText = 'Create Account',
    footerText = 'Already have an account?',
    footerLinkText = 'Sign in',
    googleButtonLink = '',
    googleButtonLinkType = 'external',
    submitButtonLink = '',
    submitButtonLinkType = 'external',
    footerLink = '',
    footerLinkType = 'external',
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    animationType = 'none',
    animateDelay = '0',
  } = props;

  return (
    <div className="p-3 space-y-0">
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Google button text</label>
            <input type="text" value={googleButtonText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.googleButtonText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <LinkPicker
            label="Google button link"
            value={{ type: googleButtonLinkType, href: googleButtonLink ?? '' }}
            onChange={(val) => {
              setProp((p: Record<string, unknown>) => {
                p.googleButtonLink = val.href;
                p.googleButtonLinkType = val.type;
              }, 0);
            }}
            hideSection
          />
          <div>
            <label className={labelCls}>Submit button text</label>
            <input type="text" value={submitButtonText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.submitButtonText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <LinkPicker
            label="Submit button link"
            value={{ type: submitButtonLinkType, href: submitButtonLink ?? '' }}
            onChange={(val) => {
              setProp((p: Record<string, unknown>) => {
                p.submitButtonLink = val.href;
                p.submitButtonLinkType = val.type;
              }, 0);
            }}
            hideSection
          />
          <div>
            <label className={labelCls}>Footer text</label>
            <input type="text" value={footerText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.footerText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Footer link text</label>
            <input type="text" value={footerLinkText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.footerLinkText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <LinkPicker
            label="Footer link"
            value={{ type: footerLinkType, href: footerLink ?? '' }}
            onChange={(val) => {
              setProp((p: Record<string, unknown>) => {
                p.footerLink = val.href;
                p.footerLinkType = val.type;
              }, 0);
            }}
            hideSection
          />
        </div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={darkBg} onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{darkBg}</span>
          </div>
          <label className={labelCls} style={{ marginTop: 12 }}>Background (light mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={lightBg} onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{lightBg}</span>
          </div>
        </div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Animation</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Animation type</label>
            <select value={animationType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}>
              <option value="none">None</option>
              <option value="fade-in">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="slide-down">Slide Down</option>
              <option value="slide-left">Slide Left</option>
              <option value="slide-right">Slide Right</option>
              <option value="scale-in">Scale In</option>
              <option value="blur-in">Blur In</option>
              <option value="rotate-in">Rotate In</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay</label>
            <select value={animateDelay} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}>
              {['0', '0.1', '0.2', '0.3', '0.5', '0.8', '1'].map((v) => (<option key={v} value={v}>{v}s</option>))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ─────────────────────────────────────────────────────────
const tronRegisterCraft = {
  displayName: 'Tron Register',
  props: {
    colorScheme: 'light',
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    title: 'Create account',
    subtitle: 'Join us today',
    googleButtonText: 'Continue with Google',
    firstNameLabel: 'First Name',
    lastNameLabel: 'Last Name',
    submitButtonText: 'Create Account',
    footerText: 'Already have an account?',
    footerLinkText: 'Sign in',
    googleButtonLink: '',
    googleButtonLinkType: 'external',
    submitButtonLink: '',
    submitButtonLinkType: 'external',
    footerLink: '',
    footerLinkType: 'external',
    animationType: 'none',
    animateDelay: '0',
    supabaseUrl: '',
    supabaseAnonKey: '',
  },
  related: { settings: TronRegisterSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    block_type: 'register',
    variant_name: 'default',
    styleTags: ['dark', 'minimal'],
    businessTags: ['ecommerce', 'startup', 'saas', 'education', 'health'],
    featureTags: ['auth'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronRegister as unknown as { craft: typeof tronRegisterCraft }).craft = tronRegisterCraft;
