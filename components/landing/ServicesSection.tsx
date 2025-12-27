'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight } from 'lucide-react';

export function ServicesSection() {
  const t = useTranslations('Landing.services');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const services = [
    { icon: '🌐', title: t('service1'), desc: t('service1Desc') },
    { icon: '🚀', title: t('service2'), desc: t('service2Desc') },
    { icon: '🔒', title: t('service3'), desc: t('service3Desc') },
    { icon: '👥', title: t('service4'), desc: t('service4Desc') },
    { icon: '🧠', title: t('service5'), desc: t('service5Desc') },
    { icon: '🎧', title: t('service6'), desc: t('service6Desc') },
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

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-3xl mb-3">{service.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{service.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{service.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Freelancer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-r from-[#FF6B35] via-[#FF4500] to-[#FF6B35] rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 text-white overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_3s_infinite] pointer-events-none" />
          
          <div className={`flex items-center gap-4 relative z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-5xl opacity-90">👥</span>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-lg mb-1">{t('freelancerCta')}</p>
              <div className="text-3xl font-black">{t('freelancerPrice')}</div>
            </div>
          </div>
          
          <Link
            href="/editor"
            className={`relative z-10 bg-white text-[#FF6B35] px-8 py-4 rounded-full font-bold hover:scale-105 hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t('getAccess')}
            <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
