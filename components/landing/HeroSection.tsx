'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useEffect, useMemo, useState, useRef } from 'react';

/* ── i18n marquee terms ── */
const MARQUEE_TERMS: Record<string, string[]> = {
  en: ['websites', 'online stores', 'business software', 'freelancers', 'deployment', 'hosting', 'security', 'analytics', 'statistics', 'SEO optimization', 'back-end', 'growth'],
  ru: ['сайты', 'интернет-магазины', 'бизнес-софт', 'фрилансерам', 'деплой', 'хостинг', 'безопасность', 'аналитика', 'статистика', 'SEO-оптимизация', 'бэкенд', 'рост'],
  he: ['אתרים', 'חנויות אונליין', 'תוכנה עסקית', 'פרילנסרים', 'פריסה', 'אחסון', 'אבטחה', 'אנליטיקס', 'סטטיסטיקה', 'קידום אתרים', 'בק-אנד', 'צמיחה'],
};

/* ── Running Man SVG — improved quality ── */
function RunnerSVG({ size = 24, color = '#FF6B35' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="38" cy="10" r="6" fill={color}/>
      {/* Body */}
      <path d="M34 16c-1 2-2 6-3 10l-8 3-5 14h5l4-10 6-2 2 4-2 9 4 8h5l1-10 3-8" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Front leg */}
      <path d="M37 35l4 7 10 4" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Back arm */}
      <path d="M31 26l-10 2-4-3" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Front arm */}
      <path d="M34 20l8-3 3 2" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function HeroSection() {
  const locale = useLocale();
  const { isAuthenticated, canAccessEditor, role } = useAuth();
  const router = useRouter();
  const [showFloatNav, setShowFloatNav] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const { scrollY } = useScroll();
  const marqueeOpacity = useTransform(scrollY, [0, 500], [0.12, 0]);
  const heroContentY = useTransform(scrollY, [0, 400], [0, 50]);

  useEffect(() => {
    const onScroll = () => {
      setShowFloatNav(window.scrollY > 200);
      const sections = ['final-cta', 'savings', 'hosting', 'speed', 'doors', 'hero'];
      for (const id of sections) {
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

  const handleEditorClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) { e.preventDefault(); router.push(`/${locale}/auth/login?redirect=/${locale}/dashboard`); return; }
    if (!canAccessEditor) { e.preventDefault(); router.push(`/${locale}/subscription?reason=editor_access&current_role=${role}`); return; }
    router.push(`/${locale}/dashboard`);
  };

  /* ── Marquee rows — i18n, no dots, just spaces ── */
  const rows = useMemo(() => {
    const terms = MARQUEE_TERMS[locale] || MARQUEE_TERMS.en;
    const txt = terms.join('   ');
    const long = `${txt}   ${txt}   ${txt}   ${txt}   ${txt}`;
    return Array.from({ length: 12 }, (_, i) => ({ text: long, i }));
  }, [locale]);

  const navLinks = [
    { href: '#doors', label: 'Doors' },
    { href: '#speed', label: 'Speed' },
    { href: '#hosting', label: 'Hosting' },
    { href: '#savings', label: 'Savings' },
  ];

  /* ── Nav right (reusable) ── */
  const NavRight = ({ floating = false }: { floating?: boolean }) => (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <LanguageSwitcher />
      <ThemeToggle />
      {isAuthenticated ? (
        <UserAvatar />
      ) : (
        <>
          <Button asChild variant="ghost" className={`hidden sm:inline-flex rounded-full text-sm font-semibold ${floating ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/5' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
            <Link href={`/${locale}/auth/login`}>Log in</Link>
          </Button>
          <Button asChild className="rounded-full bg-white text-[#FF6B35] hover:bg-white/90 font-black text-sm px-4 sm:px-5">
            <Link href={`/${locale}/auth/signup`}>Start Running</Link>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ═══ FLOATING NAV — full width ═══ */}
      <motion.nav
        initial={false}
        animate={{
          opacity: showFloatNav ? 1 : 0,
          y: showFloatNav ? 0 : -20,
          pointerEvents: showFloatNav ? 'auto' as const : 'none' as const,
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border/30 bg-background/80 px-5 sm:px-8 py-3 backdrop-blur-2xl">
          <a href="#hero" className="flex items-center gap-2 shrink-0 group">
            <RunnerSVG size={24} color="#FF6B35" />
            <span className="hidden sm:block text-xs font-black tracking-[0.18em] uppercase text-foreground">I AM RUNNING</span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const isActive = activeSection === href.replace('#', '');
              return (
                <a key={href} href={href} className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all ${isActive ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-foreground/45 hover:text-foreground hover:bg-foreground/5'}`}>
                  {label}
                </a>
              );
            })}
            <a href="#final-cta" className="ml-2 rounded-full bg-[#FF6B35] px-4 py-2 text-sm font-black text-white hover:bg-[#ff7a4b] transition">
              Start Running
            </a>
          </div>

          <NavRight floating />
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <header id="hero" className="relative min-h-screen overflow-hidden bg-[#FF6B35]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/40" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* ── Marquee — BLACK text, slower, no dots ── */}
        <motion.div style={{ opacity: marqueeOpacity }} className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col justify-center gap-5">
          {rows.map(({ text, i }) => (
            <div key={i} className="relative w-[130%] -left-[15%] overflow-hidden whitespace-nowrap">
              <div className={`inline-block text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.3em] text-black/[0.15] ${i % 2 === 0 ? 'animate-iam-left' : 'animate-iam-right'}`}>
                {text}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Content ── */}
        <motion.div style={{ y: heroContentY }} className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8">
          {/* Top bar */}
          <div className="flex items-center justify-between py-5 sm:py-7">
            <a href="#hero" className="flex items-center gap-2.5">
              {/* Mobile: only icon. Desktop: icon + text */}
              <RunnerSVG size={28} color="#fff" />
              <div className="hidden sm:block">
                <div className="text-sm font-black tracking-[0.22em] uppercase text-white">I AM RUNNING</div>
                <div className="text-[10px] font-medium text-white/55 tracking-wider">full-cycle AI development platform</div>
              </div>
            </a>
            <NavRight />
          </div>

          {/* Main hero content */}
          <div className="flex flex-1 items-center justify-center pb-16 pt-4">
            <div className="w-full max-w-4xl text-center">

              {/* "I AM RUNNING" — fire gradient, BIG */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-[clamp(3rem,9vw,6.5rem)] font-black leading-[0.9] tracking-[-0.03em]"
              >
                <span className="bg-gradient-to-r from-yellow-200 via-orange-100 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,140,0,0.3)]">
                  I AM RUNNING
                </span>
              </motion.h1>

              {/* "full-cycle AI development platform" — white, smaller */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.5 }}
                className="mt-3 text-[clamp(1rem,3vw,2rem)] font-black text-white tracking-tight"
              >
                full-cycle AI development platform
              </motion.p>

              {/* Subtitle — platform concept */}
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.5 }}
                className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-white/80"
              >
                {locale === 'ru' && 'Платформа полного цикла, на которой вы можете создавать сайты, интернет-магазины и строить бизнес-системы.'}
                {locale === 'he' && 'פלטפורמה מלאה שבה תוכלו לבנות אתרים, חנויות אונליין ומערכות עסקיות.'}
                {locale === 'en' && 'A full-cycle platform where you can build websites, online stores, and business systems.'}
                {locale !== 'en' && locale !== 'ru' && locale !== 'he' && 'A full-cycle platform where you can build websites, online stores, and business systems.'}
              </motion.p>

              {/* ── Smart CTA buttons ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-white px-10 py-7 text-base font-black text-[#FF6B35] hover:bg-white/90 shadow-[0_8px_40px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.02]">
                  <Link href={`/${locale}/interactive`}>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    Run Interactive
                  </Link>
                </Button>

                {canAccessEditor && (
                  <Button onClick={handleEditorClick} size="lg" className="w-full sm:w-auto rounded-full bg-white/15 border border-white/30 px-10 py-7 text-base font-black text-white hover:bg-white/25 backdrop-blur-sm transition-all hover:scale-[1.02]">
                    Run Editor
                  </Button>
                )}

                {isAuthenticated && !canAccessEditor && (
                  <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-white/15 border border-white/30 px-10 py-7 text-base font-black text-white hover:bg-white/25 backdrop-blur-sm transition-all hover:scale-[1.02]">
                    <Link href={`/${locale}/subscription?reason=editor_access&current_role=${role}`}>Unlock Editor</Link>
                  </Button>
                )}

                {!isAuthenticated && (
                  <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-white/15 border border-white/30 px-10 py-7 text-base font-black text-white hover:bg-white/25 backdrop-blur-sm transition-all hover:scale-[1.02]">
                    <Link href={`/${locale}/auth/signup`}>Start Running</Link>
                  </Button>
                )}
              </motion.div>

              {/* Scroll hint */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-14 flex flex-col items-center gap-2">
                <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <style jsx global>{`
          @keyframes iam-left  { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(-50%,0,0); } }
          @keyframes iam-right { 0% { transform: translate3d(-50%,0,0); } 100% { transform: translate3d(0,0,0); } }
          .animate-iam-left  { animation: iam-left  120s linear infinite; }
          .animate-iam-right { animation: iam-right 120s linear infinite; }
        `}</style>
      </header>
    </>
  );
}
