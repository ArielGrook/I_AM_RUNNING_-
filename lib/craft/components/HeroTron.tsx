'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { useSiteContext } from '@/lib/craft/context/SiteContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { LinkPicker, handleLinkClick } from '@/lib/craft/shared/LinkPicker';

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

// ── Tokens (darkBg/lightBg from props, like TronContact) ───────────────────
function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark: {
      bg: darkBg ?? '#0a0a0a',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      border: 'rgba(255,255,255,0.08)',
      cardBg: 'rgba(255,255,255,0.03)',
      gridColor: 'rgba(255,255,255,0.03)',
    },
    light: {
      bg: lightBg ?? '#ffffff',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      border: 'rgba(0,0,0,0.08)',
      cardBg: 'rgba(0,0,0,0.02)',
      gridColor: 'rgba(0,0,0,0.06)',
    },
  };
}

// ── Interfaces ───────────────────────────────────────────────────────────
export interface TronHeroProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  spotlightIntensity?: number;
  badge?: string;
  showBadge?: boolean;
  headline?: string;
  subheadline?: string;
  subtitle?: string;
  primaryCta?: string;
  primaryCtaHref?: string;
  primaryCtaHrefType?: 'section' | 'page' | 'external';
  secondaryCta?: string;
  secondaryCtaHref?: string;
  secondaryCtaHrefType?: 'section' | 'page' | 'external';
  showSecondaryCta?: boolean;
  showSocialProof?: boolean;
  socialProofText?: string;
  animationType?: string;
  animateDelay?: string;
}

