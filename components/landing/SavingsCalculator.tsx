'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const PRODUCTS = [
  { id: 'landing', label: 'Landing Page', market: 1800, iam: 20, desc: 'A sharp one-pager for product or service.' },
  { id: 'business', label: 'Business Website', market: 4500, iam: 29, desc: 'Multi-page site with services and contact.' },
  { id: 'store', label: 'Online Store', market: 7500, iam: 59, desc: 'Product catalog, checkout and orders.' },
];

/* Animated donut SVG */
function DonutChart({ percent }: { percent: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="160" height="160" viewBox="0 0 128 128" className="mx-auto">
      {/* Background ring */}
      <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.06" strokeWidth="12" />
      {/* Savings ring */}
      <motion.circle
        cx="64" cy="64" r={radius}
        fill="none" stroke="#22C55E" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        transform="rotate(-90 64 64)"
      />
      {/* IAM cost ring (small remaining part) */}
      <motion.circle
        cx="64" cy="64" r={radius}
        fill="none" stroke="#FF6B35" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - ((100 - percent) / 100) * circumference }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        transform={`rotate(${(percent / 100) * 360 - 90} 64 64)`}
      />
    </svg>
  );
}

export function SavingsCalculator() {
  const [selected, setSelected] = useState(PRODUCTS[0]);

  const yearCost = selected.iam * 12;
  const saved = selected.market - yearCost;
  const savedPct = Math.round((saved / selected.market) * 100);

  return (
    <section id="savings" className="relative bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
            See how much you{' '}
            <span className="text-[#FF6B35]">save</span>
          </h2>
          <p className="mt-4 text-foreground/55 sm:text-lg">
            Compare typical market cost vs running on I AM RUNNING for a year.
          </p>
        </motion.div>

        {/* Product selector */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {PRODUCTS.map((p) => {
            const isActive = selected.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`rounded-2xl border-2 px-5 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35] shadow-[0_0_20px_rgba(255,107,53,0.12)]'
                    : 'border-foreground/8 bg-foreground/[0.02] text-foreground/50 hover:border-foreground/15'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Calculator card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-7 sm:p-10"
          >
            <div className="text-center text-foreground/40 text-sm mb-6">{selected.desc}</div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Donut */}
              <div className="shrink-0">
                <DonutChart percent={savedPct} />
                <div className="text-center mt-2">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Savings</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FF6B35]" /> I AM RUNNING</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 w-full space-y-5">
                <div className="flex items-baseline justify-between border-b border-foreground/5 pb-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.15em] text-foreground/30">Market price</div>
                    <div className="text-foreground/40 text-sm mt-0.5">Agency one-time fee</div>
                  </div>
                  <div className="text-2xl font-black text-foreground/60">${selected.market.toLocaleString()}</div>
                </div>

                <div className="flex items-baseline justify-between border-b border-foreground/5 pb-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.15em] text-[#FF6B35]/60">I AM RUNNING / year</div>
                    <div className="text-foreground/35 text-sm mt-0.5">${selected.iam}/mo · hosting included</div>
                  </div>
                  <div className="text-2xl font-black text-[#FF6B35]">${yearCost.toLocaleString()}</div>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.15em] text-emerald-500/60">You save</div>
                    <div className="text-emerald-600/40 dark:text-emerald-400/40 text-sm mt-0.5">{savedPct}% less than market</div>
                  </div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${saved.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
