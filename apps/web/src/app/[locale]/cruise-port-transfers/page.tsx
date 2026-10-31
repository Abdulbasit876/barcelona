'use client';

import React from 'react';
import { Anchor, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from '../../../navigation';
import QuickBookingWidget from '../../../components/QuickBookingWidget';

export default function CruisePortTransfersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Port de Barcelona Â· Moll Adossat
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            Barcelona Cruise Port Transfers
          </h1>
          <p className="text-sm sm:text-base text-ice-300">
            Direct, comfortable transfers between Barcelona Cruise Terminals and the City Centre or Airport with fixed rates: Sedan â‚¬42 | Van â‚¬70 and 30 minutes complimentary waiting.
          </p>
        </div>

        <QuickBookingWidget locale={locale} />

        {/* Pricing Notice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          <div className="navy-card rounded-2xl p-6 space-y-3 border-gold-500/30">
            <span className="text-xs uppercase tracking-wider font-bold text-gold-400">
              Sedan Transfers (1 - 4 Passengers)
            </span>
            <div className="text-3xl font-serif font-bold text-white">
              â‚¬42.00 <span className="text-xs font-sans text-ice-300 font-normal">Base Fare</span>
            </div>
            <p className="text-xs sm:text-sm text-ice-300">
              Includes Economy, Standard (+â‚¬5), and Premium (+â‚¬10) sedans. Door-to-pier luggage assistance and 30 minutes free waiting time included.
            </p>
          </div>

          <div className="navy-card rounded-2xl p-6 space-y-3 border-gold-500/30">
            <span className="text-xs uppercase tracking-wider font-bold text-gold-400">
              High-Capacity Vans (5 - 8 Passengers)
            </span>
            <div className="text-3xl font-serif font-bold text-white">
              â‚¬70.00 <span className="text-xs font-sans text-ice-300 font-normal">Guaranteed Fixed Fare</span>
            </div>
            <p className="text-xs sm:text-sm text-ice-300">
              Spacious VW Caravelle or Mercedes V-Class accommodating heavy cruise luggage, golf bags, and families without surcharge stacking.
            </p>
          </div>
        </div>

        {/* Terminals Info */}
        <div className="navy-card rounded-2xl p-8 space-y-4">
          <h2 className="text-xl font-serif font-bold text-white">
            Cruise Piers & Ships Serviced
          </h2>
          <p className="text-xs sm:text-sm text-ice-300 leading-relaxed">
            We provide official authorization and direct port passes to access all secured pier zones at Moll Adossat: Terminal A, Terminal B, Terminal C, Terminal D (Palacruceros), Terminal E (Helix Cruise Center), and the World Trade Center (North and South Piers). Your driver meets you right at the passenger gangway exit.
          </p>
        </div>
      </div>
    </div>
  );
}
