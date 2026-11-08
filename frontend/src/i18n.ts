import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'es', 'de', 'ar', 'zh', 'fr', 'it'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl 3.22+ pattern
  let locale = await requestLocale;

  // Validate locale, fall back to default
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
