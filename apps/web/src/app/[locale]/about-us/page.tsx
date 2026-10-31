'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Award, HeartHandshake, MapPin, Users, Clock } from 'lucide-react';
import { Link } from '../../../navigation';

export default function AboutUsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Heritage & Standards
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            About Barcelona Taxi Transfer
          </h1>
          <p className="text-sm sm:text-base text-ice-300">
            Barcelona’s premier private chauffeur network delivering punctual airport pickups, cruise connections, and tailored sightseeing tours across Catalonia.
          </p>
        </div>

        {/* Company Overview Card */}
        <div className="navy-card rounded-2xl p-8 sm:p-10 space-y-6">
          <h2 className="text-2xl font-serif font-bold text-white">
            A Legacy of Excellence in Barcelona Transport
          </h2>
          <p className="text-xs sm:text-sm text-ice-200 leading-relaxed">
            Founded with a commitment to reliability, discretion, and transparent fixed pricing, Barcelona Taxi Transfer has grown into the trusted transportation partner for international leisure tourists, corporate executives, conference delegates, and cruise passengers visiting Spain.
          </p>
          <p className="text-xs sm:text-sm text-ice-200 leading-relaxed">
            Our mission is simple: eliminate travel friction. Whether stepping off a long-haul flight at BCN Terminal 1, disembarking at Moll Adossat Cruise Pier, or needing a multilingual chauffeur for the Mobile World Congress, our guests enjoy immaculate vehicles, courteous drivers, and peace of mind.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-navy-800">
            <div className="space-y-1">
              <span className="text-2xl font-serif font-bold text-gold-400">100%</span>
              <p className="text-xs text-ice-300 font-medium">Licensed & Insured Fleet</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-serif font-bold text-gold-400">60 Min</span>
              <p className="text-xs text-ice-300 font-medium">Free Airport Waiting Time</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-serif font-bold text-gold-400">24 / 7</span>
              <p className="text-xs text-ice-300 font-medium">Flight Monitoring & Support</p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="navy-card rounded-2xl p-6 space-y-3">
            <ShieldCheck className="w-8 h-8 text-gold-400" />
            <h3 className="text-lg font-serif font-bold text-white">Absolute Safety</h3>
            <p className="text-xs text-ice-300 leading-relaxed">
              Every vehicle undergoes rigorous safety checks and carries comprehensive passenger liability coverage under Spanish transport regulations.
            </p>
          </div>

          <div className="navy-card rounded-2xl p-6 space-y-3">
            <Award className="w-8 h-8 text-gold-400" />
            <h3 className="text-lg font-serif font-bold text-white">Professional Chauffeurs</h3>
            <p className="text-xs text-ice-300 leading-relaxed">
              Polite, English-speaking, and locally knowledgeable drivers dedicated to making your arrival in Barcelona stress-free.
            </p>
          </div>

          <div className="navy-card rounded-2xl p-6 space-y-3">
            <Clock className="w-8 h-8 text-gold-400" />
            <h3 className="text-lg font-serif font-bold text-white">Guaranteed Punctuality</h3>
            <p className="text-xs text-ice-300 leading-relaxed">
              We monitor incoming flights and train arrivals via live radar feeds, ensuring your chauffeur is in position before you exit baggage claim.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
