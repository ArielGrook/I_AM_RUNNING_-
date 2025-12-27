'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Zap, Clock, Rocket, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';

export function SpeedSection() {
  const t = useTranslations('Landing.speed');

  const steps = [
    { icon: Zap, key: 'concept', progress: 33 },
    { icon: Clock, key: 'design', progress: 66 },
    { icon: Rocket, key: 'launch', progress: 100 },
  ];

  return (
    <section className="py-24 bg-white dark:bg-black relative overflow-hidden">
      {/* Animated background lines */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent"
            style={{ top: `${20 + i * 15}%`, left: 0, right: 0 }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-orange-500 uppercase tracking-wider mb-4">
              {t('eyebrow')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
              {t('title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t('content')}
            </p>
          </div>
        </Reveal>

        {/* Speed visualization */}
        <Reveal>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 md:p-12 shadow-xl">
            {/* Timeline */}
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.key}
                  className="flex flex-col items-center text-center relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg mb-4">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {t(`metrics.${step.key}`)}
                  </span>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-12 top-8 w-8 h-8 text-orange-300" />
                  )}
                </motion.div>
              ))}

              {/* Connecting line (desktop) */}
              <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Time display */}
            <div className="text-center">
              <div className="inline-flex items-center gap-4 px-8 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <Clock className="w-8 h-8 text-orange-500" />
                <div className="text-left">
                  <div className="text-3xl md:text-4xl font-black text-orange-500">
                    {'<'}<AnimatedCounter from={60} to={30} duration={2000} /> {t('metrics.time').replace('< 30', '').trim()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Average build time</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Highlight */}
        <Reveal>
          <div className="mt-12 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white max-w-2xl mx-auto">
              <span className="text-orange-500">"</span>
              {t('highlight')}
              <span className="text-orange-500">"</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

