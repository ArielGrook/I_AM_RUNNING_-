'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Shield, Blocks, Server, Lock, CheckCircle } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Floating } from '@/components/motion/Floating';

export function TechnologySection() {
  const t = useTranslations('Landing.technology');

  const features = [
    { icon: Blocks, key: 'components' },
    { icon: Shield, key: 'security' },
    { icon: Server, key: 'backend' },
  ];

  const competitors = ['Wix', 'Squarespace', 'Webflow', 'WordPress'];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
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

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, idx) => (
            <Reveal key={feature.key} delay={idx * 0.1}>
              <Floating delay={idx * 0.3}>
                <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 card-tilt">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {t(`features.${feature.key}`)}
                  </h3>
                  <div className="w-12 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full" />
                </div>
              </Floating>
            </Reveal>
          ))}
        </div>

        {/* Highlight box */}
        <Reveal>
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-16">
            <div className="flex items-start gap-4">
              <Lock className="w-8 h-8 flex-shrink-0 mt-1" />
              <div>
                <p className="text-xl md:text-2xl font-medium leading-relaxed">
                  {t('highlight')}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Competitor comparison */}
        <Reveal>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              {competitors.map((comp, idx) => (
                <motion.span
                  key={comp}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  {comp}
                </motion.span>
              ))}
              <span className="text-gray-400 dark:text-gray-500">vs</span>
              <motion.span
                className="px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full text-sm font-bold text-white shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                I AM RUNNING
              </motion.span>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('comparison')}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

