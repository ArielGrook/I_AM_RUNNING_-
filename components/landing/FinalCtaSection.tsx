'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLocale } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { RunnerSVG } from '@/components/ui/RunnerSVG';

export function FinalCtaSection() {
  const locale = useLocale();
  const { isAuthenticated, canAccessEditor } = useAuth();

  const getCtaHref = () => {
    if (!isAuthenticated) return `/${locale}/auth/signup`;
    if (canAccessEditor) return `/${locale}/dashboard`;
    return `/${locale}/interactive`;
  };

  return (
    <section id="final-cta" className="relative w-full bg-background py-28 sm:py-40 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 65%)' }} />

      <div className="relative mx-auto max-w-5xl px-5 sm:px-8 text-center">
        {/* Runner icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto mb-6"
        >
          <RunnerSVG size={56} color="#FF6B35" />
        </motion.div>

        {/* "I AM RUNNING" — huge, fire gradient */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[clamp(3rem,10vw,7rem)] font-black leading-[0.85] tracking-[-0.03em]"
        >
          <span className="bg-gradient-to-r from-yellow-200 via-orange-200 to-yellow-300 bg-clip-text text-transparent">
            I AM RUNNING
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-foreground/50 text-lg sm:text-xl leading-relaxed"
        >
          {locale === 'ru' && 'Начни строить бизнес будущего с платформы будущего — прямо сейчас.'}
          {locale === 'he' && 'התחל לבנות את העסק של העתיד מפלטפורמה של העתיד — עכשיו.'}
          {(locale === 'en' || (locale !== 'ru' && locale !== 'he')) && 'Start building the business of the future from the platform of the future — right now.'}
        </motion.p>

        {/* Pulsing CTA — huge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 inline-flex"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#FF6B35] animate-ping opacity-[0.08]" />
            <Button asChild size="lg" className="relative rounded-full bg-[#FF6B35] px-14 sm:px-20 py-8 sm:py-10 text-xl sm:text-2xl font-black text-white hover:bg-[#ff7a4b] shadow-[0_8px_50px_rgba(255,107,53,0.3)] transition-all hover:shadow-[0_12px_60px_rgba(255,107,53,0.4)]">
              <Link href={getCtaHref()}>
                <RunnerSVG size={28} color="#fff" />
                <span className="ml-3">I AM RUNNING</span>
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Trust line */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-foreground/25">
          {['Free first month', 'No credit card', 'Hosting included'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
