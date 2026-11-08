import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['en', 'es', 'de', 'ar', 'zh', 'fr', 'it'] as const;
export const defaultLocale = 'en' as const;

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
