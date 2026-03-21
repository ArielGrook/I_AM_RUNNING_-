'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';
import { useSiteContext } from '@/lib/craft/context/SiteContext';
import { labelCls, inputCls, sectionCls } from '@/lib/craft/settingsStyles';
import { EditableText } from '@/lib/craft/shared/EditableText';
import { handleLinkClick } from '@/lib/craft/shared/LinkPicker';
import { buildGridTokens as buildTokens } from '../tokens';
import { MediaLibrary } from '@/components/craft/MediaLibrary';
import { useAuth } from '@/lib/hooks/useAuth';

function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

// ── Social icons ──────────────────────────────────────────────────────────
const IconLinkedIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const IconTwitter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconGitHub = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────
interface TeamMember {
  imageUrl?: string;
  name: string;
  role: string;
  bio?: string;
  badge?: string;
  showBadge?: boolean;
  linkedIn?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
}

export interface TronTeamProps {
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
  layoutStyle?: 'grid' | 'minimal' | 'spotlight';
  columns?: 2 | 3 | 4;
  photoShape?: 'circle' | 'square' | 'rounded';
  cardStyle?: 'border' | 'filled' | 'minimal';
  members?: TeamMember[];
  animationType?: string;
  animateDelay?: string;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  { name: 'Alex Morgan', role: 'CEO & Co-Founder', bio: 'Passionate about building products that matter. 10+ years in SaaS and startup ecosystems.', badge: 'Founder', showBadge: true, linkedIn: '#', twitter: '#', github: '', instagram: '' },
  { name: 'Sara Chen', role: 'Head of Design', bio: 'Former lead designer at Figma. Obsessed with clean interfaces and pixel-perfect details.', badge: 'Lead', showBadge: true, linkedIn: '#', twitter: '', github: '', instagram: '#' },
  { name: 'James Park', role: 'CTO', bio: 'Full-stack engineer with a love for scalable architectures and open source contributions.', badge: 'Tech', showBadge: false, linkedIn: '#', twitter: '#', github: '#', instagram: '' },
  { name: 'Mia Torres', role: 'Head of Growth', bio: 'Growth hacker turned strategist. Scaled 3 products from 0 to 100k users.', badge: '', showBadge: false, linkedIn: '#', twitter: '#', github: '', instagram: '#' },
];

