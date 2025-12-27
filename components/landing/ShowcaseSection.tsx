'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Brain, Layers, Rocket, Server, Smartphone, Search, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Floating } from '@/components/motion/Floating';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';

export function ShowcaseSection() {
  const t = useTranslations('Landing.showcase');

  const features = [
    { icon: Brain, key: 'ai', color: 'from-purple-400 to-pink-500' },
    { icon: Layers, key: 'styles', color: 'from-blue-400 to-cyan-500' },
    { icon: Rocket, key: 'deploy', color: 'from-orange-400 to-red-500' },
    { icon: Server, key: 'backend', color: 'from-green-400 to-emerald-500' },
    { icon: Smartphone, key: 'mobile', color: 'from-indigo-400 to-purple-500' },
    { icon: Search, key: 'seo', color: 'from-yellow-400 to-orange-500' },
  ];

  return (
    <section className="py-24 bg-gray-900 dark:bg-black relative overflow-hidden text-white">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10" />
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(255,107,53,0.1) 0%, transparent 50%)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4" />
              {t('eyebrow')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              {t('title')}
            </h2>
          </div>
        </Reveal>

        {/* Stats highlight */}
        <Reveal>
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <div className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-4xl font-black text-orange-400">
                <AnimatedCounter from={0} to={20} duration={1500} />
              </div>
              <div className="text-sm text-white/70">Professional Styles</div>
            </div>
            <div className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-4xl font-black text-orange-400">×</div>
              <div className="text-sm text-white/70">&nbsp;</div>
            </div>
            <div className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-4xl font-black text-orange-400">
                <AnimatedCounter from={0} to={49} duration={1500} />
              </div>
              <div className="text-sm text-white/70">Smart Tags</div>
            </div>
            <div className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-4xl font-black text-orange-400">=</div>
              <div className="text-sm text-white/70">&nbsp;</div>
            </div>
            <div className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
              <div className="text-4xl font-black">
                <AnimatedCounter from={0} to={980} duration={2000} />+
              </div>
              <div className="text-sm text-white/90">Combinations</div>
            </div>
          </div>
        </Reveal>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Reveal key={feature.key} delay={idx * 0.1}>
              <Floating delay={idx * 0.15} amplitude={4}>
                <motion.div
                  className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                  <div className="relative z-10 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {t(`features.${feature.key}.title`)}
                      </h3>
                      <p className="text-sm text-white/60">
                        {t(`features.${feature.key}.desc`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Floating>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

