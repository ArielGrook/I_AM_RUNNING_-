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
  'websites', 'online stores', 'business software', 'freelancers',
  'deployment', 'hosting', 'security', 'analytics',
  'statistics', 'SEO optimization', 'back-end', 'growth',
];

export function HeroSection() {
  const locale = useLocale();
  const { isAuthenticated, canAccessEditor, role } = useAuth();
  const router = useRouter();
  const [showFloatNav, setShowFloatNav] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowFloatNav(window.scrollY > 120);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const rows = useMemo(() => {
    const base = PLATFORM_TERMS.join(' · ');
    const long = `${base} · ${base} · ${base} · ${base}`;
    return Array.from({ length: 10 }, (_, i) => ({ text: long, i }));
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

  const NavRight = () => (
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
            className="bg-[#FF6B35] text-white hover:bg-[#ff7a4b] rounded-full font-black"
          >
            <Link href={`/${locale}/auth/signup`}>Start Running</Link>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Floating nav — appears on scroll */}
      <motion.nav
        initial={false}
        animate={{ opacity: showFloatNav ? 1 : 0, y: showFloatNav ? 0 : -16, pointerEvents: showFloatNav ? 'auto' : 'none' }}
        transition={{ duration: 0.25 }}
        className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2"
      >
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/75 px-5 py-3 text-white shadow-2xl backdrop-blur-xl">
          <a href="#hero" className="shrink-0">
            <div className="text-sm font-black tracking-[0.22em] uppercase">I AM RUNNING</div>
            <div className="text-[10px] text-white/50">full-cycle AI development platform</div>
          </a>
          <div className="hidden lg:flex items-center gap-1 text-sm">
            {['#doors:Doors', '#speed:Speed', '#hosting:Hosting', '#savings:Savings', '#final-cta:Start Running'].map(s => {
              const [href, label] = s.split(':');
              return (
                <a key={href} href={href} className="rounded-full px-3 py-2 text-white/65 hover:bg-white/10 hover:text-white transition">
                  {label}
                </a>
              );
            })}
          </div>
          <NavRight />
        </div>
      </motion.nav>

      {/* Hero */}
      <header
        id="hero"
        className="relative min-h-screen overflow-hidden bg-[#FF6B35] text-white dark:bg-[#FF6B35]"
      >
        {/* Dark overlay — creates depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/35 dark:from-black/30 dark:via-black/10 dark:to-black/50" />

        {/* Subtle texture pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Marquee background text */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col justify-center gap-[18px]">
          {rows.map(({ text, i }) => (
            <div
              key={i}
              className="relative left-[-5%] w-[110%] overflow-hidden whitespace-nowrap"
            >
              <div
                className={[
                  'inline-block text-[10px] sm:text-[12px] font-semibold uppercase tracking-[0.4em] text-white/[0.18]',
                  i % 2 === 0 ? 'animate-iam-left' : 'animate-iam-right',
                ].join(' ')}
              >
                {text}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6">

          {/* Static top nav — always visible */}
          <div className="flex items-center justify-between py-5 sm:py-7">
            <div>
              <div className="text-sm font-black tracking-[0.25em] uppercase text-white">I AM RUNNING</div>
              <div className="text-[10px] text-white/65">full-cycle AI development platform</div>
            </div>
            <NavRight />
          </div>

          {/* Main content */}
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-5xl text-center">

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs sm:text-sm uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm"
              >
                Platform of a new generation
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.5 }}
                className="mx-auto mt-6 max-w-5xl text-4xl font-black leading-[0.95] sm:text-6xl lg:text-[80px] text-white"
                style={{ letterSpacing: '-0.02em' }}
              >
                I AM RUNNING —<br />
                <span className="text-white/80">
                  full-cycle AI<br className="sm:hidden" /> development platform
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.5 }}
                className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-xl"
              >
                Build your dream website from your phone in 15 minutes —
                whether it&apos;s a landing page or an online store.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.5 }}
                className="mx-auto mt-5 max-w-3xl rounded-2xl border border-white/20 bg-black/15 px-5 py-4 text-sm text-white/85 backdrop-blur-sm sm:text-base"
              >
                Starting from{' '}
                <span className="font-black text-white">$20/month</span>
                {' '}— with the{' '}
                <span className="font-black text-white">first month free</span>
                {' '}— you get hosting, deployment, free SSL and regular backups.
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full bg-white px-10 py-6 text-base font-black text-[#FF6B35] hover:bg-white/90 sm:w-auto shadow-xl"
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
                    className="w-full rounded-full bg-black/25 border border-white/30 px-10 py-6 text-base font-black text-white hover:bg-black/35 sm:w-auto backdrop-blur-sm"
                  >
                    Run Editor
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}

                {isAuthenticated && !canAccessEditor && (
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-full bg-black/20 border border-white/25 px-10 py-6 text-base font-black text-white hover:bg-black/30 sm:w-auto backdrop-blur-sm"
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
                    className="w-full rounded-full bg-black/25 border border-white/30 px-10 py-6 text-base font-black text-white hover:bg-black/35 sm:w-auto backdrop-blur-sm"
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

        {/* Bottom fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />

        <style jsx global>{`
          @keyframes iam-left {
            0%   { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          @keyframes iam-right {
            0%   { transform: translate3d(-50%, 0, 0); }
            100% { transform: translate3d(0, 0, 0); }
          }
          .animate-iam-left  { animation: iam-left  80s linear infinite; }
          .animate-iam-right { animation: iam-right 80s linear infinite; }
        `}</style>
      </header>
    </>
  );
}
