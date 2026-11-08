'use client';

import React from 'react';
import Image from 'next/image';
import { Plane, Clock, ShieldCheck, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from '../../../navigation';
import QuickBookingWidget from '../../../components/QuickBookingWidget';

export default function AirportTransfersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Josep Tarradellas Barcelona-El Prat (BCN)
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            Barcelona Airport Transfers
          </h1>
          <p className="text-sm sm:text-base text-ice-300">
            Punctual, private airport pickups at Terminal 1 and Terminal 2 with complimentary 60-minute waiting time, flight tracking, and fixed rates from â‚¬3.00/km.
          </p>
        </div>

        {/* Quick Booking Widget Prefilled for Airport */}
        <QuickBookingWidget locale={locale} />

        {/* Airport Features Detail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 pt-6 sm:pt-8">
          <div className="navy-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-white">60 Minutes Free Waiting</h3>
            <p className="text-xs sm:text-sm text-ice-300 leading-relaxed">
              Take your time disembarking and clearing customs. We provide up to 60 minutes complimentary waiting after your flight actually lands.
            </p>
          </div>

          <div className="navy-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Plane className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-white">Live Flight Radar Tracking</h3>
            <p className="text-xs sm:text-sm text-ice-300 leading-relaxed">
              Our dispatch team monitors flight delays or early arrivals in real-time, automatically syncing your chauffeur's arrival with no penalty.
            </p>
          </div>

          <div className="navy-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-white">Meet & Greet in Arrival Hall</h3>
            <p className="text-xs sm:text-sm text-ice-300 leading-relaxed">
              Your professional chauffeur welcomes you directly inside the arrivals lounge holding a personalized name sign and helps with heavy luggage.
            </p>
          </div>
        </div>

        {/* Terminals Guide */}
        <div className="navy-card rounded-2xl p-5 sm:p-8 space-y-6">
          <h2 className="text-2xl font-serif font-bold text-white">
            Barcelona Airport Terminals Served
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm text-ice-200">
            <div className="space-y-2 p-4 rounded-xl bg-navy-950/80 border border-navy-800">
              <h4 className="font-bold text-gold-400 text-base">Terminal 1 (T1)</h4>
              <p className="text-ice-300">
                Hub for Vueling, Iberia, Air France, Lufthansa, British Airways, Qatar Airways, Emirates, and Star Alliance carriers. Chauffeur meeting point is directly outside the primary sliding exit gate.
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-navy-950/80 border border-navy-800">
              <h4 className="font-bold text-gold-400 text-base">Terminal 2 (T2A / T2B / T2C)</h4>
              <p className="text-ice-300">
                Serving EasyJet, Ryanair, Wizz Air, and other European regional flights. Chauffeurs meet guests in the central arrivals plaza beneath the legendary Fernando Botero Horse statue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
