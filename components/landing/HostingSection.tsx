'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const infra = [
  { title: 'Hosting', desc: 'Your site lives on our infrastructure — no AWS, no config.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
  )},
  { title: 'Deployment', desc: 'One click from builder to live URL — instant.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  )},
  { title: 'Free SSL', desc: 'HTTPS on every site, every domain, every plan.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
  )},
  { title: 'Backups', desc: 'Automatic backups keep your data safe at all times.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  )},
];

const tiers = [
  { id: 'starter', name: 'Starter', price: '$20', desc: 'Perfect for personal projects and landing pages. Everything you need to get started.' },
  { id: 'business', name: 'Business', price: '$29', desc: 'For small businesses that need more features, multi-page sites and priority support.' },
  { id: 'pro', name: 'Pro', price: '$59', desc: 'For growing companies and agencies. Advanced features, more projects, premium support.' },
  { id: 'enterprise', name: 'Enterprise', price: '$99', desc: 'For serious businesses. Custom solutions, dedicated support, maximum performance.' },
];

export function HostingSection() {
  const [selectedTier, setSelectedTier] = useState(tiers[0]);

  return (
    <section id="hosting" className="relative bg-foreground/[0.02] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
            Everything you need to{' '}
            <span className="text-[#FF6B35]">go live</span>
          </h2>
          <p className="mt-5 text-foreground/55 sm:text-lg">
            Hosting, deployment, SSL, and backups — built into every plan. First month free.
          </p>
        </motion.div>

        {/* Infrastructure icons — horizontal row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {infra.map(({ title, desc, icon }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3 rounded-2xl border border-foreground/8 bg-background p-5 transition-all hover:border-[#FF6B35]/20 hover:shadow-[0_8px_30px_rgba(255,107,53,0.06)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B35]/8">{icon}</div>
              <div className="font-black text-foreground text-sm">{title}</div>
              <p className="text-xs text-foreground/45 leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Pricing interactive block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-[#FF6B35]/15 bg-gradient-to-br from-[#FF6B35]/[0.04] to-transparent p-7 sm:p-10"
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: description that changes */}
            <div className="lg:w-1/2">
              <div className="text-sm uppercase tracking-[0.2em] text-[#FF6B35]/60 font-medium mb-3">
                Starting from <span className="text-[#FF6B35] font-black">$20/month</span> · first month free
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTier.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-3xl sm:text-4xl font-black text-foreground mb-2">
                    {selectedTier.name}{' '}
                    <span className="text-[#FF6B35]">{selectedTier.price}</span>
                    <span className="text-foreground/40 text-lg font-medium">/mo</span>
                  </div>
                  <p className="text-foreground/55 text-base leading-relaxed max-w-md">{selectedTier.desc}</p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-foreground/35">
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Hosting included
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Free SSL
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Auto backups
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Instant deploy
                </span>
              </div>
            </div>

            {/* Right: tier buttons */}
            <div className="lg:w-1/2 grid grid-cols-2 gap-3">
              {tiers.map((tier) => {
                const isActive = selectedTier.id === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`rounded-2xl p-5 text-left transition-all duration-250 border-2 ${
                      isActive
                        ? 'border-[#FF6B35] bg-[#FF6B35]/10 shadow-[0_4px_20px_rgba(255,107,53,0.15)]'
                        : 'border-foreground/8 bg-background hover:border-foreground/15'
                    }`}
                  >
                    <div className={`text-xs uppercase tracking-[0.15em] font-medium ${isActive ? 'text-[#FF6B35]' : 'text-foreground/35'}`}>{tier.name}</div>
                    <div className={`text-2xl font-black mt-1 ${isActive ? 'text-[#FF6B35]' : 'text-foreground'}`}>{tier.price}</div>
                    <div className="text-[10px] text-foreground/30 mt-0.5">per month</div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
