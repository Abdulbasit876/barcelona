'use client';

import React from 'react';
import { MapPin, Clock, ShieldCheck, Car } from 'lucide-react';
import QuickBookingWidget from '../../../components/QuickBookingWidget';

export default function CityTransfersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Metropolitan Private Chauffeur
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            Barcelona City Transfers
          </h1>
          <p className="text-sm sm:text-base text-ice-300">
            Comfortable door-to-door rides across Barcelona, Eixample, GrÃ cia, Diagonal Mar, and surrounding municipalities with licensed professional chauffeurs.
          </p>
        </div>

        <QuickBookingWidget locale={locale} />
      </div>
    </div>
  );
}
