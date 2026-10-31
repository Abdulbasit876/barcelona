'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Phone, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from '../navigation';

export default function CallToAction({ locale }: { locale: string }) {
  const t = useTranslations('cta');
  return (
    <section className="py-20 relative bg-gradient-to-b from-navy-900 to-navy-950 border-t border-gold-500/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
          {t('badge')}
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
          {t('title')} <span className="gold-text-gradient">{t('titleHighlight')}</span>
        </h2>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-ice-200 leading-relaxed">
          {t('subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/book"
            className="gold-button w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-gold"
          >
            <Calendar className="w-4 h-4" />
            <span>{t('bookOnline')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/custom-quote"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold border border-gold-500/40 text-gold-300 hover:bg-navy-800/80 transition-colors flex items-center justify-center"
          >
            {t('customQuote')}
          </Link>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-ice-300">
          <span className="flex items-center">
            <ShieldCheck className="w-4 h-4 text-gold-400 mr-1.5" />
            {t('feature1')}
          </span>
          <span className="flex items-center">
            <ShieldCheck className="w-4 h-4 text-gold-400 mr-1.5" />
            {t('feature2')}
          </span>
          <span className="flex items-center">
            <Phone className="w-4 h-4 text-gold-400 mr-1.5" />
            {t('feature3')}
          </span>
        </div>
      </div>
    </section>
  );
}
