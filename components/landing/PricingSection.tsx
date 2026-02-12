'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PricingSection() {
  const t = useTranslations('Landing.pricing');
  const locale = useLocale();

  const comparisons = [
    { label: t('buildSpeed'), us: t('buildSpeedUs'), them: t('buildSpeedThem') },
    { label: t('avgCost'), us: t('avgCostUs'), them: t('avgCostThem') },
    { label: t('aiGen'), us: t('aiGenUs'), them: t('aiGenThem') },
    { label: t('components'), us: t('componentsUs'), them: t('componentsThem') },
  ];

  return (
    <section 
      className="py-16 sm:py-24 bg-gray-50 dark:bg-black"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-sm font-semibold text-[#FF6B35] uppercase tracking-widest mb-4">
            {t('eyebrow')}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('content')}
          </p>
        </motion.div>

        {/* Savings Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 sm:px-10 sm:py-6 rounded-2xl shadow-xl">
            <span className="text-4xl sm:text-5xl">💰</span>
            <div>
              <div className="text-3xl sm:text-4xl font-black">{t('savings')}</div>
              <div className="text-base sm:text-lg opacity-90">{t('savingsLabel')}</div>
            </div>
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-[#262626] rounded-2xl shadow-xl overflow-hidden max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="hidden sm:grid grid-cols-3 bg-gray-50 dark:bg-[#525151] border-b-2 border-gray-200 dark:border-[#525151]">
            <div className="p-4 font-bold text-gray-500 dark:text-gray-400">{t('featureLabel')}</div>
            <div className="p-4 font-bold text-emerald-600">{t('us')}</div>
            <div className="p-4 font-bold text-gray-500 dark:text-gray-400">{t('competitors')}</div>
          </div>

          {/* Rows */}
          {comparisons.map((row, i) => (
            <div
              key={row.label}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="p-4 font-medium text-gray-900 dark:text-white">
                <span className="sm:hidden block text-xs uppercase tracking-wide text-gray-400 mb-1">
                  {t('featureLabel')}
                </span>
                {row.label}
              </div>
              <div className="p-4 text-emerald-600 font-bold flex items-center gap-2">
                <span className="sm:hidden block text-xs uppercase tracking-wide text-gray-400">
                  {t('us')}
                </span>
                <Check className="w-5 h-5" />
                {row.us}
              </div>
              <div className="p-4 text-gray-400 flex items-center gap-2">
                <span className="sm:hidden block text-xs uppercase tracking-wide text-gray-400">
                  {t('competitors')}
                </span>
                <X className="w-5 h-5 text-red-400" />
                {row.them}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <div className="inline-block px-8 py-4 bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
            <p className="text-xl font-bold text-[#FF6B35]">{t('highlight')}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Link href={`/${locale}/subscription`}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-full">
              {t('upgradePlan')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
