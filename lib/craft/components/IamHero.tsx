'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';

// ── Helpers ──────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark: {
      bg: darkBg,
      text: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.6)',
      cardBg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
      gridColor: 'rgba(255,255,255,0.03)',
    },
    light: {
      bg: lightBg,
      text: '#0a0a0a',
      textSecondary: 'rgba(0,0,0,0.6)',
      cardBg: 'rgba(0,0,0,0.03)',
      border: 'rgba(0,0,0,0.08)',
      gridColor: 'rgba(0,0,0,0.04)',
    },
  };
}

// ── Interfaces ──────────────────────────────────────────────
interface IamHeroProps {
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  badgeText?: string;
  titleLine1?: string;
  titleLine2?: string;
  poweredText?: string;
  subtitle?: string;
  primaryBtnText?: string;
  primaryBtnHref?: string;
  secondaryBtnText?: string;
  secondaryBtnHref?: string;
  showBadge?: boolean;
  showSecondaryBtn?: boolean;
  animationType?: string;
  animateDelay?: string;
}

// ── Canvas Background (orbs) ────────────────────────────────
function HeroCanvas({ accentColor, scheme }: { accentColor: string; scheme: 'dark' | 'light' }) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    let raf: number;

    const resize = () => {
      const parent = c.parentElement;
      if (!parent) return;
      c.width = parent.offsetWidth;
      c.height = parent.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c.parentElement!);

    const hue1 = 18; // accent-adjacent
    const baseAlpha = scheme === 'dark' ? 0.12 : 0.06;
    const orbs = [
      { x: 0.2, y: 0.2, vx: 0.00008, vy: 0.00006, r: 0.30, hue: hue1, alpha: baseAlpha },
      { x: 0.7, y: 0.3, vx: -0.00006, vy: 0.00005, r: 0.25, hue: 280, alpha: baseAlpha * 0.85 },
      { x: 0.5, y: 0.7, vx: 0.00007, vy: -0.00006, r: 0.28, hue: 200, alpha: baseAlpha * 0.8 },
      { x: 0.85, y: 0.6, vx: -0.00005, vy: 0.00007, r: 0.22, hue: 340, alpha: baseAlpha * 0.7 },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const o of orbs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -0.2 || o.x > 1.2) o.vx *= -1;
        if (o.y < -0.1 || o.y > 1.1) o.vy *= -1;
        const px = o.x * c.width;
        const py = o.y * c.height;
        const pr = o.r * Math.min(c.width, c.height);
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, `hsla(${o.hue},85%,60%,${o.alpha})`);
        g.addColorStop(0.4, `hsla(${o.hue},75%,45%,${o.alpha * 0.5})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [scheme]);

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

// ── Main Component ──────────────────────────────────────────
export const IamHero = React.memo(function IamHero() {
  const {
    connectors: { connect, drag },
    actions: { setProp },
  } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const btnRef = React.useRef<HTMLAnchorElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [v, setV] = React.useState(false);
  const [ripple, setRipple] = React.useState(false);

  const props = useNode((node) => node.data.props as Partial<IamHeroProps>) ?? {};
  const {
    darkBg = '#06060a',
    lightBg = '#ffffff',
    sectionHeight = 100,
    badgeText = '⚡ iamrunning.online',
    titleLine1 = 'Your online',
    titleLine2 = 'workflow.',
    poweredText = 'Powered by AI',
    subtitle = 'AI workflow for you and your team — adapts to your work style and improves as you work.',
    primaryBtnText = 'Go to Dashboard',
    primaryBtnHref = '/dashboard',
    secondaryBtnText = 'How it works',
    secondaryBtnHref = '#interactive',
    showBadge = true,
    showSecondaryBtn = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = theme?.accentColor ?? '#FF6B35';
  const scheme = theme?.colorScheme ?? 'dark';
  const ar = hexToRgb(accentColor);
  const t = buildTokens(darkBg, lightBg)[scheme];

  // ResizeObserver for mobile
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setIsMobile(el.getBoundingClientRect().width < 520);
    check();
    const obs = new ResizeObserver(([e]) => setIsMobile(e.contentRect.width < 520));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Mount animation
  React.useEffect(() => {
    if (enabled) {
      setV(true);
      return;
    }
    const timer = setTimeout(() => setV(true), 150);
    return () => clearTimeout(timer);
  }, [enabled]);

  // Magnetic effect
  const onBtnMove = React.useCallback((e: React.MouseEvent) => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const dx = (e.clientX - r.left - r.width / 2) * 0.25;
    const dy = (e.clientY - r.top - r.height / 2) * 0.25;
    btnRef.current!.style.transform = `translate(${dx}px, ${dy}px)`;
  }, []);
  const onBtnLeave = React.useCallback(() => {
    if (btnRef.current) btnRef.current.style.transform = 'none';
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (enabled) return;
    e.preventDefault();
    setRipple(true);
    setTimeout(() => {
      setRipple(false);
      if (typeof window !== 'undefined') window.location.href = primaryBtnHref;
    }, 500);
  };

  // Gradient for titleLine2 — use accent hue
  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}99 50%, ${accentColor}55 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  // Inject keyframes
  React.useEffect(() => {
    const id = 'iam-hero-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes iam-hero-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
      @keyframes iam-hero-impulse { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(2.5);opacity:0} }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      data-block-type="hero"
      className={isSelected ? 'craft-node-selected' : ''}
      style={{
        position: 'relative',
        minHeight: `${sectionHeight}vh`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '100px 20px 60px' : '120px 24px 80px',
        textAlign: 'center',
        background: t.bg,
        overflow: 'hidden',
      }}
    >
      <HeroCanvas accentColor={accentColor} scheme={scheme} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto' }} {...animAttrs}>
        {/* Badge */}
        {showBadge && (
          <div
            style={{
              opacity: v ? 1 : 0,
              transform: v ? 'none' : 'translateY(8px)',
              transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: `rgba(${ar},0.06)`,
              border: `1px solid rgba(${ar},0.35)`,
              borderRadius: 24,
              padding: '5px 16px',
              fontSize: 11,
              fontWeight: 600,
              color: accentColor,
              letterSpacing: '0.06em',
              marginBottom: 32,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accentColor,
                animation: 'iam-hero-pulse 2s infinite',
              }}
            />
            <EditableText
              value={badgeText}
              fieldKey="badgeText"
              tag="span"
              style={{ color: accentColor, fontSize: 11, fontWeight: 600 }}
              enabled={enabled}
              onSave={(val) => setProp((p: Record<string, unknown>) => { p.badgeText = val; }, 0)}
            />
          </div>
        )}

        {/* H1 */}
        <h1
          style={{
            fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 'clamp(52px,8vw,96px)',
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: '-0.05em',
            margin: '0 auto 0',
            opacity: v ? 1 : 0,
            transform: v ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s',
          }}
        >
          <EditableText
            value={titleLine1}
            fieldKey="titleLine1"
            tag="span"
            style={{ color: scheme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)' }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.titleLine1 = val; }, 0)}
          />
          <br />
          <EditableText
            value={titleLine2}
            fieldKey="titleLine2"
            tag="span"
            style={gradientStyle}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.titleLine2 = val; }, 0)}
          />
        </h1>

        {/* Powered text */}
        <div
          style={{
            fontSize: 11,
            color: scheme === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.25)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginTop: 20,
            marginBottom: 36,
            opacity: v ? 1 : 0,
            transition: 'opacity 0.7s ease 0.4s',
          }}
        >
          <EditableText
            value={poweredText}
            fieldKey="poweredText"
            tag="span"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: 'inherit' }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.poweredText = val; }, 0)}
          />
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 'clamp(15px,1.6vw,17px)',
            color: scheme === 'dark' ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.45)',
            lineHeight: 1.8,
            maxWidth: 460,
            margin: '0 auto 48px',
            opacity: v ? 1 : 0,
            transition: 'opacity 0.7s ease 0.5s',
          }}
        >
          <EditableText
            value={subtitle}
            fieldKey="subtitle"
            tag="p"
            style={{ color: 'inherit', lineHeight: 1.8, margin: 0 }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
          />
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            opacity: v ? 1 : 0,
            transition: 'opacity 0.7s ease 0.65s',
          }}
        >
          {/* Primary */}
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: isMobile ? '100%' : 'auto',
              maxWidth: isMobile ? 300 : 'none',
            }}
            onMouseMove={enabled ? undefined : onBtnMove}
            onMouseLeave={enabled ? undefined : onBtnLeave}
          >
            {ripple && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 12,
                  background: `rgba(${ar},0.5)`,
                  animation: 'iam-hero-impulse 0.55s ease-out forwards',
                  pointerEvents: 'none',
                }}
              />
            )}
            <a
              ref={btnRef}
              href={primaryBtnHref}
              onClick={handleClick}
              style={{
                display: 'inline-block',
                width: isMobile ? '100%' : 'auto',
                textAlign: 'center',
                padding: '15px 36px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                background: accentColor,
                color: '#fff',
                boxShadow: `0 0 28px rgba(${ar},0.4), 0 4px 16px rgba(${ar},0.25)`,
                transition: 'box-shadow 0.25s, transform 0.15s',
              }}
            >
              {enabled ? (
                <EditableText
                  value={primaryBtnText}
                  fieldKey="primaryBtnText"
                  tag="span"
                  style={{ color: '#fff', fontWeight: 700 }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => { p.primaryBtnText = val; }, 0)}
                />
              ) : (
                primaryBtnText
              )}
            </a>
          </div>

          {/* Secondary */}
          {showSecondaryBtn && (
            <a
              href={secondaryBtnHref}
              style={{
                display: 'inline-block',
                width: isMobile ? '100%' : 'auto',
                maxWidth: isMobile ? 300 : 'none',
                textAlign: 'center',
                padding: '15px 32px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 500,
                textDecoration: 'none',
                background: 'transparent',
                color: scheme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                border: `1px solid ${scheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'}`,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (enabled) return;
                e.currentTarget.style.borderColor = scheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
                e.currentTarget.style.color = scheme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
              }}
              onMouseLeave={(e) => {
                if (enabled) return;
                e.currentTarget.style.borderColor = scheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)';
                e.currentTarget.style.color = scheme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
              }}
            >
              {enabled ? (
                <EditableText
                  value={secondaryBtnText}
                  fieldKey="secondaryBtnText"
                  tag="span"
                  style={{ color: 'inherit', fontWeight: 500 }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => { p.secondaryBtnText = val; }, 0)}
                />
              ) : (
                secondaryBtnText
              )}
            </a>
          )}
        </div>
      </div>
    </section>
  );
});

