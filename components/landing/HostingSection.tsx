'use client';

import { motion } from 'framer-motion';

/* ── Detailed SVG icons for infrastructure features ── */
function HostingIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="32" height="10" rx="3" stroke="#FF6B35" strokeWidth="2" fill="#FF6B35" fillOpacity="0.08"/>
      <circle cx="14" cy="13" r="2" fill="#FF6B35" opacity="0.6"/>
      <circle cx="20" cy="13" r="2" fill="#FF6B35" opacity="0.4"/>
      <rect x="30" y="11" width="6" height="4" rx="1" fill="#FF6B35" opacity="0.2"/>
      <rect x="8" y="22" width="32" height="10" rx="3" stroke="#FF6B35" strokeWidth="2" fill="#FF6B35" fillOpacity="0.05"/>
      <circle cx="14" cy="27" r="2" fill="#FF6B35" opacity="0.4"/>
      <circle cx="20" cy="27" r="2" fill="#FF6B35" opacity="0.3"/>
      <rect x="30" y="25" width="6" height="4" rx="1" fill="#FF6B35" opacity="0.15"/>
      <rect x="8" y="36" width="32" height="5" rx="2.5" stroke="#FF6B35" strokeWidth="1.5" fill="#FF6B35" fillOpacity="0.03" strokeDasharray="3 2"/>
      <path d="M24 18v4M24 32v4" stroke="#FF6B35" strokeWidth="1.5" opacity="0.3"/>
    </svg>
  );
}

function DeployIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="16" stroke="#FFB08A" strokeWidth="2" fill="#FFB08A" fillOpacity="0.06"/>
      <path d="M24 14v14" stroke="#FFB08A" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M18 22l6-8 6 8" stroke="#FFB08A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 34h16" stroke="#FFB08A" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="24" r="3" fill="#FFB08A" opacity="0.2"/>
    </svg>
  );
}

function SSLIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="20" width="24" height="18" rx="4" stroke="#7bc6ff" strokeWidth="2" fill="#7bc6ff" fillOpacity="0.06"/>
      <path d="M16 20v-4a8 8 0 0116 0v4" stroke="#7bc6ff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="24" cy="30" r="3" fill="#7bc6ff" opacity="0.5"/>
      <path d="M24 33v3" stroke="#7bc6ff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function BackupIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 28a12 12 0 0124 0" stroke="#a8e6a3" strokeWidth="2" fill="none"/>
      <path d="M12 28c-2 0-4-2-4-5s2-6 6-6c1-5 5-9 10-9s9 4 10 9c4 0 6 3 6 6s-2 5-4 5" stroke="#a8e6a3" strokeWidth="2" fill="#a8e6a3" fillOpacity="0.06" strokeLinecap="round"/>
      <path d="M24 26v10" stroke="#a8e6a3" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 30l4-4 4 4" stroke="#a8e6a3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 38h12" stroke="#a8e6a3" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

const features = [
  {
    Icon: HostingIcon,
    title: 'Hosting included',
    desc: 'Your site lives on our infrastructure. No DigitalOcean, no AWS, no config hell.',
    color: '#FF6B35',
  },
  {
    Icon: DeployIcon,
    title: 'Instant deployment',
    desc: 'One click from builder to live URL. No pipelines, no DevOps, no waiting.',
    color: '#FFB08A',
  },
  {
    Icon: SSLIcon,
    title: 'Free SSL',
    desc: 'HTTPS out of the box. Every site, every domain, every plan. Always secure.',
    color: '#7bc6ff',
  },
  {
    Icon: BackupIcon,
    title: 'Regular backups',
    desc: 'Your work is safe. Automatic backups keep your data protected at all times.',
    color: '#a8e6a3',
  },
];

const tiers = [
  { name: 'Starter', price: '$20', popular: false },
  { name: 'Business', price: '$29', popular: true },
  { name: 'Pro', price: '$59', popular: false },
  { name: 'Enterprise', price: '$99', popular: false },
];

export function HostingSection() {
  return (
    <section id="hosting" className="relative bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-4 py-2 text-xs uppercase tracking-[0.22em] text-foreground/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Infrastructure included
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
            Everything you need to{' '}
            <span className="text-[#FF6B35]">go live</span>
          </h2>
          <p className="mt-5 text-foreground/55 sm:text-lg leading-relaxed">
            Hosting, deployment, SSL, and backups — all built into the platform. You build, we run.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {features.map(({ Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.07 }}
              className="rounded-3xl border border-foreground/8 bg-foreground/[0.015] p-6 transition-all duration-300 hover:border-foreground/15"
            >
              <div className="mb-5">
                <Icon />
              </div>
              <div className="font-black text-foreground mb-2">{title}</div>
              <p className="text-sm leading-relaxed text-foreground/50">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Pricing banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="rounded-3xl border border-[#FF6B35]/20 bg-gradient-to-br from-[#FF6B35]/[0.05] to-transparent p-7 sm:p-10"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                Starting from{' '}
                <span className="text-[#FF6B35]">$20/month</span>
              </div>
              <div className="mt-2 text-foreground/55">
                with the{' '}
                <span className="font-black text-[#FF6B35]">first month free</span>{' '}
                — hosting, deployment, free SSL and regular backups included
              </div>
            </div>

            {/* Tier pills */}
            <div className="flex flex-wrap gap-2.5">
              {tiers.map(({ name, price, popular }) => (
                <div
                  key={name}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    popular
                      ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/25 text-[#FF6B35]'
                      : 'bg-foreground/[0.04] border border-foreground/8 text-foreground/50'
                  }`}
                >
                  <span className="text-xs text-foreground/35 block">{name}</span>
                  <span className={popular ? 'text-[#FF6B35]' : ''}>{price}</span>/mo
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
