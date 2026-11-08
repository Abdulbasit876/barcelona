'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Phone, Mail, MapPin, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function ContactUsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('contact');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+34 ');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/contact/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          message,
          locale,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message.');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Customer Support
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            {t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-ice-300">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Card */}
          <div className="navy-card rounded-2xl p-5 sm:p-6 lg:p-8 space-y-6 lg:col-span-1">
            <h3 className="text-xl font-serif font-bold text-white">
              Get In Touch
            </h3>

            <div className="space-y-4 text-xs text-ice-200">
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">24/7 Call Center</span>
                  <a href="tel:+34687433263" className="block hover:text-gold-300 text-gold-400">
                    +34 687 433 263 (Hamid)
                  </a>
                  <a href="tel:+34602194060" className="block hover:text-gold-300 text-gold-400">
                    +34 602 194 060 (Waqas)
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Email Inquiries</span>
                  <a href="mailto:bookings@barcelonataxitransfer.com" className="hover:text-gold-300">
                    bookings@barcelonataxitransfer.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Operations Base</span>
                  <p className="text-ice-300">
                    Josep Tarradellas Barcelona-El Prat Airport, 08820 El Prat de Llobregat, Barcelona, Spain
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 border-t border-navy-800 pt-4">
                <Clock className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Operating Hours</span>
                  <p className="text-ice-300">
                    Transfers operated 24 hours a day, 365 days a year including holidays.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="navy-card rounded-2xl p-5 sm:p-6 lg:p-8 lg:col-span-2">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white">
                  Message Sent Successfully
                </h3>
                <p className="text-xs sm:text-sm text-ice-200 max-w-sm mx-auto">
                  {t('success')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/30 text-red-200 text-xs">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ice-200 mb-1">
                      {t('name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ice-200 mb-1">
                      {t('email')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ice-200 mb-1">
                      {t('phone')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ice-200 mb-1">
                      {t('subject')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Flight VY6102 question"
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ice-200 mb-1">
                    {t('message')} *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we assist with your Barcelona transport needs?"
                    className="w-full bg-navy-950 border border-navy-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="gold-button w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-gold"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Sending...' : t('send')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
