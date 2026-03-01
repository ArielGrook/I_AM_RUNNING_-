'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';

// ── Google Icon ───────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// ── Tokens ────────────────────────────────────────────────────────────────────
function buildTokens(scheme: 'dark' | 'light', accentColor: string) {
  if (scheme === 'light') {
    return {
      pageBg: '#f8f8f8',
      cardBg: '#ffffff',
      border: '#e0e0e0',
      text: '#1a1a1a',
      textMuted: '#71717a',
      accent: accentColor,
    };
  }
  return {
    pageBg: '#0a0a0a',
    cardBg: '#111111',
    border: '#2a2a2a',
    text: '#e4e4e4',
    textMuted: '#71717a',
    accent: accentColor,
  };
}

// ── Interface ─────────────────────────────────────────────────────────────────
interface TronLoginProps {
  title?: string;
  subtitle?: string;
  googleButtonText?: string;
  submitButtonText?: string;
  footerText?: string;
  footerLinkText?: string;
  animationType?: string;
  isNewlyAdded?: boolean;
}

// ── Main component ────────────────────────────────────────────────────────────
export const TronLogin = React.memo(function TronLogin() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const props = useNode((node) => node.data.props as Partial<TronLoginProps>);
  const {
    title = 'Welcome back',
    subtitle = 'Sign in to your account',
    googleButtonText = 'Continue with Google',
    submitButtonText = 'Sign In',
    footerText = "Don't have an account?",
    footerLinkText = 'Create one',
    animationType = 'none',
    isNewlyAdded = false,
  } = props;

  const accentColor = theme.accentColor ?? '#FF6B35';
  const scheme = (theme.colorScheme ?? 'dark') as 'dark' | 'light';
  const t = buildTokens(scheme, accentColor);

  // Auto-create page on first drop
  React.useEffect(() => {
    if (!isNewlyAdded || !enabled) return;
    window.dispatchEvent(new CustomEvent('craft:addPage', { detail: { name: 'Login' } }));
    setProp((p: Record<string, unknown>) => { p.isNewlyAdded = false; }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
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
      ref={(el) => { if (el) connect(drag(el)); }}
      data-block-type="login"
      className={`w-full max-w-full ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        minHeight: '100vh',
        background: t.pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: '32px 28px',
          boxSizing: 'border-box',
        }}
        {...animAttrs}
      >
        {/* Title */}
        <EditableText
          value={title ?? ''}
          fieldKey="title"
          tag="h1"
          style={{
            fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
            fontSize: 20,
            fontWeight: 700,
            color: t.text,
            marginBottom: 6,
            marginTop: 0,
          }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.title = val; }, 0)}
        />

        {/* Subtitle */}
        <EditableText
          value={subtitle ?? ''}
          fieldKey="subtitle"
          tag="p"
          style={{
            fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
            fontSize: 13,
            color: t.textMuted,
            marginBottom: 24,
            marginTop: 0,
          }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
        />

        {/* Google button */}
        <button
          type="button"
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
          }}
        >
          <GoogleIcon />
          <span
            style={{
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
              fontSize: 13,
              color: t.text,
            }}
          >
            {enabled ? (
              <EditableText
                value={googleButtonText ?? ''}
                fieldKey="googleButtonText"
                tag="span"
                style={{ color: t.text, fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 13 }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => { p.googleButtonText = val; }, 0)}
              />
            ) : googleButtonText}
          </span>
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span
            style={{
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
              fontSize: 11,
              color: t.textMuted,
            }}
          >
            or
          </span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>

        {/* Email input */}
        <input
          type="email"
          placeholder="Email"
          readOnly
          style={{ ...inputStyle, marginBottom: 12 }}
        />

        {/* Password input */}
        <input
          type="password"
          placeholder="Password"
          readOnly
          style={{ ...inputStyle, marginBottom: 20 }}
        />

        {/* Submit button */}
        <button
          type="submit"
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
            cursor: enabled ? 'default' : 'pointer',
            marginBottom: 20,
            pointerEvents: enabled ? 'none' : 'auto',
          }}
        >
          {enabled ? (
            <EditableText
              value={submitButtonText ?? ''}
              fieldKey="submitButtonText"
              tag="span"
              style={{ color: '#ffffff', fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 13, fontWeight: 600 }}
              enabled={enabled}
              onSave={(val) => setProp((p: Record<string, unknown>) => { p.submitButtonText = val; }, 0)}
            />
          ) : submitButtonText}
        </button>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
            fontSize: 12,
          }}
        >
          <EditableText
            value={footerText ?? ''}
            fieldKey="footerText"
            tag="span"
            style={{ color: t.textMuted, fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 12 }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.footerText = val; }, 0)}
          />
          <EditableText
            value={footerLinkText ?? ''}
            fieldKey="footerLinkText"
            tag="span"
            style={{ color: t.accent, fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace', fontSize: 12, cursor: 'pointer' }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.footerLinkText = val; }, 0)}
          />
        </div>
      </div>
    </section>
  );
});

// ── Settings ──────────────────────────────────────────────────────────────────
function TronLoginSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronLoginProps>);
  const { animationType = 'none' } = props;

  return (
    <div className="p-3 space-y-0">
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Animation</h3>
        <div>
          <label className={labelCls}>Animation type</label>
          <select
            value={animationType}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })}
            className={inputCls}
          >
            <option value="none">None</option>
            <option value="fade-in">Fade In</option>
            <option value="slide-up">Slide Up</option>
            <option value="slide-down">Slide Down</option>
            <option value="slide-left">Slide Left</option>
            <option value="slide-right">Slide Right</option>
            <option value="scale-in">Scale In</option>
            <option value="blur-in">Blur In</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ──────────────────────────────────────────────────────────────
const tronLoginCraft = {
  displayName: 'Tron Login',
  props: {
    title: 'Welcome back',
    subtitle: 'Sign in to your account',
    googleButtonText: 'Continue with Google',
    submitButtonText: 'Sign In',
    footerText: "Don't have an account?",
    footerLinkText: 'Create one',
    animationType: 'none',
    isNewlyAdded: true,
  },
  related: { settings: TronLoginSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['startup', 'saas', 'agency'],
    featureTags: ['auth', 'login'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronLogin as unknown as { craft: typeof tronLoginCraft }).craft = tronLoginCraft;
