'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, CheckCircle2, AlertCircle, Sparkles, MapPin, Calendar, Clock, Users, Briefcase } from 'lucide-react';

export default function CustomQuotePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('quote');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+34 ');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [passengers, setPassengers] = useState(6);
  const [luggage, setLuggage] = useState(6);
  const [vehiclePreference, setVehiclePreference] = useState('Mercedes-Benz V-Class Minivan');
  const [specialRequirements, setSpecialRequirements] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/contact/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          pickupAddress,
          destinationAddress,
          pickupDate,
          pickupTime,
          passengers,
          luggage,
          vehiclePreference,
          specialRequirements,
          preferredLanguage: locale,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit quote request.');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Bespoke Transportation
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            {t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-ice-300 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {submitted ? (
          <div className="navy-card rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white">
              Quote Request Received
            </h3>
            <p className="text-sm text-ice-200 max-w-md mx-auto leading-relaxed">
              {t('success')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="navy-card rounded-2xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-2xl">
            {error && (
              <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/30 text-red-200 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-ice-200 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Carlos Ruiz"
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ice-200 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@example.com"
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ice-200 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ice-200 mb-1.5">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. Barcelona Center, Airport or Costa Brava"
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ice-200 mb-1.5">
                  Destination / Route Itinerary *
                </label>
                <input
                  type="text"
                  required
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="e.g. Montserrat Monastery, Girona, Andorra, etc."
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-ice-200 mb-1.5">Date *</label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ice-200 mb-1.5">Time *</label>
                <input
                  type="time"
                  required
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ice-200 mb-1.5">Passengers</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value, 10))}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ice-200 mb-1.5">Luggage</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={luggage}
                  onChange={(e) => setLuggage(parseInt(e.target.value, 10))}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ice-200 mb-1.5">
                Special Requirements / Multi-day Itinerary
              </label>
              <textarea
                rows={4}
                required
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Please describe any extra stops, multi-day standby requirements, corporate event specifications, or language preferences..."
                className="w-full bg-navy-950 border border-navy-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gold-button w-full py-4 rounded-xl text-base font-bold flex items-center justify-center space-x-2 shadow-gold"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting Request...' : t('submit')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
