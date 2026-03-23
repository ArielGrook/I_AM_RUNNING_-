'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLocale } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export function FinalCtaSection() {
  const locale = useLocale();
  const { isAuthenticated, canAccessEditor, role } = useAuth();
  const router = useRouter();

  /* Smart CTA destination */
  const getCtaProps = () => {
    if (!isAuthenticated) {
      return { href: `/${locale}/auth/signup`, label: 'Start Running' };
    }
    if (canAccessEditor) {
      return { href: `/${locale}/dashboard`, label: 'Go to Dashboard' };
    }
    return { href: `/${locale}/interactive`, label: 'Run Interactive' };
  };

  const cta = getCtaProps();

  return (
    <section id="final-cta" className="relative bg-background py-24 sm:py-32 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          className="rounded-[2.5rem] border border-[#FF6B35]/15 bg-gradient-to-b from-[#FF6B35]/[0.04] to-transparent p-10 sm:p-16"
        >
          {/* Running man SVG */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FF6B35]/10 border border-[#FF6B35]/20"
          >
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="8" r="4" fill="#FF6B35" opacity="0.8"/>
              <path d="M22 18l6-4 4 6-3 8-7 2-4 10h-4l5-13 3-2-2-5-6 3-4-2 7-3z" fill="#FF6B35" opacity="0.7"/>
              <path d="M29 28l3 5 8 3v3l-10-4-4-5" fill="#FF6B35" opacity="0.6"/>
              <path d="M16 42l2-7 5-1-1 4-3 4h-3z" fill="#FF6B35" opacity="0.5"/>
            </svg>
          </motion.div>

          <h2 className="text-4xl font-black tracking-tight sm:text-6xl text-foreground">
            Start Running
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-foreground/55 sm:text-lg leading-relaxed">
            Launch faster, host properly, stay protected and grow — all on the same platform.
            Your next project starts here.
          </p>

          {/* Pulsing CTA */}
          <motion.div
            className="mt-10 inline-flex"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full bg-[#FF6B35] animate-ping opacity-[0.12]" />
              <div className="absolute -inset-1 rounded-full bg-[#FF6B35] opacity-[0.06] animate-pulse" />

              <Button
                asChild
                size="lg"
                className="relative rounded-full bg-[#FF6B35] px-12 py-8 text-lg font-black text-white hover:bg-[#ff7a4b] shadow-[0_8px_40px_rgba(255,107,53,0.3)] transition-all hover:shadow-[0_12px_50px_rgba(255,107,53,0.4)]"
              >
                <Link href={cta.href}>
                  {cta.label}
                  <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Trust line */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-foreground/30">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Free first month
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Hosting included
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
