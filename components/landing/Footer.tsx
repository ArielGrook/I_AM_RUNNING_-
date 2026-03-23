'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('Landing.footer');

  return (
    <footer className="bg-background border-t border-foreground/5 py-14 sm:py-18">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8">
          {/* Left: Logo + tagline */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/15">
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="8" r="4" fill="#FF6B35" opacity="0.8"/>
                <path d="M22 18l6-4 4 6-3 8-7 2-4 10h-4l5-13 3-2-2-5-6 3-4-2 7-3z" fill="#FF6B35" opacity="0.7"/>
                <path d="M29 28l3 5 8 3v3l-10-4-4-5" fill="#FF6B35" opacity="0.6"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-black tracking-[0.15em] uppercase text-foreground">{t('brand')}</div>
              <div className="text-xs text-foreground/40">{t('tagline')}</div>
            </div>
          </div>

          {/* Center: Links */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/privacy" className="text-foreground/40 hover:text-[#FF6B35] transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/terms" className="text-foreground/40 hover:text-[#FF6B35] transition-colors">
              {t('terms')}
            </Link>
            <Link href="mailto:hello@iamrunning.online" className="text-foreground/40 hover:text-[#FF6B35] transition-colors">
              {t('contact')}
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-foreground/5" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/30">
          <span>{t('copyright')}</span>
          <span>{t('author')}</span>
        </div>
      </div>
    </footer>
  );
}
