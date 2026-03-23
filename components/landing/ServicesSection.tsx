'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: 'Deployment',
    desc: 'Launch directly on our platform without stitching infrastructure together yourself.',
  },
  {
    title: 'Hosting',
    desc: 'Choose the tier that fits your current stage and scale when needed.',
  },
  {
    title: 'Free SSL',
    desc: 'SSL certificate included as part of the platform setup.',
  },
  {
    title: 'Regular backups',
    desc: 'Your system gets routine backups as part of the hosting layer.',
  },
  {
    title: 'Security baseline',
    desc: 'A more reliable starting point than manually gluing services together.',
  },
  {
    title: 'Platform support',
    desc: 'You are not left alone after signup — the platform is built to carry the launch.',
  },
];

const plans = [
  { name: 'Starter', price: '$20/mo', note: 'first month free' },
  { name: 'Business', price: '$29/mo', note: 'more room to grow' },
  { name: 'Pro', price: '$59/mo', note: 'for bigger products' },
  { name: 'Enterprise', price: '$99/mo', note: 'maximum scale' },
];

export function ServicesSection() {
  return (
    <section id="hosting" className="bg-[#070707] py-16 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-4xl text-center"
        >
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/60">
            Hosting / deploy / SSL / backups
          </div>
          <h2 className="text-3xl font-black sm:text-5xl">
            Infrastructure that usually has to be assembled manually
          </h2>
          <p className="mt-4 text-white/70 sm:text-lg">
            Starting from $20/month — with the first month free — you get hosting, deployment,
            free SSL and regular backups on our platform.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="rounded-[26px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="text-lg font-black">{feature.title}</div>
              <p className="mt-3 text-white/65">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-[24px] border border-[#FF6B35]/20 bg-gradient-to-br from-[#141414] to-[#0c0c0c] p-5"
            >
              <div className="text-sm uppercase tracking-[0.2em] text-white/45">{plan.name}</div>
              <div className="mt-3 text-3xl font-black text-[#FF6B35]">{plan.price}</div>
              <div className="mt-2 text-sm text-white/55">{plan.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}