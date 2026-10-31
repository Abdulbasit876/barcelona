'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Users, Car, Star, Clock } from 'lucide-react';
import { Link } from '../navigation';
import { useTranslations } from 'next-intl';

export default function AboutSection() {
  const t = useTranslations('about');
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const stats = [
    { icon: Users, value: '500+', label: t('stats.drivers') },
    { icon: Car, value: '800+', label: t('stats.network') },
    { icon: Star, value: '4.9★', label: t('stats.rating') },
    { icon: Clock, value: '24/7', label: t('stats.support') },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.15 }
    );
    if (contentRef.current) {
      contentRef.current.style.opacity = '0';
      contentRef.current.style.transform = 'translateY(32px)';
      contentRef.current.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      observer.observe(contentRef.current);
    }
    if (statsRef.current) {
      statsRef.current.style.opacity = '0';
      statsRef.current.style.transform = 'translateY(32px)';
      statsRef.current.style.transition = 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s';
      observer.observe(statsRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — image + decorative card */}
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-gold-500/10 rounded-3xl z-0" />
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-navy-950/5 rounded-3xl z-0" />

            {/* Main image block */}
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl bg-navy-950 aspect-[4/3]">
              <Image
                src="/btt.png"
                alt="Barcelona Taxi Transfer Fleet at Airport"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

              <div className="absolute top-6 left-6 z-10">
                <div className="relative w-44 h-14 sm:w-52 sm:h-16 drop-shadow-lg">
                  <Image
                    src="/logo-a.png"
                    alt="Barcelona Taxi Transfer"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              </div>

              {/* Floating stat card */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl flex items-center space-x-4 z-10">
                <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-navy-950" />
                </div>
                <div>
                  <p className="text-navy-950 font-black text-xl leading-none">500+ Drivers</p>
                  <p className="text-gray-500 text-sm mt-0.5">Ready across Barcelona</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — content */}
          <div
            ref={contentRef}
            className="space-y-6"
          >
            {/* Section label */}
            <div className="flex items-center space-x-3">
              <div className="h-0.5 w-10 bg-gold-500" />
              <span className="text-gold-600 text-xs font-black uppercase tracking-[0.2em]">{t('badge')}</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-navy-950 leading-tight tracking-tight">
              {t('title')}
            </h2>

            <div className="space-y-4 text-gray-600 text-base leading-relaxed">
              <p>{t('desc1')}</p>
              <p>{t('desc2')}</p>
            </div>

            {/* Stats grid */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 gap-4 pt-4"
            >
              {stats.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center space-x-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gold-300 hover:bg-gold-50/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-navy-950 flex items-center justify-center flex-shrink-0 group-hover:bg-gold-500 transition-colors">
                    <Icon className="w-5 h-5 text-gold-400 group-hover:text-navy-950 transition-colors" />
                  </div>
                  <div>
                    <p className="text-navy-950 font-black text-lg leading-none">{value}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center space-x-4 pt-2">
              <Link
                href="/book"
                className="inline-flex items-center px-6 py-3 rounded-full bg-navy-950 hover:bg-navy-800 text-white font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg"
              >
                {t('bookBtn')}
              </Link>
              <Link
                href="/custom-quote"
                className="inline-flex items-center text-navy-950 font-bold text-sm hover:text-gold-600 transition-colors group"
              >
                {t('quoteBtn')}
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
