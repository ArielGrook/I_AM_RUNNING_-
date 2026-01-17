'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export function Footer() {
  const t = useTranslations('Landing.footer');
  const locale = useLocale();
  const isRTL = locale === 'he';

  return (
    <footer 
      className="py-12 sm:py-16 bg-black text-white"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Logo */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <span className="text-4xl sm:text-5xl">🏃‍♂️</span>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-xl sm:text-2xl font-black text-[#FF6B35]">{t('brand')}</h3>
            <p className="text-sm text-gray-400">{t('tagline')}</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-8">
          <Link href="/privacy" className="text-gray-400 hover:text-[#FF6B35] transition-colors text-sm">
            {t('privacy')}
          </Link>
          <Link href="/terms" className="text-gray-400 hover:text-[#FF6B35] transition-colors text-sm">
            {t('terms')}
          </Link>
          <Link href="/contact" className="text-gray-400 hover:text-[#FF6B35] transition-colors text-sm">
            {t('contact')}
          </Link>
        </div>

        {/* Divider */}
        <div className="w-full max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-8" />

        {/* Copyright */}
        <p className="text-gray-500 text-sm mb-2">{t('copyright')}</p>
        <p className="text-gray-600 text-xs">{t('author')}</p>
      </div>
    </footer>
  );
}
