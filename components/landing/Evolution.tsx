'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const list = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function Evolution() {
  const t = useTranslations('Landing.evolution');
  const milestones = ['genesis', 'lego', 'ai', 'breakthrough'].map((key) => ({
    title: t(`${key}.title`),
    detail: t(`${key}.detail`),
  }));

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">{t('eyebrow')}</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">{t('headline')}</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{t('phrase')}</p>
        </div>
        <motion.div
          className="grid md:grid-cols-4 gap-4"
          variants={list}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {milestones.map((m, i) => (
            <motion.div key={m.title} className="rounded-2xl border bg-card p-4 shadow-sm" variants={item}>
              <div className="text-sm text-primary font-semibold mb-2">{t('step', { index: i + 1 })}</div>
              <h3 className="text-lg font-semibold mb-1">{m.title}</h3>
              <p className="text-sm text-muted-foreground">{m.detail}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}



