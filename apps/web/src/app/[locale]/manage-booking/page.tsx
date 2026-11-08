'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Search,
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
  Eye,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { BookingStatus } from '@barcelona/shared';

export default function ManageBookingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('manage');
  const searchParams = useSearchParams();

  const [reference, setReference] = useState('');
  const [contactInfo, setContactInfo] = useState(''); // email or phone
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    // 1. Check URL parameters (secure token link)
    const paramRef = searchParams.get('ref');
    const paramToken = searchParams.get('token');

    if (paramRef && paramToken) {
      setReference(paramRef);
      performTokenLookup(paramRef, paramToken);
      return;
    }

    // 2. Auto-load from localStorage history (customer's own bookings)
    if (typeof window !== 'undefined') {
      try {
        const historyStr = localStorage.getItem('barcelona_bookings_history');
        if (historyStr) {
          const history = JSON.parse(historyStr);
          setRecentBookings(history);
        }
        // Do NOT auto-load last booking as it could expose data
        // Customer must actively search with reference + contact info
      } catch {}
    }
  }, []);

  const copyBookingRef = () => {
    if (!booking?.bookingReference) return;
    navigator.clipboard.writeText(booking.bookingReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Secure token-based lookup (from confirmation email link)
  const performTokenLookup = async (ref: string, token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/bookings?reference=${encodeURIComponent(ref.trim())}&token=${encodeURIComponent(token.trim())}`,
      );
      if (!res.ok) throw new Error(t('notFound'));
      const data = await res.json();
      setBookingFromData(data);
    } catch (err: any) {
      setError(t('notFoundDesc'));
    } finally {
      setLoading(false);
    }
  };

  // Secure reference + contact-info lookup (no token enumeration possible)
  const performContactLookup = async (ref: string, contact: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/bookings?reference=${encodeURIComponent(ref.trim())}&contact=${encodeURIComponent(contact.trim())}`,
      );
      if (!res.ok) throw new Error(t('notFound'));
      const data = await res.json();
      setBookingFromData(data);
    } catch (err: any) {
      setError(t('notFoundDesc'));
    } finally {
      setLoading(false);
    }
  };

  const setBookingFromData = (data: any) => {
    setBooking({
      ...data,
      bookingReference: data.booking_reference || data.bookingReference,
      transferType: data.transfer_type || data.transferType,
      vehicleCategory: data.vehicle_category || data.vehicleCategory,
      status: data.status,
      paymentStatus: data.payment_status || data.paymentStatus,
      pickupAddress: data.pickup_address || data.pickupAddress,
      destinationAddress: data.destination_address || data.destinationAddress,
      pickupDateTime: data.pickup_datetime || data.pickupDateTime,
      customerName: data.customer_name || data.customerName,
      customerEmail: data.customer_email || data.customerEmail,
      customerPhone: data.customer_phone || data.customerPhone,
      totalFare: parseFloat(data.total_fare || data.totalFare || 0),
      depositAmount: parseFloat(data.deposit_amount || 0),
      remainingBalance: parseFloat(data.remaining_balance || 0),
      depositPaid: data.deposit_paid,
      balancePaid: data.balance_paid,
      passengers: data.passengers,
      luggage: data.luggage,
      cabinLuggage: data.flight_details?.cabin_luggage ?? data.cabin_luggage ?? data.cabinLuggage ?? 0,
      // Only show REAL driver data — never fallback to dummy
      assignedDriver: data.driver
        ? {
            name: data.driver.name,
            phone: data.driver.phone,
            vehiclePlate: data.driver.vehicle_plate,
            vehicleModel: data.driver.vehicle_model,
            rating: data.driver.rating,
          }
        : null,
    });
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reference.trim()) return;
    // Require contact info for security — prevent reference enumeration
    if (!contactInfo.trim()) {
      setError('Please enter your email address or phone number to verify your identity.');
      return;
    }
    performContactLookup(reference, contactInfo);
  };

  const handleCancelBooking = async () => {
    if (!confirm(t('confirmCancel'))) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: booking.bookingReference, action: 'CANCEL' }),
      });
      if (res.ok) {
        setBooking((prev: any) => ({ ...prev, status: 'CANCELLED' }));
        alert(t('cancelSuccess'));
      } else {
        const err = await res.json();
        alert('Could not cancel booking: ' + (err.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
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
        const updated = await res.json();
        setBooking((prev: any) => ({
          ...prev,
          paymentStatus: 'PAID',
          balancePaid: true,
          remainingBalance: 0,
        }));
        alert(t('paySuccess'));
      }
    } catch {}
    finally {
      setPaying(false);
    }
  };

  const isDriverAssigned = booking?.assignedDriver !== null && booking?.driver_id;
  const remainingBalance = booking?.remainingBalance || 0;
  const hasRemainingBalance = remainingBalance > 0 && !booking?.balancePaid;

  return (
    <div className="pt-28 pb-16 bg-navy-950 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            {t('trackYourRide')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
            {t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-ice-300 mt-2">
            {t('lookupDesc')}
          </p>
        </div>

        {/* Lookup Form */}
        <div className="space-y-4">
          <form
            onSubmit={handleLookup}
            className="navy-card rounded-2xl p-5 sm:p-6 space-y-3 shadow-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gold-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={t('tokenInput')}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-gold-400 font-mono placeholder-ice-400/50"
                />
              </div>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-gold-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={t('emailOrPhone')}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-gold-400 placeholder-ice-400/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="gold-button w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold shrink-0 shadow-gold flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? 'Searching...' : t('lookup')}
            </button>
          </form>

          {/* Quick Select from Recent Bookings */}
          {recentBookings.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-2 text-xs text-ice-300">
              <span className="font-semibold text-gold-400">Your Recent Bookings:</span>
              {recentBookings.map((b) => (
                <button
                  key={b.bookingReference}
                  type="button"
                  onClick={() => {
                    setReference(b.bookingReference);
                  }}
                  className={`px-3 py-1 rounded-lg border font-mono transition-all ${
                    reference === b.bookingReference
                      ? 'bg-gold-500 text-navy-950 border-gold-400 font-bold'
                      : 'bg-navy-900 border-navy-700 text-ice-200 hover:border-gold-400'
                  }`}
                >
                  {b.bookingReference}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Booking Details View */}
        {booking && (
          <div className="space-y-6">
            {/* Overview Status Cards */}
            <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="navy-card rounded-2xl p-5">
                <span className="text-[11px] text-ice-400 uppercase font-semibold">
                  Booking Reference
                </span>
                <div className="text-base font-mono font-bold text-gold-300 mt-1 flex items-center justify-between">
                  <span className="truncate">{booking.bookingReference}</span>
                  <button
                    type="button"
                    onClick={copyBookingRef}
                    className="p-1 rounded bg-navy-800 text-gold-400 hover:text-white transition-colors ml-1 flex-shrink-0"
                    title={t('copyRef')}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="navy-card rounded-2xl p-5">
                <span className="text-[11px] text-ice-400 uppercase font-semibold">
                  {t('status')}
                </span>
                <div className="text-sm font-serif font-bold text-white mt-1 flex items-center">
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
                <span className="text-[11px] text-ice-400 uppercase font-semibold">
                  {t('payment')}
                </span>
                <div className="text-sm font-serif font-bold text-white mt-1 flex items-center">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mr-2 ${
                      booking.paymentStatus === 'PAID' || booking.balancePaid ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {booking.balancePaid ? t('paidFull') : booking.paymentStatus}
                </div>
              </div>

              <div className="navy-card rounded-2xl p-5">
                <span className="text-[11px] text-ice-400 uppercase font-semibold">
                  {t('totalFare')}
                </span>
                <div className="text-2xl font-serif font-bold text-gold-400 mt-1">
                  €{Number(booking.totalFare || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Payment Breakdown & Pay Remaining */}
            <div className="navy-card rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gold-400" />
                Payment Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                  <div className="text-emerald-400 font-semibold uppercase tracking-wider mb-1">
                    {t('advancePaid')}
                  </div>
                  <div className="text-white font-bold text-lg">
                    €{Number(booking.depositAmount || 0).toFixed(2)}
                  </div>
                  <div className="text-emerald-300 text-[10px] mt-0.5">
                    {booking.depositPaid ? '✓ Paid Online' : 'Pending'}
                  </div>
                </div>
                <div className={`${hasRemainingBalance ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} border rounded-xl p-3`}>
                  <div className={`${hasRemainingBalance ? 'text-amber-400' : 'text-emerald-400'} font-semibold uppercase tracking-wider mb-1`}>
                    {t('remainingBalance')}
                  </div>
                  <div className="text-white font-bold text-lg">
                    €{Number(booking.remainingBalance || 0).toFixed(2)}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${booking.balancePaid ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {booking.balancePaid ? '✓ Paid' : 'Due to driver'}
                  </div>
                </div>
                <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-3">
                  <div className="text-ice-400 font-semibold uppercase tracking-wider mb-1">
                    {t('paymentMethod')}
                  </div>
                  <div className="text-white font-medium">
                    {booking.payment_method === 'FULL_ONLINE'
                      ? 'Full Online'
                      : 'Deposit Online + Balance to Driver'}
                  </div>
                </div>
              </div>

              {/* Pay Remaining Balance Button */}
              {hasRemainingBalance && booking.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={handlePayRemaining}
                  disabled={paying}
                  className="gold-button w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-gold"
                >
                  <CreditCard className="w-4 h-4" />
                  {paying ? 'Processing...' : `${t('payRemaining')} (€${remainingBalance.toFixed(2)})`}
                </button>
              )}

              {booking.balancePaid && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  {t('paidFull')}
                </div>
              )}
            </div>

            {/* Vehicle & Driver Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Card */}
              <div className="navy-card rounded-2xl p-5 space-y-3 border-l-4 border-gold-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-gold-400 font-bold flex items-center">
                    <Car className="w-4 h-4 mr-1.5" /> Vehicle Information
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-semibold uppercase">
                    {booking.vehicleCategory} Class
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {booking.assignedDriver?.vehicleModel ? (
                    <div className="text-white text-sm font-semibold">
                      {booking.assignedDriver.vehicleModel}
                    </div>
                  ) : (
                    <div className="text-ice-300 italic text-sm">
                      Vehicle details available after driver assignment
                    </div>
                  )}
                  {booking.assignedDriver?.vehiclePlate && (
                    <div className="text-ice-300">
                      <strong className="text-ice-200">Registration Plate:</strong>{' '}
                      <span className="font-mono text-gold-300 font-bold px-1.5 py-0.5 rounded bg-navy-950 border border-navy-700">
                        {booking.assignedDriver.vehiclePlate}
                      </span>
                    </div>
                  )}
                  <div className="text-ice-300">
                    <strong className="text-ice-200">Capacity:</strong>{' '}
                    {booking.passengers} Passengers, {booking.luggage} Suitcases, {booking.cabinLuggage || 0} Cabin Bags
                  </div>
                </div>
              </div>

              {/* Driver Card — REAL DATA ONLY */}
              <div className="navy-card rounded-2xl p-5 space-y-3 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center">
                    <User className="w-4 h-4 mr-1.5" /> {t('assignedDriver')}
                  </span>
                  {booking.assignedDriver?.rating && (
                    <div className="flex items-center text-xs text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded">
                      <Star className="w-3.5 h-3.5 fill-current mr-1 text-amber-400" />
                      <span>{booking.assignedDriver.rating}</span>
                    </div>
                  )}
                </div>

                {booking.assignedDriver ? (
                  <div className="space-y-2 text-xs">
                    <div className="text-white text-sm font-semibold">
                      {booking.assignedDriver.name}
                    </div>
                    {booking.assignedDriver.phone && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        <a
                          href={`tel:${booking.assignedDriver.phone}`}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Contact Driver ({booking.assignedDriver.phone})</span>
                        </a>
                        <a
                          href={`https://wa.me/${booking.assignedDriver.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(booking.assignedDriver.name)},%20regarding%20booking%20${booking.bookingReference}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Driver</span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  // No driver assigned yet — show placeholder
                  <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center">
                      <User className="w-6 h-6 text-ice-400" />
                    </div>
                    <div className="text-ice-300 font-medium text-xs">
                      {t('driverPending')}
                    </div>
                    <div className="text-ice-400 text-[11px]">
                      {t('driverPendingDesc')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Journey Route & Reservation Summary */}
            <div className="navy-card rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-navy-800 pb-4 gap-2">
                <div className="flex items-center space-x-2 text-white">
                  <MapPin className="w-5 h-5 text-gold-400" />
                  <h3 className="text-lg font-serif font-bold">Transfer Route Details</h3>
                </div>
                <div className="text-xs text-ice-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {booking.pickupDateTime
                    ? new Date(booking.pickupDateTime).toLocaleString()
                    : 'Scheduled'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-navy-950 p-4 rounded-xl border border-navy-800 space-y-2">
                  <div className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Pickup Location
                  </div>
                  <div className="text-white text-sm font-semibold">{booking.pickupAddress}</div>
                </div>

                <div className="bg-navy-950 p-4 rounded-xl border border-navy-800 space-y-2">
                  <div className="text-[11px] uppercase font-bold text-gold-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gold-400" />
                    Destination Dropoff
                  </div>
                  <div className="text-white text-sm font-semibold">{booking.destinationAddress}</div>
                </div>
              </div>

              {/* Passenger Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-navy-900 rounded-xl p-3 text-center">
                  <div className="text-ice-400 uppercase font-semibold mb-1">Passengers</div>
                  <div className="text-white font-bold text-base">{booking.passengers}</div>
                </div>
                <div className="bg-navy-900 rounded-xl p-3 text-center">
                  <div className="text-ice-400 uppercase font-semibold mb-1">Suitcases</div>
                  <div className="text-white font-bold text-base">{booking.luggage}</div>
                </div>
                <div className="bg-navy-900 rounded-xl p-3 text-center">
                  <div className="text-ice-400 uppercase font-semibold mb-1">Cabin Bags</div>
                  <div className="text-white font-bold text-base">{booking.cabinLuggage || 0}</div>
                </div>
                <div className="bg-navy-900 rounded-xl p-3 text-center">
                  <div className="text-ice-400 uppercase font-semibold mb-1">Transfer</div>
                  <div className="text-white font-bold text-xs">{booking.transferType}</div>
                </div>
                <div className="bg-navy-900 rounded-xl p-3 text-center">
                  <div className="text-ice-400 uppercase font-semibold mb-1">Vehicle</div>
                  <div className="text-white font-bold text-xs">{booking.vehicleCategory}</div>
                </div>
              </div>
            </div>


            {/* Actions: View Receipt & Cancel */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-navy-800">
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="gold-button px-6 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-gold"
              >
                <FileText className="w-4 h-4" />
                <span>View & Download Receipt</span>
              </button>

              {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                <button
                  onClick={handleCancelBooking}
                  className="px-5 py-3 rounded-xl bg-navy-900 border border-red-500/40 text-red-400 hover:bg-red-950/40 text-xs font-semibold transition-colors flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{t('cancelBooking')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Customer Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl text-gray-800 p-6 sm:p-8 space-y-6 my-8">
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
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    booking?.balancePaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {booking?.balancePaid ? 'Paid in Full' : 'Deposit Paid'}
                  </span>
                  <div className="mt-2 text-xs text-gray-500">
                    <div>Receipt Date: {new Date().toLocaleDateString()}</div>
                    <div>Ref: {booking?.bookingReference}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 uppercase font-bold tracking-wider block mb-1">Booking Reference</span>
                  <span className="font-mono text-base font-bold text-navy-950">{booking?.bookingReference}</span>
                  <div className="mt-2 text-gray-600"><strong>Service:</strong> {booking?.transferType} Transfer</div>
                  <div className="text-gray-600"><strong>Vehicle:</strong> {booking?.vehicleCategory}</div>
                </div>
                <div>
                  <span className="text-gray-400 uppercase font-bold tracking-wider block mb-1">Billed To</span>
                  <div className="font-bold text-navy-950 text-sm">{booking?.customerName}</div>
                  <div className="text-gray-600">{booking?.customerEmail}</div>
                  <div className="text-gray-600">{booking?.customerPhone}</div>
                </div>
              </div>

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
                      <td className="p-3 text-right font-medium text-navy-950">{booking?.pickupAddress}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Drop-off Destination</td>
                      <td className="p-3 text-right font-medium text-navy-950">{booking?.destinationAddress}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Scheduled Date & Time</td>
                      <td className="p-3 text-right text-navy-950 font-medium">
                        {booking?.pickupDateTime ? new Date(booking.pickupDateTime).toLocaleString() : '-'}
                      </td>
                    </tr>
                    {booking?.assignedDriver ? (
                      <>
                        <tr>
                          <td className="p-3 font-medium">Assigned Chauffeur</td>
                          <td className="p-3 text-right text-navy-950 font-medium">
                            {booking.assignedDriver.name} ({booking.assignedDriver.phone})
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium">Vehicle / License Plate</td>
                          <td className="p-3 text-right text-navy-950">
                            {booking.assignedDriver.vehicleModel} ({booking.assignedDriver.vehiclePlate})
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td className="p-3 font-medium">Chauffeur</td>
                        <td className="p-3 text-right text-gray-400 italic">To be assigned</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Advance Deposit Paid (Online)</span>
                  <span className="text-emerald-600 font-semibold">€{Number(booking?.depositAmount || 0).toFixed(2)}</span>
                </div>
                {booking?.balancePaid && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Remaining Balance Paid</span>
                    <span className="text-emerald-600 font-semibold">€{Number(booking?.remainingBalance || 0).toFixed(2)}</span>
                  </div>
                )}
                {!booking?.balancePaid && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Remaining Balance (Due to Driver)</span>
                    <span className="text-amber-600 font-semibold">€{Number(booking?.remainingBalance || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-navy-950 pt-2 border-t border-gray-300">
                  <span>Total Fare (EUR)</span>
                  <span className="text-[#c48e3a] text-xl">
                    €{Number(booking?.totalFare || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

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
