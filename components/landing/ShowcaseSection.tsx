'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';

export function ShowcaseSection() {
  const t = useTranslations('Landing.showcase');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const features = [
    { icon: '🧠', title: t('feature1'), desc: t('feature1Desc'), color: 'from-purple-500 to-pink-500' },
    { icon: '📚', title: t('feature2'), desc: t('feature2Desc'), color: 'from-blue-500 to-cyan-500' },
    { icon: '🚀', title: t('feature3'), desc: t('feature3Desc'), color: 'from-[#FF6B35] to-[#FF4500]' },
    { icon: '⚙️', title: t('feature4'), desc: t('feature4Desc'), color: 'from-green-500 to-emerald-500' },
    { icon: '📱', title: t('feature5'), desc: t('feature5Desc'), color: 'from-indigo-500 to-purple-500' },
    { icon: '🔍', title: t('feature6'), desc: t('feature6Desc'), color: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <section 
      className="py-24 bg-black text-white"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-sm font-semibold text-[#FFA500] uppercase tracking-widest mb-4">
            {t('eyebrow')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            {t('title')}
          </h2>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center items-center gap-4 md:gap-6 flex-wrap mb-12"
        >
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-center">
            <div className="text-4xl font-black text-[#FFA500]">20</div>
            <div className="text-sm opacity-70">{t('styles')}</div>
          </div>
          <span className="text-3xl font-bold text-[#FFA500]">×</span>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-center">
            <div className="text-4xl font-black text-[#FFA500]">49</div>
            <div className="text-sm opacity-70">{t('tags')}</div>
          </div>
          <span className="text-3xl font-bold text-[#FFA500]">=</span>
          <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF4500] rounded-xl px-6 py-4 text-center">
            <div className="text-4xl font-black">980+</div>
            <div className="text-sm opacity-90">{t('combinations')}</div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
              <p className="text-sm opacity-60">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