// ── Tilt helper — applies 3D tilt transform via direct DOM style ──────────
function useTiltEffect(enabled: boolean) {
  const refs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || enabled) return;
    const cleanups: (() => void)[] = [];

    refs.current.forEach((el) => {
      if (!el) return;
      let rafId: number;

      const onMove = (e: MouseEvent) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`;
        });
      };
      const onLeave = () => {
        cancelAnimationFrame(rafId);
        el.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)';
      };

      el.addEventListener('mousemove', onMove, { passive: true });
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
        cancelAnimationFrame(rafId);
      });
    });

    return () => cleanups.forEach((c) => c());
  }, [enabled, refs.current.length]);

  return refs;
}

// ── Component ─────────────────────────────────────────────────────────────
export const TronTeam = React.memo(function TronTeam() {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();
  const siteCtx = useSiteContext();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [hoveredSocial, setHoveredSocial] = React.useState<string | null>(null);
  const [spotlightIdx, setSpotlightIdx] = React.useState(0);
  const [visibleCards, setVisibleCards] = React.useState<Set<number>>(new Set());
  const cardRevealRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // ResizeObserver — 520px
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setIsMobile(el.getBoundingClientRect().width < 520);
    check();
    const obs = new ResizeObserver(([e]) => setIsMobile(e.contentRect.width < 520));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // IntersectionObserver scroll reveal
  React.useEffect(() => {
    if (typeof window === 'undefined' || enabled) return;
    const refs = cardRevealRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!refs.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.getAttribute('data-card-idx'));
          setVisibleCards((prev) => { const s = new Set(prev); s.add(idx); return s; });
        }
      }),
      { threshold: 0.15 }
    );
    refs.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [enabled]);

  // Tilt effect refs
  const tiltRefs = useTiltEffect(enabled);

  // ── Props ─────────────────────────────────────────────────────────────
  const props = useNode((node) => node.data.props as Partial<TronTeamProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 70,
    showGrid = true,
    label = 'The people behind it',
    showLabel = true,
    title = 'Meet the Team',
    subtitle = 'A small but mighty crew of designers, engineers, and strategists building the future.',
    layoutStyle = 'grid',
    columns = 3,
    photoShape = 'circle',
    cardStyle = 'border',
    members = DEFAULT_MEMBERS,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const accentColor = propAccent ?? theme.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme.colorScheme ?? 'dark';
  const tokens = buildTokens(darkBg, lightBg);
  const t = { ...tokens[scheme] };
  const rgb = hexToRgb(accentColor);

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const list = Array.isArray(members) && members.length > 0 ? members : DEFAULT_MEMBERS;
  const cols = isMobile ? 1 : (columns ?? 3);

  const photoRadius = photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '16px' : '4px';

  const cardBg: Record<string, string> = {
    border: t.cardBg,
    filled: `rgba(${rgb}, 0.06)`,
    minimal: 'transparent',
  };
  const cardBorder: Record<string, string> = {
    border: t.border,
    filled: `rgba(${rgb}, 0.15)`,
    minimal: 'none',
  };

  // ── Avatar ────────────────────────────────────────────────────────────
  const Avatar = ({ member, size = 80, idx }: { member: TeamMember; size?: number; idx: number }) => {
    const [hovAv, setHovAv] = React.useState(false);
    return (
      <div
        onMouseEnter={() => !enabled && setHovAv(true)}
        onMouseLeave={() => setHovAv(false)}
        style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      >
        {/* Pulse ring */}
        <div style={{
          position: 'absolute', inset: -4, borderRadius: photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '20px' : '6px',
          border: `2px solid ${accentColor}`,
          opacity: hovAv ? 0.8 : 0,
          transform: hovAv ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: -8, borderRadius: photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '24px' : '8px',
          border: `1px solid ${accentColor}`,
          opacity: hovAv ? 0.3 : 0,
          transform: hovAv ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 0.4s ease 0.05s, transform 0.4s ease 0.05s',
          pointerEvents: 'none',
        }} />
        {member.imageUrl ? (
          <img
            src={member.imageUrl}
            alt={member.name}
            style={{
              width: size, height: size, objectFit: 'cover',
              borderRadius: photoRadius,
              display: 'block',
              transition: 'transform 0.3s ease',
              transform: hovAv ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            width: size, height: size, borderRadius: photoRadius,
            background: `rgba(${rgb}, 0.15)`,
            border: `1px dashed rgba(${rgb}, 0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accentColor, fontSize: size * 0.35, fontWeight: 700,
            transition: 'background 0.3s ease',
            ...(hovAv ? { background: `rgba(${rgb}, 0.25)` } : {}),
          }}>
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  // ── Social links row ──────────────────────────────────────────────────
  const Socials = ({ member, idx }: { member: TeamMember; idx: number }) => {
    const links = [
      { key: `li-${idx}`, url: member.linkedIn, icon: <IconLinkedIn />, label: 'LinkedIn' },
      { key: `tw-${idx}`, url: member.twitter, icon: <IconTwitter />, label: 'Twitter' },
      { key: `gh-${idx}`, url: member.github, icon: <IconGitHub />, label: 'GitHub' },
      { key: `ig-${idx}`, url: member.instagram, icon: <IconInstagram />, label: 'Instagram' },
    ].filter((l) => l.url);

    if (!links.length) return null;
    return (
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {links.map(({ key, url, icon, label }) => (
          <a
            key={key}
            href={enabled ? undefined : url}
            onClick={(e) => { if (enabled) { e.preventDefault(); return; } }}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => !enabled && setHoveredSocial(key)}
            onMouseLeave={() => setHoveredSocial(null)}
            title={label}
            style={{
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: hoveredSocial === key ? `rgba(${rgb}, 0.2)` : `rgba(${rgb}, 0.08)`,
              color: hoveredSocial === key ? accentColor : t.textSecondary,
              border: `1px solid ${hoveredSocial === key ? `rgba(${rgb}, 0.3)` : 'transparent'}`,
              transition: 'all 0.2s ease',
              cursor: enabled ? 'default' : 'pointer',
              textDecoration: 'none',
              transform: hoveredSocial === key ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            {icon}
          </a>
        ))}
      </div>
    );
  };

  // ── Grid layout ───────────────────────────────────────────────────────
  const renderGrid = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: isMobile ? 16 : 24,
    }}>
      {list.map((member, i) => {
        const isVisible = enabled || visibleCards.has(i);
        return (
          <div
            key={i}
            ref={(el) => {
              cardRevealRefs.current[i] = el;
              tiltRefs.current[i] = el;
            }}
            data-card-idx={i}
            style={{
              position: 'relative',
              padding: isMobile ? '24px 20px' : '28px 24px',
              borderRadius: 16,
              background: cardBg[cardStyle ?? 'border'],
              border: cardStyle !== 'minimal' ? `1px solid ${cardBorder[cardStyle ?? 'border']}` : 'none',
              borderBottom: cardStyle === 'minimal' ? `2px solid rgba(${rgb}, 0.2)` : undefined,
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease, opacity 0.5s ease',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
              willChange: 'transform',
            }}
          >
            {/* Badge */}
            {member.showBadge && member.badge && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                padding: '3px 10px', borderRadius: 100,
                background: `rgba(${rgb}, 0.15)`, color: accentColor,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>{member.badge}</div>
            )}

            <Avatar member={member} size={isMobile ? 72 : 88} idx={i} />

            <div style={{ marginTop: 16, width: '100%' }}>
              <EditableText
                value={member.name} fieldKey={`name-${i}`} tag="h3"
                style={{ fontSize: 17, fontWeight: 700, color: t.text, margin: '0 0 4px' }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => {
                  const arr = [...((p.members as TeamMember[]) ?? [])];
                  arr[i] = { ...arr[i], name: val }; p.members = arr;
                }, 0)}
              />
              <EditableText
                value={member.role} fieldKey={`role-${i}`} tag="p"
                style={{ fontSize: 13, fontWeight: 500, color: accentColor, margin: '0 0 10px', letterSpacing: '0.02em' }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => {
                  const arr = [...((p.members as TeamMember[]) ?? [])];
                  arr[i] = { ...arr[i], role: val }; p.members = arr;
                }, 0)}
              />
              {member.bio && (
                <EditableText
                  value={member.bio} fieldKey={`bio-${i}`} tag="p"
                  style={{ fontSize: 13, lineHeight: 1.6, color: t.textSecondary, margin: 0 }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => {
                    const arr = [...((p.members as TeamMember[]) ?? [])];
                    arr[i] = { ...arr[i], bio: val }; p.members = arr;
                  }, 0)}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Socials member={member} idx={i} />
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Minimal list layout ───────────────────────────────────────────────
  const renderMinimal = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: isMobile ? 12 : 16,
    }}>
      {list.map((member, i) => {
        const isVisible = enabled || visibleCards.has(i);
        return (
          <div
            key={i}
            ref={(el) => { cardRevealRefs.current[i] = el; }}
            data-card-idx={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px', borderRadius: 12,
              background: t.cardBg, border: `1px solid ${t.border}`,
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-16px)',
            }}
          >
            <Avatar member={member} size={52} idx={i} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <EditableText
                  value={member.name} fieldKey={`mname-${i}`} tag="span"
                  style={{ fontSize: 15, fontWeight: 700, color: t.text }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => {
                    const arr = [...((p.members as TeamMember[]) ?? [])];
                    arr[i] = { ...arr[i], name: val }; p.members = arr;
                  }, 0)}
                />
                {member.showBadge && member.badge && (
                  <span style={{
                    padding: '1px 7px', borderRadius: 100,
                    background: `rgba(${rgb}, 0.12)`, color: accentColor,
                    fontSize: 10, fontWeight: 700,
                  }}>{member.badge}</span>
                )}
              </div>
              <EditableText
                value={member.role} fieldKey={`mrole-${i}`} tag="p"
                style={{ fontSize: 12, color: accentColor, fontWeight: 500, margin: '0 0 6px' }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => {
                  const arr = [...((p.members as TeamMember[]) ?? [])];
                  arr[i] = { ...arr[i], role: val }; p.members = arr;
                }, 0)}
              />
              <Socials member={member} idx={i} />
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Spotlight layout ─────────────────────────────────────────────────
  const renderSpotlight = () => {
    const active = list[spotlightIdx] ?? list[0];
    if (!active) return null;
    return (
      <div style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 32 : 48, alignItems: isMobile ? 'center' : 'flex-start',
      }}>
        {/* Big featured card */}
        <div style={{
          flex: isMobile ? 'none' : '0 0 340px',
          width: isMobile ? '100%' : 340,
          padding: '36px 32px', borderRadius: 20,
          background: `rgba(${rgb}, 0.06)`,
          border: `1px solid rgba(${rgb}, 0.2)`,
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow top */}
          <div style={{
            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb}, 0.15) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <Avatar member={active} size={120} idx={spotlightIdx} />
            </div>
            {active.showBadge && active.badge && (
              <div style={{
                display: 'inline-block', marginBottom: 12,
                padding: '4px 14px', borderRadius: 100,
                background: `rgba(${rgb}, 0.15)`, color: accentColor,
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{active.badge}</div>
            )}
            <h3 style={{ fontSize: 22, fontWeight: 800, color: t.text, margin: '0 0 6px' }}>{active.name}</h3>
            <p style={{ fontSize: 14, color: accentColor, fontWeight: 600, margin: '0 0 16px' }}>{active.role}</p>
            {active.bio && (
              <p style={{ fontSize: 14, lineHeight: 1.65, color: t.textSecondary, margin: '0 0 8px' }}>{active.bio}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Socials member={active} idx={spotlightIdx} />
            </div>
          </div>
        </div>

        {/* Thumbnails grid */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Team members
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${Math.min(cols, 3)}, 1fr)`,
            gap: 12,
          }}>
            {list.map((member, i) => {
              const isActive = i === spotlightIdx;
              return (
                <div
                  key={i}
                  onClick={() => !enabled && setSpotlightIdx(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12, cursor: enabled ? 'default' : 'pointer',
                    background: isActive ? `rgba(${rgb}, 0.1)` : 'transparent',
                    border: `1px solid ${isActive ? `rgba(${rgb}, 0.3)` : t.border}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Avatar member={member} size={40} idx={i} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: isActive ? accentColor : t.textSecondary, fontWeight: 500 }}>{member.role}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
      id="team"
      data-block-type="team"
      className={`w-full relative overflow-hidden ${isSelected ? 'craft-node-selected' : ''}`}
      style={{ background: t.bg, minHeight: `${sectionHeight}vh`, display: 'flex', alignItems: 'center' }}
    >
      {/* Grid */}
      <div key={scheme} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: showGrid
          ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
          : 'none',
        backgroundSize: showGrid ? '50px 50px' : 'auto',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', padding: isMobile ? '60px 20px' : '80px 40px' }} {...animAttrs}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? 40 : 56, textAlign: 'center' }}>
          {showLabel && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 32, height: 2, background: accentColor, borderRadius: 1 }} />
              <EditableText
                value={label ?? ''} fieldKey="label" tag="span"
                style={{ color: accentColor, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                enabled={enabled}
                onSave={(val) => setProp((p: Record<string, unknown>) => { p.label = val; }, 0)}
              />
              <div style={{ width: 32, height: 2, background: accentColor, borderRadius: 1 }} />
            </div>
          )}
          <EditableText
            value={title ?? ''} fieldKey="title" tag="h2"
            style={{ fontSize: isMobile ? 28 : 44, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: t.text, margin: '0 0 16px' }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.title = val; }, 0)}
          />
          <EditableText
            value={subtitle ?? ''} fieldKey="subtitle" tag="p"
            style={{ fontSize: 16, lineHeight: 1.65, color: t.textSecondary, margin: '0 auto', maxWidth: 560 }}
            enabled={enabled}
            onSave={(val) => setProp((p: Record<string, unknown>) => { p.subtitle = val; }, 0)}
          />
        </div>

        {layoutStyle === 'grid'      && renderGrid()}
        {layoutStyle === 'minimal'   && renderMinimal()}
        {layoutStyle === 'spotlight' && renderSpotlight()}
      </div>
    </section>
  );
});

