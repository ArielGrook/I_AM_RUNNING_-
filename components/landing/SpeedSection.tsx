'use client';

import { motion } from 'framer-motion';

/* ── SVG Icons for pillars ── */
function SpeedIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="#FF6B35" strokeWidth="2" opacity="0.2"/>
      <path d="M26 10L16 28h10l-2 12 12-20H26l2-10z" fill="#FF6B35" opacity="0.8"/>
    </svg>
  );
}

function QualityIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="#FF6B35" strokeWidth="2" opacity="0.2"/>
      <path d="M24 12l3.5 7 7.5 1.1-5.4 5.3 1.3 7.6L24 29.5l-6.9 3.5 1.3-7.6-5.4-5.3 7.5-1.1z" fill="#FF6B35" opacity="0.8"/>
    </svg>
  );
}

function PriceIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="#FF6B35" strokeWidth="2" opacity="0.2"/>
      <path d="M24 12v24M18 18c0-3.3 2.7-4 6-4s6 .7 6 4-2 4-6 4-6 .7-6 4 2.7 4 6 4 6-.7 6-4" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
    </svg>
  );
}

const pillars = [
  {
    Icon: SpeedIcon,
    title: 'Speed',
    value: '15 min',
    text: 'From phone to a live website. Start building and launch your first version faster than making a cup of coffee.',
  },
  {
    Icon: QualityIcon,
    title: 'Quality',
    value: 'Premium',
    text: 'Curated flows, polished components and a launch process that looks professional from day one.',
  },
  {
    Icon: PriceIcon,
    title: 'Price',
    value: 'From $20/mo',
    text: 'Strong value versus typical agency pricing. No hidden fees, no surprises.',
  },
];

const journey = [
  { step: 'Register', icon: '01' },
  { step: 'Choose a path', icon: '02' },
  { step: 'Build first version', icon: '03' },
  { step: 'Deploy to platform', icon: '04' },
  { step: 'Enter your live site', icon: '05' },
];

export function SpeedSection() {
  return (
    <section id="speed" className="relative bg-foreground/[0.02] py-20 sm:py-28">
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
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Speed + Quality + Price
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
            Fast launch.{' '}
            <span className="text-[#FF6B35]">Premium result.</span>
            <br />
            Fair price.
          </h2>
          <p className="mt-5 text-foreground/55 sm:text-lg leading-relaxed">
            We guide you from registration to the first login inside your fresh live website — without chaos.
          </p>
        </motion.div>

        {/* Three pillars */}
        <div className="grid gap-5 md:grid-cols-3 mb-12">
          {pillars.map(({ Icon, title, value, text }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: index * 0.08 }}
              className="rounded-3xl border border-foreground/8 bg-background p-7 transition-all duration-300 hover:border-foreground/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]"
            >
              <div className="mb-4">
                <Icon />
              </div>
              <div className="text-xs uppercase tracking-[0.25em] text-foreground/35 font-medium">
                {title}
              </div>
              <div className="mt-2 text-3xl font-black text-[#FF6B35]">{value}</div>
              <p className="mt-3 text-foreground/55 leading-relaxed text-sm">{text}</p>
            </motion.div>
          ))}
        </div>

        {/* Journey timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="rounded-3xl border border-foreground/10 bg-background p-7 sm:p-10"
        >
          <h3 className="mb-8 text-xl font-black text-foreground sm:text-2xl text-center">
            From signup to your first login
          </h3>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-6 left-0 right-0 h-px bg-foreground/8 hidden sm:block" />
            <div className="absolute top-6 left-0 right-0 h-px hidden sm:block overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF6B35]/30"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between gap-6 sm:gap-0">
              {journey.map(({ step, icon }, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + index * 0.12 }}
                  className="flex sm:flex-col items-center gap-3 sm:gap-2 sm:text-center sm:flex-1"
                >
                  <div className={`
                    flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black transition-colors
                    ${index === journey.length - 1
                      ? 'bg-[#FF6B35] text-white shadow-[0_4px_20px_rgba(255,107,53,0.3)]'
                      : 'bg-foreground/5 text-foreground/50 border border-foreground/10'
                    }
                  `}>
                    {icon}
                  </div>
                  <span className="text-sm font-semibold text-foreground/70">{step}</span>
                  {/* Arrow between steps on mobile */}
                  {index < journey.length - 1 && (
                    <svg className="hidden max-sm:block h-3 w-3 text-[#FF6B35]/40 rotate-90 sm:rotate-0 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
