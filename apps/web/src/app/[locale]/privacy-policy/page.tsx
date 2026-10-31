'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Legal & GDPR Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-ice-400 mt-2">
            Last Updated: October 2026 Â· European General Data Protection Regulation (EU 2016/679)
          </p>
        </div>

        <div className="navy-card rounded-2xl p-6 sm:p-10 space-y-6 text-xs sm:text-sm text-ice-200 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">1. Data Controller</h2>
            <p>
              Barcelona Taxi Transfer operates as the data controller responsible for personal information collected through our customer website, reservation engines, and client communications. We are dedicated to upholding the highest standards of data integrity and passenger confidentiality.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">2. Information We Collect</h2>
            <p>
              When booking a private transfer or requesting a quotation, we collect necessary operational details including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-ice-300">
              <li>Full name, email address, and telephone contact number</li>
              <li>Pickup location, destination coordinates, date, and flight or train identifiers</li>
              <li>Passenger volume, luggage requirements, and optional infant safety seat requests</li>
              <li>Secure encrypted transaction identifiers processed via our payment partner Stripe (we never store card credentials)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">3. Purpose and Legal Basis of Processing</h2>
            <p>
              Your data is processed strictly to execute the contract of private carriage (fulfilling your requested airport, cruise, or city transfer), coordinate chauffeur dispatch, send automated landing status updates, and comply with Spanish statutory transportation and tax reporting regulations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">4. Live GPS Tracking and Security</h2>
            <p>
              Live geolocation data is exclusively broadcast to authorized customers possessing valid high-entropy booking tokens during active ride windows. Once a ride terminates, real-time telemetry streaming immediately ceases.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-white">5. Your Rights</h2>
            <p>
              Under the GDPR, you have the right to access, rectify, or request erasure of your personal data at any time by emailing our data protection officer at privacy@barcelonataxitransfer.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
