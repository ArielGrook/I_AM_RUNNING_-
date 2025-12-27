'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const styles = [
  'modern_dark',
  'modern_light',
  'modern_gradient',
  'classic_white',
  'classic_elegant',
  'minimal_dark',
  'minimal_light',
  'corporate_blue',
  'corporate_gray',
  'creative_colorful',
  'creative_artistic',
  'vintage_retro',
  'tech_neon',
  'medical_clean',
  'restaurant_warm',
  'fashion_elegant',
  'ecommerce_modern',
  'blog_readable',
  'portfolio_showcase',
  'custom_authored',
];

const card = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.03 } }),
};

export function ComponentShowcase() {
  const t = useTranslations('Landing.showcase');
  const tags = 49;

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">{t('eyebrow')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2">{t('headline')}</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">{t('sub')}</p>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            <div className="font-semibold text-foreground">{t('styles', { count: styles.length })}</div>
            <div>{t('tags', { count: tags })}</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {styles.map((style, i) => (
            <motion.div
              key={style}
              className="rounded-xl border bg-card p-4 shadow-sm text-sm hover:-translate-y-1 hover:shadow-md transition"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              custom={i}
              variants={card}
            >
              <div className="font-semibold capitalize">{style.replace(/_/g, ' ')}</div>
              <div className="text-muted-foreground text-xs mt-1">{t('tagline')}</div>
            </motion.div>
          ))}
          <motion.div
            className="rounded-xl border bg-primary/5 p-4 shadow-sm text-sm border-primary/30 hover:-translate-y-1 hover:shadow-md transition"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.2 }}
          >
            <div className="font-semibold text-primary">+ {tags} tags</div>
            <div className="text-primary/80 text-xs mt-1">{t('tagsSub')}</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}



