'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { useSiteContext } from '@/lib/craft/context/SiteContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { LinkPicker, handleLinkClick } from '@/lib/craft/shared/LinkPicker';
import { buildGridTokens as buildTokens } from '../tokens';

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

// ── Props interface ───────────────────────────────────────────────────────
export interface TronCTAProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  label?: string;
  showLabel?: boolean;
  title?: string;
  subtitle?: string;
  primaryText?: string;
  primaryHref?: string;
  primaryHrefType?: 'section' | 'page' | 'external';
  secondaryText?: string;
  secondaryHref?: string;
  secondaryHrefType?: 'section' | 'page' | 'external';
  showSecondary?: boolean;
  layoutStyle?: 'centered' | 'split';
  glowIntensity?: number;
  cardTitle?: string;
  cardText?: string;
  cardBadge?: string;
  cardIcon?: string;
  animationType?: string;
  animateDelay?: string;
}

// ── Card icon set ─────────────────────────────────────────────────────────
const CARD_ICONS: Record<string, React.ReactNode> = {
  bolt: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  lock: (<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  user: (<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  globe: (<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>),
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  check: (<><polyline points="20 6 9 17 4 12"/></>),
  rocket: (<><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></>),
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
};

const CARD_ICON_LABELS: Record<string, string> = {
  bolt: '⚡ Bolt', shield: '🛡 Shield', lock: '🔒 Lock',
  user: '👤 User', globe: '🌐 Globe', star: '⭐ Star',
  check: '✓ Check', rocket: '🚀 Rocket', heart: '♥ Heart',
};
export const TronCTA = React.memo(function TronCTA() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();
  const siteCtx = useSiteContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const primaryBtnRef = React.useRef<HTMLAnchorElement>(null);
  const secondaryBtnRef = React.useRef<HTMLAnchorElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [primaryHovered, setPrimaryHovered] = React.useState(false);
  const [secondaryHovered, setSecondaryHovered] = React.useState(false);

  // ResizeObserver — 520px breakpoint, строго пустой массив
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setIsMobile(el.getBoundingClientRect().width < 520);
    check();
    const observer = new ResizeObserver(([e]) => setIsMobile(e.contentRect.width < 520));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // GSAP — stagger анимация слов заголовка при маунте
  React.useEffect(() => {
    if (typeof window === 'undefined' || enabled) return;
    let ctx: { revert?: () => void } = {};
    const initGsap = async () => {
      try {
        const gsapModule = await import('gsap');
        const gsap = (gsapModule as unknown as { gsap: typeof import('gsap').gsap }).gsap
          || (gsapModule as unknown as { default: typeof import('gsap').gsap }).default;
        if (!gsap) return;

        const words = containerRef.current?.querySelectorAll('.tron-cta-word');
        if (!words?.length) return;

        ctx = gsap.context(() => {
          gsap.fromTo(
            words,
            { opacity: 0, y: 40, rotateX: -20 },
            {
              opacity: 1, y: 0, rotateX: 0,
              duration: 0.7, ease: 'power3.out',
              stagger: 0.08, delay: 0.1,
            }
          );
        });
      } catch (e) {
        // GSAP unavailable — degrade gracefully
      }
    };
    initGsap();
    return () => { if (ctx?.revert) ctx.revert(); };
  }, [enabled]);

  // Magnetic buttons
  React.useEffect(() => {
    if (typeof window === 'undefined' || enabled || isMobile) return;
    const buttons = [
      { el: primaryBtnRef.current },
      { el: secondaryBtnRef.current },
    ];

    const cleanups: (() => void)[] = [];

    buttons.forEach(({ el }) => {
      if (!el) return;
      const handleMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.25;
        const dy = (e.clientY - cy) * 0.25;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      };
      const handleLeave = () => { el.style.transform = 'translate(0,0)'; };
      el.addEventListener('mousemove', handleMove);
      el.addEventListener('mouseleave', handleLeave);
      cleanups.push(() => {
        el.removeEventListener('mousemove', handleMove);
        el.removeEventListener('mouseleave', handleLeave);
      });
    });

    return () => cleanups.forEach((c) => c());
  }, [enabled, isMobile]);

  // Pulse animation keyframes
  React.useEffect(() => {
    const id = 'tron-cta-animations';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes tronCtaRing {
        0%   { transform: scale(0.8); opacity: 0.8; }
        100% { transform: scale(2);   opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // ── Props ──────────────────────────────────────────────────────────────
  const props = useNode((node) => node.data.props as Partial<TronCTAProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 70,
    showGrid = true,
    label = 'Ready to start?',
    showLabel = true,
    title = 'Build your website today',
    subtitle = 'Join thousands of businesses already running on our platform. No code required — just results.',
    primaryText = 'Start for free',
    primaryHref = '#',
    primaryHrefType = 'external',
    secondaryText = 'See examples',
    secondaryHref = '#',
    secondaryHrefType = 'external',
    showSecondary = true,
    layoutStyle = 'centered',
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'light';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme], accent: accentColor };
  const rgb = hexToRgb(accentColor);

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  // Split title into words for GSAP stagger
  const titleWords = (title ?? '').split(' ').filter(Boolean);

  // ── Layout: centered or split ──────────────────────────────────────────
  const isSplit = layoutStyle === 'split' && !isMobile;

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      id="cta"
      data-block-type="cta"
      className={`w-full relative overflow-hidden ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        minHeight: `${sectionHeight}vh`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Grid */}
      <div
        key={scheme}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: showGrid
            ? `linear-gradient(${t.gridColor} 1px, transparent 1px),
               linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
            : 'none',
          backgroundSize: showGrid ? '50px 50px' : 'auto',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative', zIndex: 2,
          width: '100%',
          maxWidth: 1200, margin: '0 auto',
          padding: isMobile ? '60px 24px' : '80px 40px',
          display: 'flex',
          flexDirection: isSplit ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: isSplit ? 'space-between' : 'center',
          gap: isSplit ? 60 : 0,
          textAlign: isSplit ? 'left' : 'center',
        }}
        {...animAttrs}
      >
        {/* Text side */}
        <div style={{ flex: isSplit ? '1 1 55%' : 'none', maxWidth: isSplit ? '55%' : 680 }}>

          {/* Label */}
          {showLabel && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: 20,
              justifyContent: isSplit ? 'flex-start' : 'center',
              width: '100%',
            }}>
              {/* Animated ring */}
              <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: accentColor,
                }} />
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: `1px solid ${accentColor}`,
                  animation: 'tronCtaRing 2s ease-out infinite',
                }} />
              </div>
              <EditableText
                value={label ?? ''}
                fieldKey="label"
                tag="span"
                style={{
                  color: accentColor, fontSize: 13, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => { p.label = val; }, 0)}
              />
            </div>
          )}

          {/* Title with word-split for GSAP */}
          <h2
            style={{
              fontSize: isMobile ? 32 : (isSplit ? 40 : 52),
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: t.text,
              margin: '0 0 20px',
              perspective: 800,
            }}
          >
            {enabled ? (
              <EditableText
                value={title ?? ''}
                fieldKey="title"
                tag="span"
                style={{ color: t.text }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => { p.title = val; }, 0)}
              />
            ) : (
              titleWords.map((word, i) => (
                <React.Fragment key={i}>
                  <span
                    className="tron-cta-word"
                    style={{ display: 'inline-block', marginRight: '0.25em' }}
                  >
                    {word}
                  </span>
                </React.Fragment>
              ))
            )}
          </h2>

          {/* Subtitle */}
          <EditableText
            value={subtitle ?? ''}
            fieldKey="subtitle"
            tag="p"
            style={{
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.65,
              color: t.textSecondary,
              margin: '0 0 36px',
              maxWidth: isSplit ? '100%' : 560,
              marginLeft: isSplit ? 0 : 'auto',
              marginRight: isSplit ? 0 : 'auto',
            }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
          />

          {/* Buttons */}
          {isSplit && (
            <ButtonGroup
              enabled={enabled}
              isMobile={isMobile}
              primaryText={primaryText}
              primaryHref={primaryHref}
              primaryHrefType={primaryHrefType}
              secondaryText={secondaryText}
              secondaryHref={secondaryHref}
              secondaryHrefType={secondaryHrefType}
              showSecondary={showSecondary}
              accentColor={accentColor}
              rgb={rgb}
              t={t}
              primaryHovered={primaryHovered}
              secondaryHovered={secondaryHovered}
              setPrimaryHovered={setPrimaryHovered}
              setSecondaryHovered={setSecondaryHovered}
              primaryBtnRef={primaryBtnRef}
              secondaryBtnRef={secondaryBtnRef}
              siteCtx={siteCtx}
              setProp={setProp}
            />
          )}
        </div>

        {/* Centered buttons (non-split) */}
        {!isSplit && (
          <ButtonGroup
            enabled={enabled}
            isMobile={isMobile}
            primaryText={primaryText}
            primaryHref={primaryHref}
            primaryHrefType={primaryHrefType}
            secondaryText={secondaryText}
            secondaryHref={secondaryHref}
            secondaryHrefType={secondaryHrefType}
            showSecondary={showSecondary}
            accentColor={accentColor}
            rgb={rgb}
            t={t}
            primaryHovered={primaryHovered}
            secondaryHovered={secondaryHovered}
            setPrimaryHovered={setPrimaryHovered}
            setSecondaryHovered={setSecondaryHovered}
            primaryBtnRef={primaryBtnRef}
            secondaryBtnRef={secondaryBtnRef}
            siteCtx={siteCtx}
            setProp={setProp}
          />
        )}

        {/* Split right: decorative card */}
        {isSplit && (
          <div style={{
            flex: '0 0 38%', maxWidth: '38%',
            position: 'relative',
          }}>
            <div style={{
              borderRadius: 20,
              padding: '32px 28px',
              background: `rgba(${rgb}, 0.06)`,
              border: `1px solid rgba(${rgb}, 0.15)`,
              backdropFilter: 'blur(12px)',
            }}>
              {/* Editable card content */}
              <div style={{ marginBottom: 20 }}>
                <EditableText
                  value={props.cardTitle ?? 'Fast & reliable'}
                  fieldKey="cardTitle"
                  tag="div"
                  style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 10 }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => { p.cardTitle = val; }, 0)}
                />
                <EditableText
                  value={props.cardText ?? 'Deploy in minutes, not months. Our platform handles everything so you can focus on your business.'}
                  fieldKey="cardText"
                  tag="p"
                  style={{ fontSize: 14, lineHeight: 1.65, color: t.textSecondary }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => { p.cardText = val; }, 0)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: `1px solid rgba(${rgb}, 0.12)` }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `rgba(${rgb}, 0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                    {CARD_ICONS[props.cardIcon ?? 'bolt']}
                  </svg>
                </div>
                <EditableText
                  value={props.cardBadge ?? 'No credit card required'}
                  fieldKey="cardBadge"
                  tag="span"
                  style={{ fontSize: 13, color: t.textSecondary, fontWeight: 500 }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => { p.cardBadge = val; }, 0)}
                />
              </div>
            </div>
            {/* Glow behind card */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '120%', height: '120%',
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${rgb}, 0.12) 0%, transparent 70%)`,
              pointerEvents: 'none', zIndex: -1,
            }} />
          </div>
        )}
      </div>
    </section>
  );
});

