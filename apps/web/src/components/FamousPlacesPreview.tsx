'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Compass, ArrowRight, MapPin, Clock } from 'lucide-react';
import { Link } from '../navigation';
import { SEED_FAMOUS_PLACES } from '@barcelona/shared';

export default function FamousPlacesPreview({ locale }: { locale: string }) {
  const t = useTranslations('famousPlacesPreview');
  const places = SEED_FAMOUS_PLACES.slice(0, 4);

  return (
    <section className="py-24 bg-navy-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-4 md:space-y-0">
          <div>
            <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
              {t('badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
              {t('title')}
            </h2>
            <p className="text-sm sm:text-base text-ice-300 mt-2 max-w-xl">
              {t('subtitle')}
            </p>
          </div>
          <Link
            href="/famous-places"
            className="inline-flex items-center space-x-2 text-sm font-bold text-gold-400 hover:text-gold-300 transition-colors"
          >
            <span>{t('exploreAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {places.map((place) => {
            const locKey = (locale as 'en' | 'es' | 'fr' | 'it') || 'en';
            const name = place.name[locKey] || place.name.en;
            const shortDesc = place.shortDescription[locKey] || place.shortDescription.en;

            return (
              <div
                key={place.id}
                className="navy-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={place.imageUrl}
                      alt={name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-md border border-gold-500/30 text-[10px] uppercase tracking-wider font-bold text-gold-400 px-2.5 py-1 rounded-full">
                      {place.category}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-serif font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                      {name}
                    </h3>
                    <p className="text-xs text-ice-300 leading-relaxed mb-4 line-clamp-2">
                      {shortDesc}
                    </p>
                    <div className="flex items-center text-[11px] text-ice-300 space-x-3 mb-2">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gold-400" />
                        {place.recommendedDuration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0">
                  <Link
                    href={`/book?destination=${encodeURIComponent(place.address)}`}
                    className="gold-button w-full py-2.5 rounded-xl text-xs font-bold text-center block shadow-gold"
                  >
                    {t('bookRide')}
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
