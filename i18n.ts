import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'ru', 'he', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'hi'] as const;
export const defaultLocale = 'en' as const;

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl 3.22+ — read locale from request path via requestLocale promise
  let locale = await requestLocale;

  // Fallback to default if missing or unsupported (e.g. GET / without locale prefix)
  if (!locale || !locales.includes(locale as typeof locales[number])) {
    locale = defaultLocale;
  }

  // Load messages with fallback to English
  let messages;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`./messages/${defaultLocale}.json`)).default;
  }

  // locale MUST be returned — required in next-intl 3.22+
  return { locale, messages };
});



