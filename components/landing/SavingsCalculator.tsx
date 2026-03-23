'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from 'next-intl';

const PRODUCTS = [
  {
    id: 'landing',
    label: 'Landing Page',
    emoji: '🚀',
    market: 1800,
    iam: 20,
    desc: 'A sharp one-pager for a product, service, or personal brand.',
  },
  {
    id: 'business',
    label: 'Business Website',
    emoji: '🏢',
    market: 4500,
    iam: 29,
    desc: 'Multi-page website with about, services, contact and more.',
  },
  {
    id: 'store',
    label: 'Online Store',
    emoji: '🛍️',
    market: 7500,
    iam: 59,
    desc: 'Product catalog, checkout flow and order management.',
  },
];

export function SavingsCalculator() {
  const locale = useLocale();
  const [selected, setSelected] = useState(PRODUCTS[0]);

  const saved = selected.market - selected.iam * 12;
  const savedPct = Math.round((saved / selected.market) * 100);

  return (
    <section id="savings" className="bg-[#080808] py-16 text-white sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/65">
            Savings calculator
          </div>
          <h2 className="text-3xl font-black sm:text-5xl">
            See how much you save
          </h2>
          <p className="mt-4 text-white/60 sm:text-lg">
            Compare typical market cost vs running on I AM RUNNING for a year.
          </p>
        </motion.div>

        {/* Product selector */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 flex flex-wrap justify-center gap-3"
        >
          {PRODUCTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={[
                'rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                selected.id === p.id
                  ? 'border-[#FF6B35] bg-[#FF6B35] text-white shadow-[0_0_24px_rgba(255,107,53,0.3)]'
                  : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white',
              ].join(' ')}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </motion.div>

        {/* Calculator card */}
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-[32px] border border-white/10 bg-[#0d0d0d] p-6 sm:p-10"
        >
          <div className="mb-6 text-center text-white/50 text-sm">{selected.desc}</div>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Market cost */}
            <div className="rounded-[20px] border border-white/10 bg-[#111] p-5 text-center">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-white/40">
                Typical market cost
              </div>
              <div className="mt-3 text-3xl font-black text-white/80">
                ${selected.market.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-white/35">one-time agency fee</div>
            </div>

            {/* IAM cost */}
            <div className="rounded-[20px] border border-[#FF6B35]/30 bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.12),transparent_70%)] p-5 text-center">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-[#FFB08A]/70">
                I AM RUNNING / year
              </div>
              <div className="mt-3 text-3xl font-black text-[#FF6B35]">
                ${(selected.iam * 12).toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-white/35">
                ${selected.iam}/mo · hosting included
              </div>
            </div>

            {/* Savings */}
            <div className="rounded-[20px] border border-emerald-500/25 bg-emerald-950/20 p-5 text-center">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-emerald-400/60">
                You save
              </div>
              <div className="mt-3 text-3xl font-black text-emerald-400">
                ${saved.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-emerald-500/50">
                {savedPct}% less than market
              </div>
            </div>
          </div>

          {/* Visual bar */}
          <div className="mt-8">
            <div className="mb-2 flex justify-between text-xs text-white/40">
              <span>Market price</span>
              <span>I AM RUNNING (1 year)</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                key={selected.id + '-bar'}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(((selected.iam * 12) / selected.market) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFB08A]"
              />
            </div>
            <div className="mt-2 text-right text-xs text-white/40">
              {Math.round(((selected.iam * 12) / selected.market) * 100)}% of market cost
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              asChild
              className="rounded-full bg-[#FF6B35] px-8 py-5 font-black text-white hover:bg-[#ff7a4b]"
            >
              <Link href={`/${locale}/interactive`}>
                Start saving now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
