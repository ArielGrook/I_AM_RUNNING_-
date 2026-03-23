'use client';

import { motion } from 'framer-motion';

const pillars = [
  {
    title: 'Speed',
    value: '15 min',
    text: 'Start from your phone and get to a live first version fast.',
  },
  {
    title: 'Quality',
    value: 'Curated',
    text: 'Structured flows, polished components and a cleaner launch process.',
  },
  {
    title: 'Price',
    value: 'Market-friendly',
    text: 'Strong value compared to typical digital product and agency pricing.',
  },
];

const journey = [
  'Register',
  'Choose a path',
  'Build your first version',
  'Launch on our platform',
  'Enter your fresh website',
];

export function SpeedSection() {
  return (
    <section id="speed" className="bg-white py-16 text-black dark:bg-black dark:text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-xs uppercase tracking-[0.22em] text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
            Speed + quality + price
          </div>
          <h2 className="text-3xl font-black sm:text-5xl">
            Fast. High-quality. Fairly priced.
          </h2>
          <p className="mt-4 text-black/65 dark:text-white/70 sm:text-lg">
            We guide clients from the moment of registration to the first login inside a fresh live
            website.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-[28px] border border-black/10 bg-[#faf7f4] p-6 dark:border-white/10 dark:bg-[#111]"
            >
              <div className="text-sm uppercase tracking-[0.22em] text-black/45 dark:text-white/45">
                {pillar.title}
              </div>
              <div className="mt-3 text-3xl font-black text-[#FF6B35]">{pillar.value}</div>
              <p className="mt-4 text-black/65 dark:text-white/70">{pillar.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 rounded-[30px] border border-black/10 bg-gradient-to-br from-[#111] to-[#1b1b1b] p-6 text-white dark:border-white/10"
        >
          <div className="mb-6 text-xl font-black sm:text-2xl">
            From signup to first login — without chaos
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {journey.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm sm:text-base">
                  <span className="mr-2 text-[#FFB08A]">{index + 1}.</span>
                  {step}
                </div>
                {index < journey.length - 1 && (
                  <div className="text-[#FF6B35]">→</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}