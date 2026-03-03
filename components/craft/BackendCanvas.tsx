'use client';

import React, { useRef, useState, useCallback, useEffect, CSSProperties, Fragment } from 'react';
import { useEditorTheme } from './EditorThemeContext';

// ─── SVG Icon components ───────────────────────────────────────────────────────
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

// ─── Category colors ───────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  auth:     '#a78bfa',
  contact:  '#34d399',
  payment:  '#fbbf24',
  commerce: '#38bdf8',
  default:  '#94a3b8',
};

function getCategoryColor(category?: string): string {
  return category && category in CATEGORY_COLORS ? CATEGORY_COLORS[category] : CATEGORY_COLORS.default;
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
  category: string;
}

const BLOCKS: BlockData[] = [
  { id: 'auth',    label: 'USER AUTH',     price: '$40', status: 'pending', Icon: IconLock,       category: 'auth'     },
  { id: 'contact', label: 'CONTACT FORM',  price: '$25', status: 'active',  Icon: IconEnvelope,   category: 'contact'  },
  { id: 'stripe',  label: 'STRIPE',        price: '$80', status: 'locked',  Icon: IconCreditCard, category: 'payment'  },
  { id: 'cart',    label: 'SHOPPING CART', price: '$40', status: 'pending', Icon: IconCart,       category: 'commerce' },
];

const SIDEBAR_BLOCKS = [
  { label: 'User Auth',     price: '$40', Icon: IconLock,       category: 'auth'     },
  { label: 'Contact Form',  price: '$25', Icon: IconEnvelope,   category: 'contact'  },
  { label: 'Stripe',        price: '$80', Icon: IconCreditCard, category: 'payment'  },
  { label: 'Shopping Cart', price: '$40', Icon: IconCart,       category: 'commerce' },
  { label: 'Analytics',     price: '$30', Icon: IconChart,      category: 'default'  },
];

// ─── Constants ─────────────────────────────────────────────────────────────────
const CARD_WIDTH = 160;
const CARD_HEIGHT = 72;
const MONO: CSSProperties = { fontFamily: 'ui-monospace, "Cascadia Code", "Fira Mono", monospace' };

// ─── Card: YOUR SITE ───────────────────────────────────────────────────────────
function SiteCard({
  t,
  pos,
  onMouseDown,
}: {
  t: Tokens;
  pos: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background: t.cardBg,
        border: '1px solid #FF6B35',
        borderRadius: 8,
        padding: '10px 12px',
        boxShadow: '0 0 24px rgba(255,107,53,0.15)',
        boxSizing: 'border-box',
        cursor: 'grab',
        userSelect: 'none',
      }}
      onMouseDown={(e) => onMouseDown(e, 'site')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <IconGlobe size={20} color="#FF6B35" />
        <svg width="7" height="7" viewBox="0 0 7 7">
          <circle cx="3.5" cy="3.5" r="3" fill="#FF6B35">
            <animate attributeName="opacity" values="1;0.25;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div style={{ ...MONO, fontSize: 10, color: t.textOrange, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.4 }}>
        YOUR SITE
      </div>
      <div style={{ ...MONO, fontSize: 8, color: t.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
        FRONTEND
      </div>
    </div>
  );
}

// ─── Card: SUPABASE ────────────────────────────────────────────────────────────
function DatabaseCard({
  t,
  pos,
  onMouseDown,
}: {
  t: Tokens;
  pos: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background: t.cardBg,
        border: '1px solid #1e40af',
        borderRadius: 8,
        padding: '10px 12px',
        boxShadow: '0 0 24px rgba(30,64,175,0.15)',
        boxSizing: 'border-box',
        cursor: 'grab',
        userSelect: 'none',
      }}
      onMouseDown={(e) => onMouseDown(e, 'db')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <IconDb size={20} color={t.textBlue} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.textBlue }} />
      </div>
      <div style={{ ...MONO, fontSize: 10, color: t.textBlue, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.4 }}>
        SUPABASE
      </div>
      <div style={{ ...MONO, fontSize: 8, color: t.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
        DATABASE
      </div>
    </div>
  );
}

