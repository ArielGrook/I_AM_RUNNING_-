'use client';

import React, {
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
  CSSProperties,
  forwardRef,
  Fragment,
} from 'react';
import { useEditorTheme } from './EditorThemeContext';

// ─── SVG Icon components (no emoji, no external libs) ─────────────────────────
type IconProps = { size?: number; color?: string };

function IconLock({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3.5" y="8" width="11" height="8.5" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M6 8V6.5a3 3 0 016 0V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="12.5" r="1.5" fill={color} />
    </svg>
  );
}

function IconEnvelope({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="4.5" width="14" height="10" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M2 6.5l7 4.5 7-4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCreditCard({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="14" height="10" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M2 7.5h14" stroke={color} strokeWidth="1.5" />
      <rect x="4" y="10" width="4" height="1.5" rx="0.5" fill={color} />
    </svg>
  );
}

function IconCart({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 2h2.5l2 8.5h7l2-5.5H5.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="14" r="1.5" stroke={color} strokeWidth="1.5" />
      <circle cx="13" cy="14" r="1.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function IconChart({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3 14l4-4 3 2 5-7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2.5 16h13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconGlobe({ size = 22, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8.5" stroke={color} strokeWidth="1.5" />
      <ellipse cx="11" cy="11" rx="3.5" ry="8.5" stroke={color} strokeWidth="1.5" />
      <path d="M2.5 11h17" stroke={color} strokeWidth="1.5" />
      <path d="M4 6.5h14M4 15.5h14" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}

function IconDb({ size = 22, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <ellipse cx="11" cy="6" rx="7" ry="2.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M4 6v5c0 1.38 3.13 2.5 7 2.5S18 12.38 18 11V6"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M4 11v5c0 1.38 3.13 2.5 7 2.5S18 17.38 18 16v-5"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ─── Theme tokens ──────────────────────────────────────────────────────────────
type Tokens = {
  bg: string;
  panelBg: string;
  panelBorder: string;
  cardBg: string;
  cardBorderDefault: string;
  textPrimary: string;
  textMuted: string;
  textOrange: string;
  textBlue: string;
  line: string;
  nodeDot: string;
};

function useTokens(): Tokens {
  const { theme } = useEditorTheme();
  const dark = theme === 'dark';
  return {
    bg:                dark ? '#0a0a0a' : '#f5f5f5',
    panelBg:           dark ? '#0a0a0a' : '#ffffff',
    panelBorder:       dark ? '#1a1a1a' : '#e8e8e8',
    cardBg:            dark ? '#111111' : '#ffffff',
    cardBorderDefault: dark ? '#1f1f1f' : '#e2e2e2',
    textPrimary:       dark ? '#d4d4d4' : '#171717',
    textMuted:         dark ? '#525252' : '#a3a3a3',
    textOrange:        '#FF6B35',
    textBlue:          dark ? '#60a5fa' : '#2563eb',
    line:              dark ? '#2d2d2d' : '#d0d0d0',
    nodeDot:           '#FF6B35',
  };
}

// ─── Data ──────────────────────────────────────────────────────────────────────
type BlockStatus = 'pending' | 'active' | 'locked';
type IconComp = React.FC<IconProps>;

interface BlockData {
  id: string;
  label: string;
  price: string;
  status: BlockStatus;
  Icon: IconComp;
}

const BLOCKS: BlockData[] = [
  { id: 'auth',    label: 'USER AUTH',     price: '$40', status: 'pending', Icon: IconLock       },
  { id: 'contact', label: 'CONTACT FORM',  price: '$25', status: 'active',  Icon: IconEnvelope   },
  { id: 'stripe',  label: 'STRIPE',        price: '$80', status: 'locked',  Icon: IconCreditCard },
  { id: 'cart',    label: 'SHOPPING CART', price: '$40', status: 'pending', Icon: IconCart       },
];

const SIDEBAR_BLOCKS = [
  { label: 'User Auth',     price: '$40', Icon: IconLock       },
  { label: 'Contact Form',  price: '$25', Icon: IconEnvelope   },
  { label: 'Stripe',        price: '$80', Icon: IconCreditCard },
  { label: 'Shopping Cart', price: '$40', Icon: IconCart       },
  { label: 'Analytics',     price: '$30', Icon: IconChart      },
];

// ─── SVG coordinate types ──────────────────────────────────────────────────────
interface SvgCoords {
  siteRight: number;
  siteCenterY: number;
  nodeX: number;
  blocks: Array<{ centerY: number; left: number; right: number }>;
  dbLeft: number;
  dbCenterY: number;
  topBlockY: number;
  bottomBlockY: number;
}

// ─── Shared mono font style helper ────────────────────────────────────────────
const MONO: CSSProperties = { fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace' };

// ─── Card: YOUR SITE ──────────────────────────────────────────────────────────
const CARD_W = 160;

const SiteCard = forwardRef<HTMLDivElement, { t: Tokens }>(function SiteCard({ t }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        background: t.cardBg,
        border: '1px solid #FF6B35',
        borderRadius: 8,
        padding: '12px 14px',
        boxShadow: '0 0 24px rgba(255,107,53,0.15)',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <IconGlobe size={22} color="#FF6B35" />
        {/* Online pulsing dot — SVG animate */}
        <svg width="8" height="8" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" fill="#FF6B35">
            <animate attributeName="opacity" values="1;0.25;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div style={{ ...MONO, fontSize: 11, color: t.textOrange, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.4 }}>
        YOUR SITE
      </div>
      <div style={{ ...MONO, fontSize: 9, color: t.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>
        FRONTEND
      </div>
    </div>
  );
});

// ─── Card: SUPABASE ────────────────────────────────────────────────────────────
const DatabaseCard = forwardRef<HTMLDivElement, { t: Tokens }>(function DatabaseCard({ t }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        background: t.cardBg,
        border: '1px solid #1e40af',
        borderRadius: 8,
        padding: '12px 14px',
        boxShadow: '0 0 24px rgba(30,64,175,0.15)',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <IconDb size={22} color={t.textBlue} />
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.textBlue }} />
      </div>
      <div style={{ ...MONO, fontSize: 11, color: t.textBlue, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.4 }}>
        SUPABASE
      </div>
      <div style={{ ...MONO, fontSize: 9, color: t.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>
        DATABASE
      </div>
    </div>
  );
});

// ─── Card: Block module ────────────────────────────────────────────────────────
const BlockCard = forwardRef<HTMLDivElement, { block: BlockData; t: Tokens }>(
  function BlockCard({ block, t }, ref) {
    const { status, Icon } = block;

    const borderColor =
      status === 'active'  ? '#FF6B35' :
      status === 'locked'  ? '#1e3a5f' :
      t.cardBorderDefault;

    const boxShadow =
      status === 'active'  ? '0 0 14px rgba(255,107,53,0.14)' :
      status === 'locked'  ? '0 0 14px rgba(30,58,95,0.14)'   :
      'none';

    const iconColor =
      status === 'active' ? '#FF6B35' :
      status === 'locked' ? t.textBlue :
      t.textMuted;

    const StatusDot = () => {
      if (status === 'active') {
        return (
          <svg width="7" height="7" viewBox="0 0 7 7">
            <circle cx="3.5" cy="3.5" r="3" fill="#FF6B35">
              <animate attributeName="r"       values="3;4.5;3"   dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.3;1"   dur="1.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        );
      }
      if (status === 'locked') {
        return <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1e3a5f', flexShrink: 0 }} />;
      }
      return <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.cardBorderDefault, flexShrink: 0 }} />;
    };

    const statusLabel =
      status === 'active' ? 'ACTIVE' :
      status === 'locked' ? 'LOCKED' :
      'PENDING';

    const statusColor =
      status === 'active' ? '#FF6B35' :
      status === 'locked' ? t.textBlue :
      t.textMuted;

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W,
          background: t.cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          padding: '10px 12px',
          boxShadow,
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {/* Top row: icon + name + price */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon size={15} color={iconColor} />
            <span style={{ ...MONO, fontSize: 9, color: t.textPrimary, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
              {block.label}
            </span>
          </div>
          <span style={{ ...MONO, fontSize: 9, color: t.textMuted }}>{block.price}</span>
        </div>
        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <StatusDot />
          <span style={{ ...MONO, fontSize: 8, color: statusColor, letterSpacing: '0.06em' }}>
            {statusLabel}
          </span>
        </div>
      </div>
    );
  }
);

// ─── SVG Lines ─────────────────────────────────────────────────────────────────
function SvgLines({ coords, t }: { coords: SvgCoords; t: Tokens }) {
  const { siteRight, siteCenterY, nodeX, blocks, dbLeft, dbCenterY, topBlockY, bottomBlockY } = coords;

  return (
    <>
      {/* Site → branch node */}
      <line
        x1={siteRight} y1={siteCenterY}
        x2={nodeX}     y2={siteCenterY}
        stroke={t.line} strokeWidth="1.5"
      />

      {/* Vertical spine through all blocks */}
      <line
        x1={nodeX} y1={topBlockY}
        x2={nodeX} y2={bottomBlockY}
        stroke={t.line} strokeWidth="1.5"
      />

      {/* Per-block: junction dot + horizontal branch + right-to-DB line */}
      {blocks.map((block, i) => (
        <Fragment key={i}>
          {/* Small dot at the vertical spine junction */}
          <circle cx={nodeX} cy={block.centerY} r="2.5" fill={t.line} />

          {/* Horizontal elbow → block left edge */}
          <line
            x1={nodeX}      y1={block.centerY}
            x2={block.left} y2={block.centerY}
            stroke={t.line} strokeWidth="1.5"
          />

          {/* Block right edge → DB (converging to DB center Y) */}
          <line
            x1={block.right} y1={block.centerY}
            x2={dbLeft}      y2={dbCenterY}
            stroke={t.line} strokeWidth="1.5" opacity="0.4"
          />
        </Fragment>
      ))}

      {/* Main branch node — pulsing */}
      <circle cx={nodeX} cy={siteCenterY} r="4" fill={t.nodeDot}>
        <animate attributeName="r"       values="4;6;4"   dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.35;1" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </>
  );
}

// ─── Left panel ────────────────────────────────────────────────────────────────
function LeftPanel({ t }: { t: Tokens }) {
  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: t.panelBg,
        borderRight: `1px solid ${t.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          ...MONO,
          fontSize: 10,
          color: t.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          padding: '12px 16px',
          borderBottom: `1px solid ${t.panelBorder}`,
        }}
      >
        BACKEND BLOCKS
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {SIDEBAR_BLOCKS.map((b, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 16px',
              cursor: 'pointer',
              borderBottom: `1px solid ${t.panelBorder}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.bg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <b.Icon size={15} color={t.textMuted} />
            <span style={{ ...MONO, fontSize: 11, color: t.textPrimary, flex: 1 }}>{b.label}</span>
            <span style={{ ...MONO, fontSize: 10, color: t.textMuted }}>{b.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BackendCanvas ─────────────────────────────────────────────────────────────
export function BackendCanvas() {
  const t = useTokens();

  const containerRef = useRef<HTMLDivElement>(null);
  const siteRef      = useRef<HTMLDivElement>(null);
  const dbRef        = useRef<HTMLDivElement>(null);
  const blockRefs    = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  const [coords, setCoords] = useState<SvgCoords | null>(null);

  const calculate = useCallback(() => {
    const container = containerRef.current;
    const site      = siteRef.current;
    const db        = dbRef.current;
    if (!container || !site || !db) return;
    if (blockRefs.current.some((r) => r === null)) return;

    const cRect = container.getBoundingClientRect();

    const rel = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        left:    r.left   - cRect.left,
        right:   r.right  - cRect.left,
        centerY: r.top + r.height / 2 - cRect.top,
      };
    };

    const s  = rel(site);
    const d  = rel(db);
    const bs = (blockRefs.current as HTMLDivElement[]).map(rel);

    const nodeX = s.right + (bs[0].left - s.right) / 2;

    setCoords({
      siteRight:    s.right,
      siteCenterY:  s.centerY,
      nodeX,
      blocks:       bs.map((b) => ({ centerY: b.centerY, left: b.left, right: b.right })),
      dbLeft:       d.left,
      dbCenterY:    d.centerY,
      topBlockY:    bs[0].centerY,
      bottomBlockY: bs[bs.length - 1].centerY,
    });
  }, []);

  useLayoutEffect(() => {
    calculate();
    const ro = new ResizeObserver(calculate);
    const el = containerRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [calculate]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: t.bg }}>
      <LeftPanel t={t} />

      {/* Main canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* SVG overlay for lines — pointer-events: none */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {coords && <SvgLines coords={coords} t={t} />}
        </svg>

        {/* Cards row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 80,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <SiteCard ref={siteRef} t={t} />

          {/* Block modules column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {BLOCKS.map((block, i) => (
              <BlockCard
                key={block.id}
                ref={(el) => { blockRefs.current[i] = el; }}
                block={block}
                t={t}
              />
            ))}
          </div>

          <DatabaseCard ref={dbRef} t={t} />
        </div>
      </div>
    </div>
  );
}
