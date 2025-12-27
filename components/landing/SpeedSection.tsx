'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';

export function SpeedSection() {
  const t = useTranslations('Landing.speed');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const steps = [
    { icon: '⚡', label: t('concept') },
    { icon: '🎨', label: t('design') },
    { icon: '🚀', label: t('launch') },
  ];

  return (
    <section 
      className="py-24 bg-white dark:bg-black"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-sm font-semibold text-[#FF6B35] uppercase tracking-widest mb-4">
            {t('eyebrow')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('content')}
          </p>
        </motion.div>

        {/* Speed Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-10"
        >
          {/* Steps Timeline */}
          <div className={`flex justify-center items-center gap-4 md:gap-8 flex-wrap mb-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-4 md:gap-8">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, type: 'spring' }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30">
                    {step.icon}
                  </div>
                  <span className="mt-2 font-bold text-gray-900 dark:text-white">{step.label}</span>
                </motion.div>
                {i < steps.length - 1 && (
                  <span className={`text-3xl text-[#FF6B35] font-bold hidden md:block ${isRTL ? 'rotate-180' : ''}`}>→</span>
                )}
              </div>
            ))}
          </div>

          {/* Time Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 px-8 py-4 rounded-2xl shadow-xl">
              <span className="text-4xl">⏱️</span>
              <div>
                <div className="text-3xl font-black text-[#FF6B35]">{t('time')}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('timeLabel')}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-2xl font-bold text-gray-900 dark:text-white mt-10"
        >
          "{t('quote')}"
        </motion.p>
      </div>
    </section>
  );
}
