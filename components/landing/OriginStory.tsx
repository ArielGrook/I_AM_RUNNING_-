'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Lightbulb, Rocket, Target, Zap } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';

export function OriginStory() {
  const t = useTranslations('Landing.origin');

  const timeline = [
    { icon: Lightbulb, label: 'Vision', year: '2022' },
    { icon: Target, label: 'Research', year: '2023' },
    { icon: Zap, label: 'Development', year: '2024' },
    { icon: Rocket, label: 'Launch', year: '2025' },
  ];

  return (
    <section className="py-24 bg-white dark:bg-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-100 to-transparent dark:from-orange-900/20 rounded-full blur-3xl opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <Reveal direction="left">
            <div className="space-y-6">
              <span className="inline-block text-sm font-semibold text-orange-500 uppercase tracking-wider">
                {t('eyebrow')}
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
                {t('title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('content')}
              </p>
              <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border-l-4 border-orange-500">
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200 italic">
                  "{t('highlight')}"
                </p>
              </div>
            </div>
          </Reveal>

          {/* Timeline visualization */}
          <Reveal direction="right">
            <div className="relative">
              {/* Founder placeholder */}
              <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 p-1 shadow-2xl">
                <div className="w-full h-full rounded-3xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-8xl mb-4">🏃‍♂️</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">Ariel Shein</div>
                    <div className="text-orange-500 font-medium">Founder & Developer</div>
                  </div>
                </div>
              </div>

              {/* Timeline dots */}
              <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-4">
                {timeline.map((item, idx) => (
                  <motion.div
                    key={item.label}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 mt-2">{item.year}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

