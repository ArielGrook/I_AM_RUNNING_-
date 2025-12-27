'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const locales = ['en', 'he', 'ru'] as const;

function replaceLocale(pathname: string, locale: string) {
  const parts = pathname.split('/');
  parts[1] = locale;
  return parts.join('/') || `/${locale}`;
}

export function LanguageSwitcher() {
  const pathname = usePathname() || '/en';
  const currentLocale = pathname.split('/')[1] || 'en';

  const links = useMemo(
    () =>
      locales.map((locale) => ({
        locale,
        href: replaceLocale(pathname, locale),
        active: locale === currentLocale,
      })),
    [pathname, currentLocale]
  );

  return (
    <div className="flex items-center gap-2 text-sm">
      {links.map((link) => (
        <Link
          key={link.locale}
          href={link.href}
          className={`px-2 py-1 rounded-md transition ${
            link.active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
          }`}
        >
          {link.locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}