// ─── Card: Block module ────────────────────────────────────────────────────────
function BlockCard({
  block,
  t,
  pos,
  onMouseDown,
}: {
  block: BlockData;
  t: Tokens;
  pos: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent, id: string) => void;
}) {
  const { status, Icon, category } = block;
  const categoryColor = getCategoryColor(category);

  const StatusDot = () => {
    if (status === 'active') {
      return (
        <svg width="7" height="7" viewBox="0 0 7 7">
          <circle cx="3.5" cy="3.5" r="3" fill={categoryColor}>
            <animate attributeName="r" values="3;4.5;3" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    if (status === 'locked') {
      return (
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: categoryColor,
            flexShrink: 0,
            opacity: 0.5,
          }}
        />
      );
    }
    return (
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: categoryColor,
          flexShrink: 0,
          opacity: 0.4,
        }}
      />
    );
  };

  const statusLabel = status === 'active' ? 'ACTIVE' : status === 'locked' ? 'LOCKED' : 'PENDING';

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background: t.cardBg,
        border: `1px solid ${categoryColor}`,
        borderRadius: 6,
        padding: '10px 12px',
        boxShadow: `0 0 12px ${categoryColor}20`,
        boxSizing: 'border-box',
        cursor: 'grab',
        userSelect: 'none',
      }}
      onMouseDown={(e) => onMouseDown(e, block.id)}
    >
      {/* Top row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon size={15} color={categoryColor} />
          <span
            style={{
              ...MONO,
              fontSize: 9,
              color: categoryColor,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 90,
            }}
          >
            {block.label}
          </span>
        </div>
        <span style={{ ...MONO, fontSize: 9, color: t.textMuted }}>{block.price}</span>
      </div>
      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <StatusDot />
        <span
          style={{
            ...MONO,
            fontSize: 8,
            color: categoryColor,
            letterSpacing: '0.06em',
          }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

// ─── SVG Lines ─────────────────────────────────────────────────────────────────
function SvgLines({
  positions,
  t,
}: {
  positions: Record<string, { x: number; y: number }>;
  t: Tokens;
}) {
  const half = CARD_HEIGHT / 2;

  const siteOut = {
    x: positions.site.x + CARD_WIDTH,
    y: positions.site.y + half,
  };
  const dbIn = {
    x: positions.db.x,
    y: positions.db.y + half,
  };
  const nodeX = siteOut.x + 40;

  const blockIds = ['auth', 'contact', 'stripe', 'cart'];
  const blockCenters = blockIds.map((id) => ({
    id,
    left: { x: positions[id].x, y: positions[id].y + half },
    right: { x: positions[id].x + CARD_WIDTH, y: positions[id].y + half },
  }));

  const topY = Math.min(...blockCenters.map((b) => b.left.y));
  const bottomY = Math.max(...blockCenters.map((b) => b.left.y));
  const dxSite = (nodeX - siteOut.x) * 0.5;

  return (
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
      {/* site → nodeX (soft curve) */}
      <path
        d={`M ${siteOut.x} ${siteOut.y} C ${siteOut.x + dxSite} ${siteOut.y}, ${nodeX - dxSite} ${siteOut.y}, ${nodeX} ${siteOut.y}`}
        fill="none"
        stroke={t.line}
        strokeWidth="1.5"
      />

      {/* nodeX vertical spine */}
      <line x1={nodeX} y1={topY} x2={nodeX} y2={bottomY} stroke={t.line} strokeWidth="1.5" />

      {/* nodeX → each block */}
      {blockCenters.map((b) => (
        <Fragment key={b.id}>
          <circle cx={nodeX} cy={b.left.y} r="2.5" fill={t.line} />
          <line
            x1={nodeX}
            y1={b.left.y}
            x2={b.left.x}
            y2={b.left.y}
            stroke={t.line}
            strokeWidth="1.5"
          />
        </Fragment>
      ))}

      {/* each block → db (cubic bezier, fan to dbIn) */}
      {blockCenters.map((b) => {
        const dx = (dbIn.x - b.right.x) * 0.5;
        return (
          <path
            key={b.id + '-db'}
            d={`M ${b.right.x} ${b.right.y} C ${b.right.x + dx} ${b.right.y}, ${dbIn.x - dx} ${dbIn.y}, ${dbIn.x} ${dbIn.y}`}
            fill="none"
            stroke={t.line}
            strokeWidth="1.5"
            opacity="0.4"
          />
        );
      })}

      {/* pulsing main node */}
      <circle cx={nodeX} cy={siteOut.y} r="4" fill={t.nodeDot}>
        <animate attributeName="r" values="4;6;4" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.35;1" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ─── Left panel ────────────────────────────────────────────────────────────────
