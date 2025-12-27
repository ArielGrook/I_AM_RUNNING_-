'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';

export function OriginStory() {
  const t = useTranslations('Landing.origin');
  const locale = useLocale();
  const isRTL = locale === 'he';

  return (
    <section 
      className="py-24 bg-white dark:bg-black"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold text-[#FF6B35] uppercase tracking-widest mb-4">
              {t('eyebrow')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6">
              {t('title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {t('content')}
            </p>
            <div className={`p-6 bg-gradient-to-r ${isRTL ? 'from-orange-50 border-r-4' : 'from-orange-50 border-l-4'} dark:from-orange-950/30 border-[#FF6B35] rounded-r-xl`}>
              <p className="text-lg italic text-gray-700 dark:text-gray-200">
                "{t('highlight')}"
              </p>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Founder Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 rounded-3xl p-10 text-center border-2 border-[#FF6B35] shadow-xl">
              <div className="text-7xl mb-4">🏃‍♂️</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{t('founderName')}</div>
              <div className="text-[#FF6B35] font-semibold">{t('founderTitle')}</div>
            </div>

            {/* Timeline */}
            <div className="flex justify-center gap-3 flex-wrap">
              {[
                { year: '2022', label: t('year2022') },
                { year: '2023', label: t('year2023') },
                { year: '2024', label: t('year2024') },
                { year: '2025', label: t('year2025') },
              ].map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex flex-col items-center px-4 py-3 bg-gradient-to-br from-[#FF6B35] to-[#FF4500] rounded-xl text-white shadow-lg"
                >
                  <span className="font-bold text-sm">{item.year}</span>
                  <span className="text-xs opacity-90">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
