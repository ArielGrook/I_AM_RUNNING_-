'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ParticleField } from '@/components/motion/Particles';
import { TypewriterText } from '@/components/motion/TypewriterText';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { DevFpsCounter } from '@/components/motion/DevFpsCounter';

export function HeroSection() {
  const t = useTranslations('Landing.hero');

  // Build subheadline with highlighted words
  const subParts = t('subheadline')
    .replace('{quality}', `<span class="text-orange-300 font-bold">${t('quality')}</span>`)
    .replace('{speed}', `<span class="text-orange-300 font-bold">${t('speed')}</span>`)
    .replace('{price}', `<span class="text-orange-300 font-bold">${t('price')}</span>`);

  return (
    <header className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FF4500] via-[#FF6B35] to-[#FF4500] text-white">
      {/* Animated background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <ParticleField />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.4),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.3),transparent_35%)]" />
        <div className="absolute inset-0 gradient-wave opacity-30" />
      </div>

      {/* Dev FPS Counter */}
      <DevFpsCounter />

      {/* Header Nav */}
      <nav className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold shadow-lg backdrop-blur-sm">
            🏃‍♂️
          </div>
          <div>
            <div className="text-lg font-bold tracking-wide">I AM RUNNING</div>
            <div className="text-xs text-white/80">AI-Powered Builder</div>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            asChild
            className="hidden sm:inline-flex bg-white text-[#FF4500] hover:bg-white/90 font-semibold shadow-lg"
          >
            <Link href="/editor">
              {t('cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Intro text */}
          <motion.p
            className="text-lg sm:text-xl text-white/90 font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {t('intro')}
          </motion.p>

          {/* Main headline with typewriter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-tight">
              <TypewriterText
                text={t('headline')}
                speed={80}
                className="text-shimmer"
                highlightWords={['STOP', 'CHASING', 'ХВАТИТ', 'ГОНЯТЬСЯ', 'מספיק', 'לרדוף']}
                highlightClassName="text-orange-200"
              />
            </h1>
          </motion.div>

          {/* Subheadline with highlighted keywords */}
          <motion.p
            className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            dangerouslySetInnerHTML={{ __html: subParts }}
          />

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Button
              asChild
              size="lg"
              className="px-10 py-7 text-xl font-bold bg-white text-[#FF4500] hover:bg-white/90 shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300 breathing-btn rounded-full"
            >
              <Link href="/editor">
                {t('cta')}
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-4 sm:gap-8 pt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <StatCard
              value={1000}
              suffix="+"
              label={t('stats.websitesLabel')}
            />
            <StatCard
              value={30}
              prefix="<"
              suffix="min"
              label={t('stats.timeLabel')}
            />
            <StatCard
              value={500}
              prefix="$"
              suffix="+"
              label={t('stats.savingsLabel')}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-black to-transparent" />
    </header>
  );
}

function StatCard({
  value,
  prefix = '',
  suffix = '',
  label,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg">
      <div className="text-2xl sm:text-4xl font-black text-white">
        {prefix}
        <AnimatedCounter from={0} to={value} duration={2000} />
        {suffix}
      </div>
      <div className="text-xs sm:text-sm text-white/80 mt-1">{label}</div>
    </div>
  );
}
