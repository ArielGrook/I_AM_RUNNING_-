'use client';

import { useNode, useEditor } from '@craftjs/core';
import React from 'react';
import { useTheme } from '@/lib/craft/context/ThemeContext';

// ── Helpers ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  if (!m) return '255,107,53';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

// ── Tokens (from TronStats) ───────────────────────────────────────────────
const tokens = {
  dark: {
    bg: '#0a0a0a',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    border: 'rgba(255,255,255,0.08)',
    cardBg: 'rgba(255,255,255,0.03)',
    gridColor: 'rgba(255,255,255,0.03)',
  },
  light: {
    bg: '#ffffff',
    text: '#0a0a0a',
    textSecondary: '#52525b',
    border: 'rgba(0,0,0,0.08)',
    cardBg: 'rgba(0,0,0,0.02)',
    gridColor: 'rgba(0,0,0,0.06)',
  },
};

function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark: { ...tokens.dark, bg: darkBg ?? '#0a0a0a' },
    light: { ...tokens.light, bg: lightBg ?? '#ffffff' },
  };
}

// ── Interfaces ───────────────────────────────────────────────────────────
export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  subtitle: string;
  features: PricingFeature[];
  ctaText: string;
  isPopular: boolean;
  isHighlighted: boolean;
  popularText?: string;
  priceAnnual?: string;
}

interface TronPricingProps {
  colorScheme?: 'dark' | 'light';
  accentColor?: string;
  darkBg?: string;
  lightBg?: string;
  sectionHeight?: number;
  showGrid?: boolean;
  showBillingToggle?: boolean;
  annualDiscount?: string;
  title?: string;
  subtitle?: string;
  plans?: PricingPlan[];
  animationType?: string;
  animateDelay?: string;
}

