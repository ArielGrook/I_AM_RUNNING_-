'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const pillars = [
  { title: 'Speed', value: '15 min', text: 'From phone to a live website. Launch your first version faster than making a cup of coffee.', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  { title: 'Quality', value: 'Premium', text: 'Curated flows, polished components and a launch process that looks professional from day one.', color: '#EAB308', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)' },
  { title: 'Price', value: 'From $20/mo', text: 'Strong value versus typical agency pricing. No hidden fees, no surprises, no overpaying.', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
];

const journey = [
  { step: 'Register', icon: '01' },
  { step: 'Choose a path', icon: '02' },
  { step: 'Build first version', icon: '03' },
  { step: 'Deploy to platform', icon: '04' },
  { step: 'Enter your live site', icon: '05' },
];

export function SpeedSection() {
  /* ── Looping step highlight: 3s per step ── */
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % journey.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="speed" className="relative bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
            Fast launch.{' '}
            <span className="text-[#FF6B35]">Premium result.</span>{' '}
            Fair price.
          </h2>
          <p className="mt-5 text-foreground/55 sm:text-lg leading-relaxed">
            We guide you from registration to the first login inside your fresh live website.
          </p>
        </motion.div>

        {/* Three pillars — colored */}
        <div className="grid gap-5 md:grid-cols-3 mb-14">
          {pillars.map(({ title, value, text, color, bg, border }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: index * 0.1 }}
              className="rounded-3xl p-7 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${color}20` }}>
                {index === 0 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                )}
                {index === 1 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                )}
                {index === 2 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                )}
              </div>
              <div className="text-xs uppercase tracking-[0.25em] font-medium" style={{ color }}>{title}</div>
              <div className="mt-2 text-3xl font-black" style={{ color }}>{value}</div>
              <p className="mt-3 text-foreground/55 leading-relaxed text-sm">{text}</p>
            </motion.div>
          ))}
        </div>

        {/* Journey timeline with looping animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-7 sm:p-10"
        >
          <h3 className="mb-8 text-xl font-black text-foreground sm:text-2xl text-center">
            From signup to your first login
          </h3>

          <div className="flex flex-col sm:flex-row sm:justify-between gap-5 sm:gap-0 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden sm:block absolute top-6 left-[10%] right-[10%] h-px bg-foreground/8" />

            {journey.map(({ step, icon }, index) => {
              const isActive = index === activeStep;
              return (
                <div key={step} className="flex sm:flex-col items-center gap-3 sm:gap-2 sm:text-center sm:flex-1">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      backgroundColor: isActive ? '#FF6B35' : 'transparent',
                      color: isActive ? '#ffffff' : 'inherit',
                      borderColor: isActive ? '#FF6B35' : 'rgba(128,128,128,0.15)',
                    }}
                    transition={{ duration: 0.4 }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black border-2 text-foreground/40"
                    style={{ boxShadow: isActive ? '0 4px 20px rgba(255,107,53,0.35)' : 'none' }}
                  >
                    {icon}
                  </motion.div>
                  <motion.span
                    animate={{ color: isActive ? '#FF6B35' : undefined, opacity: isActive ? 1 : 0.5 }}
                    transition={{ duration: 0.4 }}
                    className="text-sm font-semibold text-foreground"
                  >
                    {step}
                  </motion.span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
