'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Plane, Ship, MapPin, Briefcase } from 'lucide-react';
import { Link } from '../navigation';
import { useTranslations } from 'next-intl';

export default function Hero({ locale }: { locale: string }) {
  const t = useTranslations('hero');
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elements = [
      { el: badgeRef.current, delay: 100 },
      { el: headlineRef.current, delay: 300 },
      { el: subRef.current, delay: 500 },
      { el: btnRef.current, delay: 700 },
      { el: imageRef.current, delay: 200 },
      { el: servicesRef.current, delay: 900 },
    ];
    elements.forEach(({ el, delay }) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
    });
  }, []);

  const services = [
    { icon: Plane, titleKey: 'airport', subKey: 'airportSub', href: '/airport-transfers' },
    { icon: MapPin, titleKey: 'taxi', subKey: 'taxiSub', href: '/city-transfers' },
    { icon: Ship, titleKey: 'cruise', subKey: 'cruiseSub', href: '/cruise-port-transfers' },
    { icon: Briefcase, titleKey: 'private', subKey: 'privateSub', href: '/city-tours' },
  ];

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-navy-950">
      {/* Full background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/car-hero.png"
          alt="Premium Barcelona Taxi Transfer"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/80 via-navy-950/30 to-transparent" />
      </div>

      {/* BARCELONA watermark text */}
      <div className="absolute bottom-32 right-0 left-0 flex justify-center z-10 pointer-events-none select-none">
        <span className="text-[clamp(3rem,12vw,9rem)] font-black text-white/5 tracking-[0.3em] uppercase leading-none">
          BARCELONA
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center pt-28 sm:pt-32 pb-10 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto w-full">
        <div className="max-w-xl lg:max-w-2xl">
          {/* Badge */}
          <div
            ref={badgeRef}
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-400 text-xs font-semibold tracking-widest uppercase mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 mr-2 animate-pulse" />
            {t('badge')}
          </div>

          {/* Main headline */}
          <h1
            ref={headlineRef}
            className="text-3xl sm:text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6"
          >
            <span className="text-white block">{t('titleLine1')}</span>
            <span className="text-white block text-[0.42em] leading-normal font-bold tracking-normal mt-2">{t('titleLine2')}</span>
          </h1>

          {/* Sub text */}
          <p
            ref={subRef}
            className="text-ice-200 text-base sm:text-lg leading-relaxed mb-8 max-w-md"
          >
            {t('subtitle')}
          </p>

          {/* CTA button */}
          <div ref={btnRef}>
            <Link
              href="/book"
              className="inline-flex items-center px-8 py-4 rounded-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-base shadow-2xl hover:shadow-gold-500/40 transition-all duration-300 group hover:-translate-y-0.5 active:translate-y-0"
            >
              {t('bookTransfer')}
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Services bar at bottom */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-8" ref={servicesRef}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {services.map(({ icon: Icon, titleKey, subKey, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center space-x-3 px-4 py-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-md hover:shadow-xl hover:border-gold-500/60 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center group-hover:bg-gold-500 transition-colors">
                  <Icon className="w-4 h-4 text-gold-600 group-hover:text-navy-950 transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-navy-950 font-bold text-[13px] group-hover:text-gold-600 transition-colors truncate">
                    {t(`serviceBar.${titleKey}`)}
                  </p>
                  <p className="text-gray-500 text-[11px] truncate font-medium">{t(`serviceBar.${subKey}`)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
