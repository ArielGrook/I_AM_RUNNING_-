'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useEffect, useMemo, useState, useRef } from 'react';

/* ── marquee terms ── */
const PLATFORM_TERMS = [
  'websites', 'online stores', 'business software', 'freelancers',
  'deployment', 'hosting', 'security', 'analytics',
  'statistics', 'SEO optimization', 'back-end', 'growth',
  'websites', 'online stores', 'business software', 'freelancers',
  'deployment', 'hosting', 'security', 'analytics',
];

/* ── brand colors ── */
const ORANGE = '#FF6B35';
const ORANGE_LIGHT = '#FF8C5A';

export function HeroSection() {
  const locale = useLocale();
  const { isAuthenticated, canAccessEditor, role } = useAuth();
  const router = useRouter();
  const [showFloatNav, setShowFloatNav] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const heroRef = useRef<HTMLElement>(null);

  /* ── parallax on scroll ── */
  const { scrollY } = useScroll();
  const marqueeOpacity = useTransform(scrollY, [0, 600], [0.14, 0]);
  const heroContentY = useTransform(scrollY, [0, 500], [0, 60]);

  /* ── smart floating header on scroll ── */
  useEffect(() => {
    const onScroll = () => {
      setShowFloatNav(window.scrollY > 200);

      // track active section
      const sections = ['hero', 'doors', 'speed', 'hosting', 'savings', 'final-cta'];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 200) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── smart editor CTA ── */
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

  /* ── marquee rows ── */
  const rows = useMemo(() => {
    const txt = PLATFORM_TERMS.join('   ·   ');
    const long = `${txt}   ·   ${txt}   ·   ${txt}`;
    return Array.from({ length: 12 }, (_, i) => ({ text: long, i }));
  }, []);

  /* ── nav links ── */
  const navLinks = [
    { href: '#doors', label: 'Doors' },
    { href: '#speed', label: 'Speed' },
    { href: '#hosting', label: 'Hosting' },
    { href: '#savings', label: 'Savings' },
  ];

  /* ── right side nav (reused in static + floating) ── */
  const NavRight = ({ floating = false }: { floating?: boolean }) => (
    <div className="flex items-center gap-2">
      <LanguageSwitcher />
      <ThemeToggle />
      {isAuthenticated ? (
        <UserAvatar />
      ) : (
        <>
          <Button
            asChild
            variant="ghost"
            className={`hidden sm:inline-flex rounded-full text-sm font-semibold ${floating ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/5' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
          >
            <Link href={`/${locale}/auth/login`}>Log in</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-[#FF6B35] text-white hover:bg-[#ff7a4b] font-black text-sm px-5"
          >
            <Link href={`/${locale}/auth/signup`}>Start Running</Link>
          </Button>
        </>
      )}
    </div>
  );

  /* ── Running Man SVG logo ── */
  const RunningLogo = ({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="8" r="4.5" fill={color} />
      <path d="M22 18l6-4 4 6-3 8-7 2-4 10h-4l5-13 3-2-2-5-6 3-4-2 7-3z" fill={color} opacity="0.9"/>
      <path d="M29 28l3 5 8 3v4l-10-4-4-6" fill={color} opacity="0.85"/>
      <path d="M16 44l2-8 5-1 -1 5-3 4h-3z" fill={color} opacity="0.8"/>
    </svg>
  );

  return (
    <>
      {/* ═══════════ FLOATING NAV ═══════════ */}
      <motion.nav
        initial={false}
        animate={{
          opacity: showFloatNav ? 1 : 0,
          y: showFloatNav ? 0 : -20,
          pointerEvents: showFloatNav ? 'auto' as const : 'none' as const,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2"
      >
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/40 bg-background/80 px-5 py-3 shadow-2xl backdrop-blur-2xl">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF6B35] transition-transform group-hover:scale-105">
              <RunningLogo size={18} color="#fff" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-black tracking-[0.2em] uppercase text-foreground">I AM RUNNING</div>
            </div>
          </a>

          {/* Center links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const isActive = activeSection === href.replace('#', '');
              return (
                <a
                  key={href}
                  href={href}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                      : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  {label}
                </a>
              );
            })}
            <a
              href="#final-cta"
              className="ml-1 rounded-full bg-[#FF6B35] px-4 py-2 text-sm font-black text-white hover:bg-[#ff7a4b] transition"
            >
              Start Running
            </a>
          </div>

          <NavRight floating />
        </div>
      </motion.nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <header
        id="hero"
        ref={heroRef}
        className="relative min-h-screen overflow-hidden bg-[#FF6B35]"
      >
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/40" />

        {/* Subtle radial light at top center */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[70%]"
          style={{
            background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,200,160,0.2), transparent)',
          }}
        />

        {/* Dot pattern texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* ── Marquee background ── */}
        <motion.div
          style={{ opacity: marqueeOpacity }}
          className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col justify-center gap-4"
        >
          {rows.map(({ text, i }) => (
            <div
              key={i}
              className="relative w-[120%] -left-[10%] overflow-hidden whitespace-nowrap"
            >
              <div
                className={`inline-block text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.35em] text-white/[0.12] ${
                  i % 2 === 0 ? 'animate-iam-left' : 'animate-iam-right'
                }`}
              >
                {text}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Main content ── */}
        <motion.div
          style={{ y: heroContentY }}
          className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8"
        >
          {/* Static top bar */}
          <div className="flex items-center justify-between py-5 sm:py-7">
            <a href="#hero" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 transition-transform group-hover:scale-105">
                <RunningLogo size={22} color="#fff" />
              </div>
              <div>
                <div className="text-sm font-black tracking-[0.22em] uppercase text-white">I AM RUNNING</div>
                <div className="text-[10px] font-medium text-white/60 tracking-wider">full-cycle AI development platform</div>
              </div>
            </a>
            <NavRight />
          </div>

          {/* Hero content — centered */}
          <div className="flex flex-1 items-center justify-center pb-16 pt-4">
            <div className="w-full max-w-4xl text-center">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs sm:text-sm uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                Platform of a new generation
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
                className="mt-7 text-[clamp(2.4rem,7vw,5.5rem)] font-black leading-[0.92] tracking-[-0.03em] text-white"
              >
                I AM RUNNING
                <br />
                <span className="text-white/75">full-cycle AI</span>
                <br className="sm:hidden" />
                <span className="text-white/75"> development platform</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mx-auto mt-6 max-w-2xl text-base sm:text-xl leading-relaxed text-white/80"
              >
                Build your dream website from your phone in 15&nbsp;minutes —
                whether it&apos;s a landing page or an online store.
              </motion.p>

              {/* Infrastructure offer banner */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.5 }}
                className="mx-auto mt-6 max-w-2xl rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm sm:text-base text-white/85 backdrop-blur-md"
              >
                Starting from{' '}
                <span className="font-black text-white">$20/month</span>
                {' '}— with the{' '}
                <span className="font-black text-white">first month free</span>
                {' '}— hosting, deployment, free SSL and regular backups included.
              </motion.div>

              {/* ── Smart CTA buttons ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.5 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                {/* Primary: Run Interactive — always visible */}
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto rounded-full bg-white px-10 py-7 text-base font-black text-[#FF6B35] hover:bg-white/90 shadow-[0_8px_40px_rgba(0,0,0,0.15)] transition-all hover:shadow-[0_12px_50px_rgba(0,0,0,0.2)] hover:scale-[1.02]"
                >
                  <Link href={`/${locale}/interactive`}>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Run Interactive
                  </Link>
                </Button>

                {/* Editor button — context-aware */}
                {canAccessEditor && (
                  <Button
                    onClick={handleEditorClick}
                    size="lg"
                    className="w-full sm:w-auto rounded-full bg-white/15 border border-white/30 px-10 py-7 text-base font-black text-white hover:bg-white/25 backdrop-blur-sm transition-all hover:scale-[1.02]"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                    Run Editor
                  </Button>
                )}

                {isAuthenticated && !canAccessEditor && (
                  <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto rounded-full bg-white/15 border border-white/30 px-10 py-7 text-base font-black text-white hover:bg-white/25 backdrop-blur-sm transition-all hover:scale-[1.02]"
                  >
                    <Link href={`/${locale}/subscription?reason=editor_access&current_role=${role}`}>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      Unlock Editor
                    </Link>
                  </Button>
                )}

                {!isAuthenticated && (
                  <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto rounded-full bg-white/15 border border-white/30 px-10 py-7 text-base font-black text-white hover:bg-white/25 backdrop-blur-sm transition-all hover:scale-[1.02]"
                  >
                    <Link href={`/${locale}/auth/signup`}>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      Start Running
                    </Link>
                  </Button>
                )}
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-12 flex flex-col items-center gap-2"
              >
                <span className="text-[11px] uppercase tracking-[0.3em] text-white/40 font-medium">Explore</span>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                </motion.div>
              </motion.div>

            </div>
          </div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <style jsx global>{`
          @keyframes iam-left {
            0%   { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          @keyframes iam-right {
            0%   { transform: translate3d(-50%, 0, 0); }
            100% { transform: translate3d(0, 0, 0); }
          }
          .animate-iam-left  { animation: iam-left  90s linear infinite; }
          .animate-iam-right { animation: iam-right 90s linear infinite; }
        `}</style>
      </header>
    </>
  );
}
