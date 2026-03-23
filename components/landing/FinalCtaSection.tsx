'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useLocale } from 'next-intl';

export function FinalCtaSection() {
  const locale = useLocale();

  return (
    <section id="final-cta" className="bg-black py-20 text-white sm:py-28">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-[36px] border border-[#FF6B35]/20 bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.2),rgba(12,12,12,0.95)_52%)] px-6 py-12 shadow-[0_25px_120px_rgba(255,107,53,0.16)]"
        >
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/60">
              Final CTA
            </div>
            <h2 className="text-3xl font-black sm:text-6xl">Start Running</h2>
            <p className="mx-auto mt-5 max-w-2xl text-white/70 sm:text-lg">
              Launch faster, host properly, stay protected and grow on the same platform.
            </p>

            <div className="mt-8 flex justify-center">
              <div className="animate-pulse">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-[#FF6B35] px-10 py-7 text-lg font-black text-white hover:bg-[#ff7a4b]"
                >
                  <Link href={`/${locale}/auth/signup`}>
                    Start Running
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}