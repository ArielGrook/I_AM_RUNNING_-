'use client';

import { motion } from 'framer-motion';
import { Shield, Server, Lock, RefreshCw } from 'lucide-react';

const features = [
  {
    icon: Server,
    title: 'Hosting included',
    desc: 'Your site lives on our infrastructure. No DigitalOcean, no AWS, no config hell.',
    color: '#FF6B35',
  },
  {
    icon: RefreshCw,
    title: 'Instant deployment',
    desc: 'One click from builder to live URL. No pipelines, no DevOps, no waiting.',
    color: '#FFB08A',
  },
  {
    icon: Lock,
    title: 'Free SSL',
    desc: 'HTTPS out of the box. Every site, every domain, every plan. Always.',
    color: '#7bc6ff',
  },
  {
    icon: Shield,
    title: 'Regular backups',
    desc: 'Your work is safe. Automatic backups keep your data secure.',
    color: '#a8e6a3',
  },
];

export function HostingSection() {
  return (
    <section id="hosting" className="bg-black py-16 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/65">
            Infrastructure included
          </div>
          <h2 className="text-3xl font-black sm:text-5xl">
            Everything you need to go live
          </h2>
          <p className="mt-4 text-white/70 sm:text-lg">
            Hosting, deployment, SSL, and backups — all built into the platform. You build, we run.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="rounded-[24px] border border-white/10 bg-[#0d0d0d] p-6"
            >
              <div
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${color}18`, border: `1px solid ${color}28` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div className="mb-2 font-black">{title}</div>
              <p className="text-sm leading-relaxed text-white/55">{desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 rounded-[28px] border border-[#FF6B35]/25 bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.12),transparent_60%)] p-6 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-2xl font-black sm:text-3xl">
                Starting from{' '}
                <span className="text-[#FF6B35]">$20/month</span>
              </div>
              <div className="mt-1 text-white/60">
                with the{' '}
                <span className="font-black text-[#FFB08A]">first month free</span>{' '}
                — hosting, deployment, free SSL and regular backups included
              </div>
            </div>
            <div className="shrink-0">
              <div className="flex gap-3 text-sm text-white/50">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Starter $20</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Business $29</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Pro $59</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
