'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { useSiteContext } from '@/lib/craft/context/SiteContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { buildGridTokens as buildTokens } from '../tokens';

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

// ── Interface ─────────────────────────────────────────────────────────────
export interface HeroDefaultProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  animationType?: string;
  animateDelay?: string;
}

// ── Main component ────────────────────────────────────────────────────────
export const HeroDefault = React.memo(function HeroDefault() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();
  const siteCtx = useSiteContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // ResizeObserver for mobile detection
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

  // Float animation for headline
  React.useEffect(() => {
    const styleId = 'hero-default-float-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes hero-default-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .hero-default-float-animation {
          animation: hero-default-float 6s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const props = useNode((node) => node.data.props as Partial<HeroDefaultProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 90,
    showGrid = true,
    title = 'Build Something Amazing',
    subtitle = 'Transform your ideas into reality with our platform',
    primaryButtonText = 'Get Started',
    secondaryButtonText = 'Learn More',
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'dark';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme], accent: accentColor };
  const rgb = hexToRgb(accentColor);

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const handleButtonClick = (e: React.MouseEvent, isPrimary: boolean) => {
    if (enabled) {
      e.preventDefault();
      return;
    }
    // Add navigation logic here if needed
  };

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      className={`w-full relative overflow-hidden flex flex-col items-center justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        minHeight: `${sectionHeight}vh`,
        position: 'relative',
      }}
    >
      {/* Grid overlay */}
      {showGrid && (
        <div
          key={scheme}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${t.gridColor} 1px, transparent 1px),
                             linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Content */}
      <div
        className="max-w-4xl mx-auto w-full px-4 sm:px-6 text-center"
        style={{ position: 'relative', zIndex: 1 }}
        {...animAttrs}
      >
        <EditableText
          value={title ?? ''}
          fieldKey="title"
          tag="h1"
          className="hero-default-float-animation"
          style={{
            fontSize: 'clamp(42px, 8vw, 96px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: t.text,
            margin: '0 0 24px',
          }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.title = val; }, 0)}
        />

        <EditableText
          value={subtitle ?? ''}
          fieldKey="subtitle"
          tag="p"
          style={{
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            color: t.textSecondary,
            lineHeight: 1.6,
            margin: '0 auto 40px',
            maxWidth: 600,
          }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
        />

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 16,
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'center',
            marginTop: 32,
          }}
        >
          <button
            onClick={(e) => handleButtonClick(e, true)}
            disabled={enabled}
            style={{
              padding: '16px 32px',
              background: accentColor,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: enabled ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!enabled) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 8px 25px -8px rgba(${rgb}, 0.5)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!enabled) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {enabled ? (
              <EditableText
                value={primaryButtonText ?? ''}
                fieldKey="primaryButtonText"
                tag="span"
                style={{ color: '#fff', fontWeight: 600 }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => { p.primaryButtonText = val; }, 0)}
              />
            ) : (
              primaryButtonText
            )}
          </button>

          <button
            onClick={(e) => handleButtonClick(e, false)}
            disabled={enabled}
            style={{
              padding: '16px 32px',
              background: 'transparent',
              color: t.text,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 500,
              cursor: enabled ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!enabled) {
                e.currentTarget.style.background = `rgba(${rgb}, 0.1)`;
                e.currentTarget.style.borderColor = `rgba(${rgb}, 0.3)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!enabled) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = t.border;
              }
            }}
          >
            {enabled ? (
              <EditableText
                value={secondaryButtonText ?? ''}
                fieldKey="secondaryButtonText"
                tag="span"
                style={{ color: t.text, fontWeight: 500 }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => { p.secondaryButtonText = val; }, 0)}
              />
            ) : (
              secondaryButtonText
            )}
          </button>
        </div>
      </div>
    </section>
  );
});

// ── Settings ───────────────────────────────────────────────────────────────
function HeroDefaultSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<HeroDefaultProps>) ?? {};
  const {
    title = 'Build Something Amazing',
    subtitle = 'Transform your ideas into reality with our platform',
    primaryButtonText = 'Get Started',
    secondaryButtonText = 'Learn More',
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 90,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const setT = (key: keyof HeroDefaultProps, ms: number) => (val: unknown) =>
    setProp((p: Record<string, unknown>) => { p[key] = val; }, ms);

  return (
    <div className="p-3 space-y-0">
      {/* CONTENT */}
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setT('title', 500)(e.target.value)} 
              className={inputCls} 
            />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <input 
              type="text" 
              value={subtitle} 
              onChange={(e) => setT('subtitle', 500)(e.target.value)} 
              className={inputCls} 
            />
          </div>
          <div>
            <label className={labelCls}>Primary button text</label>
            <input 
              type="text" 
              value={primaryButtonText} 
              onChange={(e) => setT('primaryButtonText', 500)(e.target.value)} 
              className={inputCls} 
            />
          </div>
          <div>
            <label className={labelCls}>Secondary button text</label>
            <input 
              type="text" 
              value={secondaryButtonText} 
              onChange={(e) => setT('secondaryButtonText', 500)(e.target.value)} 
              className={inputCls} 
            />
          </div>
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
            min={40}
            max={100}
            step={5}
            value={sectionHeight}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)}
            className="settings-slider"
          />
        </div>
      </div>

      {/* DISPLAY */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-3">Display</h3>
        <div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input 
              type="checkbox" 
              checked={showGrid} 
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} 
              className="rounded border-gray-600 bg-gray-700" 
            />
            Show grid
          </label>
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
const heroDefaultCraft = {
  displayName: 'Hero Default',
  props: {
    colorScheme: 'dark' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 90,
    showGrid: true,
    title: 'Build Something Amazing',
    subtitle: 'Transform your ideas into reality with our platform',
    primaryButtonText: 'Get Started',
    secondaryButtonText: 'Learn More',
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: HeroDefaultSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    block_type: 'hero',
    variant_name: 'default',
    styleTags: ['dark', 'minimal'],
    businessTags: ['startup', 'agency', 'consulting', 'portfolio', 'business_card'],
    featureTags: ['hero'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};

(HeroDefault as unknown as { craft: typeof heroDefaultCraft }).craft = heroDefaultCraft;