'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLocale } from 'next-intl';

/* ── SVG icons for product types ── */
function LandingIcon({ active }: { active: boolean }) {
  const color = active ? '#FF6B35' : 'currentColor';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function BusinessIcon({ active }: { active: boolean }) {
  const color = active ? '#FF6B35' : 'currentColor';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function StoreIcon({ active }: { active: boolean }) {
  const color = active ? '#FF6B35' : 'currentColor';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 7v13a2 2 0 002 2h14a2 2 0 002-2V7l-3-5z" />
      <line x1="3" y1="7" x2="21" y2="7" />
      <path d="M16 11a4 4 0 01-8 0" />
    </svg>
  );
}

function ArrowRightSVG() {
  return (
    <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

const PRODUCTS = [
  {
    id: 'landing',
    label: 'Landing Page',
    Icon: LandingIcon,
    market: 1800,
    iam: 20,
    desc: 'A sharp one-pager for a product, service, or personal brand.',
  },
  {
    id: 'business',
    label: 'Business Website',
    Icon: BusinessIcon,
    market: 4500,
    iam: 29,
    desc: 'Multi-page website with about, services, contact and more.',
  },
  {
    id: 'store',
    label: 'Online Store',
    Icon: StoreIcon,
    market: 7500,
    iam: 59,
    desc: 'Product catalog, checkout flow and order management.',
  },
];

export function SavingsCalculator() {
  const locale = useLocale();
  const [selected, setSelected] = useState(PRODUCTS[0]);

  const yearCost = selected.iam * 12;
  const saved = selected.market - yearCost;
  const savedPct = Math.round((saved / selected.market) * 100);
  const barWidth = Math.round((yearCost / selected.market) * 100);

  return (
    <section id="savings" className="relative bg-foreground/[0.02] py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-4 py-2 text-xs uppercase tracking-[0.22em] text-foreground/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Savings calculator
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
            See how much you{' '}
            <span className="text-[#FF6B35]">save</span>
          </h2>
          <p className="mt-5 text-foreground/55 sm:text-lg">
            Compare typical market cost vs running on I AM RUNNING for a year.
          </p>
        </motion.div>

        {/* Product selector */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex flex-wrap justify-center gap-3"
        >
          {PRODUCTS.map((p) => {
            const isActive = selected.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-250 ${
                  isActive
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35] shadow-[0_0_20px_rgba(255,107,53,0.15)]'
                    : 'border-foreground/10 bg-foreground/[0.03] text-foreground/55 hover:border-foreground/20 hover:text-foreground/70'
                }`}
              >
                <p.Icon active={isActive} />
                {p.label}
              </button>
            );
          })}
        </motion.div>

        {/* Calculator card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border border-foreground/10 bg-background p-7 sm:p-10"
          >
            <div className="mb-6 text-center text-foreground/45 text-sm">{selected.desc}</div>

            <div className="grid gap-5 sm:grid-cols-3">
              {/* Market cost */}
              <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5 text-center">
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-foreground/35">
                  Typical market cost
                </div>
                <div className="mt-3 text-3xl font-black text-foreground/70">
                  ${selected.market.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-foreground/30">one-time agency fee</div>
              </div>

              {/* IAM cost */}
              <div className="rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/[0.04] p-5 text-center">
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-[#FF6B35]/60">
                  I AM RUNNING / year
                </div>
                <div className="mt-3 text-3xl font-black text-[#FF6B35]">
                  ${yearCost.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-foreground/30">
                  ${selected.iam}/mo · hosting included
                </div>
              </div>

              {/* Savings */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 text-center">
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-emerald-600/50 dark:text-emerald-400/50">
                  You save
                </div>
                <div className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  ${saved.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-emerald-600/40 dark:text-emerald-400/40">
                  {savedPct}% less than market
                </div>
              </div>
            </div>

            {/* Visual bar comparison */}
            <div className="mt-8">
              <div className="mb-2 flex justify-between text-xs text-foreground/35">
                <span>Market price</span>
                <span>I AM RUNNING (1 year)</span>
              </div>
              <div className="h-3.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                <motion.div
                  key={selected.id + '-bar'}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFB08A]"
                />
              </div>
              <div className="mt-2 text-right text-xs text-foreground/35">
                {barWidth}% of market cost
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button
                asChild
                className="rounded-full bg-[#FF6B35] px-8 py-6 font-black text-white hover:bg-[#ff7a4b] shadow-[0_4px_24px_rgba(255,107,53,0.2)] transition-all hover:shadow-[0_8px_32px_rgba(255,107,53,0.3)] hover:scale-[1.02]"
              >
                <Link href={`/${locale}/interactive`}>
                  Start saving now
                  <ArrowRightSVG />
                </Link>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
