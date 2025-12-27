'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';

export function TechnologySection() {
  const t = useTranslations('Landing.technology');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const features = [
    { icon: '🧩', title: t('feature1') },
    { icon: '🛡️', title: t('feature2') },
    { icon: '⚙️', title: t('feature3') },
  ];

  const competitors = ['Wix', 'Squarespace', 'Webflow', 'WordPress'];

  return (
    <section 
      className="py-24 bg-gray-50 dark:bg-black"
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

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{feature.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* Security Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF4500] rounded-2xl p-8 flex items-center gap-6 mb-8 text-white"
        >
          <span className="text-4xl">🔒</span>
          <p className="text-xl font-medium">{t('highlight')}</p>
        </motion.div>

        {/* Competitors Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg"
        >
          <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
            {competitors.map((comp) => (
              <span key={comp} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
                {comp}
              </span>
            ))}
            <span className="text-gray-400 font-semibold">vs</span>
            <span className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] rounded-full text-sm font-bold text-white">
              I AM RUNNING
            </span>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300">
            {t('comparisonIntro')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