function normalizePricingPlan(raw: unknown): PricingPlan {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const featuresRaw = o.features;
    const features: PricingFeature[] = Array.isArray(featuresRaw)
      ? featuresRaw.map((f) => {
          if (f && typeof f === 'object' && 'text' in f) return f as PricingFeature;
          return { text: String(f ?? ''), included: true };
        })
      : [];
    return {
      name: String(o.name ?? ''),
      price: String(o.price ?? ''),
      period: String(o.period ?? '/mo'),
      subtitle: String(o.subtitle ?? o.description ?? ''),
      features,
      ctaText: String(o.ctaText ?? 'Get started'),
      isPopular: Boolean(o.isPopular ?? false),
      isHighlighted: Boolean(o.isHighlighted ?? o.highlighted ?? false),
      popularText: (o.popularText as string) || undefined,
      priceAnnual: (o.priceAnnual as string) || undefined,
    };
  }
  return {
    name: '',
    price: '',
    period: '/mo',
    subtitle: '',
    features: [],
    ctaText: 'Get started',
    isPopular: false,
    isHighlighted: false,
  };
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$29',
    priceAnnual: '$23',
    period: '/mo',
    subtitle: 'For individuals',
    isPopular: false,
    isHighlighted: false,
    popularText: 'Most popular',
    ctaText: 'Get started',
    features: [
      { text: '5 projects', included: true },
      { text: '10GB storage', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Priority support', included: false },
      { text: 'Custom domain', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$79',
    priceAnnual: '$63',
    period: '/mo',
    subtitle: 'For growing teams',
    isPopular: true,
    isHighlighted: true,
    popularText: 'Most popular',
    ctaText: 'Get started',
    features: [
      { text: '20 projects', included: true },
      { text: '50GB storage', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom domain', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: '$199',
    priceAnnual: '$159',
    period: '/mo',
    subtitle: 'For large organizations',
    isPopular: false,
    isHighlighted: false,
    popularText: 'Most popular',
    ctaText: 'Contact us',
    features: [
      { text: 'Unlimited projects', included: true },
      { text: '500GB storage', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom domain', included: true },
    ],
  },
];

// ── PricingPlanCardDisplay (internal) ──────────────────────────────────────
interface PricingPlanCardDisplayProps {
  plan: PricingPlan;
  t: { text: string; textSecondary: string; border: string; cardBg: string };
  accentColor: string;
  enabled: boolean;
  isAnnual?: boolean;
}

function PricingPlanCardDisplay({ plan, t, accentColor, enabled, isAnnual = false }: PricingPlanCardDisplayProps) {
  const [hovered, setHovered] = React.useState(false);
  const displayPrice = isAnnual && plan.priceAnnual ? plan.priceAnnual : plan.price;

  const isHighlighted = plan.isHighlighted ?? false;
  const cardStyle: React.CSSProperties = isHighlighted
    ? {
        background: `rgba(${hexToRgb(accentColor)}, 0.05)`,
        border: `2px solid ${accentColor}`,
      }
    : {
        background: t.cardBg,
        border: `1px solid ${t.border}`,
      };

  return (
    <div
      onMouseEnter={() => !enabled && setHovered(true)}
      onMouseLeave={() => !enabled && setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 12,
        padding: 28,
        ...cardStyle,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 48px rgba(${hexToRgb(accentColor)}, 0.15)` : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      {plan.isPopular && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: accentColor,
            color: '#fff',
            padding: '4px 14px',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {plan.popularText ?? 'Most popular'}
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 8 }}>
        {plan.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: t.text }}>
          {displayPrice}
        </span>
        <span style={{ fontSize: 14, color: t.textSecondary }}>{plan.period}</span>
      </div>

      {plan.subtitle && (
        <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 20 }}>{plan.subtitle}</div>
      )}

      <div
        style={{
          height: 1,
          background: `rgba(${hexToRgb(accentColor)}, 0.2)`,
          marginBottom: 20,
        }}
      />

      <div style={{ flex: 1, marginBottom: 24 }}>
        {(plan.features ?? []).map((feat, fi) => (
          <div
            key={fi}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
              opacity: feat.included ? 1 : 0.4,
            }}
          >
            <span
              style={{
                color: feat.included ? accentColor : t.textSecondary,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {feat.included ? '✓' : '×'}
            </span>
            <span style={{ color: t.text, fontSize: 14 }}>{feat.text}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        style={{
          width: '100%',
          padding: '12px 20px',
          borderRadius: 8,
          border: 'none',
          background: accentColor,
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'default',
        }}
      >
        {plan.ctaText}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export const TronPricing = React.memo(function TronPricing() {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((node) => node.events.selected);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme } = useTheme();

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isAnnual, setIsAnnual] = React.useState(false);

  const props = useNode((node) => node.data.props as Partial<TronPricingProps>) ?? {};
  const {
    colorScheme = 'dark',
    accentColor: propAccent,
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    showBillingToggle = true,
    annualDiscount = 'Save 20%',
    title = 'Simple, transparent pricing',
    subtitle = 'Choose the plan that works best for you.',
    plans = DEFAULT_PLANS,
    animationType = 'none',
    animateDelay = '0',
  } = props;

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
  }, [colorScheme]);

  const accentColor = propAccent ?? theme?.accentColor ?? '#FF6B35';
  const scheme = colorScheme ?? theme?.colorScheme ?? 'dark';
  const tokensBuilt = buildTokens(darkBg, lightBg);
  const t = {
    ...tokensBuilt[scheme],
    accent: accentColor,
    bg: scheme === 'dark' ? (darkBg ?? '#0a0a0a') : (lightBg ?? '#ffffff'),
  };

  const gridLines = showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none';

  const animAttrs: Record<string, string> = {};
  if (!enabled && animationType !== 'none') {
    animAttrs['data-animate'] = animationType;
    if (animateDelay !== '0') animAttrs['data-animate-delay'] = animateDelay;
  }

  const rawPlans = (Array.isArray(plans) ? plans : DEFAULT_PLANS).map(normalizePricingPlan);
  // On mobile: popular first
  const displayPlans = isMobile
    ? [...rawPlans].sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
    : rawPlans;

  const titleWords = (title ?? '').split(' ');
  const firstWord = titleWords[0] ?? '';
  const restWords = titleWords.slice(1).join(' ');

  return (
    <section
      ref={(el) => {
        if (el) {
          connect(drag(el));
          (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      key={`${scheme}`}
      data-block-type="pricing"
      className={`w-full max-w-full py-20 px-4 sm:px-8 lg:px-16 flex flex-col justify-center ${isSelected ? 'craft-node-selected' : ''}`}
      style={{
        background: t.bg,
        backgroundImage: gridLines,
        backgroundSize: showGrid ? '50px 50px' : 'auto',
        minHeight: `${sectionHeight}vh`,
      }}
    >
      <div className="max-w-6xl mx-auto w-full" {...animAttrs}>
        <div className="text-center mb-12 md:mb-16">
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 700,
              color: t.text,
              margin: 0,
            }}
          >
            <span style={{ color: t.accent }}>{firstWord}</span>
            {restWords ? ` ${restWords}` : ''}
          </h2>
          <p
            style={{
              fontSize: 16,
              color: t.textSecondary,
              marginTop: 12,
              marginBottom: 0,
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        </div>

        {showBillingToggle && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 48,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: isAnnual ? 400 : 600,
                color: isAnnual ? t.textSecondary : t.text,
              }}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAnnual((prev) => !prev);
              }}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: isAnnual ? accentColor : t.border,
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: isAnnual ? 23 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </button>
            <span
              style={{
                fontSize: 14,
                fontWeight: isAnnual ? 600 : 400,
                color: isAnnual ? t.text : t.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Annually
              {annualDiscount && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: `rgba(${hexToRgb(accentColor)}, 0.12)`,
                    border: `1px solid rgba(${hexToRgb(accentColor)}, 0.3)`,
                    color: accentColor,
                    fontSize: 11,
                    fontWeight: 600,
                    opacity: isAnnual ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {annualDiscount}
                </span>
              )}
            </span>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : `repeat(${displayPlans.length}, 1fr)`,
            gap: isMobile ? 16 : 24,
            alignItems: 'start',
            width: '100%',
          }}
        >
          {displayPlans.map((plan, i) => (
            <PricingPlanCardDisplay
              key={`${i}-${isAnnual}`}
              plan={plan}
              t={t}
              accentColor={accentColor}
              enabled={enabled}
              isAnnual={isAnnual}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

// ── PricingCard (backward compatibility) ───────────────────────────────────
export interface PricingCardProps {
  name?: string;
  price?: string;
  period?: string;
  description?: string;
  features?: string[];
  highlighted?: boolean;
  ctaText?: string;
  accentColor?: string;
  colorScheme?: 'dark' | 'light';
}

export const PricingCard = React.memo(function PricingCard({
  name = 'Pro',
  price = '79',
  period = '/mo',
  description = '',
  features = [],
  highlighted = false,
  ctaText = 'Get started',
  accentColor = '#FF6B35',
  colorScheme = 'dark',
}: PricingCardProps) {
  const { connectors: { connect, drag } } = useNode();
  const isSelected = useNode((n) => n.events.selected);
  const scheme = (colorScheme ?? 'dark') as 'dark' | 'light';
  const tokensBuilt = buildTokens('#0a0a0a', '#ffffff');
  const t = tokensBuilt[scheme];

  const plan: PricingPlan = {
    name,
    price,
    period,
    subtitle: description,
    features: (features ?? []).map((f) => ({ text: f, included: true })),
    ctaText,
    isPopular: false,
    isHighlighted: highlighted ?? false,
  };

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={isSelected ? 'craft-node-selected' : ''}
      style={{ width: '100%' }}
    >
      <PricingPlanCardDisplay
        plan={plan}
        t={t}
        accentColor={accentColor ?? '#FF6B35'}
        enabled={false}
      />
    </div>
  );
});

function PricingCardSettings() {
  const { actions: { setProp } } = useNode();
  const { name = '', price = '', period = '/mo', description = '', features = [], highlighted = false, ctaText = '', accentColor = '#FF6B35', colorScheme = 'dark' } =
    useNode((n) => n.data.props as PricingCardProps) ?? {};
  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';

  const updateFeature = (i: number, v: string) =>
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.features as string[]) ?? [])];
      arr[i] = v;
      p.features = arr;
    }, 500);

  return (
    <div className="p-3 space-y-3 text-white">
      <div><label className={labelCls}>Name</label><input type="text" value={name} onChange={(e) => setProp((p: Record<string, unknown>) => { p.name = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Price</label><input type="text" value={price} onChange={(e) => setProp((p: Record<string, unknown>) => { p.price = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Period</label><input type="text" value={period} onChange={(e) => setProp((p: Record<string, unknown>) => { p.period = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>Description</label><input type="text" value={description} onChange={(e) => setProp((p: Record<string, unknown>) => { p.description = e.target.value; }, 500)} className={inputCls} /></div>
      <div><label className={labelCls}>CTA text</label><input type="text" value={ctaText} onChange={(e) => setProp((p: Record<string, unknown>) => { p.ctaText = e.target.value; }, 500)} className={inputCls} /></div>
      <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={highlighted} onChange={(e) => setProp((p: Record<string, unknown>) => { p.highlighted = e.target.checked; })} className="rounded border-gray-600 bg-gray-700" /> Highlighted</label>
      <div>
        <label className={labelCls}>Features</label>
        {(features ?? []).map((f, i) => (
          <div key={i} className="flex gap-2 mt-1">
            <input type="text" value={f} onChange={(e) => updateFeature(i, e.target.value)} className={inputCls} />
            <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.features = (p.features as string[]).filter((_, j) => j !== i); })} className="text-red-400">×</button>
          </div>
        ))}
        <button type="button" onClick={() => setProp((p: Record<string, unknown>) => { p.features = [...(p.features as string[] ?? []), 'New feature']; })} className="text-xs text-gray-400 mt-2">+ Add</button>
      </div>
    </div>
  );
}

(PricingCard as unknown as { craft: Record<string, unknown> }).craft = {
  displayName: 'Pricing Card',
  props: {
    name: 'Pro',
    price: '79',
    period: '/mo',
    description: '',
    features: ['Feature 1', 'Feature 2'],
    highlighted: false,
    ctaText: 'Get started',
    accentColor: '#FF6B35',
    colorScheme: 'dark',
  },
  related: { settings: PricingCardSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
};

// ── Settings ──────────────────────────────────────────────────────────────
function TronPricingSettings() {
  const { actions: { setProp } } = useNode();
  const props = useNode((node) => node.data.props as Partial<TronPricingProps>) ?? {};
  const {
    title = 'Simple, transparent pricing',
    subtitle = 'Choose the plan that works best for you.',
    plans = DEFAULT_PLANS,
    showBillingToggle = true,
    annualDiscount = 'Save 20%',
    darkBg = '#0a0a0a',
    lightBg = '#ffffff',
    sectionHeight = 80,
    showGrid = true,
    animationType = 'none',
    animateDelay = '0',
  } = props;

  const labelCls = 'block text-xs mb-1.5 text-gray-400 uppercase tracking-wide';
  const inputCls = 'w-full px-2 py-1.5 text-xs rounded bg-gray-700 border border-gray-600 text-white';
  const rawList = Array.isArray(plans) ? plans : DEFAULT_PLANS;
  const list = rawList.map(normalizePricingPlan);

  const updatePlan = (pi: number, field: keyof PricingPlan, value: unknown) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.plans as PricingPlan[]) ?? [])];
      if (arr[pi]) arr[pi] = { ...arr[pi], [field]: value };
      p.plans = arr;
    }, 500);
  };

  const updateFeature = (pi: number, fi: number, field: keyof PricingFeature, value: unknown) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.plans as PricingPlan[]) ?? [])];
      if (arr[pi]?.features) {
        const feats = [...arr[pi].features];
        if (feats[fi]) feats[fi] = { ...feats[fi], [field]: value };
        arr[pi] = { ...arr[pi], features: feats };
      }
      p.plans = arr;
    }, 500);
  };

  const addFeature = (pi: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.plans as PricingPlan[]) ?? [])];
      if (arr[pi]) {
        arr[pi] = {
          ...arr[pi],
          features: [...(arr[pi].features ?? []), { text: 'New feature', included: true }],
        };
      }
      p.plans = arr;
    }, 0);
  };

  const removeFeature = (pi: number, fi: number) => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.plans as PricingPlan[]) ?? [])];
      if (arr[pi]?.features) {
        arr[pi] = { ...arr[pi], features: arr[pi].features.filter((_, i) => i !== fi) };
      }
      p.plans = arr;
    }, 0);
  };

  const addPlan = () => {
    setProp((p: Record<string, unknown>) => {
      const arr = [...((p.plans as PricingPlan[]) ?? [])];
      arr.push({
        name: 'New Plan',
        price: '$0',
        period: '/mo',
        subtitle: '',
        isPopular: false,
        isHighlighted: false,
        ctaText: 'Get started',
        features: [{ text: 'Feature', included: true }],
      });
      p.plans = arr;
    }, 0);
  };

  const removePlan = (pi: number) => {
    setProp((p: Record<string, unknown>) => {
      p.plans = ((p.plans as PricingPlan[]) ?? []).filter((_, i) => i !== pi);
    }, 0);
  };

  return (
    <div className="p-3 space-y-0 text-white">
      {/* CONTENT */}
      <div className="border-t border-gray-700 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Content</h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.title = e.target.value; }, 500)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.subtitle = e.target.value; }, 500)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* PLANS */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Plans</h3>
        <div className="space-y-4">
          {list.map((plan, pi) => (
            <div key={pi} className="p-3 rounded bg-gray-800/50 space-y-3">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={plan.name}
                  onChange={(e) => updatePlan(pi, 'name', e.target.value)}
                  className={inputCls}
                  placeholder="Plan name"
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  value={plan.price}
                  onChange={(e) => updatePlan(pi, 'price', e.target.value)}
                  className={inputCls}
                  placeholder="Price"
                  style={{ width: 70 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <label className={labelCls}>Annual price (per month)</label>
                  <input
                    type="text"
                    value={plan.priceAnnual ?? ''}
                    onChange={(e) =>
                      setProp((p: Record<string, unknown>) => {
                        const plans = [...((p.plans as PricingPlan[]) ?? [])];
                        if (plans[pi]) plans[pi] = { ...plans[pi], priceAnnual: e.target.value };
                        p.plans = plans;
                      }, 300)
                    }
                    className={inputCls}
                    placeholder="e.g. $23"
                    style={{ width: 90 }}
                  />
                </div>
                <input
                  type="text"
                  value={plan.period}
                  onChange={(e) => updatePlan(pi, 'period', e.target.value)}
                  className={inputCls}
                  placeholder="/mo"
                  style={{ width: 60 }}
                />
                <button
                  type="button"
                  onClick={() => removePlan(pi)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                  title="Remove plan"
                >
                  ×
                </button>
              </div>
              <div>
                <label className={labelCls}>Subtitle</label>
                <input
                  type="text"
                  value={plan.subtitle}
                  onChange={(e) => updatePlan(pi, 'subtitle', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>CTA text</label>
                <input
                  type="text"
                  value={plan.ctaText}
                  onChange={(e) => updatePlan(pi, 'ctaText', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={plan.isPopular ?? false}
                    onChange={(e) => updatePlan(pi, 'isPopular', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  Most popular
                </label>
                {plan.isPopular && (
                  <input
                    type="text"
                    value={plan.popularText ?? 'Most popular'}
                    onChange={(e) =>
                      setProp((p: Record<string, unknown>) => {
                        const plans = [...((p.plans as PricingPlan[]) ?? [])];
                        if (plans[pi]) plans[pi] = { ...plans[pi], popularText: e.target.value };
                        p.plans = plans;
                      }, 300)
                    }
                    className={inputCls}
                    placeholder="Most popular"
                  />
                )}
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={plan.isHighlighted ?? false}
                    onChange={(e) => updatePlan(pi, 'isHighlighted', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  Highlighted
                </label>
              </div>
              <div>
                <label className={labelCls}>Features</label>
                <div className="space-y-2 mt-2">
                  {(plan.features ?? []).map((feat, fi) => (
                    <div key={fi} className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={feat.included}
                        onChange={(e) => updateFeature(pi, fi, 'included', e.target.checked)}
                        className="rounded border-gray-600 bg-gray-700"
                      />
                      <input
                        type="text"
                        value={feat.text}
                        onChange={(e) => updateFeature(pi, fi, 'text', e.target.value)}
                        className={inputCls}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(pi, fi)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addFeature(pi)}
                    className="px-2 py-1 text-xs rounded bg-gray-600 text-gray-300 hover:bg-gray-500"
                  >
                    + Add feature
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPlan}
            className="px-2 py-1.5 text-xs rounded bg-[#FF6B35] text-white hover:bg-[#ff8555]"
          >
            + Add plan
          </button>
        </div>
      </div>

      {/* BILLING */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Billing</h3>
        <div className="space-y-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#d4d4d8' }}>Show Monthly/Annually</span>
            <input
              type="checkbox"
              checked={showBillingToggle ?? true}
              onChange={(e) =>
                setProp((p: Record<string, unknown>) => {
                  p.showBillingToggle = e.target.checked;
                })
              }
              className="rounded border-gray-600 bg-gray-700"
            />
          </div>
          <div>
            <label className={labelCls}>Discount label</label>
            <input
              type="text"
              value={annualDiscount ?? 'Save 20%'}
              onChange={(e) =>
                setProp((p: Record<string, unknown>) => {
                  p.annualDiscount = e.target.value;
                }, 300)
              }
              className={inputCls}
              placeholder="Save 20%"
            />
          </div>
        </div>
      </div>

      {/* COLORS */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Colors</h3>
        <div>
          <label className={labelCls}>Background (dark mode)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={darkBg ?? '#0a0a0a'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.darkBg = e.target.value; }, 300)}
              style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{darkBg ?? '#0a0a0a'}</span>
          </div>
          <label className={labelCls} style={{ marginTop: 12 }}>
            Background (light mode)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={lightBg ?? '#ffffff'}
              onChange={(e) => setProp((p: Record<string, unknown>) => { p.lightBg = e.target.value; }, 300)}
              style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{lightBg ?? '#ffffff'}</span>
          </div>
        </div>
      </div>

      {/* SIZE */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Size</h3>
        <div>
          <label className={labelCls}>Section height: {sectionHeight}vh</label>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={sectionHeight}
            onChange={(e) => setProp((p: Record<string, unknown>) => { p.sectionHeight = Number(e.target.value); }, 500)}
            className="w-full"
          />
        </div>
      </div>

      {/* DISPLAY */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Display</h3>
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

      {/* ANIMATION */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Animation</h3>
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
                <option key={v} value={v}>
                  {v}s
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft config ──────────────────────────────────────────────────────────
const tronPricingCraft = {
  displayName: 'Tron Pricing',
  props: {
    colorScheme: 'dark',
    accentColor: '#FF6B35',
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 80,
    showGrid: true,
    showBillingToggle: true,
    annualDiscount: 'Save 20%',
    title: 'Simple, transparent pricing',
    subtitle: 'Choose the plan that works best for you.',
    plans: DEFAULT_PLANS,
    animationType: 'none',
    animateDelay: '0',
  },
  related: { settings: TronPricingSettings },
  rules: { canDrag: () => true, canMoveIn: () => false },
  custom: {
    styleTags: ['dark', 'minimal'],
    businessTags: ['saas', 'startup'],
    featureTags: ['pricing'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
};
(TronPricing as unknown as { craft: typeof tronPricingCraft }).craft = tronPricingCraft;
