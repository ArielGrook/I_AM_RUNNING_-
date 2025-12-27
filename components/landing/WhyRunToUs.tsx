'use client';

import { BadgeCheck, Gauge, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const icons = [BadgeCheck, Gauge, ShieldCheck];

export function WhyRunToUs() {
  const t = useTranslations('Landing.why');
  const items = ['price', 'speed', 'quality'].map((key, idx) => ({
    title: t(`${key}.title`),
    desc: t(`${key}.desc`),
    Icon: icons[idx],
  }));

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">{t('eyebrow')}</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">{t('headline')}</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{t('phrase')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <item.Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


