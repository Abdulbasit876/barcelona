'use client';

import React from 'react';
import { Train, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from '../../../navigation';
import QuickBookingWidget from '../../../components/QuickBookingWidget';

export default function SantsStationTransfersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            EstaciÃ³ de Barcelona-Sants
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            Barcelona Sants Train Transfers
          </h1>
          <p className="text-sm sm:text-base text-ice-300">
            Hassle-free private transfers to and from Barcelona Sants for AVE, TGV, and Ouigo high-speed trains. Sedan â‚¬32 | Van â‚¬45 fixed rates with 15 minutes free waiting time.
          </p>
        </div>

        <QuickBookingWidget locale={locale} />

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 pt-6 sm:pt-8">
          <div className="navy-card rounded-2xl p-6 space-y-3 border-gold-500/30">
            <span className="text-xs uppercase tracking-wider font-bold text-gold-400">
              Sedan Transfers (1 - 4 Passengers)
            </span>
            <div className="text-3xl font-serif font-bold text-white">
              â‚¬32.00 <span className="text-xs font-sans text-ice-300 font-normal">Base Fare</span>
            </div>
            <p className="text-xs sm:text-sm text-ice-300">
              Economy, Standard (+â‚¬5), and Premium (+â‚¬10) sedans. Chauffeur meets you at the central main concourse exit.
            </p>
          </div>

          <div className="navy-card rounded-2xl p-6 space-y-3 border-gold-500/30">
            <span className="text-xs uppercase tracking-wider font-bold text-gold-400">
              Van Transfers (5 - 8 Passengers)
            </span>
            <div className="text-3xl font-serif font-bold text-white">
              â‚¬45.00 <span className="text-xs font-sans text-ice-300 font-normal">Fixed Fare</span>
            </div>
            <p className="text-xs sm:text-sm text-ice-300">
              Fixed fare for family groups and heavy train luggage. Direct, smooth connection to your hotel or airport terminal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