// ── Button group (shared between centered + split) ─────────────────────────
interface ButtonGroupProps {
  enabled: boolean;
  isMobile: boolean;
  primaryText?: string;
  primaryHref?: string;
  primaryHrefType?: string;
  secondaryText?: string;
  secondaryHref?: string;
  secondaryHrefType?: string;
  showSecondary?: boolean;
  accentColor: string;
  rgb: string;
  t: { text: string; textSecondary: string; border: string };
  primaryHovered: boolean;
  secondaryHovered: boolean;
  setPrimaryHovered: (v: boolean) => void;
  setSecondaryHovered: (v: boolean) => void;
  primaryBtnRef: React.RefObject<HTMLAnchorElement>;
  secondaryBtnRef: React.RefObject<HTMLAnchorElement>;
  siteCtx: { navigateToPage: (slug: string) => void };
  setProp: (cb: (p: Record<string, unknown>) => void, ms?: number) => void;
}

function ButtonGroup({
  enabled, isMobile,
  primaryText, primaryHref, primaryHrefType,
  secondaryText, secondaryHref, secondaryHrefType,
  showSecondary, accentColor, rgb, t,
  primaryHovered, secondaryHovered,
  setPrimaryHovered, setSecondaryHovered,
  primaryBtnRef, secondaryBtnRef,
  siteCtx, setProp,
}: ButtonGroupProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 12 : 16,
      alignItems: isMobile ? 'stretch' : 'center',
      justifyContent: 'center',
    }}>
      {/* Primary button */}
      <a
        ref={primaryBtnRef}
        href={enabled ? undefined : (primaryHref ?? '#')}
        onClick={(e) => handleLinkClick(e, primaryHref ?? '#', enabled, siteCtx.navigateToPage)}
        onMouseEnter={() => !enabled && setPrimaryHovered(true)}
        onMouseLeave={() => setPrimaryHovered(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          gap: 8,
          padding: isMobile ? '16px 32px' : '14px 36px',
          borderRadius: 100,
          background: primaryHovered
            ? accentColor
            : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          color: '#ffffff',
          fontWeight: 700, fontSize: isMobile ? 16 : 15,
          cursor: enabled ? 'default' : 'pointer',
          textDecoration: 'none',
          boxShadow: primaryHovered
            ? `0 0 32px rgba(${rgb}, 0.5), 0 8px 24px rgba(${rgb}, 0.3)`
            : `0 0 16px rgba(${rgb}, 0.25)`,
          transition: 'all 0.2s ease',
          transform: primaryHovered ? 'translateY(-2px)' : 'translateY(0)',
          whiteSpace: 'nowrap',
        }}
      >
        {enabled ? (
          <EditableText
            value={primaryText ?? ''}
            fieldKey="primaryText"
            tag="span"
            style={{ color: '#ffffff', fontWeight: 700 }}
            enabled={enabled}
            onSave={(val) => setProp((p) => { p.primaryText = val; }, 0)}
          />
        ) : primaryText}
        {!enabled && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </a>

      {/* Secondary button */}
      {showSecondary && (
        <a
          ref={secondaryBtnRef}
          href={enabled ? undefined : (secondaryHref ?? '#')}
          onClick={(e) => handleLinkClick(e, secondaryHref ?? '#', enabled, siteCtx.navigateToPage)}
          onMouseEnter={() => !enabled && setSecondaryHovered(true)}
          onMouseLeave={() => setSecondaryHovered(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            gap: 8,
            padding: isMobile ? '16px 32px' : '14px 36px',
            borderRadius: 100,
            background: secondaryHovered ? `rgba(${rgb}, 0.1)` : 'transparent',
            color: t.text,
            fontWeight: 600, fontSize: isMobile ? 16 : 15,
            cursor: enabled ? 'default' : 'pointer',
            textDecoration: 'none',
            border: `1px solid ${secondaryHovered ? `rgba(${rgb}, 0.4)` : t.border}`,
            transition: 'all 0.2s ease',
            transform: secondaryHovered ? 'translateY(-2px)' : 'translateY(0)',
            whiteSpace: 'nowrap',
          }}
        >
          {enabled ? (
            <EditableText
              value={secondaryText ?? ''}
              fieldKey="secondaryText"
              tag="span"
              style={{ color: t.text, fontWeight: 600 }}
              enabled={enabled}
              onSave={(val) => setProp((p) => { p.secondaryText = val; }, 0)}
            />
          ) : secondaryText}
        </a>
      )}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────
function TronCTASettings() {
  const { actions: { setProp } } = useNode();

  const props = useNode((node) => node.data.props as Partial<TronCTAProps>) ?? {};
  const {
    label = 'Ready to start?',
    showLabel = true,
    title = 'Build your website today',
    subtitle = 'Join thousands of businesses already running on our platform.',
    primaryText = 'Start for free',
    primaryHref = '#',
    primaryHrefType = 'external',
    secondaryText = 'See examples',
    secondaryHref = '#',
    secondaryHrefType = 'external',
    showSecondary = true,
    layoutStyle = 'centered',
    glowIntensity = 12,
    showGrid = true,
    accentColor = '#FF6B35',
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 60,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  return (
    <div className="p-3 space-y-0">
      {/* CONTENT */}
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Label</label>
            <input type="text" value={label} onChange={(e) => setProp((p: Record<string, unknown>) => { p.label = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <textarea value={subtitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; }, 500)} className={inputCls} rows={3} />
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Layout</h3>
        <div>
          <label className={labelCls}>Style</label>
          <select value={layoutStyle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.layoutStyle = e.target.value; })} className={inputCls}>
            <option value="centered">Centered</option>
            <option value="split">Split (text + card)</option>
          </select>
        </div>
      </div>

      {/* BUTTONS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Primary button</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Text</label>
            <input type="text" value={primaryText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.primaryText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <LinkPicker
            label="Link"
            value={{ type: (primaryHrefType ?? 'external') as 'section' | 'page' | 'external', href: primaryHref ?? '#' }}
            onChange={(val) => setProp((p: Record<string, unknown>) => { p.primaryHref = val.href; p.primaryHrefType = val.type; }, 0)}
          />
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Secondary button</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <input type="checkbox" checked={showSecondary} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showSecondary = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show secondary button
          </label>
          {showSecondary && (
            <>
              <div>
                <label className={labelCls}>Text</label>
                <input type="text" value={secondaryText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.secondaryText = e.target.value; }, 500)} className={inputCls} />
              </div>
              <LinkPicker
                label="Link"
                value={{ type: (secondaryHrefType ?? 'external') as 'section' | 'page' | 'external', href: secondaryHref ?? '#' }}
                onChange={(val) => setProp((p: Record<string, unknown>) => { p.secondaryHref = val.href; p.secondaryHrefType = val.type; }, 0)}
              />
            </>
          )}
        </div>
      </div>

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Colors</h3>
        <div className="space-y-2">
          {[
            { label: 'Accent', key: 'accentColor', value: accentColor },
            { label: 'Background (dark)', key: 'darkBg', value: darkBg },
            { label: 'Background (light)', key: 'lightBg', value: lightBg },
          ].map(({ label: lbl, key, value }) => (
            <div key={key}>
              <label className={labelCls}>{lbl}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input type="color" value={value}
                  onChange={(e) => {
                    setProp((p: Record<string, unknown>) => { p[key] = e.target.value; }, 300);
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('iam_color_preset_changed', {
                        detail: { accentColor, darkBg, lightBg, [key]: e.target.value },
                      }));
                    }
                  }}
                />
                <span className="text-xs text-zinc-500 font-mono">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SIZE */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Size</h3>
        <div>
          <label className={labelCls}>Section height: {sectionHeight}vh</label>
          <input type="range" min={40} max={100} step={5} value={sectionHeight}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)}
            className="settings-slider"
          />
        </div>
      </div>

      {/* DISPLAY */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Display</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showLabel} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showLabel = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show label
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showGrid} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show grid
          </label>
        </div>
      </div>

      {/* CARD ICON (split layout only) */}
      {layoutStyle === 'split' && (
        <div className={sectionCls}>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Card icon</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {Object.entries(CARD_ICON_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setProp((p: Record<string, unknown>) => { p.cardIcon = key; })}
                style={{
                  padding: '8px 4px', borderRadius: 6, fontSize: 11, textAlign: 'center',
                  background: props.cardIcon === key || (!props.cardIcon && key === 'bolt')
                    ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                  border: props.cardIcon === key || (!props.cardIcon && key === 'bolt')
                    ? '1px solid #FF6B35' : '1px solid rgba(255,255,255,0.08)',
                  color: '#fff', cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ANIMATION */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Animation</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Type</label>
            <select value={animationType} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animationType = e.target.value; })} className={inputCls}>
              <option value="none">None</option>
              <option value="fade-in">Fade In</option>
              <option value="slide-up">Slide Up</option>
              <option value="scale-in">Scale In</option>
              <option value="blur-in">Blur In</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay</label>
            <select value={animateDelay} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}>
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
const tronCTACraft = {
  displayName: 'CTA Tron',
  props: {
    colorScheme: 'light' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 70,
    showGrid: true,
    label: 'Ready to start?',
    showLabel: true,
    title: 'Build your website today',
    subtitle: 'Join thousands of businesses already running on our platform. No code required — just results.',
    primaryText: 'Start for free',
    primaryHref: '#',
    primaryHrefType: 'external' as const,
    secondaryText: 'See examples',
    secondaryHref: '#',
    secondaryHrefType: 'external' as const,
    showSecondary: true,
    layoutStyle: 'centered' as const,
    glowIntensity: 12,
    cardTitle: 'Fast & reliable',
    cardText: 'Deploy in minutes, not months. Our platform handles everything so you can focus on your business.',
    cardBadge: 'No credit card required',
    cardIcon: 'bolt',
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronCTASettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    block_type: 'cta',
    variant_name: 'default',
    style_tags: ['dark', 'minimal', 'bold'],
    business_tags: [
      'food', 'shop', 'ecommerce', 'startup', 'business_card',
      'portfolio', 'beauty', 'health', 'education', 'agency', 'consulting',
    ],
    feature_tags: ['cta'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronCTA as unknown as { craft: typeof tronCTACraft }).craft = tronCTACraft;
