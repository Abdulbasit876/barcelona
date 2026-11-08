'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';
import { Link } from '../../../navigation';

const FAQS = [
  {
    q: 'How does the free waiting time policy work?',
    a: 'For airport arrivals at Barcelona-El Prat (BCN), we include 60 minutes of complimentary waiting time after your flight actually lands. For cruise port pickups at Moll Adossat, we include 30 minutes free waiting. For city and train station pickups, 15 minutes of free waiting are provided. Additional waiting must be authorized by dispatch.',
  },
  {
    q: 'What happens if my flight is delayed or arrives early?',
    a: 'We monitor all flights using real-time aviation radar feeds. If your flight arrives early or is delayed, your chauffeurâ€™s dispatch schedule is automatically adjusted with no extra charge.',
  },
  {
    q: 'Where will I meet my chauffeur at Barcelona Airport?',
    a: 'Your chauffeur will wait inside the arrivals hall immediately past the customs luggage exit doors, holding a clear digital tablet or official sign displaying your name.',
  },
  {
    q: 'Are toll charges, airport fees, and taxes included in the fare?',
    a: 'Yes. All displayed fares are 100% fixed and transparent. They include Catalan regional transport taxes (IVA), highway tolls (autopistas), airport parking access, and passenger luggage handling.',
  },
  {
    q: 'Can I cancel my transfer or receive a refund?',
    a: 'Yes. You can cancel your reservation free of charge up to 24 hours prior to your scheduled pickup time directly via the "Manage My Booking" link or by contacting our 24/7 support line.',
  },
  {
    q: 'Do you provide baby and child safety booster seats?',
    a: 'Yes. Infant baby capsules and child booster seats are provided completely free of charge upon request during the reservation process.',
  },
  {
    q: 'How does the Cruise Port and Sants Station approval workflow operate?',
    a: 'Because maritime berths and high-speed train platforms require specific access coordination and variable traffic windows, reservations originating at the Cruise Port or Sants Station are initially created with Pending Dispatcher Approval. Our team validates the itinerary and sends you an instant confirmation link to finalize payment.',
  },
];

export default function FaqPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Frequently Asked Questions
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            Everything You Need to Know
          </h1>
          <p className="text-xs sm:text-sm text-ice-300">
            Answers to common questions regarding airport pickups, cruise ports, fares, and policies.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="navy-card rounded-2xl overflow-hidden border border-navy-800 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-white hover:text-gold-300 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gold-400 shrink-0 ml-4 transition-transform ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === idx && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-ice-300 leading-relaxed border-t border-navy-900">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="navy-card rounded-2xl p-6 text-center space-y-3 mt-12">
          <h3 className="text-lg font-serif font-bold text-white">Still have questions?</h3>
          <p className="text-xs text-ice-300">
            Our multilingual support operators are available 24 hours a day to assist with custom itineraries.
          </p>
          <div className="pt-2">
            <Link
              href="/contact-us"
              className="gold-button inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-bold"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
