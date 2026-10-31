'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Car,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { TransferType, VehicleCategory } from '@barcelona/shared';
import PlacesAutocomplete from './PlacesAutocomplete';

export default function QuickBookingWidget({ locale }: { locale: string }) {
  const t = useTranslations('widget');
  const router = useRouter();

  const [pickup, setPickup] = useState('Barcelona El Prat Airport (BCN) Terminal 1');
  const [destination, setDestination] = useState('Plaça de Catalunya, Barcelona');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('12:00');
  const [bookingMode, setBookingMode] = useState<'now' | 'schedule'>('schedule');
  const [passengers, setPassengers] = useState(2);
  const [luggage, setLuggage] = useState(2);
  const [serviceType, setServiceType] = useState<TransferType>(TransferType.AIRPORT);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const actualDate = bookingMode === 'now' ? now.toISOString().split('T')[0] : date;
    const actualTime = bookingMode === 'now' 
      ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      : time;

    const query = new URLSearchParams({
      pickup,
      destination,
      date: actualDate,
      time: actualTime,
      mode: bookingMode,
      passengers: passengers.toString(),
      luggage: luggage.toString(),
      type: serviceType,
    });
    router.push(`/${locale}/book?${query.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-navy-900/90 backdrop-blur-xl border border-gold-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-20">
      <div className="flex items-center justify-between mb-6 border-b border-navy-800 pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center">
            <Sparkles className="w-5 h-5 text-gold-400 mr-2" />
            {t('title')}
          </h3>
          <p className="text-xs text-ice-300 mt-1">{t('pricingNotice')}</p>
        </div>
      </div>

      <form onSubmit={handleContinue} className="space-y-5">
        {/* Transfer Service Type Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2">
            {t('serviceType')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { type: TransferType.AIRPORT, label: t('types.airport') },
              { type: TransferType.CRUISE_PORT, label: t('types.cruise') },
              { type: TransferType.SANTS_STATION, label: t('types.sants') },
              { type: TransferType.CITY_TRANSFER, label: t('types.city') },
              { type: TransferType.CITY_TOUR, label: t('types.tour') },
            ].map((item) => (
              <button
                type="button"
                key={item.type}
                onClick={() => setServiceType(item.type)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                  serviceType === item.type
                    ? 'bg-gold-500 text-navy-950 border-gold-400 shadow-gold'
                    : 'bg-navy-950/70 text-ice-200 border-navy-700 hover:border-gold-500/40 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pickup and Destination Fields with Google Places Autocomplete */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <PlacesAutocomplete
              value={pickup}
              onChange={(val) => setPickup(val)}
              placeholder={t('pickupPlaceholder')}
              label={t('pickup')}
              required
              icon={<MapPin className="w-3.5 h-3.5 text-gold-400" />}
            />
          </div>

          <div>
            <PlacesAutocomplete
              value={destination}
              onChange={(val) => setDestination(val)}
              placeholder={t('destinationPlaceholder')}
              label={t('destination')}
              required
              icon={<MapPin className="w-3.5 h-3.5 text-gold-400" />}
            />
          </div>
        </div>

        {/* Pickup Time Mode Selection: Book Now vs Schedule */}
        <div className="bg-navy-950/60 p-3 rounded-xl border border-navy-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2">
            Pickup Time Option
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBookingMode('now')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${
                bookingMode === 'now'
                  ? 'bg-gold-500 text-navy-950 border-gold-400 font-bold shadow-gold'
                  : 'bg-navy-900/80 text-ice-200 border-navy-700 hover:border-gold-500/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Book For Now (Immediate)</span>
            </button>
            <button
              type="button"
              onClick={() => setBookingMode('schedule')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${
                bookingMode === 'schedule'
                  ? 'bg-gold-500 text-navy-950 border-gold-400 font-bold shadow-gold'
                  : 'bg-navy-900/80 text-ice-200 border-navy-700 hover:border-gold-500/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule For Later</span>
            </button>
          </div>
          {bookingMode === 'now' && (
            <p className="text-[11px] text-emerald-400 mt-2 flex items-center">
              ✓ Nearest available chauffeur will be dispatched immediately (approx. 5-10 mins).
            </p>
          )}
        </div>

        {/* Date, Time, Passengers, Luggage */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-ice-200 mb-1.5 flex items-center">
              <Calendar className="w-3.5 h-3.5 text-gold-400 mr-1.5" />
              {t('date')}
            </label>
            <input
              type="date"
              required
              disabled={bookingMode === 'now'}
              value={bookingMode === 'now' ? new Date().toISOString().split('T')[0] : date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-navy-950/80 border border-navy-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ice-200 mb-1.5 flex items-center">
              <Clock className="w-3.5 h-3.5 text-gold-400 mr-1.5" />
              {t('time')}
            </label>
            <input
              type="time"
              required
              disabled={bookingMode === 'now'}
              value={bookingMode === 'now' ? 'Now' : time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-navy-950/80 border border-navy-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ice-200 mb-1.5 flex items-center">
              <Users className="w-3.5 h-3.5 text-gold-400 mr-1.5" />
              {t('passengers')}
            </label>
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value, 10))}
              className="w-full bg-navy-950/80 border border-navy-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16, 25, 50].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ice-200 mb-1.5 flex items-center">
              <Briefcase className="w-3.5 h-3.5 text-gold-400 mr-1.5" />
              {t('luggage')}
            </label>
            <select
              value={luggage}
              onChange={(e) => setLuggage(parseInt(e.target.value, 10))}
              className="w-full bg-navy-950/80 border border-navy-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Suitcase' : 'Suitcases'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit action */}
        <div className="pt-2">
          <button
            type="submit"
            className="gold-button w-full py-4 rounded-xl text-base font-bold flex items-center justify-center space-x-2 shadow-gold"
          >
            <span>{t('continue')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
