'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, Globe, ChevronDown, Calendar } from 'lucide-react';
import { Link, locales } from '../navigation';

const LANGUAGE_LABELS: Record<string, { name: string; flag: string; short: string }> = {
  en: { name: 'English', flag: '🇬🇧', short: 'EN' },
  es: { name: 'Español', flag: '🇪🇸', short: 'ES' },
  de: { name: 'Deutsch', flag: '🇩🇪', short: 'DE' },
  ar: { name: 'العربية', flag: '🇸🇦', short: 'AR' },
  zh: { name: '中文', flag: '🇨🇳', short: 'ZH' },
  fr: { name: 'Français', flag: '🇫🇷', short: 'FR' },
  it: { name: 'Italiano', flag: '🇮🇹', short: 'IT' },
};

export default function Header({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const switchLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/') || `/${newLocale}`;
    router.push(newPath);
    setLangMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/about-us', label: t('about') },
    { href: '/airport-transfers', label: t('airport') },
    { href: '/city-tours', label: t('tours') },
    { href: '/fleet', label: t('fleet') },
    { href: '/manage-booking', label: t('manageBooking') },
    { href: '/contact-us', label: t('contact') },
  ];

  return (
    <>
      {/* Floating pill header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 transition-all duration-500 ${
          scrolled ? 'pt-2' : 'pt-4'
        }`}
      >
        <div
          className={`w-full max-w-6xl flex items-center justify-between px-4 py-2 rounded-full transition-all duration-500 ${
            scrolled
              ? 'bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-100'
              : 'bg-white/90 backdrop-blur-md shadow-xl border border-white/60'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center group flex-shrink-0">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <Image
                src="/logo-b.png"
                alt="Barcelona Taxi Transfer"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === `/${locale}${link.href === '/' ? '' : link.href}`;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-navy-950 text-white'
                      : 'text-navy-800 hover:text-navy-950 hover:bg-navy-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-navy-800 hover:bg-gray-200 text-[12px] font-semibold transition-all"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-navy-600" />
                <span>{LANGUAGE_LABELS[locale]?.flag} {LANGUAGE_LABELS[locale]?.short}</span>
                <ChevronDown className="w-3 h-3 text-navy-500" />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-gray-100 shadow-2xl py-1.5 z-50 overflow-hidden">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => switchLanguage(loc)}
                      className={`w-full flex items-center space-x-2.5 px-4 py-2 text-[12px] text-left transition-colors ${
                        locale === loc
                          ? 'bg-navy-950 text-white font-semibold'
                          : 'text-navy-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base">{LANGUAGE_LABELS[loc]?.flag}</span>
                      <span>{LANGUAGE_LABELS[loc]?.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Book Now gold button */}
            <Link
              href="/book"
              className="flex items-center px-4 py-2 rounded-full text-[13px] font-bold bg-gold-500 hover:bg-gold-400 text-navy-950 shadow-md hover:shadow-lg transition-all duration-200 group"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
              {t('bookNow')}
            </Link>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-gray-100 text-navy-800 hover:bg-gray-200 transition-all"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-3 right-3 sm:left-4 sm:right-4 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[85vh] overflow-y-auto">
            <nav className="flex flex-col p-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-navy-800 hover:bg-navy-950 hover:text-white transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 px-2 pt-2 pb-1 border-t border-gray-100">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => { switchLanguage(loc); setMobileMenuOpen(false); }}
                    className={`text-center py-2 rounded-xl text-[11px] font-bold transition-all ${
                      locale === loc ? 'bg-navy-950 text-white' : 'bg-gray-100 text-navy-700'
                    }`}
                  >
                    {LANGUAGE_LABELS[loc]?.flag} {loc.toUpperCase()}
                  </button>
                ))}
              </div>
              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 mx-2 py-3 rounded-xl text-[13px] font-bold bg-gold-500 text-navy-950 text-center hover:bg-gold-400 transition-all"
              >
                Book Now
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Backdrop for dropdowns */}
      {(langMenuOpen || mobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setLangMenuOpen(false); setMobileMenuOpen(false); }}
        />
      )}
    </>
  );
}
