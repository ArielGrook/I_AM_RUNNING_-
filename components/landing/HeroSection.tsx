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
import { RunnerSVG } from '@/components/ui/RunnerSVG';
import { useEffect, useMemo, useState } from 'react';

/* ── i18n marquee terms ── */
const MARQUEE_TERMS: Record<string, string[]> = {
  en: ['websites', 'online stores', 'business software', 'freelancers', 'deployment', 'hosting', 'security', 'analytics', 'statistics', 'SEO optimization', 'back-end', 'growth'],
  ru: ['сайты', 'интернет-магазины', 'бизнес-софт', 'фрилансерам', 'деплой', 'хостинг', 'безопасность', 'аналитика', 'статистика', 'SEO-оптимизация', 'бэкенд', 'рост'],
  he: ['אתרים', 'חנויות אונליין', 'תוכנה עסקית', 'פרילנסרים', 'פריסה', 'אחסון', 'אבטחה', 'אנליטיקס', 'סטטיסטיקה', 'קידום אתרים', 'בק-אנד', 'צמיחה'],
};

/* ── i18n hero content ── */
const HERO_CONTENT = {
  en: {
    intro: 'In our time, people are constantly chasing speed, quality, and price.',
    headline1: 'STOP CHASING,',
    headline2: 'START RUNNING',
    sub_before: 'Towards progress with iamrunning.online — a modern, experimental platform combining',
    quality: 'QUALITY',
    sub_mid1: 'of elements,',
    speed: 'SPEED',
    sub_mid2: 'of development, and affordable',
    price: 'PRICE',
    sub_after: 'for websites of any level.',
    concept: 'A full-cycle platform where you can build websites, online stores, and business systems.',
    cta_interactive: 'Run Interactive',
    cta_start: 'Start Running',
    cta_editor: 'Run Editor',
    cta_unlock: 'Unlock Editor',
  },
  ru: {
    intro: 'В наше время люди находятся в постоянной погоне за скоростью, качеством и ценой.',
    headline1: 'ХВАТИТ ГОНЯТЬСЯ,',
    headline2: 'ПОРА БЕЖАТЬ',
    sub_before: 'К прогрессу с iamrunning.online — современным конструктором, совмещающим',
    quality: 'КАЧЕСТВО',
    sub_mid1: 'элементов,',
    speed: 'СКОРОСТЬ',
    sub_mid2: 'разработки и доступную',
    price: 'ЦЕНУ',
    sub_after: 'для сайтов любого уровня.',
    concept: 'Платформа полного цикла, на которой вы можете создавать сайты, интернет-магазины и строить бизнес-системы.',
    cta_interactive: 'Запустить Интерактив',
    cta_start: 'Начать',
    cta_editor: 'Редактор',
    cta_unlock: 'Открыть Редактор',
  },
  he: {
    intro: 'בזמננו אנשים רודפים כל הזמן אחרי מהירות, איכות ומחיר.',
    headline1: 'מספיק לרדוף,',
    headline2: 'זמן לרוץ',
    sub_before: 'לקראת קידמה עם iamrunning.online — פלטפורמה מודרנית המשלבת',
    quality: 'איכות',
    sub_mid1: 'רכיבים,',
    speed: 'מהירות',
    sub_mid2: 'פיתוח ו',
    price: 'מחיר',
    sub_after: 'נגיש לאתרים בכל רמה.',
    concept: 'פלטפורמה מלאה שבה תוכלו לבנות אתרים, חנויות אונליין ומערכות עסקיות.',
    cta_interactive: 'התחל אינטראקטיב',
    cta_start: 'התחל לרוץ',
    cta_editor: 'עורך',
    cta_unlock: 'פתח עורך',
  },
};

/* ── Running Man SVG is now imported from components/ui/RunnerSVG ── */

