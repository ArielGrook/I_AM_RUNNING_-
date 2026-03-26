'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { useSiteContext } from '@/lib/craft/context/SiteContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { LinkPicker, handleLinkClick } from '@/lib/craft/shared/LinkPicker';
import { buildGridTokens as buildTokens } from '../tokens';
import { MediaLibrary } from '@/components/craft/MediaLibrary';
import { useAuth } from '@/lib/hooks/useAuth';

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

// ── Interfaces ───────────────────────────────────────────────────────────
interface StatItem {
  value: string;
  label: string;
}

export interface TronAboutProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  spotlightIntensity?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  secondaryDescription?: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right';
  showImage?: boolean;
  ctaText?: string;
  ctaHref?: string;
  ctaHrefType?: 'section' | 'page' | 'external';
  showCta?: boolean;
  stats?: StatItem[];
  showStats?: boolean;
  animationType?: string;
  animateDelay?: string;
}

// ── Main component ────────────────────────────────────────────────────────
export const TronAbout = React.memo(function TronAbout() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();
  const siteCtx = useSiteContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [hovered, setHovered] = React.useState<number | null>(null);

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

  // ── Parallax on image (mouse-reactive, disabled in editor) ──
  const imageWrapRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (typeof window === 'undefined' || enabled) return;
    const el = imageWrapRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const img = el.querySelector('img');
      if (img) {
        img.style.transform = `scale(1.05) translate(${x * -12}px, ${y * -12}px)`;
      }
    };
    const handleLeave = () => {
      const img = el.querySelector('img');
      if (img) {
        img.style.transform = 'scale(1) translate(0, 0)';
      }
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [enabled]);

  const props = useNode((node) => node.data.props as Partial<TronAboutProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    spotlightIntensity = 10,
    title = 'About Us',
    subtitle = 'Our Story',
    description = 'We are a team of passionate creators dedicated to building exceptional digital experiences. Our mission is to empower businesses with beautiful, functional websites.',
    secondaryDescription = 'Founded with a simple idea — that every business deserves a premium online presence — we have grown into a platform trusted by hundreds of teams worldwide.',
    imageUrl = '',
    imagePosition = 'right',
    showImage = true,
    ctaText = 'Learn more',
    ctaHref = '#',
    ctaHrefType = 'external',
    showCta = true,
    stats = [
      { value: '500+', label: 'Projects delivered' },
      { value: '98%', label: 'Client satisfaction' },
      { value: '24/7', label: 'Support available' },
      { value: '50+', label: 'Team members' },
    ],
    showStats = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'light';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme], accent: accentColor };
  const rgb = hexToRgb(accentColor);

  const spotlightStyle =
    spotlightIntensity != null && spotlightIntensity > 0
      ? {
          backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(${rgb}, ${spotlightIntensity / 100}) 0%, transparent 70%)`,
        }
      : {};

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  // ── Image placeholder SVG ──
  const placeholderBg = scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const placeholderBorder = scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const imageBlock = showImage && (
    <div
      ref={imageWrapRef}
      style={{
        flex: isMobile ? 'none' : '0 0 45%',
        width: isMobile ? '100%' : '45%',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: isMobile ? '16/10' : '4/5',
        background: imageUrl ? 'transparent' : placeholderBg,
        border: imageUrl ? 'none' : `1px dashed ${placeholderBorder}`,
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title ?? 'About'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.textSecondary} strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span style={{ color: t.textSecondary, fontSize: 13 }}>
            {enabled ? 'Click settings to add image' : ''}
          </span>
        </div>
      )}
      {/* Accent glow on image corner */}
      <div
        style={{
          position: 'absolute',
          bottom: -20,
          right: imagePosition === 'right' ? -20 : 'auto',
          left: imagePosition === 'left' ? -20 : 'auto',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `rgba(${rgb}, 0.15)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );

  const textBlock = (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Subtitle label */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 32,
            height: 2,
            background: accentColor,
            borderRadius: 1,
          }}
        />
        <EditableText
          value={subtitle ?? ''}
          fieldKey="subtitle"
          tag="span"
          style={{
            color: accentColor,
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
        />
      </div>

      {/* Title */}
      <EditableText
        value={title ?? ''}
        fieldKey="title"
        tag="h2"
        style={{
          fontSize: isMobile ? 28 : 42,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: t.text,
          margin: '0 0 20px',
        }}
        enabled={enabled}
        onSave={(val) => setProp((p: Record<string, unknown>) => { p.title = val; }, 0)}
      />

      {/* Description */}
      <EditableText
        value={description ?? ''}
        fieldKey="description"
        tag="p"
        style={{
          fontSize: 16,
          lineHeight: 1.7,
          color: t.textSecondary,
          margin: '0 0 16px',
        }}
        enabled={enabled}
        onSave={(val) => setProp((p: Record<string, unknown>) => { p.description = val; }, 0)}
      />

      {/* Secondary description */}
      {(enabled || secondaryDescription) && (
        <EditableText
          value={secondaryDescription ?? ''}
          fieldKey="secondaryDescription"
          tag="p"
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: t.textSecondary,
            margin: '0 0 28px',
            opacity: 0.8,
          }}
          enabled={enabled}
          onSave={(val) => setProp((p: Record<string, unknown>) => { p.secondaryDescription = val; }, 0)}
        />
      )}

      {/* CTA button */}
      {showCta && (
        <a
          href={enabled ? undefined : ctaHref}
          onClick={(e) => handleLinkClick(e, ctaHref ?? '#', enabled, siteCtx.navigateToPage)}
          onTouchEnd={(e) => handleLinkClick(e as unknown as React.MouseEvent, ctaHref ?? '#', enabled, siteCtx.navigateToPage)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            background: `rgba(${rgb}, 0.1)`,
            color: accentColor,
            border: `1px solid rgba(${rgb}, 0.2)`,
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: enabled ? 'default' : 'pointer',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {enabled ? (
            <EditableText
              value={ctaText ?? ''}
              fieldKey="ctaText"
              tag="span"
              style={{ color: accentColor, fontWeight: 600 }}
              enabled={enabled}
              onSave={(val) => setProp((p: Record<string, unknown>) => { p.ctaText = val; }, 0)}
            />
          ) : (
            ctaText
          )}
          <span style={{ fontSize: 16 }}>→</span>
        </a>
      )}
    </div>
  );

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      id="about"
      data-block-type="about"
      className={`w-full relative overflow-hidden ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        minHeight: `${sectionHeight}vh`,
        position: 'relative',
      }}
    >
      {/* Grid overlay */}
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

      {/* Spotlight */}
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
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1200,
          margin: '0 auto',
          padding: isMobile ? '48px 20px' : '80px 40px',
        }}
        {...animAttrs}
      >
        {/* Main two-column layout */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 32 : 60,
            alignItems: isMobile ? 'stretch' : 'center',
          }}
        >
          {/* Image position: left or right */}
          {!isMobile && imagePosition === 'left' && imageBlock}
          {isMobile && imageBlock}

          {textBlock}

          {!isMobile && imagePosition === 'right' && imageBlock}
        </div>

        {/* Stats row */}
        {showStats && stats && stats.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(2, 1fr)'
                : `repeat(${stats.length}, 1fr)`,
              gap: isMobile ? 16 : 24,
              marginTop: isMobile ? 40 : 64,
              paddingTop: isMobile ? 32 : 48,
              borderTop: `1px solid ${t.border}`,
            }}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                onMouseEnter={() => !enabled && setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '16px 8px' : '20px 16px',
                  borderRadius: 12,
                  background: hovered === i ? `rgba(${rgb}, 0.06)` : 'transparent',
                  border: `1px solid ${hovered === i ? `rgba(${rgb}, 0.15)` : 'transparent'}`,
                  transition: 'all 0.25s ease',
                  transform: hovered === i ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                {enabled ? (
                  <>
                    <EditableText
                      value={stat.value}
                      fieldKey={`stat-value-${i}`}
                      tag="div"
                      style={{
                        fontSize: isMobile ? 28 : 36,
                        fontWeight: 800,
                        color: accentColor,
                        lineHeight: 1.1,
                        marginBottom: 6,
                      }}
                      enabled={enabled}
                      onSave={(val) => setProp((p: Record<string, unknown>) => {
                        const arr = [...(p.stats as StatItem[])];
                        arr[i] = { ...arr[i], value: val };
                        p.stats = arr;
                      }, 0)}
                    />
                    <EditableText
                      value={stat.label}
                      fieldKey={`stat-label-${i}`}
                      tag="div"
                      style={{
                        fontSize: 13,
                        color: t.textSecondary,
                        fontWeight: 500,
                      }}
                      enabled={enabled}
                      onSave={(val) => setProp((p: Record<string, unknown>) => {
                        const arr = [...(p.stats as StatItem[])];
                        arr[i] = { ...arr[i], label: val };
                        p.stats = arr;
                      }, 0)}
                    />
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: isMobile ? 28 : 36,
                        fontWeight: 800,
                        color: accentColor,
                        lineHeight: 1.1,
                        marginBottom: 6,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: t.textSecondary,
                        fontWeight: 500,
                      }}
                    >
                      {stat.label}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

// ── Settings ───────────────────────────────────────────────────────────────
function TronAboutSettings() {
  const { actions: { setProp } } = useNode();
  const { user } = useAuth();
  const [showMedia, setShowMedia] = React.useState(false);

  const props = useNode((node) => node.data.props as Partial<TronAboutProps>) ?? {};
  const {
    title = 'About Us',
    subtitle = 'Our Story',
    description = 'We are a team of passionate creators...',
    secondaryDescription = 'Founded with a simple idea...',
    imageUrl = '',
    imagePosition = 'right',
    showImage = true,
    ctaText = 'Learn more',
    ctaHref = '#',
    ctaHrefType = 'external',
    showCta = true,
    stats = [],
    showStats = true,
    showGrid = true,
    spotlightIntensity = 10,
    accentColor = '#FF6B35',
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
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
            <input type="text" value={subtitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 500)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setProp((p: Record<string, unknown>) => { p.description = e.target.value; }, 500)} className={inputCls} rows={3} />
          </div>
          <div>
            <label className={labelCls}>Secondary description</label>
            <textarea value={secondaryDescription} onChange={(e) => setProp((p: Record<string, unknown>) => { p.secondaryDescription = e.target.value; }, 500)} className={inputCls} rows={3} />
          </div>
        </div>
      </div>

      {/* IMAGE */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Image</h3>
        <div className="space-y-3">
          <button
            onClick={() => setShowMedia(true)}
            style={{ color: '#FF6B35', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {imageUrl ? '↺ Replace image' : '+ Add image'}
          </button>
          {imageUrl && (
            <div style={{ marginTop: 8 }}>
              <img src={imageUrl} alt="Preview" style={{ width: '100%', borderRadius: 8, maxHeight: 120, objectFit: 'cover' }} />
              <button
                onClick={() => setProp((p: Record<string, unknown>) => { p.imageUrl = ''; })}
                style={{ color: '#f87171', fontSize: 12, marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Remove image
              </button>
            </div>
          )}
          {showMedia && user && (
            <MediaLibrary
              userId={user.id}
              accept="image"
              onSelect={(url: string) => {
                setProp((p: Record<string, unknown>) => { p.imageUrl = url; }, 0);
                setShowMedia(false);
              }}
              onClose={() => setShowMedia(false)}
            />
          )}
          <div>
            <label className={labelCls}>Position</label>
            <select
              value={imagePosition}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.imagePosition = e.target.value; })}
              className={inputCls}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">CTA</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Button text</label>
            <input type="text" value={ctaText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.ctaText = e.target.value; }, 500)} className={inputCls} />
          </div>
          <LinkPicker
            label="Button link"
            value={{ type: ctaHrefType ?? 'external', href: ctaHref ?? '#' }}
            onChange={(val) => {
              setProp((p: Record<string, unknown>) => {
                p.ctaHref = val.href;
                p.ctaHrefType = val.type;
              }, 0);
            }}
          />
        </div>
      </div>

      {/* STATS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Stats</h3>
        <div className="space-y-2">
          {(stats ?? []).map((stat: StatItem, i: number) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <label className={labelCls}>Value</label>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => setProp((p: Record<string, unknown>) => {
                      const arr = [...(p.stats as StatItem[])];
                      arr[i] = { ...arr[i], value: e.target.value };
                      p.stats = arr;
                    }, 500)}
                    className={inputCls}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={labelCls}>Label</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => setProp((p: Record<string, unknown>) => {
                      const arr = [...(p.stats as StatItem[])];
                      arr[i] = { ...arr[i], label: e.target.value };
                      p.stats = arr;
                    }, 500)}
                    className={inputCls}
                  />
                </div>
              </div>
              <button
                onClick={() => setProp((p: Record<string, unknown>) => {
                  const arr = [...(p.stats as StatItem[])];
                  arr.splice(i, 1);
                  p.stats = arr;
                })}
                style={{ color: '#f87171', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => setProp((p: Record<string, unknown>) => {
              const arr = [...(p.stats as StatItem[] || [])];
              arr.push({ value: '100+', label: 'New stat' });
              p.stats = arr;
            })}
            style={{ color: '#FF6B35', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            + Add stat
          </button>
        </div>
      </div>

      {/* DISPLAY */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Display</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showImage} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showImage = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show image
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showCta} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showCta = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show CTA button
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showStats} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showStats = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show stats
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={showGrid} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" />
            Show grid
          </label>
        </div>
      </div>

      {/* STYLE */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Style</h3>
        <div>
          <label className={labelCls}>Spotlight intensity: {spotlightIntensity ?? 10}</label>
          <input
            type="range" min={0} max={30} step={1}
            value={spotlightIntensity ?? 10}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.spotlightIntensity = Number(e.target.value); }, 300)}
            className="settings-slider"
          />
        </div>
      </div>

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Accent color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={accentColor ?? '#FF6B35'}
              onChange={(e) => {
                setProp((p: Record<string, unknown>) => { p.accentColor = e.target.value; }, 300);
                window.dispatchEvent(new CustomEvent('iam_color_preset_changed', {
                  detail: { accentColor: e.target.value, darkBg: darkBg ?? '#0a0a0a', lightBg: lightBg ?? '#ffffff' }
                }));
              }}
            />
            <span className="text-xs text-zinc-500 font-mono">{accentColor ?? '#FF6B35'}</span>
          </div>
          <label className={labelCls}>Background (dark)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={darkBg ?? '#0a0a0a'}
              onChange={(e) => {
                setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300);
                window.dispatchEvent(new CustomEvent('iam_color_preset_changed', {
                  detail: { accentColor: accentColor ?? '#FF6B35', darkBg: e.target.value, lightBg: lightBg ?? '#ffffff' }
                }));
              }}
            />
            <span className="text-xs text-zinc-500 font-mono">{darkBg ?? '#0a0a0a'}</span>
          </div>
          <label className={labelCls}>Background (light)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={lightBg ?? '#ffffff'}
              onChange={(e) => {
                setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300);
                window.dispatchEvent(new CustomEvent('iam_color_preset_changed', {
                  detail: { accentColor: accentColor ?? '#FF6B35', darkBg: darkBg ?? '#0a0a0a', lightBg: e.target.value }
                }));
              }}
            />
            <span className="text-xs text-zinc-500 font-mono">{lightBg ?? '#ffffff'}</span>
          </div>
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
              <option value="slide-down">Slide Down</option>
              <option value="slide-left">Slide Left</option>
              <option value="slide-right">Slide Right</option>
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
const tronAboutCraft = {
  displayName: 'About Tron',
  props: {
    colorScheme: 'light' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 80,
    showGrid: true,
    spotlightIntensity: 10,
    title: 'About Us',
    subtitle: 'Our Story',
    description: 'We are a team of passionate creators dedicated to building exceptional digital experiences. Our mission is to empower businesses with beautiful, functional websites.',
    secondaryDescription: 'Founded with a simple idea — that every business deserves a premium online presence — we have grown into a platform trusted by hundreds of teams worldwide.',
    imageUrl: '',
    imagePosition: 'right' as const,
    showImage: true,
    ctaText: 'Learn more',
    ctaHref: '#',
    ctaHrefType: 'external' as const,
    showCta: true,
    stats: [
      { value: '500+', label: 'Projects delivered' },
      { value: '98%', label: 'Client satisfaction' },
      { value: '24/7', label: 'Support available' },
      { value: '50+', label: 'Team members' },
    ],
    showStats: true,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronAboutSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    block_type: 'about',
    variant_name: 'default',
    style_tags: ['dark', 'minimal', 'elegant'],
    business_tags: ['food', 'startup', 'agency', 'consulting', 'portfolio', 'beauty', 'health', 'education'],
    feature_tags: ['about'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronAbout as unknown as { craft: typeof tronAboutCraft }).craft = tronAboutCraft;
