'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  ShieldCheck,
  MapPin,
  Clock,
  User,
  Car,
  CreditCard,
  FileText,
  AlertTriangle,
  Phone,
  CheckCircle,
  XCircle,
  MessageCircle,
  Star,
  Copy,
  Check,
  Download,
  Printer,
  X,
  Lock,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Link } from '../../../../../navigation';
import BookingReceiptModal, { normalizeBookingData } from '@/components/BookingReceiptModal';

export default function SecureTrackingPage({
  params: { locale, reference, token },
}: {
  params: { locale: string; reference: string; token: string };
}) {
  const t = useTranslations('manage');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchSecureBooking();
    // Poll every 15s so driver assignment & status changes appear automatically
    const interval = setInterval(fetchSecureBooking, 15000);
    return () => clearInterval(interval);
  }, [reference, token]);

  const fetchSecureBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      // Must supply both reference AND token – server validates access token
      const res = await fetch(
        `/api/bookings?reference=${encodeURIComponent(reference.trim())}&token=${encodeURIComponent(token.trim())}`,
      );
      if (!res.ok) {
        throw new Error('Access denied. Invalid secure tracking token or booking reference.');
      }
      const data = await res.json();
      setBooking(normalizeBookingData(data));
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve your reservation.');
    } finally {
      setLoading(false);
    }
  };

  const copyBookingRef = () => {
    if (!booking?.bookingReference) return;
    navigator.clipboard.writeText(booking.bookingReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePayRemaining = async () => {
    if (!booking?.bookingReference) return;
    setPaying(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: booking.bookingReference, action: 'PAY_BALANCE' }),
      });
      if (res.ok) {
        setBooking((prev: any) => ({
          ...prev,
          paymentStatus: 'PAID',
          balancePaid: true,
          remainingBalance: 0,
        }));
        alert(t('paySuccess'));
      }
    } catch {
      alert('Payment processing failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 bg-navy-950 min-h-screen text-center text-white">
        <div className="animate-spin w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-ice-300">Verifying secure tracking credentials...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="pt-32 pb-20 bg-navy-950 min-h-screen">
        <div className="max-w-xl mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">Access Denied / Not Found</h1>
          <p className="text-sm text-ice-300">
            {error || 'This secure tracking URL is invalid or has expired. Customers can only view their own booking with the unique secret token sent to their email.'}
          </p>
          <div className="pt-4">
            <Link
              href="/manage-booking"
              className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold inline-block"
            >
              Go to Booking Lookup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const remainingBalance = booking?.remainingBalance || 0;
  const hasRemainingBalance = remainingBalance > 0 && !booking?.balancePaid;

  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Verified Encrypted Guest Session
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
            Live Booking Status
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs text-ice-400">Reference:</span>
            <span className="font-mono text-gold-300 font-bold px-2 py-0.5 rounded bg-navy-900 border border-gold-500/30 text-sm">
              {booking.bookingReference}
            </span>
            <button
              onClick={copyBookingRef}
              className="p-1 rounded bg-navy-800 text-gold-400 hover:text-white"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 4 Status KPI cards */}
        <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="navy-card rounded-2xl p-5">
            <span className="text-[11px] text-ice-400 uppercase font-semibold">Status</span>
            <div className="text-sm font-bold text-white mt-1 flex items-center">
              <span
                className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  booking.status === 'COMPLETED' ? 'bg-emerald-400' :
                  booking.status === 'CANCELLED' ? 'bg-red-400' :
                  booking.status === 'IN_PROGRESS' ? 'bg-blue-400' :
                  'bg-amber-400'
                }`}
              />
              {booking.status}
            </div>
          </div>

          <div className="navy-card rounded-2xl p-5">
            <span className="text-[11px] text-ice-400 uppercase font-semibold">Payment</span>
            <div className="text-sm font-bold text-white mt-1 flex items-center">
              <span
                className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  booking.balancePaid || booking.paymentStatus === 'PAID' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              {booking.balancePaid ? 'Fully Paid Online' : 'Advance Paid (Balance Due)'}
            </div>
          </div>

          <div className="navy-card rounded-2xl p-5">
            <span className="text-[11px] text-ice-400 uppercase font-semibold">Total Fare</span>
            <div className="text-xl font-bold text-gold-400 mt-1">
              €{Number(booking.totalFare || 0).toFixed(2)}
            </div>
          </div>

          <div className="navy-card rounded-2xl p-5">
            <span className="text-[11px] text-ice-400 uppercase font-semibold">Remaining</span>
            <div className={`text-xl font-bold mt-1 ${booking.balancePaid ? 'text-emerald-400' : 'text-amber-400'}`}>
              €{Number(booking.remainingBalance || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Payment Summary & Remaining Payment Workflow */}
        <div className="navy-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold-400" />
              Payment Details
            </h3>
            <span className="text-xs text-ice-400">Regulated Fixed Pricing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5">
              <div className="text-emerald-400 font-semibold uppercase tracking-wider mb-1">
                Advance Paid
              </div>
              <div className="text-white font-bold text-xl">
                €{Number(booking.depositAmount || 0).toFixed(2)}
              </div>
              <div className="text-emerald-300 text-[10px] mt-0.5">✓ Secured Online</div>
            </div>

            <div className={`${hasRemainingBalance ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} border rounded-xl p-3.5`}>
              <div className={`${hasRemainingBalance ? 'text-amber-400' : 'text-emerald-400'} font-semibold uppercase tracking-wider mb-1`}>
                Remaining Balance
              </div>
              <div className="text-white font-bold text-xl">
                €{Number(booking.remainingBalance || 0).toFixed(2)}
              </div>
              <div className={`text-[10px] mt-0.5 ${booking.balancePaid ? 'text-emerald-300' : 'text-amber-300 font-bold'}`}>
                {booking.balancePaid ? '✓ Fully Paid' : 'Due to driver or pay online'}
              </div>
            </div>

            <div className="bg-navy-900 border border-navy-700 rounded-xl p-3.5">
              <div className="text-ice-400 font-semibold uppercase tracking-wider mb-1">
                Payment Status
              </div>
              <div className="text-white font-bold text-sm mt-1">
                {booking.balancePaid ? 'Fully Paid Online' : 'Balance Pending'}
              </div>
              <div className="text-[10px] text-ice-400 mt-0.5">
                {booking.balancePaid ? 'No further payment required' : 'Payable online or cash to chauffeur'}
              </div>
            </div>
          </div>

          {/* Prominent "Pay Remaining Amount" Button */}
          {hasRemainingBalance && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePayRemaining}
                disabled={paying}
                className="gold-button w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-gold"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {paying
                    ? 'Processing Online Payment...'
                    : `Pay Remaining Amount (€${remainingBalance.toFixed(2)})`}
                </span>
              </button>
            </div>
          )}

          {booking.balancePaid && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Your booking is fully paid online. You will not be charged anything further by your driver.</span>
            </div>
          )}
        </div>

        {/* Assigned Chauffeur & Vehicle Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehicle */}
          <div className="navy-card rounded-2xl p-5 space-y-3 border-l-4 border-gold-500">
            <span className="text-xs uppercase tracking-wider text-gold-400 font-bold flex items-center">
              <Car className="w-4 h-4 mr-1.5" /> Vehicle Information
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="text-white text-sm font-semibold">
                {booking.assignedDriver?.vehicleModel || `${booking.vehicleCategory} Class Luxury Vehicle`}
              </div>
              {booking.assignedDriver?.vehiclePlate && (
                <div className="text-ice-300">
                  <strong className="text-ice-200">Registration Plate:</strong>{' '}
                  <span className="font-mono text-gold-300 font-bold px-1.5 py-0.5 rounded bg-navy-950 border border-navy-700">
                    {booking.assignedDriver.vehiclePlate}
                  </span>
                </div>
              )}
              <div className="text-ice-300">
                <strong className="text-ice-200">Capacity:</strong> {booking.passengers} Passengers, {booking.luggage} Suitcases, {booking.cabinLuggage || 0} Cabin Bags
              </div>
            </div>
          </div>

          {/* Driver – REAL DATA ONLY */}
          <div className="navy-card rounded-2xl p-5 space-y-3 border-l-4 border-emerald-500">
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center justify-between">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1.5" /> Assigned Driver Details
              </span>
              {booking.assignedDriver?.rating && (
                <span className="flex items-center text-amber-400 font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-current mr-1" />
                  {booking.assignedDriver.rating}
                </span>
              )}
            </span>

            {booking.assignedDriver ? (
              <div className="space-y-2 text-xs">
                <div className="text-white text-sm font-semibold">{booking.assignedDriver.name}</div>
                {booking.assignedDriver.phone && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={`tel:${booking.assignedDriver.phone}`}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Contact Driver ({booking.assignedDriver.phone})</span>
                    </a>
                    <a
                      href={`https://wa.me/${booking.assignedDriver.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(booking.assignedDriver.name)},%20regarding%20booking%20${booking.bookingReference}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Driver</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center">
                  <User className="w-6 h-6 text-ice-400" />
                </div>
                <div className="text-amber-300 font-semibold text-xs">
                  ⏳ Wait until driver is assigned
                </div>
                <div className="text-ice-400 text-[11px] max-w-xs">
                  Your chauffeur is being assigned by our dispatch team. You will see their exact name, phone number, and vehicle registration here prior to pickup.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Route Details */}
        <div className="navy-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-white border-b border-navy-800 pb-4">
            <MapPin className="w-5 h-5 text-gold-400" />
            <h3 className="text-lg font-serif font-bold">Transfer Itinerary</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-navy-950 p-4 rounded-xl border border-navy-800 space-y-2">
              <div className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Pickup Location
              </div>
              <div className="text-white text-sm font-semibold">{booking.pickupAddress}</div>
              <div className="text-xs text-ice-400 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5 text-gold-400" />
                <span>{booking.pickupDateTime ? new Date(booking.pickupDateTime).toLocaleString() : 'Scheduled'}</span>
              </div>
            </div>

            <div className="bg-navy-950 p-4 rounded-xl border border-navy-800 space-y-2">
              <div className="text-[11px] uppercase font-bold text-gold-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold-400" />
                Destination Dropoff
              </div>
              <div className="text-white text-sm font-semibold">{booking.destinationAddress}</div>
              <div className="text-xs text-ice-400 flex items-center gap-1.5 pt-1">
                <Car className="w-3.5 h-3.5 text-gold-400" />
                <span>Fixed Rate Guaranteed · {booking.transferType} Transfer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt trigger */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="gold-button px-6 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-gold"
          >
            <FileText className="w-4 h-4" />
            <span>View & Download Passenger Receipt</span>
          </button>
        </div>
      </div>

      {/* Customer Receipt Modal */}
      <BookingReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        booking={booking}
      />
    </div>
  );
}
