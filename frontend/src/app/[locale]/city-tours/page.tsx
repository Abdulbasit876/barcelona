'use client';

import React from 'react';
import { Compass, Clock, MapPin, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { Link } from '../../../navigation';
import QuickBookingWidget from '../../../components/QuickBookingWidget';

export default function CityToursPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Private Sightseeing & Day Trips
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            Barcelona Private City Tours
          </h1>
          <p className="text-sm sm:text-base text-ice-300">
            Discover the architectural masterworks of Antoni GaudÃ­ and Mediterranean vistas at your own pace with a dedicated English-speaking chauffeur at â‚¬65 per hour.
          </p>
        </div>

        {/* Tour Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          <div className="navy-card rounded-2xl p-6 space-y-3">
            <span className="text-xs uppercase tracking-wider font-bold text-gold-400">
              Half-Day Tour (4 Hours)
            </span>
            <div className="text-2xl font-serif font-bold text-white">â‚¬260.00 EUR</div>
            <p className="text-xs sm:text-sm text-ice-300">
              Covers Sagrada FamÃ­lia, Passeig de GrÃ cia (Casa BatllÃ³, La Pedrera), and Park GÃ¼ell with door-to-door VIP pickup.
            </p>
            <Link
              href="/book?type=CITY_TOUR&hours=4"
              className="gold-button w-full py-2.5 rounded-xl text-xs font-bold text-center block mt-3"
            >
              Book 4-Hour Tour
            </Link>
          </div>

          <div className="navy-card rounded-2xl p-6 space-y-3 border-gold-400/50">
            <span className="text-xs uppercase tracking-wider font-bold text-gold-400">
              Full-Day Tour (8 Hours)
            </span>
            <div className="text-2xl font-serif font-bold text-white">â‚¬520.00 EUR</div>
            <p className="text-xs sm:text-sm text-ice-300">
              Comprehensive exploration: GaudÃ­ masterpieces, MontjuÃ¯c Castle, Gothic Quarter, Barceloneta promenade, and Tibidabo viewpoint.
            </p>
            <Link
              href="/book?type=CITY_TOUR&hours=8"
              className="gold-button w-full py-2.5 rounded-xl text-xs font-bold text-center block mt-3"
            >
              Book 8-Hour Tour
            </Link>
          </div>

          <div className="navy-card rounded-2xl p-6 space-y-3">
            <span className="text-xs uppercase tracking-wider font-bold text-gold-400">
              Montserrat & Wine Country
            </span>
            <div className="text-2xl font-serif font-bold text-white">Custom Quote</div>
            <p className="text-xs sm:text-sm text-ice-300">
              Excursions outside the metropolitan perimeter (Montserrat Abbey, PenedÃ¨s wine cellars, Girona, or Costa Brava).
            </p>
            <Link
              href="/custom-quote"
              className="px-4 py-2.5 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-300 hover:text-white text-xs font-bold text-center block mt-3"
            >
              Request Custom Quote
            </Link>
          </div>
        </div>

        <QuickBookingWidget locale={locale} />
      </div>
    </div>
  );
}
