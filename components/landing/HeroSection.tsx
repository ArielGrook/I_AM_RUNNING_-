'use client';

import Link from 'next/link';
import { ArrowRight, PlayCircle, Rocket, Zap } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ParticleField } from '@/components/motion/Particles';
import { DevFpsCounter } from '@/components/motion/DevFpsCounter';
import { TypewriterText } from '@/components/motion/TypewriterText';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { ComponentAssembly } from '@/components/motion/ComponentAssembly';

const gradient = 'bg-gradient-to-br from-[#FF4500] via-[#FF6B35] to-[#FF4500]';

export function HeroSection() {
  const t = useTranslations('Landing.hero');
  const [counts, setCounts] = useState({ price: 20, speed: 0, styles: 0 });
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const inView = useInView(heroRef, { once: true, margin: '-20% 0px' });
  const [particleDensity, setParticleDensity] = useState({ desktop: 90, mobile: 30 });

  useEffect(() => {
    if (!inView || prefersReducedMotion) return;
    let frame: number;
    const start = performance.now();
    const duration = 1400;
    const animate = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setCounts({
        price: Math.round(20 + p * 180), // to 200
        speed: Math.max(1, Math.round(p * 30)),
        styles: Math.round(p * 20),
      });
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [inView, prefersReducedMotion]);

  useEffect(() => {
    const updateDensity = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setParticleDensity({ desktop: 100, mobile: mobile ? 30 : 100 });
      if (process.env.NODE_ENV === 'development') {
        console.log('[Hero] particle density set', mobile ? 'mobile' : 'desktop');
      }
    };
    updateDensity();
    window.addEventListener('resize', updateDensity);
    return () => window.removeEventListener('resize', updateDensity);
  }, []);

  return (
    <header ref={heroRef} className={`relative overflow-hidden ${gradient} text-white`}>
      <ParticleField countDesktop={particleDensity.desktop} countMobile={particleDensity.mobile} className="z-0" />
      <div className="wave-layer fast" />
      <div className="wave-layer" />
      <div className="wave-layer slow" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between relative z-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center text-lg font-bold shadow-lg">
            🏃‍♂️
          </div>
          <div>
            <div className="text-sm uppercase tracking-widest text-white/80">I AM RUNNING</div>
            <div className="text-xs text-white/70">{t('triple')}</div>
          </div>
        </motion.div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/editor"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white text-[#2D2D2D] px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition"
          >
            {t('ctaHeader')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-6"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow"
              variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}
            >
              <Zap className="h-4 w-4" /> {t('badge')}
            </motion.div>
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <TypewriterText
                text={t('headline1')}
                speed={55}
                highlightWords={['Stop', 'Running']}
                className="block shimmer-text"
              />
              <span className="block text-orange-200 mt-1">
                <TypewriterText text={t('headline2')} speed={65} startDelay={400} />
              </span>
            </motion.h1>
            <motion.p
              className="text-lg text-white/80 max-w-2xl"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              {t('subheadline')}
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <Button
                asChild
                size="lg"
                className="px-8 py-6 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] breathing glow-ring"
              >
                <Link href="/editor">
                  {t('ctaPrimary')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="px-8 py-6 text-lg bg-white/15 text-white border border-white/30 hover:bg-white/25"
                asChild
              >
                <Link href="#demo">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  {t('ctaSecondary')}
                </Link>
              </Button>
            </motion.div>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-white/80"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <Stat
                label={t('statPrice.label')}
                detail={t('statPrice.detail')}
                value={<AnimatedCounter from={20} to={200} prefix="$" duration={1400} onInView progressBar progressColor="#FF6B35" />}
              />
              <Stat
                label={t('statSpeed.label')}
                detail={t('statSpeed.detail')}
                value={<AnimatedCounter from={60} to={30} suffix=" min" duration={1400} onInView />}
              />
              <Stat
                label={t('statQuality.label')}
                detail={t('statQuality.detail')}
                value={<AnimatedCounter from={0} to={20} suffix=" styles" duration={1400} onInView />}
              />
            </motion.div>
          </motion.div>
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          >
            <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-[#FFA500] blur-3xl opacity-60" />
            <div className="absolute -right-8 bottom-8 h-20 w-20 rounded-full bg-white blur-3xl opacity-20" />
            <div className="relative rounded-3xl bg-white/10 border border-white/20 shadow-2xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4 text-sm text-white/80">
                <span>{t('assembly')}</span>
                <Rocket className="h-5 w-5 text-orange-200" />
              </div>
              <ComponentAssembly
                items={[
                  { label: 'Hero block' },
                  { label: 'Navigation' },
                  { label: 'Features' },
                  { label: 'CTA strip' },
                  { label: 'Footer' },
                ]}
              />
              <div className="mt-6 text-center text-sm text-white/80">{t('footer')}</div>
            </div>
          </motion.div>
        </div>
      </div>
      {process.env.NODE_ENV !== 'production' && <DevFpsCounter />}
    </header>
  );
}

function Stat({ label, value, detail }: { label: string; value: React.ReactNode; detail: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-white/70">{label}</div>
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="text-xs text-white/70">{detail}</div>
    </div>
  );
}



