'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, X, DollarSign } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';

export function PricingSection() {
  const t = useTranslations('Landing.pricing');

  const rows = ['speed', 'cost', 'ai', 'components'];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
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

        {/* Savings highlight */}
        <Reveal>
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-4 px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl text-white shadow-xl">
              <DollarSign className="w-12 h-12" />
              <div>
                <div className="text-4xl md:text-5xl font-black">
                  <AnimatedCounter from={0} to={500} duration={2000} />+
                </div>
                <div className="text-lg opacity-90">Average Savings</div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Comparison table */}
        <Reveal>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="font-bold text-gray-500 dark:text-gray-400">
                {t('comparison.feature')}
              </div>
              <div className="text-center">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-full">
                  {t('comparison.us')}
                </span>
              </div>
              <div className="text-center font-bold text-gray-500 dark:text-gray-400">
                {t('comparison.others')}
              </div>
            </div>

            {/* Rows */}
            {rows.map((row, idx) => (
              <motion.div
                key={row}
                className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t(`comparison.${row}`)}
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                    <Check className="w-5 h-5" />
                    {t(`comparison.${row}Us`)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-2 text-gray-400">
                    <X className="w-5 h-5" />
                    {t(`comparison.${row}Others`)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* Highlight */}
        <Reveal>
          <div className="mt-12 text-center">
            <div className="inline-block p-6 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border-2 border-orange-200 dark:border-orange-800">
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {t('highlight')}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