type AuthPanelProps = {
  t: Tokens;
  projectId: string | null;
  onConnectSuccess: (url: string, anonKey: string) => void;
};

function LeftPanel({ t, projectId, onConnectSuccess }: AuthPanelProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [showFields, setShowFields] = useState({ anon: false, service: false, db: false });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [migrationsResult, setMigrationsResult] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!projectId || !authOpen) return;
    fetch(`/api/projects/${projectId}/backend-auth`)
      .then((r) => r.json())
      .then((data: { supabaseUrl?: string; supabaseAnonKey?: string; serviceRoleKey?: string; dbPassword?: string }) => {
        if (data.supabaseUrl) setSupabaseUrl(data.supabaseUrl);
        if (data.supabaseAnonKey) setSupabaseAnonKey(data.supabaseAnonKey);
        if (data.serviceRoleKey) setServiceRoleKey(data.serviceRoleKey);
        if (data.dbPassword) setDbPassword(data.dbPassword);
      })
      .catch(() => {});
  }, [projectId, authOpen]);

  const handleConnect = useCallback(async () => {
    if (!projectId || !supabaseUrl?.trim() || !supabaseAnonKey?.trim() || !serviceRoleKey?.trim()) {
      setAuthError('URL, Anon Key and Service Role Key are required');
      return;
    }
    if (!dbPassword?.trim()) {
      setAuthError('Database password is required for migrations');
      return;
    }
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/backend-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: supabaseUrl.trim(),
          supabaseAnonKey: supabaseAnonKey.trim(),
          serviceRoleKey: serviceRoleKey.trim(),
          dbPassword: dbPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? 'Connection failed');
        setMigrationsResult(null);
        return;
      }
      setAuthSuccess(true);
      setMigrationsResult(data.migrationsResult ?? null);
      onConnectSuccess(data.supabaseUrl, data.supabaseAnonKey);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setAuthLoading(false);
    }
  }, [projectId, supabaseUrl, supabaseAnonKey, serviceRoleKey, dbPassword, onConnectSuccess]);

  const inputStyle: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 8px',
    marginBottom: 8,
    ...MONO,
    fontSize: 11,
    color: t.textPrimary,
    background: t.cardBg,
    border: `1px solid ${t.panelBorder}`,
    borderRadius: 4,
  };

  return (
    <div
      style={{
        width: 280,
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
        {/* User Auth expandable */}
        <div style={{ borderBottom: `1px solid ${t.panelBorder}` }}>
          <div
            role="button"
            tabIndex={0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 16px',
              cursor: 'pointer',
            }}
            onClick={() => setAuthOpen((o) => !o)}
            onKeyDown={(e) => e.key === 'Enter' && setAuthOpen((o) => !o)}
          >
            <IconLock size={15} color={getCategoryColor('auth')} />
            <span style={{ ...MONO, fontSize: 11, color: getCategoryColor('auth'), flex: 1 }}>
              User Auth
            </span>
            <span style={{ ...MONO, fontSize: 10, color: t.textMuted }}>{authOpen ? '−' : '+'}</span>
          </div>
          {authOpen && (
            <div style={{ padding: '0 12px 12px' }}>
              <input
                placeholder="Supabase URL"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                style={inputStyle}
              />
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <input
                  type={showFields.anon ? 'text' : 'password'}
                  placeholder="Supabase Anon Key"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0, paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowFields((s) => ({ ...s, anon: !s.anon }))}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: t.textMuted,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showFields.anon ? 'Hide' : 'Show'}
                >
                  {showFields.anon ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <input
                  type={showFields.service ? 'text' : 'password'}
                  placeholder="Service Role Key"
                  value={serviceRoleKey}
                  onChange={(e) => setServiceRoleKey(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0, paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowFields((s) => ({ ...s, service: !s.service }))}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: t.textMuted,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showFields.service ? 'Hide' : 'Show'}
                >
                  {showFields.service ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <input
                  type={showFields.db ? 'text' : 'password'}
                  placeholder="Database Password"
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0, paddingRight: 36 }}
                  title="From Supabase → Settings → Database → Connection string (postgres:[PASSWORD]@). Not stored."
                />
                <button
                  type="button"
                  onClick={() => setShowFields((s) => ({ ...s, db: !s.db }))}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: t.textMuted,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showFields.db ? 'Hide' : 'Show'}
                >
                  {showFields.db ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="button"
                disabled={authLoading || !projectId}
                onClick={handleConnect}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  ...MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#fff',
                  background: authSuccess ? '#22c55e' : getCategoryColor('auth'),
                  border: 'none',
                  borderRadius: 4,
                  cursor: authLoading || !projectId ? 'not-allowed' : 'pointer',
                }}
              >
                {authLoading ? 'Connecting...' : authSuccess ? 'Connected' : 'Connect'}
              </button>
              {authError && (
                <div style={{ ...MONO, fontSize: 10, color: '#f87171', marginTop: 6 }}>{authError}</div>
              )}
              {authSuccess && migrationsResult && (
                <div style={{ ...MONO, fontSize: 9, color: t.textMuted, marginTop: 6 }}>
                  {Object.entries(migrationsResult).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                </div>
              )}
            </div>
          )}
        </div>
        {SIDEBAR_BLOCKS.filter((b) => b.label !== 'User Auth').map((b, i) => (
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <b.Icon size={15} color={getCategoryColor(b.category)} />
            <span style={{ ...MONO, fontSize: 11, color: getCategoryColor(b.category), flex: 1 }}>
              {b.label}
            </span>
            <span style={{ ...MONO, fontSize: 10, color: t.textMuted }}>{b.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BackendCanvas ─────────────────────────────────────────────────────────────
export function BackendCanvas({
  projectId = null,
  onConnectSuccess = () => {},
}: {
  projectId?: string | null;
  onConnectSuccess?: (url: string, anonKey: string) => void;
}) {
  const t = useTokens();
  const isDark = useEditorTheme().theme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({
    site: { x: 60, y: 180 },
    auth: { x: 320, y: 60 },
    contact: { x: 320, y: 160 },
    stripe: { x: 320, y: 260 },
    cart: { x: 320, y: 360 },
    db: { x: 580, y: 180 },
  });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const draggingCard = useRef<string | null>(null);
  const cardDragOffset = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(prev * delta, 0.3), 3));
  }, []);

  const startCardDrag = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      draggingCard.current = id;
      cardDragOffset.current = {
        x: e.clientX / scale - positions[id].x,
        y: e.clientY / scale - positions[id].y,
      };
      document.body.style.userSelect = 'none';
    },
    [scale, positions]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      document.body.style.userSelect = 'none';
    },
    [offset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingCard.current) {
        setPositions((prev) => ({
          ...prev,
          [draggingCard.current!]: {
            x: e.clientX / scale - cardDragOffset.current.x,
            y: e.clientY / scale - cardDragOffset.current.y,
          },
        }));
        return;
      }
      if (!isPanning) return;
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    },
    [isPanning, panStart, scale]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    draggingCard.current = null;
    document.body.style.userSelect = '';
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    draggingCard.current = null;
    document.body.style.userSelect = '';
  }, []);

  const bgStyle: CSSProperties = isDark
    ? {
        backgroundColor: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle, #1e1e1e 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }
    : {
        backgroundColor: '#f5f5f5',
        backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: t.bg }}>
      <LeftPanel t={t} projectId={projectId} onConnectSuccess={onConnectSuccess} />

      {/* Main canvas with zoom/pan */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          ...bgStyle,
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Transform layer — all content */}
        <div
          style={{
            position: 'relative',
            width: 900,
            height: 500,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning || draggingCard.current ? 'none' : 'transform 0.1s ease-out',
            left: '50%',
            top: '50%',
            marginLeft: -450,
            marginTop: -250,
          }}
        >
          <SvgLines positions={positions} t={t} />
          <SiteCard t={t} pos={positions.site} onMouseDown={startCardDrag} />
          <DatabaseCard t={t} pos={positions.db} onMouseDown={startCardDrag} />
          {BLOCKS.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              t={t}
              pos={positions[block.id]}
              onMouseDown={startCardDrag}
            />
          ))}
        </div>

        {/* Hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            ...MONO,
            fontSize: 9,
            color: isDark ? '#333333' : '#bbbbbb',
            userSelect: 'none',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          scroll to zoom · drag to pan
        </div>
      </div>
    </div>
  );
}
