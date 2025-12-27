'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const rows = ['time', 'cost', 'ai', 'system', 'export'];

export function PricingComparison() {
  const t = useTranslations('Landing.pricing');

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">{t('eyebrow')}</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">{t('headline')}</h2>
          <p className="text-muted-foreground mt-2">{t('sub')}</p>
        </div>
        <motion.div
          className="overflow-hidden rounded-2xl border bg-card shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="grid grid-cols-3 bg-muted text-sm font-semibold">
            <div className="px-4 py-3 text-left">{t('col.criteria')}</div>
            <div className="px-4 py-3 text-left text-primary">{t('col.ours')}</div>
            <div className="px-4 py-3 text-left">{t('col.theirs')}</div>
          </div>
          <div className="divide-y">
            {rows.map((key, i) => (
              <motion.div
                key={key}
                className="grid grid-cols-3 px-4 py-3 text-sm"
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="font-medium">{t(`${key}.label`)}</div>
                <div className="text-primary font-semibold">{t(`${key}.ours`)}</div>
                <div className="text-muted-foreground">{t(`${key}.theirs`)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}