export function HeroSection() {
  const locale = useLocale();
  const t = HERO_CONTENT[locale as keyof typeof HERO_CONTENT] || HERO_CONTENT.en;
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

  /* ── Marquee rows — i18n, no dots, just spaces, slower ── */
  const rows = useMemo(() => {
    const terms = MARQUEE_TERMS[locale as keyof typeof MARQUEE_TERMS] || MARQUEE_TERMS.en;
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

  /* ── Nav right ── */
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
            <Link href={`/${locale}/auth/signup`}>{t.cta_start}</Link>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ═══ FLOATING NAV ═══ */}
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
          <a href="#hero" className="flex items-center gap-2 shrink-0">
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
              {t.cta_start}
            </a>
          </div>

          <NavRight floating />
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <header id="hero" className="relative min-h-screen overflow-hidden bg-[#FF6B35] dark:bg-[#0a0a0a]">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/40 dark:from-[#FF6B35]/10 dark:via-transparent dark:to-transparent" />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* ── Marquee — BLACK on light, orange/dim on dark, slower, no dots ── */}
        <motion.div style={{ opacity: marqueeOpacity }} className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col justify-center gap-5">
          {rows.map(({ text, i }) => (
            <div key={i} className="relative w-[130%] -left-[15%] overflow-hidden whitespace-nowrap">
              <div className={`inline-block text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.3em] text-black/[0.15] dark:text-[#FF6B35]/[0.08] ${i % 2 === 0 ? 'animate-iam-left' : 'animate-iam-right'}`}>
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
                <div className="text-[10px] font-medium text-white/55 dark:text-white/40 tracking-wider">full-cycle AI development platform</div>
              </div>
            </a>
            <NavRight />
          </div>

          {/* ── Main hero content ── */}
          <div className="flex flex-1 items-center justify-center pb-16 pt-4">
            <div className="w-full max-w-4xl text-center">

              {/* Intro text — small, white */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-sm sm:text-base font-medium text-white/80 dark:text-white/60 mb-6 sm:mb-8"
              >
                {t.intro}
              </motion.p>

              {/* STOP CHASING, START RUNNING — огненный градиент */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-[clamp(2.5rem,8vw,6rem)] font-black leading-[0.95] tracking-[-0.03em]"
              >
                <span className="block bg-gradient-to-r from-yellow-300 via-orange-200 to-yellow-400 dark:from-[#FF6B35] dark:via-[#ff9a5c] dark:to-[#FF6B35] bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(255,140,0,0.4)]">
                  {t.headline1}
                </span>
                <span className="block bg-gradient-to-r from-yellow-200 via-white to-yellow-300 dark:from-[#FF6B35] dark:via-[#ffb380] dark:to-[#FF6B35] bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(255,140,0,0.3)]">
                  {t.headline2}
                </span>
              </motion.h1>

              {/* Subtitle — QUALITY (yellow) SPEED (blue) PRICE (green) */}
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mx-auto mt-6 sm:mt-8 max-w-2xl text-sm sm:text-base leading-relaxed text-white/85 dark:text-white/70"
              >
                {t.sub_before}{' '}
                <span className="font-black text-yellow-300 dark:text-yellow-400">{t.quality}</span>{' '}
                {t.sub_mid1}{' '}
                <span className="font-black text-blue-300 dark:text-blue-400">{t.speed}</span>{' '}
                {t.sub_mid2}{' '}
                <span className="font-black text-green-300 dark:text-green-400">{t.price}</span>{' '}
                {t.sub_after}
              </motion.p>

              {/* Concept line */}
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.5 }}
                className="mx-auto mt-4 max-w-xl text-sm text-white/60 dark:text-white/45"
              >
                {t.concept}
              </motion.p>

              {/* ── CTA Buttons ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-white px-10 py-7 text-base font-black text-[#FF6B35] hover:bg-white/90 shadow-[0_8px_40px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.02]">
                  <Link href={`/${locale}/interactive`}>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    {t.cta_interactive}
                  </Link>
                </Button>

                {canAccessEditor && (
                  <Button onClick={handleEditorClick} size="lg" className="w-full sm:w-auto rounded-full bg-white/15 border border-white/30 px-10 py-7 text-base font-black text-white hover:bg-white/25 backdrop-blur-sm transition-all hover:scale-[1.02]">
                    {t.cta_editor}
                  </Button>
                )}

                {isAuthenticated && !canAccessEditor && (
                  <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-white/15 border border-white/30 px-10 py-7 text-base font-black text-white hover:bg-white/25 backdrop-blur-sm transition-all hover:scale-[1.02]">
                    <Link href={`/${locale}/subscription?reason=editor_access&current_role=${role}`}>{t.cta_unlock}</Link>
                  </Button>
                )}

                {!isAuthenticated && (
                  <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-white/15 border border-white/30 px-10 py-7 text-base font-black text-white hover:bg-white/25 backdrop-blur-sm transition-all hover:scale-[1.02]">
                    <Link href={`/${locale}/auth/signup`}>{t.cta_start}</Link>
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

        {/* Bottom gradient to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <style jsx global>{`
          @keyframes iam-left  { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(-50%,0,0); } }
          @keyframes iam-right { 0% { transform: translate3d(-50%,0,0); } 100% { transform: translate3d(0,0,0); } }
          .animate-iam-left  { animation: iam-left  180s linear infinite; }
          .animate-iam-right { animation: iam-right 180s linear infinite; }
        `}</style>
      </header>
    </>
  );
}