// ── Settings ──────────────────────────────────────────────────────────────
function TronTeamSettings() {
  const { actions: { setProp } } = useNode();
  const { user } = useAuth();
  const props = useNode((node) => node.data.props as Partial<TronTeamProps>) ?? {};
  const {
    label = 'The people behind it', showLabel = true,
    title = 'Meet the Team', subtitle = 'A small but mighty crew.',
    layoutStyle = 'grid', columns = 3,
    photoShape = 'circle', cardStyle = 'border',
    members = DEFAULT_MEMBERS, showGrid = true,
    darkBg = '#0a0a0a', lightBg = '#ffffff',
    sectionHeight = 70, animationType = 'none', animateDelay = '0',
  } = props;

  const list = Array.isArray(members) && members.length > 0 ? members : DEFAULT_MEMBERS;
  const [openMember, setOpenMember] = React.useState<number | null>(null);
  const [showMedia, setShowMedia] = React.useState<number | null>(null);

  const updateMember = (i: number, field: keyof TeamMember, value: string | boolean) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.members as TeamMember[]) ?? [])];
      arr[i] = { ...arr[i], [field]: value };
      p.members = arr;
    }, 300);
  };

  return (
    <div className="p-3 space-y-0">
      {/* CONTENT */}
      <div className={`${sectionCls} first:border-t-0 first:pt-0 first:mt-0`}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div><label className={labelCls}>Label</label><input type="text" value={label} onChange={(e) => setProp((p: Record<string, unknown>) => { p.label = e.target.value; }, 500)} className={inputCls} /></div>
          <div><label className={labelCls}>Title</label><input type="text" value={title} onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 500)} className={inputCls} /></div>
          <div><label className={labelCls}>Subtitle</label><textarea value={subtitle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; }, 500)} className={inputCls} rows={2} /></div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Layout</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Style</label>
            <select value={layoutStyle} onChange={(e) => setProp((p: Record<string, unknown>) => { p.layoutStyle = e.target.value; })} className={inputCls}>
              <option value="grid">Grid cards</option>
              <option value="minimal">Minimal list</option>
              <option value="spotlight">Spotlight</option>
            </select>
          </div>
          {layoutStyle === 'grid' && (
            <div>
              <label className={labelCls}>Columns</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {([2, 3, 4] as const).map((n) => (
                  <button key={n} onClick={() => setProp((p: Record<string, unknown>) => { p.columns = n; })}
                    style={{ flex: 1, padding: '5px 0', fontSize: 12, borderRadius: 6, border: '1px solid', borderColor: columns === n ? '#FF6B35' : 'rgba(255,255,255,0.12)', background: columns === n ? 'rgba(255,107,53,0.12)' : 'transparent', color: columns === n ? '#FF6B35' : '#a1a1aa', cursor: 'pointer' }}
                  >{n}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className={labelCls}>Photo shape</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['circle', 'rounded', 'square'] as const).map((s) => (
                <button key={s} onClick={() => setProp((p: Record<string, unknown>) => { p.photoShape = s; })}
                  style={{ flex: 1, padding: '5px 0', fontSize: 11, borderRadius: 6, border: '1px solid', borderColor: photoShape === s ? '#FF6B35' : 'rgba(255,255,255,0.12)', background: photoShape === s ? 'rgba(255,107,53,0.12)' : 'transparent', color: photoShape === s ? '#FF6B35' : '#a1a1aa', cursor: 'pointer' }}
                >{s}</button>
              ))}
            </div>
          </div>
          {layoutStyle === 'grid' && (
            <div>
              <label className={labelCls}>Card style</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['border', 'filled', 'minimal'] as const).map((s) => (
                  <button key={s} onClick={() => setProp((p: Record<string, unknown>) => { p.cardStyle = s; })}
                    style={{ flex: 1, padding: '5px 0', fontSize: 11, borderRadius: 6, border: '1px solid', borderColor: cardStyle === s ? '#FF6B35' : 'rgba(255,255,255,0.12)', background: cardStyle === s ? 'rgba(255,107,53,0.12)' : 'transparent', color: cardStyle === s ? '#FF6B35' : '#a1a1aa', cursor: 'pointer' }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MEMBERS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Members ({list.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.map((member, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
              {/* Collapsible header */}
              <button
                onClick={() => setOpenMember(openMember === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {/* Mini avatar */}
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `rgba(255,107,53,0.15)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#FF6B35', overflow: 'hidden' }}>
                  {member.imageUrl ? <img src={member.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : member.name.charAt(0)}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7', flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.name || `Member ${i + 1}`}
                </span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button onClick={(e) => { e.stopPropagation(); setProp((p: Record<string, unknown>) => { p.members = ((p.members as TeamMember[]) ?? []).filter((_, idx) => idx !== i); }); }}
                    style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}>×</button>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#71717a', transform: openMember === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </button>

              {/* Expanded */}
              {openMember === i && (
                <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Photo */}
                  <div>
                    <label className={labelCls}>Photo</label>
                    <button onClick={() => setShowMedia(i)} style={{ color: '#FF6B35', fontWeight: 600, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', marginBottom: 6 }}>
                      {member.imageUrl ? '↺ Replace photo' : '+ Add photo'}
                    </button>
                    {member.imageUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={member.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        <button onClick={() => updateMember(i, 'imageUrl', '')} style={{ color: '#f87171', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
                      </div>
                    )}
                    {showMedia === i && user && (
                      <MediaLibrary userId={user.id} accept="image"
                        onSelect={(url) => { updateMember(i, 'imageUrl', url); setShowMedia(null); }}
                        onClose={() => setShowMedia(null)}
                      />
                    )}
                  </div>
                  <div><label className={labelCls}>Name</label><input type="text" value={member.name} onChange={(e) => updateMember(i, 'name', e.target.value)} className={inputCls} style={{ marginBottom: 0 }} /></div>
                  <div><label className={labelCls}>Role / Position</label><input type="text" value={member.role} onChange={(e) => updateMember(i, 'role', e.target.value)} className={inputCls} style={{ marginBottom: 0 }} /></div>
                  <div><label className={labelCls}>Bio</label><textarea value={member.bio ?? ''} rows={3} onChange={(e) => updateMember(i, 'bio', e.target.value)} className={inputCls} style={{ marginBottom: 0 }} /></div>
                  {/* Badge */}
                  <div>
                    <label className={labelCls}>Badge</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="text" value={member.badge ?? ''} placeholder="Founder, Lead…" onChange={(e) => updateMember(i, 'badge', e.target.value)} className={inputCls} style={{ flex: 1, marginBottom: 0 }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a1a1aa', flexShrink: 0, cursor: 'pointer' }}>
                        <input type="checkbox" checked={member.showBadge ?? false} onChange={(e) => updateMember(i, 'showBadge', e.target.checked)} /> show
                      </label>
                    </div>
                  </div>
                  {/* Social links */}
                  <div>
                    <label className={labelCls}>Social links</label>
                    {[
                      { field: 'linkedIn' as keyof TeamMember, label: 'LinkedIn URL' },
                      { field: 'twitter' as keyof TeamMember, label: 'Twitter/X URL' },
                      { field: 'github' as keyof TeamMember, label: 'GitHub URL' },
                      { field: 'instagram' as keyof TeamMember, label: 'Instagram URL' },
                    ].map(({ field, label: lbl }) => (
                      <input key={field} type="text" value={(member[field] as string) ?? ''} placeholder={lbl}
                        onChange={(e) => updateMember(i, field, e.target.value)}
                        className={inputCls} style={{ marginBottom: 4 }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setProp((p: Record<string, unknown>) => {
            p.members = [...((p.members as TeamMember[]) ?? []), { name: 'New Member', role: 'Role', bio: '', badge: '', showBadge: false, linkedIn: '', twitter: '', github: '', instagram: '' }];
          })} style={{ color: '#FF6B35', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
            + Add member
          </button>
        </div>
      </div>

      {/* COLORS */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Colors</h3>
        {[{ label: 'Background (dark)', key: 'darkBg', value: darkBg }, { label: 'Background (light)', key: 'lightBg', value: lightBg }].map(({ label: lbl, key, value }) => (
          <div key={key}>
            <label className={labelCls}>{lbl}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <input type="color" value={value} onChange={(e) => setProp((p: Record<string, unknown>) => { p[key] = e.target.value; }, 300)} />
              <span className="text-xs text-zinc-500 font-mono">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* SIZE */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Size</h3>
        <label className={labelCls}>Section height: {sectionHeight}vh</label>
        <input type="range" min={40} max={100} step={5} value={sectionHeight} onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 300)} className="settings-slider" />
      </div>

      {/* DISPLAY */}
      <div className={sectionCls}>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Display</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={showLabel} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showLabel = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" /> Show label</label>
          <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={showGrid} onChange={(e) => setProp((p: Record<string, unknown>) => { p.showGrid = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" /> Show grid</label>
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
              <option value="scale-in">Scale In</option>
              <option value="blur-in">Blur In</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Delay</label>
            <select value={animateDelay} onChange={(e) => setProp((p: Record<string, unknown>) => { p.animateDelay = e.target.value; })} className={inputCls}>
              {['0', '0.1', '0.2', '0.3', '0.5', '0.8'].map((v) => <option key={v} value={v}>{v}s</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ──────────────────────────────────────────────────────────
const tronTeamCraft = {
  displayName: 'Team Tron',
  props: {
    colorScheme: 'dark' as const,
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 70,
    showGrid: true,
    label: 'The people behind it',
    showLabel: true,
    title: 'Meet the Team',
    subtitle: 'A small but mighty crew of designers, engineers, and strategists building the future.',
    layoutStyle: 'grid' as const,
    columns: 3 as const,
    photoShape: 'circle' as const,
    cardStyle: 'border' as const,
    members: DEFAULT_MEMBERS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronTeamSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    block_type: 'team',
    variant_name: 'default',
    style_tags: ['dark', 'minimal', 'elegant'],
    business_tags: ['agency', 'startup', 'consulting', 'portfolio', 'education'],
    feature_tags: ['team'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronTeam as unknown as { craft: typeof tronTeamCraft }).craft = tronTeamCraft;