// ── Main component ────────────────────────────────────────────────────────
export const HeroTron = React.memo(function HeroTron() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();
  const siteCtx = useSiteContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkWidth = () => {
      setIsMobile(el.getBoundingClientRect().width < 520);
    };

    checkWidth();

    const observer = new ResizeObserver(([entry]) => {
      setIsMobile((entry?.contentRect?.width ?? 0) < 520);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const props = useNode((node) => node.data.props as Partial<TronHeroProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 100,
    showGrid = true,
    spotlightIntensity = 15,
    badge = '✦ Now in public beta',
    showBadge = true,
    headline = 'Build websites faster.',
    subheadline = 'Professional websites in minutes',
    subtitle = 'Drag, drop, and publish. No code required. Built for modern teams.',
    primaryCta = 'Get started free',
    primaryCtaHref = '#',
    primaryCtaHrefType = 'external',
    secondaryCta = 'View demo',
    secondaryCtaHref = '#',
    secondaryCtaHrefType = 'external',
    showSecondaryCta = true,
    showSocialProof = true,
    socialProofText = '500+ teams already building',
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'dark';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme], accent: accentColor };
  const rgb = hexToRgb(accentColor);

  const spotlightStyle =
    spotlightIntensity != null && spotlightIntensity > 0
      ? {
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(${rgb}, ${spotlightIntensity / 100}) 0%, transparent 70%)`,
        }
      : {};

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      id="hero"
      data-block-type="hero"
      data-block-category="header"
      className={`w-full relative overflow-hidden flex flex-col items-center justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        minHeight: `${sectionHeight}vh`,
        position: 'relative',
      }}
    >
      {/* Grid overlay — key заставляет перемонтировать при смене темы */}
      <div
        key={scheme}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: showGrid
            ? `linear-gradient(${t.gridColor} 1px, transparent 1px),
               linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
            : 'none',
          backgroundSize: showGrid ? '50px 50px' : 'auto',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Spotlight overlay */}
      {spotlightIntensity != null && spotlightIntensity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            ...spotlightStyle,
          }}
        />
      )}

      {/* Content */}
      <div
        className="max-w-3xl mx-auto w-full px-4 sm:px-6 text-center"
        style={{ position: 'relative', zIndex: 1 }}
        {...animAttrs}
      >
        {showBadge && (badge || enabled) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 100,
              border: `1px solid rgba(${rgb}, 0.3)`,
              background: `rgba(${rgb}, 0.08)`,
              color: accentColor,
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 24,
            }}
          >
            {enabled ? (
              <EditableText value={badge ?? ''} fieldKey="badge" tag="span" style={{ color: accentColor }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.badge = val; }, 0)} />
            ) : (
              badge
            )}
          </div>
        )}

        <EditableText
          value={headline ?? ''}
          fieldKey="headline"
          tag="h1"
          style={{
            fontSize: 'clamp(40px, 7vw, 96px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: t.text,
            margin: '0 0 12px',
          }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.headline = val; }, 0)}
        />

        {(enabled || subheadline) && (
          <EditableText
            value={subheadline ?? ''}
            fieldKey="subheadline"
            tag="p"
            style={{
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              fontWeight: 500,
              color: t.text,
              margin: '0 0 12px',
              lineHeight: 1.4,
            }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.subheadline = val; }, 0)}
          />
        )}

        {(enabled || subtitle) && (
          <EditableText
            value={subtitle ?? ''}
            fieldKey="subtitle"
            tag="p"
            style={{
              fontSize: 16,
              color: t.textSecondary,
              lineHeight: 1.6,
              margin: '0 auto',
              maxWidth: 520,
            }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
          />
        )}

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 12,
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'center',
            marginTop: 32,
          }}
        >
          <a
            href={enabled ? undefined : primaryCtaHref}
            onClick={(e) => handleLinkClick(e, primaryCtaHref ?? '#', enabled, siteCtx.navigateToPage)}
            onTouchEnd={(e) => handleLinkClick(e as any, primaryCtaHref ?? '#', enabled, siteCtx.navigateToPage)}
            style={{
              padding: '14px 32px',
              background: accentColor,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: enabled ? 'default' : 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {enabled ? (
              <EditableText value={primaryCta ?? ''} fieldKey="primaryCta" tag="span" style={{ color: '#fff', fontWeight: 600 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.primaryCta = val; }, 0)} />
            ) : (
              primaryCta
            )}
          </a>

          {showSecondaryCta && (
            <a
              href={enabled ? undefined : secondaryCtaHref}
              onClick={(e) => handleLinkClick(e, secondaryCtaHref ?? '#', enabled, siteCtx.navigateToPage)}
              onTouchEnd={(e) => handleLinkClick(e as any, secondaryCtaHref ?? '#', enabled, siteCtx.navigateToPage)}
              style={{
                padding: '14px 32px',
                background: 'transparent',
                color: t.text,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                cursor: enabled ? 'default' : 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {enabled ? (
                <EditableText value={secondaryCta ?? ''} fieldKey="secondaryCta" tag="span" style={{ color: t.text, fontWeight: 500 }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.secondaryCta = val; }, 0)} />
              ) : (
                secondaryCta
              )}
            </a>
          )}
        </div>

        {/* Social proof */}
        {showSocialProof && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 40,
            }}
          >
            <div style={{ display: 'flex', gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: accentColor, fontSize: 14 }}>
                  ★
                </span>
              ))}
            </div>
            <span style={{ color: t.textSecondary, fontSize: 14 }}>
              {enabled ? (
                <EditableText value={socialProofText ?? ''} fieldKey="socialProofText" tag="span" style={{ color: t.textSecondary }} enabled={enabled} onSave={(val) => setProp((p: Record<string, unknown>) => { p.socialProofText = val; }, 0)} />
              ) : (
                socialProofText
              )}
            </span>
          </div>
        )}
      </div>
    </section>
  );
});

// ── Settings ───────────────────────────────────────────────────────────────
function HeroTronSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronHeroProps>) ?? {};
  const {
    badge = '✦ Now in public beta',
    headline = 'Build websites faster.',
    subheadline = 'Professional websites in minutes',
    subtitle = 'Drag, drop, and publish. No code required. Built for modern teams.',
    primaryCta = 'Get started free',
    primaryCtaHref = '#',
    primaryCtaHrefType = 'external',
    secondaryCta = 'View demo',
    secondaryCtaHref = '#',
    secondaryCtaHrefType = 'external',
    showBadge = true,
    showSecondaryCta = true,
    showSocialProof = true,
    showGrid = true,
    socialProofText = '500+ teams already building',
    spotlightIntensity = 15,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 100,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const setT = (key: keyof TronHeroProps, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  return (
    <div className="p-3 space-y-0">
      {/* CONTENT */}
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Badge</label>
            <input type="text" value={badge} onChange={(e) => setT('badge', 500)(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Headline</label>
            <input type="text" value={headline} onChange={(e) => setT('headline', 500)(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subheadline</label>
            <input type="text" value={subheadline} onChange={(e) => setT('subheadline', 500)(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <input type="text" value={subtitle} onChange={(e) => setT('subtitle', 500)(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">CTA</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Primary button</label>
            <input type="text" value={primaryCta} onChange={(e) => setT('primaryCta', 500)(e.target.value)} className={inputCls} />
          </div>
          <LinkPicker
            label="Primary button link"
            value={{ type: primaryCtaHrefType, href: primaryCtaHref }}
            onChange={(val) => {
              setProp((p: Record<string, unknown>) => {
                p.primaryCtaHref = val.href;
                p.primaryCtaHrefType = val.type;
              }, 0);
            }}
          />
          <div>
            <label className={labelCls}>Secondary button</label>
            <input type="text" value={secondaryCta} onChange={(e) => setT('secondaryCta', 500)(e.target.value)} className={inputCls} />
          </div>
          <LinkPicker
            label="Secondary button link"
            value={{ type: secondaryCtaHrefType, href: secondaryCtaHref }}
            onChange={(val) => {
              setProp((p: Record<string, unknown>) => {
                p.secondaryCtaHref = val.href;
                p.secondaryCtaHrefType = val.type;
              }, 0);
            }}
          />
        </div>
      </div>

      {/* DISPLAY */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Display</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showBadge} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showBadge = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show badge
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showSecondaryCta} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showSecondaryCta = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show secondary CTA
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showSocialProof} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showSocialProof = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show social proof
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showGrid} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show grid
          </label>
        </div>
      </div>

      {/* SOCIAL PROOF */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Social proof</h3>
        <div>
          <label className={labelCls}>Text</label>
          <input type="text" value={socialProofText} onChange={(e) => setT('socialProofText', 500)(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* STYLE */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Style</h3>
        <div>
          <label className={labelCls}>Spotlight intensity: {spotlightIntensity ?? 15}</label>
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={spotlightIntensity ?? 15}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.spotlightIntensity = Number(e.target.value); }, 300)}
            className="settings-slider"
          />
        </div>
      </div>

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={darkBg ?? '#0a0a0a'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{darkBg ?? '#0a0a0a'}</span>
          </div>
          <label className={labelCls} style={{ marginTop: 12 }}>Background (light mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={lightBg ?? '#ffffff'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{lightBg ?? '#ffffff'}</span>
          </div>
        </div>
      </div>

      {/* SIZE */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Size</h3>
        <div>
          <label className={labelCls}>Section height: {sectionHeight}vh</label>
          <input
            type="range"
            min={60}
            max={100}
            step={5}
            value={sectionHeight}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)}
            className="settings-slider"
          />
        </div>
      </div>

      {/* ANIMATION */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Animation</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Type</label>
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
              <option value="rotate-in">Rotate In</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay</label>
            <select
              value={animateDelay}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })}
              className={inputCls}
            >
              {['0', '0.1', '0.2', '0.3', '0.5', '0.8', '1'].map((v) => (
                <option key={v} value={v}>{v}s</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ──────────────────────────────────────────────────────────
const heroTronCraft = {
  displayName: 'Hero Tron',
  props: {
    colorScheme: 'dark' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 100,
    showGrid: true,
    spotlightIntensity: 15,
    showBadge: true,
    badge: '✦ Now in public beta',
    headline: 'Build websites faster.',
    subheadline: 'Professional websites in minutes',
    subtitle: 'Drag, drop, and publish. No code required. Built for modern teams.',
    primaryCta: 'Get started free',
    primaryCtaHref: '#',
    primaryCtaHrefType: 'external' as const,
    secondaryCta: 'View demo',
    secondaryCtaHref: '#',
    secondaryCtaHrefType: 'external' as const,
    showSecondaryCta: true,
    showSocialProof: true,
    socialProofText: '500+ teams already building',
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: HeroTronSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal', 'bold'],
    businessTags: ['saas', 'startup', 'agency'],
    featureTags: ['hero'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(HeroTron as unknown as { craft: typeof heroTronCraft }).craft = heroTronCraft;

// ── Backward compatibility: HeroTronHeading, HeroTronSubheading, HeroTronButton ─────────────────
export interface HeroTronHeadingProps {
  text: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

export const HeroTronHeading = React.memo(function HeroTronHeading(props: HeroTronHeadingProps) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { text = 'Build faster.', accentColor = '#FF6B35', colorScheme = 'dark' } = props;
  const tokens = buildTokens('#0a0a0a', '#ffffff');
  const t = tokens[colorScheme];
  const words = (text ?? '').split(' ');
  const first = words[0] ?? '';
  const rest = words.slice(1).join(' ');
  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={isSelected ? 'craft-node-selected' : ''}
      style={{
        color: t.text,
        fontSize: 'clamp(40px, 6vw, 80px)',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        margin: '0 0 24px 0',
      }}
    >
      <span style={{ color: accentColor }}>{first}</span>
      {rest ? ` ${rest}` : ''}
    </div>
  );
});

// Minimal settings for HeroTronHeading
function HeroTronHeadingSettings() {
  const { actions: { setProp } } = useNode();
  const { text, animationType, animateDelay } = useNode((n) => n.data.props as HeroTronHeadingProps) ?? {};
  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Text</label><input type="text" value={text ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.text = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Animation</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
}

(HeroTronHeading as unknown as { craft: object }).craft = {
  displayName: 'Hero Tron Heading',
  props: { text: 'Build faster.', accentColor: '#FF6B35', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: HeroTronHeadingSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

export interface HeroTronSubheadingProps {
  text: string;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

export const HeroTronSubheading = React.memo(function HeroTronSubheading(props: HeroTronSubheadingProps) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { text = 'Create modern websites in minutes.', colorScheme = 'dark' } = props;
  const tokens = buildTokens('#0a0a0a', '#ffffff');
  const t = tokens[colorScheme];
  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={isSelected ? 'craft-node-selected' : ''}
      style={{
        fontSize: 'clamp(16px, 2vw, 20px)',
        color: t.textSecondary,
        lineHeight: 1.7,
        maxWidth: 520,
        margin: '0 auto 40px',
      }}
    >
      {text}
    </div>
  );
});

function HeroTronSubheadingSettings() {
  const { actions: { setProp } } = useNode();
  const { text, animationType, animateDelay } = useNode((n) => n.data.props as HeroTronSubheadingProps) ?? {};
  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Text</label><input type="text" value={text ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.text = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Animation</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
}

(HeroTronSubheading as unknown as { craft: object }).craft = {
  displayName: 'Hero Tron Subheading',
  props: { text: 'Create modern websites in minutes.', accentColor: '#FF6B35', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: HeroTronSubheadingSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

export type HeroTronButtonStyle = 'filled' | 'outline';

export interface HeroTronButtonProps {
  text: string;
  href: string;
  style: HeroTronButtonStyle;
  accentColor: string;
  colorScheme: 'dark' | 'light';
  animationType: string;
  animateDelay: string;
}

export const HeroTronButton = React.memo(function HeroTronButton(props: HeroTronButtonProps) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const { text = 'Get Started', href = '#', style: btnStyle = 'filled', accentColor = '#FF6B35', colorScheme = 'dark' } = props;
  const tokens = buildTokens('#0a0a0a', '#ffffff');
  const t = tokens[colorScheme];
  const isFilled = btnStyle === 'filled';
  return (
    <a
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      href={href}
      className={isSelected ? 'craft-node-selected' : ''}
      style={{
    display: 'inline-block',
    padding: '16px 40px',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
        background: isFilled ? accentColor : 'transparent',
        color: isFilled ? '#fff' : accentColor,
    border: isFilled ? 'none' : `2px solid ${accentColor}`,
    textDecoration: 'none',
    cursor: 'pointer',
      }}
    >
      {text}
    </a>
  );
});

function HeroTronButtonSettings() {
  const { actions: { setProp } } = useNode();
  const { text, href, style: btnStyle, animationType, animateDelay } = useNode((n) => n.data.props as HeroTronButtonProps) ?? {};
  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Text</label><input type="text" value={text ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.text = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Link</label><input type="text" value={href ?? ''} onChange={(e) => setProp((p: Record<string, unknown>) => { p.href = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Style</label><select value={btnStyle ?? 'filled'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.style = e.target.value; })} className={inputCls}><option value="filled">Filled</option><option value="outline">Outline</option></select></div>
      <div><label className={labelCls}>Animation</label><select value={animationType ?? 'none'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}><option value="none">None</option><option value="fade-in">Fade In</option><option value="slide-up">Slide Up</option></select></div>
      <div><label className={labelCls}>Delay</label><select value={animateDelay ?? '0'} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}><option value="0">0s</option><option value="0.1">0.1s</option><option value="0.2">0.2s</option></select></div>
    </div>
  );
}

(HeroTronButton as unknown as { craft: object }).craft = {
  displayName: 'Hero Tron Button',
  props: { text: 'Get Started', href: '#', style: 'filled' as HeroTronButtonStyle, accentColor: '#FF6B35', colorScheme: 'dark' as const, animationType: 'none', animateDelay: '0' },
  related: { settings: HeroTronButtonSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};
