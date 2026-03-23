'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Crown, Layers3, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from 'next-intl';

export function ThreeDoorsSection() {
  const locale = useLocale();

  return (
    <section id="doors" className="bg-black py-16 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/65">
            Three doors. One platform.
          </div>
          <h2 className="text-3xl font-black sm:text-5xl">
            Choose how you want to start running
          </h2>
          <p className="mt-4 text-white/70 sm:text-lg">
            Start fast, build professionally, or go fully custom with AI-native software.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[28px] border border-white/10 bg-[#0d0d0d] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.22em] text-white/45">Door A</div>
                <h3 className="mt-2 text-2xl font-black">Interactive</h3>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <Smartphone className="h-6 w-6 text-[#FFB08A]" />
              </div>
            </div>

            <div className="mb-6 rounded-[24px] border border-white/10 bg-gradient-to-br from-[#161616] to-[#0b0b0b] p-4">
              <div className="mx-auto max-w-[210px] rounded-[28px] border border-white/10 bg-[#101010] p-3 shadow-2xl">
                <div className="mb-3 h-2 w-12 rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="h-16 rounded-2xl bg-gradient-to-br from-[#FF9B72] to-[#FF6B35]" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-12 rounded-xl bg-white/10" />
                    <div className="h-12 rounded-xl bg-white/10" />
                  </div>
                  <div className="h-10 rounded-xl bg-white/10" />
                </div>
              </div>
            </div>

            <p className="text-white/75">
              Build your dream website from your phone in 15 minutes — whether it’s a landing page
              or an online store.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-white/55">
              <li>• mobile-first flow</li>
              <li>• fast launch</li>
              <li>• simple onboarding</li>
            </ul>

            <Button asChild className="mt-6 w-full rounded-full bg-white text-black hover:bg-white/90">
              <Link href={`/${locale}/interactive`}>
                Run Interactive
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="rounded-[28px] border border-white/10 bg-[#0d0d0d] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.22em] text-white/45">Door B</div>
                <h3 className="mt-2 text-2xl font-black">Editor</h3>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <Layers3 className="h-6 w-6 text-[#7bc6ff]" />
              </div>
            </div>

            <div className="mb-6 rounded-[24px] border border-white/10 bg-gradient-to-br from-[#0e1620] to-[#0a0f16] p-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117]">
                <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="grid grid-cols-[56px_1fr_120px] gap-2 p-3">
                  <div className="rounded-xl bg-white/5 p-2">
                    <div className="h-16 rounded-lg bg-white/10" />
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <div className="h-24 rounded-lg border border-dashed border-white/10 bg-white/[0.03]" />
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <div className="space-y-2">
                      <div className="h-5 rounded bg-white/10" />
                      <div className="h-5 rounded bg-white/10" />
                      <div className="h-5 rounded bg-white/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-white/75">
              Build professional white-label websites with backend directly in your browser.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-white/55">
              <li>• more control</li>
              <li>• professional workflows</li>
              <li>• white-label direction</li>
            </ul>

            <Button
              asChild
              className="mt-6 w-full rounded-full bg-[#1a2230] text-white hover:bg-[#202b3b]"
            >
              <Link href={`/${locale}/auth/login?redirect=/${locale}/dashboard`}>
                Run Editor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="relative rounded-[28px] border border-[#FF6B35]/40 bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.25),rgba(13,13,13,0.95)_45%)] p-6 shadow-[0_20px_120px_rgba(255,107,53,0.18)]"
          >
            <div className="absolute right-5 top-5 rounded-full border border-[#FFB08A]/25 bg-[#FF6B35]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#FFD5C4]">
              most powerful
            </div>

            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.22em] text-white/55">Door C</div>
                <h3 className="mt-2 text-2xl font-black">Business Software</h3>
              </div>
              <div className="rounded-2xl border border-[#FFB08A]/20 bg-white/5 p-3">
                <Crown className="h-6 w-6 text-[#FFB08A]" />
              </div>
            </div>

            <div className="mb-6 rounded-[24px] border border-[#FFB08A]/15 bg-black/20 p-4 backdrop-blur-sm">
              <div className="space-y-3 rounded-2xl border border-white/10 bg-[#111] p-4">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded-full bg-white/10" />
                  <div className="rounded-full bg-[#FF6B35]/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#FFD5C4]">
                    custom
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-2xl bg-white/8" />
                  <div className="h-16 rounded-2xl bg-[#FF6B35]/15" />
                  <div className="col-span-2 h-12 rounded-2xl bg-white/8" />
                </div>
              </div>
            </div>

            <p className="text-white/85">
              Custom AI-native software by I AM RUNNING.
            </p>
            <p className="mt-2 text-sm text-[#FFD5C4]">
              Our most powerful product — built around your business goals and workflows.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-white/65">
              <li>• consultation with our team</li>
              <li>• personalised development plan</li>
              <li>• software tailored to business needs</li>
            </ul>

            <Button
              asChild
              className="mt-6 w-full rounded-full bg-[#FF6B35] text-white hover:bg-[#ff7a4b]"
            >
              <Link href="mailto:hello@iamrunning.online?subject=Business%20Software%20Consultation">
                Run Business
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}