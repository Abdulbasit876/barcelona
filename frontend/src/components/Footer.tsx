'use client';

import React from 'react';
import Image from 'next/image';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Link } from '../navigation';
import { useTranslations } from 'next-intl';

export default function Footer({ locale }: { locale: string }) {
  const t = useTranslations('footer');

  const usefulLinks = [
    { href: '/', labelKey: 'home' },
    { href: '/about-us', labelKey: 'about' },
    { href: '/book', labelKey: 'bookTransfer' },
    { href: '/manage-booking', labelKey: 'trackRide' },
    { href: '/terms-and-conditions', labelKey: 'terms' },
    { href: '/privacy-policy', labelKey: 'privacy' },
    { href: '/cancellation-refund-policy', labelKey: 'cancellation' },
    { href: '/faq', labelKey: 'faq' },
  ];

  const ourServices = [
    { href: '/airport-transfers', labelKey: 'airportTransfers' },
    { href: '/cruise-port-transfers', labelKey: 'cruisePort' },
    { href: '/sants-station-transfers', labelKey: 'santsStation' },
    { href: '/city-tours', labelKey: 'cityTours' },
    { href: '/city-tours', labelKey: 'privateHourly' },
    { href: '/city-transfers', labelKey: 'groupTransfers' },
  ];

  return (
    <footer className="bg-[#F8F9FC] border-t border-gray-200">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="space-y-5">
            <Link href="/" className="inline-block">
              <div className="relative w-96 h-32 max-w-full">
                <Image
                  src="/logo.png"
                  alt="Barcelona Taxi Transfer"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="text-navy-950 font-black text-xs uppercase tracking-[0.15em] mb-4 pb-2 border-b-2 border-gold-500 inline-block">
              {t('quickLinks')}
            </h4>
            <ul className="space-y-2.5 mt-4">
              {usefulLinks.map((link) => (
                <li key={link.href + link.labelKey}>
                  <Link
                    href={link.href}
                    className="flex items-center text-gray-600 hover:text-gold-600 text-sm transition-colors group"
                  >
                    <span className="mr-2 text-gold-500 group-hover:translate-x-0.5 transition-transform">›</span>
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Services */}
          <div>
            <h4 className="text-navy-950 font-black text-xs uppercase tracking-[0.15em] mb-4 pb-2 border-b-2 border-gold-500 inline-block">
              {t('services')}
            </h4>
            <ul className="space-y-2.5 mt-4">
              {ourServices.map((svc, i) => (
                <li key={svc.href + i}>
                  <Link
                    href={svc.href}
                    className="flex items-center text-gray-600 hover:text-gold-600 text-sm transition-colors group"
                  >
                    <span className="mr-2 text-gold-500 group-hover:translate-x-0.5 transition-transform">›</span>
                    {t(svc.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-navy-950 font-black text-xs uppercase tracking-[0.15em] mb-4 pb-2 border-b-2 border-gold-500 inline-block">
              {t('support')}
            </h4>
            <div className="space-y-4 mt-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 text-sm">Barcelona</span>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <a href="tel:+34687433263" className="block text-sm text-gray-700 hover:text-gold-600 transition-colors">
                    +34 687 433 263 (Hamid)
                  </a>
                  <a href="tel:+34602194060" className="block text-sm text-gray-700 hover:text-gold-600 transition-colors">
                    +34 602 194 060 (Waqas)
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <a
                  href="mailto:bookings@barcelonataxitransfer.com"
                  className="text-gray-600 text-sm hover:text-gold-600 transition-colors break-all"
                >
                  bookings@barcelonataxitransfer.com
                </a>
              </div>

              {/* Payment methods */}
              <div className="pt-2">
                <p className="text-navy-950 font-bold text-xs uppercase tracking-wide mb-3 flex items-center">
                  <span className="w-4 h-0.5 bg-gold-500 mr-2" />
                  Accepted Payments
                </p>
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <div className="flex items-center justify-center w-10 h-7 rounded bg-[#1A1F71] px-1">
                    <span className="text-white font-black text-[9px] tracking-tight">VISA</span>
                  </div>
                  <div className="flex items-center justify-center w-10 h-7 rounded bg-white border border-gray-200 px-1">
                    <div className="flex">
                      <div className="w-4 h-4 rounded-full bg-red-600 opacity-90" />
                      <div className="w-4 h-4 rounded-full bg-orange-400 opacity-90 -ml-2" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-10 h-7 rounded bg-[#007BC1] px-1">
                    <span className="text-white font-black text-[8px] tracking-tight">AMEX</span>
                  </div>
                  <div className="flex items-center justify-center w-10 h-7 rounded bg-black px-1">
                    <span className="text-white font-bold text-[7px]"> Pay</span>
                  </div>
                  <div className="flex items-center justify-center w-10 h-7 rounded bg-white border border-gray-200 px-1">
                    <span className="text-gray-700 font-bold text-[7px]">G Pay</span>
                  </div>
                </div>
                <p className="text-gray-400 text-[10px] mt-2">256-Bit SSL Encrypted & PCI-DSS Certified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — navy */}
      <div className="bg-navy-950 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-ice-300 space-y-2 sm:space-y-0">
          <p>© {new Date().getFullYear()} Barcelona Taxi Transfer. {t('rights')}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <Link href="/privacy-policy" className="hover:text-gold-400 transition-colors">{t('privacy')}</Link>
            <span className="text-navy-700">•</span>
            <Link href="/terms-and-conditions" className="hover:text-gold-400 transition-colors">{t('terms')}</Link>
            <span className="text-navy-700">•</span>
            <Link href="/cancellation-refund-policy" className="hover:text-gold-400 transition-colors">{t('cancellation')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
