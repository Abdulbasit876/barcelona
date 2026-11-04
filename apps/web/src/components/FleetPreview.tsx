'use client';

import React from 'react';
import Image from 'next/image';
import VehicleImageCarousel from './VehicleImageCarousel';
import { useTranslations } from 'next-intl';
import { Users, Briefcase, ArrowRight, Check } from 'lucide-react';
import { Link } from '../navigation';
import { SEED_VEHICLES } from '@barcelona/shared';

export default function FleetPreview({ locale }: { locale: string }) {
  const t = useTranslations('fleetPreview');
  const vehicles = SEED_VEHICLES.slice(0, 3); // Economy, Standard, Premium

  return (
    <section className="py-16 sm:py-24 bg-[#0a1628] relative">
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
            href="/fleet"
            className="inline-flex items-center space-x-2 text-sm font-bold text-gold-400 hover:text-gold-300 transition-colors"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {vehicles.map((v) => {
            const locKey = (locale as 'en' | 'es' | 'fr' | 'it') || 'en';
            const desc = v.description[locKey] || v.description.en;

            return (
              <div
                key={v.id}
                className="navy-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300"
              >
                <div>
                  <div className="relative overflow-hidden bg-navy-950">
                    <VehicleImageCarousel category={v.category} alt={v.name} heightClass="h-52" />
                    <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-md border border-gold-500/30 text-[10px] uppercase tracking-wider font-bold text-gold-400 px-3 py-1 rounded-full z-10 pointer-events-none">
                      {v.category.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-serif font-bold text-white mb-1 group-hover:text-gold-300 transition-colors">
                      {v.name}
                    </h3>
                    <p className="text-xs text-gold-400 font-medium mb-3">
                      {v.exampleModels.replace(/Â/g, '')}
                    </p>
                    <p className="text-xs sm:text-sm text-ice-300 leading-relaxed mb-5">
                      {desc}
                    </p>

                    {/* Capacity Specs */}
                    <div className="grid grid-cols-2 gap-3 py-3 px-4 bg-navy-950/80 rounded-xl border border-navy-800 mb-5 text-xs text-ice-200">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gold-400" />
                        <span>Max {v.maxPassengers} Pax</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-gold-400" />
                        <span>Max {v.maxLuggage} Luggage</span>
                      </div>
                    </div>

                    {/* Feature tags */}
                    <div className="space-y-1.5 mb-6 text-xs text-ice-300">
                      {v.features.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <Check className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-0">
                  <Link
                    href={`/book?vehicle=${v.category}`}
                    className="gold-button w-full py-3 rounded-xl text-xs font-bold text-center block shadow-gold"
                  >
                    {t('bookVehicle')}
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
