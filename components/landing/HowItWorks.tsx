'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.45 } }),
};

export function HowItWorks() {
  const t = useTranslations('Landing.how');
  const steps = ['describe', 'generate', 'customize'].map((key, idx) => ({
    title: t(`${key}.title`),
    detail: t(`${key}.detail`),
    accent: `0${idx + 1}`,
  }));

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">{t('eyebrow')}</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">{t('headline')}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="rounded-2xl border bg-card p-6 shadow-sm"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              custom={i}
              variants={variants}
            >
              <div className="text-primary text-sm font-semibold">{step.accent}</div>
              <h3 className="text-xl font-semibold mt-2 mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



