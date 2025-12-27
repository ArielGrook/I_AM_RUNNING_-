'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Globe, Rocket, Shield, Users, Brain, Headphones, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Floating } from '@/components/motion/Floating';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ServicesSection() {
  const t = useTranslations('Landing.services');

  const features = [
    { icon: Globe, key: 'assembly' },
    { icon: Rocket, key: 'deployment' },
    { icon: Shield, key: 'ssl' },
    { icon: Users, key: 'freelancer' },
    { icon: Brain, key: 'ai' },
    { icon: Headphones, key: 'support' },
  ];

  return (
    <section className="py-24 bg-white dark:bg-black relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-50/50 to-transparent dark:via-orange-900/10 pointer-events-none" />

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

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, idx) => (
            <Reveal key={feature.key} delay={idx * 0.1}>
              <Floating delay={idx * 0.2} amplitude={3}>
                <motion.div
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  {/* Background glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-red-500/0 group-hover:from-orange-400/5 group-hover:to-red-500/5 transition-all duration-300" />

                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        {t(`features.${feature.key}.title`)}
                        {feature.key === 'ssl' && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                            FREE
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t(`features.${feature.key}.desc`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Floating>
            </Reveal>
          ))}
        </div>

        {/* Freelancer CTA */}
        <Reveal>
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <Users className="w-12 h-12 mb-4 mx-auto md:mx-0 opacity-90" />
                <p className="text-xl md:text-2xl font-medium mb-2">
                  {t('freelancerCta')}
                </p>
                <p className="text-3xl md:text-4xl font-black">
                  {t('freelancerPrice')}
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-white text-orange-500 hover:bg-white/90 font-bold px-8 py-6 text-lg shadow-lg"
              >
                <Link href="/editor">
                  Get Access
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

