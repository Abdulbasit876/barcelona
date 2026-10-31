'use client';

import React from 'react';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { Link } from '../../../navigation';

export default function CancellationRefundPolicyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Transparent Guarantees
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
            Cancellation & Refund Policy
          </h1>
          <p className="text-xs text-ice-400 mt-2">
            Clear guidelines for cancellations, modifications, and refunds
          </p>
        </div>

        <div className="navy-card rounded-2xl p-6 sm:p-10 space-y-6 text-xs sm:text-sm text-ice-200 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-white flex items-center">
              <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
              1. Free Cancellation Up to 24 Hours
            </h2>
            <p>
              We understand travel schedules can change unexpectedly. Customers may cancel any standard private transfer free of charge up to 24 hours prior to the scheduled pickup time and receive a 100% full refund credited to the original payment method.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-white flex items-center">
              <Clock className="w-5 h-5 text-gold-400 mr-2" />
              2. Cancellations Within 24 Hours
            </h2>
            <p>
              Cancellations submitted between 12 and 24 hours prior to pickup are eligible for a 50% refund or full travel credit valid for 12 months. Cancellations made less than 12 hours prior to pickup or passenger no-shows are non-refundable, as vehicles and chauffeurs are formally reserved.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-white flex items-center">
              <ShieldAlert className="w-5 h-5 text-gold-400 mr-2" />
              3. Flight Cancellations by Airlines
            </h2>
            <p>
              If your incoming flight to Barcelona (BCN) is cancelled by the operating airline, please notify our dispatch team as soon as possible. Provided notification is received before your driver departs for the terminal, we will reschedule your pickup to your replacement flight at no additional charge.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-white">
              4. How to Request a Cancellation or Refund
            </h2>
            <p>
              You can cancel directly through your reservation link on the{' '}
              <Link href="/manage-booking" className="text-gold-400 underline hover:text-gold-300">
                Manage My Booking
              </Link>{' '}
              page, or by contacting customer support at bookings@barcelonataxitransfer.com or +34 687 433 263. Refunds are processed through Stripe and typically appear on your card statement within 3 to 5 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
