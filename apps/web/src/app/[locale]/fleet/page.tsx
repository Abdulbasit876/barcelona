'use client';

import React from 'react';
import Image from 'next/image';
import VehicleImageCarousel from '../../../components/VehicleImageCarousel';
import { useTranslations } from 'next-intl';
import { Users, Briefcase, Check, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';
import { Link } from '../../../navigation';
import { SEED_VEHICLES } from '@barcelona/shared';

export default function FleetPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('fleet');
  const locKey = (locale as 'en' | 'es' | 'fr' | 'it') || 'en';

  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Certified Luxury Transportation
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-ice-300">
            {t('subtitle')}
          </p>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SEED_VEHICLES.map((vehicle) => {
            const desc = vehicle.description[locKey] || vehicle.description.en;

            return (
              <div
                key={vehicle.id}
                className="navy-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300"
              >
                <div>
                  <div className="relative overflow-hidden bg-navy-900">
                    <VehicleImageCarousel category={vehicle.category} alt={vehicle.name} heightClass="h-60" />
                    <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-md border border-gold-500/30 text-[10px] uppercase tracking-wider font-bold text-gold-400 px-3 py-1 rounded-full z-10 pointer-events-none">
                      {vehicle.category.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-serif font-bold text-white mb-1 group-hover:text-gold-300 transition-colors">
                      {vehicle.name}
                    </h3>
                    <p className="text-xs text-gold-400 font-semibold mb-3">
                      {vehicle.exampleModels.replace(/Â/g, '')}
                    </p>
                    <p className="text-xs sm:text-sm text-ice-300 leading-relaxed mb-6">
                      {desc}
                    </p>

                    {/* Capacity Info */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-navy-950 rounded-xl border border-navy-800 text-xs text-ice-200 mb-6">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gold-400" />
                        <span>Up to {vehicle.maxPassengers} Passengers</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-gold-400" />
                        <span>Up to {vehicle.maxLuggage} Suitcases</span>
                      </div>
                    </div>

                    {/* Amenities List */}
                    <div className="space-y-2 border-t border-navy-800 pt-4 text-xs text-ice-300">
                      {vehicle.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <Check className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href={`/book?vehicle=${vehicle.category}`}
                    className="gold-button w-full py-3.5 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2 shadow-gold"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{t('select')}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
