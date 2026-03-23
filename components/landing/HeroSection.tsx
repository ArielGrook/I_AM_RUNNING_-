'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useEffect, useMemo, useState } from 'react';

const PLATFORM_TERMS = [
  'websites',
  'online stores',
  'business software',
  'freelancers',
  'deployment',
  'hosting',
  'security',
  'analytics',
  'statistics',
  'SEO optimization',
  'back-end',
  'growth',
];

export function HeroSection() {
  const locale = useLocale();
  const { isAuthenticated, canAccessEditor, role } = useAuth();
  const router = useRouter();
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowHeader(window.scrollY > 110);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const rows = useMemo(() => {
    const base = PLATFORM_TERMS.join('  ·  ');
    return Array.from({ length: 10 }, (_, i) => `${base}  ·  ${base}  ·  ${base}`);
  }, []);

  const handleEditorClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      router.push(`/${locale}/auth/login?redirect=/${locale}/dashboard`);
      return;
    }

    if (!canAccessEditor) {
      e.preventDefault();
      router.push(`/${locale}/subscription?reason=editor_access&current_role=${role}`);
      return;
    }

    router.push(`/${locale}/dashboard`);
  };

  return (
    <>
      <motion.nav
        initial={false}
        animate={{
          opacity: showHeader ? 1 : 0,
          y: showHeader ? 0 : -18,
          pointerEvents: showHeader ? 'auto' : 'none',
        }}
        transition={{ duration: 0.28 }}
        className="fixed top-4 left-1/2 z-50 w-[calc(100%-1rem)] max-w-7xl -translate-x-1/2"
      >
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
          <a href="#hero" className="shrink-0">
            <div className="text-sm font-black tracking-[0.22em] uppercase">I AM RUNNING</div>
            <div className="text-[10px] text-white/60">full-cycle AI development platform</div>
          </a>

          <div className="hidden lg:flex items-center gap-2 text-sm">
            <a href="#doors" className="rounded-full px-3 py-2 text-white/75 hover:bg-white/10 hover:text-white transition">
              Doors
            </a>
            <a href="#speed" className="rounded-full px-3 py-2 text-white/75 hover:bg-white/10 hover:text-white transition">
              Speed
            </a>
            <a href="#hosting" className="rounded-full px-3 py-2 text-white/75 hover:bg-white/10 hover:text-white transition">
              Hosting
            </a>
            <a href="#savings" className="rounded-full px-3 py-2 text-white/75 hover:bg-white/10 hover:text-white transition">
              Savings
            </a>
            <a href="#final-cta" className="rounded-full px-3 py-2 text-white/75 hover:bg-white/10 hover:text-white transition">
              Start Running
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            {isAuthenticated ? (
              <UserAvatar />
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden sm:inline-flex text-white hover:bg-white/10"
                >
                  <Link href={`/${locale}/auth/login`}>Log in</Link>
                </Button>
                <Button
                  asChild
                  className="bg-[#FF6B35] text-white hover:bg-[#ff7a4b] rounded-full"
                >
                  <Link href={`/${locale}/auth/signup`}>Start Running</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      <header
        id="hero"
        className="relative min-h-screen overflow-hidden bg-[#050505] text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.28),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(255,140,70,0.15),transparent_35%)]" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 flex flex-col justify-center gap-5 sm:gap-7">
            {rows.map((row, index) => (
              <div
                key={index}
                className="relative left-[-10%] w-[120%] overflow-hidden whitespace-nowrap"
              >
                <div
                  className={[
                    'inline-block text-[11px] sm:text-[13px] lg:text-[15px] font-medium uppercase tracking-[0.35em] text-white/[0.04]',
                    index % 2 === 0 ? 'animate-iam-marquee-left' : 'animate-iam-marquee-right',
                  ].join(' ')}
                >
                  {row}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6">
          <div className="flex items-center justify-between py-5 sm:py-7">
            <div>
              <div className="text-sm font-black tracking-[0.25em] uppercase text-white">I AM RUNNING</div>
              <div className="text-xs text-white/60">full-cycle AI development platform</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
              {isAuthenticated ? (
                <UserAvatar />
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${locale}/auth/login`}
                    className="hidden sm:block rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:border-white/30 hover:text-white transition"
                  >
                    Log in
                  </Link>
                  <Link
                    href={`/${locale}/auth/signup`}
                    className="rounded-full bg-[#FF6B35] px-4 py-2 text-sm font-black text-white hover:bg-[#ff7a4b] transition"
                  >
                    Start Running
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-5xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm uppercase tracking-[0.22em] text-white/70 backdrop-blur-sm"
              >
                Platform of a new generation for building, launching and scaling digital products
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.55 }}
                className="mx-auto mt-6 max-w-5xl text-4xl font-black leading-[0.95] sm:text-6xl lg:text-8xl"
              >
                I AM RUNNING —{' '}
                <span className="bg-gradient-to-r from-[#FFB08A] via-[#FF6B35] to-[#FFA86C] bg-clip-text text-transparent">
                  full-cycle AI development platform
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.55 }}
                className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/80 sm:text-xl"
              >
                Build your dream website from your phone in 15 minutes — whether it’s a landing
                page or an online store.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.55 }}
                className="mx-auto mt-6 max-w-4xl rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/80 backdrop-blur-md sm:text-base"
              >
                Starting from <span className="font-black text-white">$20/month</span> — with the{' '}
                <span className="font-black text-[#FFB08A]">first month free</span> — you get
                hosting, deployment, free SSL and regular backups on our platform.
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.55 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-3"
              >
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                  websites
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                  business software
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                  deployment
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                  hosting
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                  security
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                  analytics
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.55 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full bg-white px-8 py-6 text-base font-black text-black hover:bg-white/90 sm:w-auto"
                >
                  <Link href={`/${locale}/interactive`}>
                    Run Interactive
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                {canAccessEditor && (
                  <Button
                    onClick={handleEditorClick}
                    size="lg"
                    className="w-full rounded-full bg-[#FF6B35] px-8 py-6 text-base font-black text-white hover:bg-[#ff7a4b] sm:w-auto"
                  >
                    Run Editor
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}

                {isAuthenticated && !canAccessEditor && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full border-white/20 bg-white/5 px-8 py-6 text-base font-black text-white hover:bg-white/10 sm:w-auto"
                  >
                    <Link href={`/${locale}/subscription?reason=editor_access&current_role=${role}`}>
                      Unlock Editor
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )}

                {!isAuthenticated && (
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-full bg-[#FF6B35] px-8 py-6 text-base font-black text-white hover:bg-[#ff7a4b] sm:w-auto"
                  >
                    <Link href={`/${locale}/auth/signup`}>
                      Start Running
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black to-transparent" />

        <style jsx global>{`
          @keyframes iam-marquee-left {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          @keyframes iam-marquee-right {
            0% { transform: translate3d(-50%, 0, 0); }
            100% { transform: translate3d(0, 0, 0); }
          }
          .animate-iam-marquee-left {
            animation: iam-marquee-left 90s linear infinite;
          }
          .animate-iam-marquee-right {
            animation: iam-marquee-right 90s linear infinite;
          }
        `}</style>
      </header>
    </>
  );
}