// ── Settings ────────────────────────────────────────────────
function IamHeroSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<IamHeroProps>) ?? {};
  const {
    badgeText = '⚡ iamrunning.online',
    titleLine1 = 'Your online',
    titleLine2 = 'workflow.',
    poweredText = 'Powered by AI',
    subtitle = 'AI workflow for you and your team — adapts to your work style and improves as you work.',
    primaryBtnText = 'Go to Dashboard',
    primaryBtnHref = '/dashboard',
    secondaryBtnText = 'How it works',
    secondaryBtnHref = '#interactive',
    showBadge = true,
    showSecondaryBtn = true,
    darkBg = '#06060a',
    lightBg = '#ffffff',
    sectionHeight = 100,
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
            <label className={labelCls}>Badge Text</label>
            <input value={badgeText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.badgeText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title Line 1</label>
            <input value={titleLine1} onChange={(e) => setProp((p: Record<string, unknown>) => { p.titleLine1 = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title Line 2 (gradient)</label>
            <input value={titleLine2} onChange={(e) => setProp((p: Record<string, unknown>) => { p.titleLine2 = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Small Text</label>
            <input value={poweredText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.poweredText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <textarea value={subtitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; }, 500)} className={inputCls} rows={3} />
          </div>
        </div>
      </div>

      {/* BUTTONS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Buttons</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Primary Button Text</label>
            <input value={primaryBtnText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.primaryBtnText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Primary Button Link</label>
            <input value={primaryBtnHref} onChange={(e) => setProp((p: Record<string, unknown>) => { p.primaryBtnHref = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Secondary Button Text</label>
            <input value={secondaryBtnText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.secondaryBtnText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Secondary Button Link</label>
            <input value={secondaryBtnHref} onChange={(e) => setProp((p: Record<string, unknown>) => { p.secondaryBtnHref = e.target.value; }, 500)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={darkBg} onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)} />
            <span className="text-xs text-zinc-500 font-mono">{darkBg}</span>
          </div>
          <label className={labelCls}>Background (light)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={lightBg} onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)} />
            <span className="text-xs text-zinc-500 font-mono">{lightBg}</span>
          </div>
        </div>
      </div>

      {/* SIZE */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Size</h3>
        <label className={labelCls}>Section height: {sectionHeight}vh</label>
        <input type="range" min={50} max={100} step={5} value={sectionHeight} onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 500)} className="settings-slider" />
      </div>

      {/* DISPLAY */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Display</h3>
        <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <input type="checkbox" checked={showBadge} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showBadge = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
          Show badge
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" checked={showSecondaryBtn} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showSecondaryBtn = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
          Show secondary button
        </label>
      </div>

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
              {['0', '0.1', '0.2', '0.3', '0.5', '0.8', '1'].map((val) => (
                <option key={val} value={val}>{val}s</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ────────────────────────────────────────────
const iamHeroCraft = {
  displayName: 'IAM Hero',
  props: {
    darkBg: '#06060a',
    lightBg: '#ffffff',
    sectionHeight: 100,
    badgeText: '⚡ iamrunning.online',
    titleLine1: 'Your online',
    titleLine2: 'workflow.',
    poweredText: 'Powered by AI',
    subtitle: 'AI workflow for you and your team — adapts to your work style and improves as you work.',
    primaryBtnText: 'Go to Dashboard',
    primaryBtnHref: '/dashboard',
    secondaryBtnText: 'How it works',
    secondaryBtnHref: '#interactive',
    showBadge: true,
    showSecondaryBtn: true,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: IamHeroSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    block_type: 'hero',
    variant_name: 'iam-dark',
    style_tags: ['dark', 'neon_futuristic', 'minimal'],
    business_tags: ['startup', 'agency', 'consulting'],
    feature_tags: ['hero'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(IamHero as unknown as { craft: typeof iamHeroCraft }).craft = iamHeroCraft;
