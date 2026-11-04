'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Plane, Anchor, Train, Compass, Crown, Users, Briefcase, ArrowUpRight } from 'lucide-react';
import { Link } from '../navigation';

export default function ServicesSection({ locale }: { locale: string }) {
  const t = useTranslations('services');

  const services = [
    {
      key: 'airport',
      icon: Plane,
      href: '/airport-transfers',
      badge: 'BCN Terminals 1 & 2',
      pricing: 'From €3.00/km (60 mins free wait)',
    },
    {
      key: 'cruise',
      icon: Anchor,
      href: '/cruise-port-transfers',
      badge: 'Moll Adossat Piers A-E',
      pricing: 'Sedan €42 | Van €70 Fixed Fare',
    },
    {
      key: 'sants',
      icon: Train,
      href: '/sants-station-transfers',
      badge: 'AVE / Ouigo High Speed',
      pricing: 'Sedan €32 | Van €45 Fixed Fare',
    },
    {
      key: 'tours',
      icon: Compass,
      href: '/city-tours',
      badge: 'Bespoke Sightseeing',
      pricing: '€65 / hour (Metropolitan area)',
    },
    {
      key: 'executive',
      icon: Crown,
      href: '/fleet',
      badge: 'Mercedes-Benz E & S-Class',
      pricing: 'VIP Chauffeur Service',
    },
    {
      key: 'group',
      icon: Users,
      href: '/custom-quote',
      badge: 'Up to 55+ Passengers',
      pricing: 'Minivans & Luxury Coaches',
    },
    {
      key: 'company',
      icon: Briefcase,
      href: '/book',
      badge: 'Corporate & Business',
      pricing: '€65 / hour',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-navy-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Tailored European Transport
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            {t('title')}
          </h2>
          <p className="text-sm sm:text-base text-ice-300">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="navy-card rounded-2xl p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-navy-900 border border-gold-500/30 flex items-center justify-center text-gold-400 group-hover:bg-gold-500 group-hover:text-navy-950 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide text-gold-300 bg-navy-900/80 border border-gold-500/20 px-3 py-1 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                    {t(`${item.key}.title` as any)}
                  </h3>
                  <p className="text-xs sm:text-sm text-ice-300 leading-relaxed mb-6">
                    {t(`${item.key}.desc` as any)}
                  </p>
                </div>

                <div className="pt-4 border-t border-navy-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gold-400">
                    {item.pricing}
                  </span>
                  <Link
                    href={item.href}
                    className="flex items-center text-xs font-bold text-white hover:text-gold-300 transition-colors group-hover:translate-x-1"
                  >
                    <span>{t(`${item.key}.action` as any)}</span>
                    <ArrowUpRight className="w-4 h-4 ml-1 text-gold-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
