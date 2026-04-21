'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { RunnerSVG } from '@/components/ui/RunnerSVG';

export function Footer() {
  const t = useTranslations('Landing.footer');

  return (
    <footer className="bg-background border-t border-foreground/5 py-12">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <RunnerSVG size={22} color="#FF6B35" />
            <div>
              <div className="text-xs font-black tracking-[0.15em] uppercase text-foreground">{t('brand')}</div>
              <div className="text-[10px] text-foreground/35">{t('tagline')}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/privacy" className="text-foreground/35 hover:text-[#FF6B35] transition-colors">{t('privacy')}</Link>
            <Link href="/terms" className="text-foreground/35 hover:text-[#FF6B35] transition-colors">{t('terms')}</Link>
            <Link href="mailto:hello@iamrunning.online" className="text-foreground/35 hover:text-[#FF6B35] transition-colors">{t('contact')}</Link>
          </div>
        </div>

        <div className="my-6 h-px bg-foreground/5" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground/25">
          <span>{t('copyright')}</span>
          <span>CEO Ariel Shein</span>
        </div>
      </div>
    </footer>
  );
}
