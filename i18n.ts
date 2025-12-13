import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'ru', 'he', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'hi'] as const;
export const defaultLocale = 'en' as const;

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Load messages with fallback to English
  let messages;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch {
    // Fallback to English if translation file doesn't exist
    messages = (await import(`./messages/${defaultLocale}.json`)).default;
  }

  return { messages };
});



