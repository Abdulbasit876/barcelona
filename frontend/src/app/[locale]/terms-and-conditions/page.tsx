'use client';

import React from 'react';

export default function TermsAndConditionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Customer Agreement
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
            Terms and Conditions
          </h1>
          <p className="text-xs text-ice-400 mt-2">
            Applicable to all reservations operated by Barcelona Taxi Transfer
          </p>
        </div>

        <div className="navy-card rounded-2xl p-6 sm:p-10 space-y-6 text-xs sm:text-sm text-ice-200 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">1. Scope of Service</h2>
            <p>
              Barcelona Taxi Transfer provides licensed pre-booked private passenger transport (VTC and official taxi services) across the Barcelona Metropolitan Area, Catalonia, and regional destinations in Spain.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">2. Transparent Pricing and Surcharges</h2>
            <p>
              All prices quoted online are in Euros (EUR) and include standard VAT, mandatory passenger insurance, fuel, highway tolls, and luggage handling. Fixed fares apply to defined airport, cruise port, and train station routes. Rates outside defined perimeters are subject to upfront quotation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">3. Waiting Time Policy</h2>
            <p>
              Complimentary waiting allowances are defined as follows: 60 minutes for airport pickups from the recorded flight touchdown time; 30 minutes for cruise port pickups; 15 minutes for city and rail pickups. Any additional waiting beyond complimentary thresholds must be agreed with dispatch and is billed at regulated hourly rates.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">4. Luggage and Vehicle Capacity</h2>
            <p>
              Passengers must declare the accurate number of suitcases during booking. Chauffeurs reserve the right to decline excess baggage that compromises safety or exceeds the vehicle manufacturerâ€™s load capacity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">5. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of Spain and the Generalitat de Catalunya transport regulations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
