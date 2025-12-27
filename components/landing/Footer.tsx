'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export function Footer() {
  const t = useTranslations('Landing.footer');

  return (
    <footer className="bg-black text-white py-16 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-900/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3"
          >
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-2xl shadow-lg">
              🏃‍♂️
            </div>
            <div>
              <h3 className="text-2xl font-black text-orange-500">{t('brand')}</h3>
              <p className="text-sm text-gray-400">{t('tagline')}</p>
            </div>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-400"
          >
            <Link href="/privacy" className="hover:text-orange-400 transition-colors">
              {t('links.privacy')}
            </Link>
            <Link href="/terms" className="hover:text-orange-400 transition-colors">
              {t('links.terms')}
            </Link>
            <Link href="/contact" className="hover:text-orange-400 transition-colors">
              {t('links.contact')}
            </Link>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"
          />

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <p className="text-gray-500">{t('copyright')}</p>
            <p className="text-gray-600 text-sm">{t('author')}</p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
