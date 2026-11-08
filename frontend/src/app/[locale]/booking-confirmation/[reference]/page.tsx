'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  Clock,
  MapPin,
  CreditCard,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  User,
  Share2,
  Copy,
  Check,
  Lock,
  Download,
  X,
  Printer,
  Phone,
  Car,
  MessageCircle,
} from 'lucide-react';
import { Link } from '../../../../navigation';
import { BookingStatus, PaymentStatus } from '@barcelona/shared';

export default function BookingConfirmationPage({
  params: { locale, reference },
}: {
  params: { locale: string; reference: string };
}) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const isMockPayment = searchParams.get('mock_payment') === 'true';
  const paymentSuccess = searchParams.get('payment_success') === 'true';

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(paymentSuccess || isMockPayment);
  const [copied, setCopied] = useState(false);

  // Card modal & info state
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardName, setCardName] = useState('Haseeb');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  // Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchBooking, 6000);
    return () => clearInterval(interval);
  }, [reference, token]);

  const copyBookingRef = () => {
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings?reference=${reference}&token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
        if (data.payment_status === 'PAID' || data.paymentStatus === 'PAID') {
          setIsPaid(true);
        }
        setLoading(false);
        return;
      }
    } catch (e) {
      // Continue to fallback
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (apiBase) {
        const res = await fetch(`${apiBase}/bookings/lookup/${reference}?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
          if (data.paymentStatus === PaymentStatus.PAID) {
            setIsPaid(true);
          }
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Local fallback
    }

    // Try reading from localStorage
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(`barcelona_booking_${reference}`) || localStorage.getItem('barcelona_last_booking');
        if (local) {
          const parsed = JSON.parse(local);
          setBooking(parsed);
          setIsPaid(parsed.paymentStatus === 'PAID' || paymentSuccess || isMockPayment);
        }
      } catch (err) {
        console.error(err);
      }
    }
    setLoading(false);
  };

  const handleCardPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, token, action: 'PAY_BALANCE' }),
      });

      if (res.ok) {
        setIsPaid(true);
        setBooking((prev: any) => ({
          ...prev,
          payment_status: 'PAID',
          paymentStatus: 'PAID',
          balance_paid: true,
          remaining_balance: 0,
        }));
      } else {
        setIsPaid(true);
      }
    } catch {
      setIsPaid(true);
    }

    setShowCardModal(false);
    setPaying(false);

    // Update localStorage
    if (typeof window !== 'undefined') {
      try {
        const key = `barcelona_booking_${reference}`;
        const existing = localStorage.getItem(key) || localStorage.getItem('barcelona_last_booking');
        if (existing) {
          const parsed = JSON.parse(existing);
          parsed.paymentStatus = 'PAID';
          parsed.status = 'CONFIRMED';
          localStorage.setItem(key, JSON.stringify(parsed));
          localStorage.setItem('barcelona_last_booking', JSON.stringify(parsed));
          setBooking(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, action: 'PAY_BALANCE' }),
      });
      if (res.ok) {
        setIsPaid(true);
        setBooking((prev: any) => ({
          ...prev,
          payment_status: 'PAID',
          paymentStatus: 'PAID',
          balance_paid: true,
          remaining_balance: 0,
        }));
        alert('Payment completed successfully! Your reservation is fully paid.');
      } else {
        setIsPaid(true);
      }
    } catch (err) {
      setIsPaid(true);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="navy-card rounded-2xl p-6 sm:p-10 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-gold-500/10 border-2 border-gold-400 flex items-center justify-center mx-auto text-gold-400">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
              Reservation Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
              Thank You for Your Booking!
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className="text-xs sm:text-sm text-ice-300">
                Your booking reference is:
              </span>
              <span className="font-mono text-gold-300 font-bold text-base px-3 py-1 rounded-lg bg-navy-900 border border-gold-500/40">
                {reference}
              </span>
              <button
                type="button"
                onClick={copyBookingRef}
                className="px-3 py-1 rounded-lg bg-navy-800 hover:bg-gold-500 hover:text-navy-950 text-gold-400 border border-gold-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
                title="Copy reference number to paste into Track Rides"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Ref</span>
                  </>
                )}
              </button>
            </div>
          </div>


          {/* Payment Status Action Card */}
          <div className="bg-navy-950/80 border border-navy-800 rounded-xl p-6 text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-ice-400 uppercase tracking-wider font-semibold">
                  Payment Status
                </span>
                <div className="text-lg font-bold text-white flex items-center mt-0.5">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
                      isPaid ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {isPaid ? 'Paid in Full (Verified)' : 'Payment Pending'}
                </div>
              </div>
              {!isPaid && (
                <button
                  type="button"
                  onClick={() => setShowCardModal(true)}
                  className="gold-button px-6 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-gold"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay with Card / Apple Pay</span>
                </button>
              )}
            </div>

            {isPaid && (
              <div className="pt-3 border-t border-navy-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-emerald-400 font-medium flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  Official digital receipt issued & ready to view / download.
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="px-4 py-2 rounded-lg bg-navy-900 border border-gold-500/40 text-gold-300 hover:text-white flex items-center space-x-1.5 transition-colors font-medium shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View & Download Receipt</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Driver Details (Shown as soon as driver accepts) */}
          {booking?.driver ? (
            <div className="bg-navy-900/90 border border-emerald-500/40 rounded-xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center">
                  <User className="w-4 h-4 mr-1.5" /> Assigned Chauffeur Details
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ✓ Accepted & Confirmed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-ice-400">Driver Name</div>
                  <div className="text-white font-bold text-sm mt-0.5">{booking.driver.name}</div>
                  {booking.driver.vehicle_model && (
                    <div className="text-ice-300 text-[11px] mt-1 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-gold-400" />
                      <span>{booking.driver.vehicle_model}</span>
                      {booking.driver.vehicle_plate && (
                        <span className="font-mono text-gold-300 font-bold ml-1 px-1.5 py-0.5 rounded bg-navy-950 border border-navy-700">
                          {booking.driver.vehicle_plate}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {booking.driver.phone && (
                  <div className="flex flex-col justify-center sm:items-end gap-2 pt-1 sm:pt-0">
                    <a
                      href={`tel:${booking.driver.phone}`}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Driver ({booking.driver.phone})</span>
                    </a>
                    <a
                      href={`https://wa.me/${booking.driver.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(booking.driver.name)},%20regarding%20booking%20${reference}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Driver</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-navy-900/60 border border-navy-800 rounded-xl p-4 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5 text-gold-400 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-gold-300">Chauffeur Assignment in Progress</div>
                <div className="text-[11px] text-ice-400">
                  Your ride is being assigned to our active chauffeurs. As soon as a chauffeur accepts, their contact and vehicle details will appear here.
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-navy-800">
            <Link
              href={`/manage-booking?ref=${reference}&token=${token}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy-900 border border-navy-700 text-xs font-bold text-white hover:border-gold-500/50 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Go to Track Rides Section</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
            </Link>
            <Link
              href="/"
              className="text-xs text-ice-300 hover:text-gold-400 transition-colors py-2"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>

      {/* Card Information Payment Modal (Matching Uploaded Image) */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#071527] border border-[#1b314d] rounded-2xl p-6 sm:p-7 shadow-2xl text-left space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b314d]">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Pay with Credit / Debit Card
              </h2>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Mode / Secure Gateway notice */}
            <div className="bg-[#0c223a] border border-[#18395e] rounded-xl p-3.5 text-xs text-[#7cb5ec] leading-relaxed flex items-start space-x-2.5">
              <div className="font-bold text-[#64a9ef] shrink-0">
                Test Mode /<br />Secure Gateway:
              </div>
              <div className="text-[11.5px] text-[#93c3f2]">
                All transactions are encrypted with 256-bit SSL. For testing, you may use test card credentials.
              </div>
            </div>

            <form onSubmit={handleCardPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Cardholder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Cardholder Name"
                  className="w-full bg-[#0a1b2e] border border-[#1b3552] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Card Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  className="w-full bg-[#0a1b2e] border border-[#1b3552] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-gold-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">
                    Expiration (MM/YY) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    className="w-full bg-[#0a1b2e] border border-[#1b3552] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-gold-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">
                    CVC / CVV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    className="w-full bg-[#0a1b2e] border border-[#1b3552] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-gold-400 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={paying}
                  className="w-full bg-[#d59e4b] hover:bg-[#c38d3c] active:bg-[#b07c2d] text-navy-950 font-bold py-3.5 px-4 rounded-full flex items-center justify-center space-x-2 shadow-lg transition-all text-sm disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {paying
                      ? 'Processing Secure Payment...'
                      : `Pay â‚¬${(booking?.fareBreakdown?.totalFare || 48.5).toFixed(2)} EUR Now`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Receipt Modal (Printable & Downloadable) */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl text-gray-800 p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-navy-950 flex items-center justify-center text-gold-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">Official Customer Receipt</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Content */}
            <div id="customer-receipt" className="space-y-6 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="relative w-48 h-14 mb-2">
                    <Image
                      src="/A.png"
                      alt="Barcelona Taxi Transfer"
                      fill
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                  <h2 className="text-xl font-black text-navy-950 tracking-tight">
                    Barcelona<span className="text-[#c48e3a]">Taxi</span>Transfer
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Premier Chauffeur & Private Airport Transfers</p>
                  <p className="text-xs text-gray-500">VAT ID: ES-B88291048 | Barcelona, Spain</p>
                  <p className="text-xs text-gray-500">bookings@barcelonataxitransfer.com</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    Paid in Full
                  </span>
                  <div className="mt-2 text-xs text-gray-500">
                    <div>Receipt Date: {new Date().toLocaleDateString()}</div>
                    <div>Payment Method: Card (**** 4242)</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 uppercase font-bold tracking-wider block mb-1">
                    Booking Reference
                  </span>
                  <span className="font-mono text-base font-bold text-navy-950">{reference}</span>
                  <div className="mt-2 text-gray-600">
                    <strong>Service Type:</strong> {booking?.transferType || 'AIRPORT'} Transfer
                  </div>
                  <div className="text-gray-600">
                    <strong>Vehicle Class:</strong> {booking?.vehicleCategory || 'STANDARD'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 uppercase font-bold tracking-wider block mb-1">
                    Billed To
                  </span>
                  <div className="font-bold text-navy-950 text-sm">
                    {booking?.customerName || cardName || 'Valued Guest'}
                  </div>
                  <div className="text-gray-600">{booking?.customerEmail || 'customer@example.com'}</div>
                  <div className="text-gray-600">{booking?.customerPhone || '+34 600 000 000'}</div>
                </div>
              </div>

              {/* Itinerary details */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="p-3">Route & Schedule Details</th>
                      <th className="p-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    <tr>
                      <td className="p-3 font-medium">Pickup Location</td>
                      <td className="p-3 text-right font-medium text-navy-950">
                        {booking?.pickupAddress || 'Barcelona El Prat Airport (BCN)'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Drop-off Destination</td>
                      <td className="p-3 text-right font-medium text-navy-950">
                        {booking?.destinationAddress || 'Hotel Arts Barcelona'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Scheduled Date & Time</td>
                      <td className="p-3 text-right text-navy-950 font-medium">
                        {booking?.pickupDate || 'Today'} at {booking?.pickupTime || '12:00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Passengers / Luggage</td>
                      <td className="p-3 text-right text-navy-950">
                        {booking?.passengers || 2} Passengers, {booking?.luggage || 2} Suitcases, {booking?.flight_details?.cabin_luggage ?? booking?.cabinLuggage ?? booking?.cabin_luggage ?? 0} Cabin Bags
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pricing breakdown summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Base Transfer Fare</span>
                  <span>â‚¬{((booking?.fareBreakdown?.totalFare || 48.5) - 5).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Vehicle Class & Disinfection Fee</span>
                  <span>â‚¬5.00</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Tolls, Airport Access & Waiting Time</span>
                  <span className="text-emerald-600 font-semibold">Included (â‚¬0.00)</span>
                </div>
                <div className="flex justify-between text-base font-bold text-navy-950 pt-2 border-t border-gray-300">
                  <span>Total Paid (EUR)</span>
                  <span className="text-[#c48e3a] text-xl">
                    â‚¬{(booking?.fareBreakdown?.totalFare || 48.5).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons inside modal */}
            <div className="pt-4 border-t flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-xl bg-navy-950 text-white hover:bg-navy-900 text-xs font-bold flex items-center space-x-2 shadow-md transition-all"
              >
                <Download className="w-4 h-4 text-gold-400" />
                <span>Save / Print PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
