'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck, UserCheck, Clock, Radio, CheckCircle2 } from 'lucide-react';

export default function WhyChooseUs({ locale }: { locale: string }) {
  const t = useTranslations('whyUs');

  const items = [
    {
      icon: ShieldCheck,
      title: t('item1Title'),
      desc: t('item1Desc'),
    },
    {
      icon: UserCheck,
      title: t('item2Title'),
      desc: t('item2Desc'),
    },
    {
      icon: Clock,
      title: t('item3Title'),
      desc: t('item3Desc'),
    },
    {
      icon: Radio,
      title: t('item4Title'),
      desc: t('item4Desc'),
    },
  ];

  return (
    <section className="py-20 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-600 font-bold">
            Unrivalled Quality Standards
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy-950">
            {t('title')}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white border border-gray-200/90 rounded-2xl p-6 relative overflow-hidden group hover:border-gold-500/60 hover:shadow-xl transition-all duration-300 shadow-sm hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-600 mb-5 group-hover:bg-gold-500 group-hover:text-navy-950 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-serif font-bold text-navy-950 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
