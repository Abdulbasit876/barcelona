'use client';

import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import {
  Car,
  MapPin,
  Clock,
  CheckCircle,
  Navigation,
  DollarSign,
  LogOut,
  RefreshCw,
  Timer,
  Phone,
  MessageSquare,
  MessageCircle,
  User,
  ShieldCheck,
  Check,
  ExternalLink,
  Award,
  Calendar,
  Layers,
  Receipt,
  Printer,
  CreditCard,
  Send,
  X,
  Eye,
  Copy,
  Lock,
  Maximize2,
  Zap,
} from 'lucide-react';

function formatDateTime(d?: string) {
  if (!d) return 'Scheduled';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function cleanPhoneNumber(phone?: string) {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '');
}

export default function DriverPortalPage() {
  const [driver, setDriver] = useState<any>(null);
  const [rides, setRides] = useState<any>(null);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [rideDetails, setRideDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loginForm, setLoginForm] = useState({ phoneOrEmail: '03305174366', vehiclePlate: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [waitForm, setWaitForm] = useState({ minutes: 0, reason: '' });
  const [showWaitForm, setShowWaitForm] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [showCashModal, setShowCashModal] = useState(false);
  const [showOnlineVerifyModal, setShowOnlineVerifyModal] = useState(false);
  const [onlineVerifyNote, setOnlineVerifyNote] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [onlinePaySent, setOnlinePaySent] = useState(false);
  const [onlinePayUrl, setOnlinePayUrl] = useState('');

  // Airport Greeting Name Board & Copy States
  const [nameBoardCustomer, setNameBoardCustomer] = useState<{
    name: string;
    ref: string;
    flight?: string;
  } | null>(null);
  const [nameBoardTheme, setNameBoardTheme] = useState<'GOLD' | 'YELLOW' | 'LIGHT'>('GOLD');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [fleetDrivers, setFleetDrivers] = useState<any[]>([
    { id: '0c2ead87-fdcb-4533-96b5-4fd7d7c6ef9e', name: 'haseeb', phone: '03305174366', vehicle_plate: '1234-abcd', vehicle_model: 'caroola' },
    { id: '9ec780e0-2f9f-4f95-a83c-fc026f7f0d7e', name: 'abdullah', phone: '03186238263', vehicle_plate: '1122-abcd', vehicle_model: 'mercides' },
    { id: '93c0355f-1092-48ac-87e7-ea0d7e421d26', name: 'haris', phone: '03305174355', vehicle_plate: '5678-abcd', vehicle_model: 'lexus' },
  ]);

  useEffect(() => {
    // 1. Session storage has priority (isolated per tab)
    const stored = typeof window !== 'undefined'
      ? (sessionStorage.getItem('btt_driver_profile') || localStorage.getItem('btt_driver_profile'))
      : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDriver(parsed);
        fetchRides(parsed.id);
      } catch {}
    }
    // Also fetch active drivers list from API for quick switcher
    ApiClient.getDrivers?.().then((res: any) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setFleetDrivers(res.data.filter((d: any) => d.is_active));
      }
    }).catch(() => {});

    return () => {
      if (trackingInterval) clearInterval(trackingInterval);
    };
  }, []);

  // Real-time polling every 4 seconds to instantly show new offers & remove rides accepted by other drivers
  useEffect(() => {
    if (!driver?.id) return;
    const interval = setInterval(() => {
      fetchRides(driver.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [driver?.id]);

  const switchDriver = (d: any) => {
    const token = `driver-${d.id}`;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('btt_driver_token', token);
      sessionStorage.setItem('btt_driver_profile', JSON.stringify(d));
      localStorage.setItem('btt_driver_token', token);
      localStorage.setItem('btt_driver_profile', JSON.stringify(d));
    }
    setDriver(d);
    setSelectedRide(null);
    setRideDetails(null);
    fetchRides(d.id);
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      const res = await ApiClient.driverLogin(loginForm.phoneOrEmail, loginForm.vehiclePlate);
      setDriver(res.driver);
      await fetchRides(res.driver.id);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Contact administration.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRides = async (driverIdOverride?: string) => {
    const activeId = driverIdOverride || driver?.id;
    if (!activeId) return;
    try {
      const data = await ApiClient.getDriverMyRides(activeId);
      setRides(data);

      // Real-time synchronization: If currently viewing an offer/assigned ride that is no longer offered to this driver
      setSelectedRide((prevSelected: any) => {
        if (!prevSelected) return null;
        if (prevSelected.isPendingOffer || prevSelected.pending_offer) {
          const allRides = [...(data.todayRides || []), ...(data.upcomingRides || [])];
          const exists = allRides.some((r: any) => r.id === prevSelected.id);
          if (!exists) {
            setRideDetails(null);
            return null;
          }
        }
        return prevSelected;
      });
    } catch (err) {
      console.error('Error fetching driver rides:', err);
    }
  };

  const openRide = async (ride: any, driverIdOverride?: string) => {
    const activeId = driverIdOverride || driver?.id;
    setSelectedRide(ride);
    try {
      const details = await ApiClient.getDriverRideDetails(ride.id, activeId);
      setRideDetails(details);
    } catch {
      setRideDetails(ride);
    }
  };

  const handleAcceptRide = async (bookingId: string) => {
    if (!driver?.id) return;
    setUpdating(true);
    try {
      const res = await ApiClient.acceptRide(bookingId, driver.id);
      alert(res.message || `🎉 Ride accepted successfully! It is now assigned to ${driver.name}.`);
      await fetchRides(driver.id);
      if (selectedRide?.id === bookingId) {
        await openRide(res.booking || { ...selectedRide, status: 'ACCEPTED', isPendingOffer: false, pending_offer: false }, driver.id);
      }
    } catch (err: any) {
      alert(err.message || 'Could not accept ride. It may have already been accepted by another driver.');
      await fetchRides(driver.id);
      setSelectedRide(null);
      setRideDetails(null);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectRide = async (bookingId: string) => {
    if (!driver?.id) return;
    if (!confirm('Are you sure you want to reject this ride offer? It will be removed from your list.')) return;
    setUpdating(true);
    try {
      const res = await ApiClient.rejectRide(bookingId, driver.id);
      alert(res.message || 'Ride offer rejected.');
      await fetchRides(driver.id);
      if (selectedRide?.id === bookingId) {
        setSelectedRide(null);
        setRideDetails(null);
      }
    } catch (err: any) {
      alert(err.message || 'Could not reject ride.');
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (status: string, notes?: string) => {
    if (!selectedRide || !driver?.id) return;
    setUpdating(true);
    try {
      await ApiClient.updateDriverRideStatus(selectedRide.id, status, notes, driver.id);
      await fetchRides(driver.id);
      if (status === 'COMPLETED') {
        alert('🎉 Ride completed successfully! You are now free to pick your next ride.');
        setSelectedRide(null);
        setRideDetails(null);
      } else {
        await openRide({ ...selectedRide, status }, driver.id);
      }
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const reportWaiting = async () => {
    if (!selectedRide || !driver?.id || waitForm.minutes <= 0) return;
    setUpdating(true);
    try {
      const res = await ApiClient.reportDriverWaitingTime(selectedRide.id, waitForm.minutes, waitForm.reason, driver.id);
      alert(`✅ Waiting time reported!\nBillable: ${res.billableMinutes} mins\nExtra charge: €${res.extraCharge}\nNew balance to collect: €${res.newRemainingBalance}`);
      setShowWaitForm(false);
      await fetchRides(driver.id);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmCashPayment = async () => {
    if (!rideDetails) return;
    setUpdating(true);
    try {
      const amount = Number(rideDetails.remaining_balance ?? rideDetails.remainingBalance ?? rideDetails.total_fare ?? 0);
      await ApiClient.collectDriverCashPayment(rideDetails.id, amount, driver?.id);
      setShowCashModal(false);
      setRideDetails({
        ...rideDetails,
        payment_status: 'PAID',
        paymentStatus: 'PAID',
        balance_paid: true,
        balancePaid: true,
        remaining_balance: 0,
        remainingBalance: 0,
        final_payment_method: 'CASH',
        finalPaymentMethod: 'CASH',
        isPaidCash: true,
        isPaidOnline: false,
        driver_cash_received: amount,
        driverCashReceived: amount,
        driver_notes: (rideDetails.driver_notes || '') + `\n[CASH RECEIVED]: €${amount.toFixed(2)} verified by driver ${driver?.name || ''}`,
      });
      alert(`✅ Cash payment of €${amount.toFixed(2)} verified and recorded successfully.`);
      fetchRides(driver?.id);
    } catch (err: any) {
      alert('Error recording cash payment: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmOnlinePayment = async () => {
    if (!rideDetails) return;
    setUpdating(true);
    try {
      await ApiClient.confirmDriverOnlinePayment(rideDetails.id, onlineVerifyNote, driver?.id);
      setShowOnlineVerifyModal(false);
      setRideDetails({
        ...rideDetails,
        payment_status: 'PAID',
        paymentStatus: 'PAID',
        balance_paid: true,
        balancePaid: true,
        remaining_balance: 0,
        remainingBalance: 0,
        final_payment_method: 'ONLINE',
        finalPaymentMethod: 'ONLINE',
        isPaidOnline: true,
        isPaidCash: false,
        driver_notes: (rideDetails.driver_notes || '') + `\n[ONLINE PAYMENT VERIFIED]: Verified by driver ${driver?.name || ''} ${onlineVerifyNote ? `(${onlineVerifyNote})` : ''}`,
      });
      alert('✅ Online payment verified by driver! Cash collection is disabled.');
      fetchRides(driver?.id);
    } catch (err: any) {
      alert('Error verifying online payment: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestOnlinePayment = async () => {
    if (!rideDetails) return;
    setUpdating(true);
    try {
      const res = await ApiClient.requestDriverOnlinePayment(rideDetails.id, driver?.id);
      setOnlinePayUrl(res.paymentLink);
      setOnlinePaySent(true);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(res.paymentLink);
      }
      alert(`Payment link copied to clipboard!\n\nLink: ${res.paymentLink}\n\nYou can also click the WhatsApp button to send it to the customer.`);
    } catch (err: any) {
      alert('Error requesting online payment: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('btt_driver_token');
      sessionStorage.removeItem('btt_driver_profile');
      localStorage.removeItem('btt_driver_token');
      localStorage.removeItem('btt_driver_profile');
      setDriver(null);
      setRides(null);
      setSelectedRide(null);
      setRideDetails(null);
    }
  };

  // ---- 1. DRIVER LOGIN SCREEN ----
  if (!driver) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="Barcelona Taxi Transfer"
              className="h-14 w-auto mx-auto object-contain mb-3 drop-shadow-sm"
            />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Driver Portal</h1>
            <p className="text-slate-500 font-medium text-xs mt-0.5">Barcelona Taxi Transfer Fleet App</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
            <div className="pb-3 mb-4 border-b border-slate-100 flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Driver Sign In</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {loginError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Registered Phone or Email</label>
                <input
                  required
                  type="text"
                  placeholder="+34 632 41 50 48 or driver@email.com"
                  value={loginForm.phoneOrEmail}
                  onChange={(e) => setLoginForm({ ...loginForm, phoneOrEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-navy-800 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Vehicle License Plate (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1234-XYZ"
                  value={loginForm.vehiclePlate}
                  onChange={(e) => setLoginForm({ ...loginForm, vehiclePlate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-navy-800 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-sm shadow-md transition disabled:opacity-60 mt-2"
              >
                {loading ? 'Connecting…' : 'Access My Rides →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---- 2. RIDE DETAIL VIEW ----
  if (selectedRide && rideDetails) {
    const rawPhone = rideDetails.customer_phone || rideDetails.customerPhone || '';
    const cleanPhone = cleanPhoneNumber(rawPhone);
    const customerName = rideDetails.customer_name || rideDetails.customerName || 'Customer';
    const customerEmail = rideDetails.customer_email || rideDetails.customerEmail || '';
    const pickupAddress = rideDetails.pickup_address || rideDetails.pickupAddress || 'Barcelona';
    const destAddress = rideDetails.destination_address || rideDetails.destinationAddress || 'Barcelona';
    const pickupTime = formatDateTime(rideDetails.pickup_datetime || rideDetails.pickupDateTime);
    const bookingRef = rideDetails.booking_reference || rideDetails.bookingReference || 'BTT-RIDE';
    const currentStatus = rideDetails.status || 'ASSIGNED';

    const totalFare = Number(rideDetails.total_fare || rideDetails.totalFare || 0);
    const depositAmount = Number(rideDetails.deposit_amount || rideDetails.advance_amount || rideDetails.advanceAmount || (totalFare * 0.2));
    const cashToCollect = Number(rideDetails.remaining_balance ?? rideDetails.remainingBalance ?? (totalFare - depositAmount));

    const notesStr = String(rideDetails.driver_notes || rideDetails.driverNotes || '');
    const isPaidCash = Boolean(
      rideDetails.isPaidCash ||
      rideDetails.is_paid_cash ||
      (
        (rideDetails.balance_paid || rideDetails.balancePaid || rideDetails.payment_status === 'PAID' || rideDetails.paymentStatus === 'PAID') &&
        (
          rideDetails.final_payment_method === 'CASH' ||
          rideDetails.finalPaymentMethod === 'CASH' ||
          rideDetails.fare_breakdown?.final_payment_method === 'CASH' ||
          rideDetails.fareBreakdown?.final_payment_method === 'CASH' ||
          rideDetails.payment_method === 'CASH' ||
          rideDetails.paymentMethod === 'CASH' ||
          notesStr.includes('CASH RECEIVED') ||
          notesStr.includes('CASH COLLECTED')
        )
      )
    );

    const isPaidOnline = Boolean(
      !isPaidCash &&
      (
        rideDetails.isPaidOnline ||
        rideDetails.is_paid_online ||
        (
          (rideDetails.balance_paid || rideDetails.balancePaid || rideDetails.payment_status === 'PAID' || rideDetails.paymentStatus === 'PAID') &&
          (
            rideDetails.final_payment_method === 'ONLINE' ||
            rideDetails.finalPaymentMethod === 'ONLINE' ||
            rideDetails.fare_breakdown?.final_payment_method === 'ONLINE' ||
            rideDetails.fareBreakdown?.final_payment_method === 'ONLINE' ||
            rideDetails.payment_method === 'FULL_ONLINE' ||
            rideDetails.paymentMethod === 'FULL_ONLINE' ||
            rideDetails.online_payment_transaction_id ||
            rideDetails.onlinePaymentTransactionId ||
            rideDetails.stripe_payment_intent_id ||
            notesStr.includes('ONLINE PAYMENT')
          )
        )
      )
    );
    const isFullyPaid = isPaidOnline || isPaidCash || rideDetails.payment_status === 'PAID' || rideDetails.paymentStatus === 'PAID' || cashToCollect <= 0;

    const pickupEncoded = encodeURIComponent(pickupAddress);
    const destEncoded = encodeURIComponent(destAddress);
    const mapsPickupUrl = rideDetails.mapsPickupUrl || `https://www.google.com/maps/search/?api=1&query=${pickupEncoded}`;
    const mapsNavUrl = rideDetails.mapsNavigationUrl || `https://www.google.com/maps/dir/?api=1&origin=${pickupEncoded}&destination=${destEncoded}`;

    const isRideAccepted = currentStatus === 'ACCEPTED' || currentStatus === 'ON_ROUTE' || currentStatus === 'IN_PROGRESS' || currentStatus === 'PASSENGER_ON_BOARD' || currentStatus === 'PICKED_RIDE' || currentStatus === 'COMPLETED';

    return (
      <div className="min-h-screen bg-slate-50 pb-12 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-2 sm:px-4">
        {/* Active Chauffeur Info Bar */}
        <div className="bg-slate-900 text-white px-3.5 py-1.5 flex items-center justify-between text-xs sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse flex-shrink-0"></span>
            <span className="text-slate-400 text-[11px]">Chauffeur:</span>
            <span className="font-black text-emerald-400 capitalize truncate">{driver?.name}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{driver?.phone}</span>
        </div>

        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-[29px] z-20 shadow-sm">
          <button
            onClick={() => { setSelectedRide(null); setRideDetails(null); }}
            className="text-navy-800 font-extrabold text-sm flex items-center gap-1 hover:text-navy-950 transition"
          >
            ← Back to Rides
          </button>
          <div className="flex items-center gap-1.5 font-mono font-black text-slate-900 text-xs bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
            <span>{bookingRef}</span>
            <button
              onClick={() => copyToClipboard(bookingRef, `ref-${bookingRef}`)}
              className="text-slate-500 hover:text-slate-800 transition"
              title="Copy Booking Reference"
            >
              {copiedKey === `ref-${bookingRef}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div
            className={`w-3 h-3 rounded-full ${isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
            title={isTracking ? 'GPS tracking active' : 'GPS off'}
          />
        </div>

        <div className="p-4 space-y-4">
          {/* STEP-BY-STEP RIDE ACTION BUTTONS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Trip Actions</span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-200">
                Current: {currentStatus}
              </span>
            </div>

            {/* Primary Action Button Bar */}
            <div className="space-y-2 pt-1">
              {!isRideAccepted && (
                <button
                  onClick={() => handleAcceptRide(rideDetails.id)}
                  disabled={updating}
                  className="w-full py-3.5 bg-[#00875a] hover:bg-[#00704a] active:bg-[#005a3b] text-white font-extrabold rounded-2xl text-base shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Accept Ride</span>
                </button>
              )}

              <div className="grid grid-cols-3 gap-2">
                {/* 1. On Route Button */}
                <button
                  onClick={() => updateStatus('ON_ROUTE', 'Driver is on route to pickup location')}
                  disabled={updating || !isRideAccepted}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-[11px] font-black transition shadow-sm ${
                    currentStatus === 'IN_PROGRESS' || currentStatus === 'ON_ROUTE' || currentStatus === 'ON_THE_WAY'
                      ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-300'
                      : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  <Navigation className="w-5 h-5 mb-1" />
                  <span>On Route</span>
                </button>

                {/* 2. Picked Ride Button */}
                <button
                  onClick={() => updateStatus('PICKED_RIDE', 'Passenger picked up, heading to destination')}
                  disabled={updating || !isRideAccepted}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-[11px] font-black transition shadow-sm ${
                    currentStatus === 'PASSENGER_ON_BOARD' || currentStatus === 'PICKED_RIDE'
                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <Car className="w-5 h-5 mb-1" />
                  <span>Picked Ride</span>
                </button>

                {/* 3. Ride Completed Button */}
                <button
                  onClick={() => {
                    if (!isRideAccepted) return;
                    if (!isFullyPaid) {
                      alert(`⚠️ Payment pending!\nPlease verify Remaining Balance (€${cashToCollect.toFixed(2)}) via "Online Payment Done" or "Cash Payment Received" before completing this ride.`);
                      return;
                    }
                    if (confirm(`Confirm ride completion for #${bookingRef}?`)) {
                      updateStatus('COMPLETED', 'Ride completed successfully');
                    }
                  }}
                  disabled={updating || !isRideAccepted}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition shadow-sm"
                >
                  <CheckCircle className="w-5 h-5 mb-1" />
                  <span>Ride Completed</span>
                </button>
              </div>
            </div>
          </div>

          {/* CUSTOMER INFORMATION & EYE BUTTON & DIRECT CONTACT */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Passenger Information</span>
              <span className="text-xs font-bold text-slate-500">{rideDetails.vehicle_category || rideDetails.vehicleCategory}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-900">{customerName}</span>
                  {/* Eye Button: Airport Greeting Board */}
                  <button
                    onClick={() => setNameBoardCustomer({
                      name: customerName,
                      ref: bookingRef,
                      flight: rideDetails.flight_or_train_number || rideDetails.flightOrTrainNumber,
                    })}
                    className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition flex items-center gap-1 text-[11px] font-bold"
                    title="View Passenger Name in Full Screen (Airport Greeting Board)"
                  >
                    <Eye className="w-4 h-4 text-amber-600" />
                    <span>Greeting Board</span>
                  </button>
                  {/* Copy Customer Name */}
                  <button
                    onClick={() => copyToClipboard(customerName, 'custName')}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Copy Customer Name"
                  >
                    {copiedKey === 'custName' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {rawPhone && <div className="text-xs font-bold text-slate-600 mt-1">{rawPhone}</div>}
                {customerEmail && <div className="text-[11px] text-slate-400 font-medium">{customerEmail}</div>}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy-800 flex items-center justify-center font-black text-lg border border-navy-100">
                {customerName[0]?.toUpperCase() || 'P'}
              </div>
            </div>

            {/* THREE DIRECT CONTACT BUTTONS */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {rawPhone ? (
                <>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex flex-col items-center justify-center py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-2xl text-xs transition"
                  >
                    <Phone className="w-4 h-4 text-emerald-600 mb-1" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center py-2.5 px-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 font-bold rounded-2xl text-xs transition"
                  >
                    <MessageCircle className="w-4 h-4 text-green-600 mb-1" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`sms:${cleanPhone}`}
                    className="flex flex-col items-center justify-center py-2.5 px-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold rounded-2xl text-xs transition"
                  >
                    <MessageSquare className="w-4 h-4 text-sky-600 mb-1" />
                    <span>SMS</span>
                  </a>
                </>
              ) : (
                <div className="col-span-3 text-center py-2 text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                  No phone number provided
                </div>
              )}
            </div>

            {/* TRIP DETAILS & LOCATIONS */}
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-start gap-2.5 text-slate-800">
                <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Pickup Location:</div>
                  <div className="text-slate-700 font-medium">{pickupAddress}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-slate-800">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Drop-off Destination:</div>
                  <div className="text-slate-700 font-medium">{destAddress}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-bold pt-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Pickup Time: {pickupTime}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-semibold pt-1">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>
                  Capacity: {rideDetails.passengers || 1} Passengers • {rideDetails.luggage || 0} Suitcases • {rideDetails.cabin_luggage ?? rideDetails.cabinLuggage ?? 0} Cabin Bags
                </span>
              </div>
            </div>

            {/* FLIGHT / TRAIN / CRUISE / SPECIAL REQUESTS */}
            {(rideDetails.flight_or_train_number || rideDetails.flightOrTrainNumber) && (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3 font-bold">
                ✈ Flight / Train: {rideDetails.flight_or_train_number || rideDetails.flightOrTrainNumber}
              </div>
            )}

            {(rideDetails.cruise_ship_name || rideDetails.cruiseShipName) && (
              <div className="text-xs text-sky-800 bg-sky-50 border border-sky-200 rounded-2xl p-3 font-bold">
                🚢 Cruise Ship: {rideDetails.cruise_ship_name || rideDetails.cruiseShipName}
              </div>
            )}

            {(rideDetails.special_requests || rideDetails.specialRequests) && (
              <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-3 font-medium">
                📝 Passenger Notes: "{rideDetails.special_requests || rideDetails.specialRequests}"
              </div>
            )}
          </div>

          {/* PAYMENT & CASH/ONLINE COLLECTION WORKFLOW */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Payment Breakdown</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Remaining Balance</div>
              <div className="text-2xl font-black text-amber-800 mt-1">€{cashToCollect.toFixed(2)}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {isPaidOnline ? '✓ Paid Online' : isPaidCash ? '✓ Paid Cash' : 'Due to Chauffeur'}
              </div>
            </div>

            {/* SCENARIO 1: REMAINING AMOUNT WAS PAID ONLINE */}
            {isPaidOnline ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Online Payment Completed</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs">
                    Payment Status: Paid Online
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-200 text-slate-800">
                    Cash Collection: Not Required
                  </span>
                </div>
                <p className="text-xs text-emerald-800 font-medium">
                  The full fare has been completed online by the passenger. The Cash Payment option is disabled. Do not collect any cash from the passenger.
                </p>
                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Cash Option Automatically Disabled
                  </span>
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="font-bold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Generate Receipt
                  </button>
                </div>
              </div>
            ) : isPaidCash ? (
              /* SCENARIO 2: CASH WAS COLLECTED BY DRIVER */
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                  <DollarSign className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Cash Payment Received & Verified</span>
                </div>
                <p className="text-xs text-emerald-800 font-medium">
                  Verified cash payment of €{Number(rideDetails.driver_cash_received || cashToCollect).toFixed(2)} collected by driver {driver?.name}. Recorded in dispatch ledger.
                </p>
                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Final Payment Method: CASH
                  </span>
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="font-bold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Generate Receipt
                  </button>
                </div>
              </div>
            ) : (
              /* SCENARIO 3: BALANCE IS PENDING - SHOW TWO PROMINENT BUTTONS */
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="text-xs font-bold text-amber-900">
                    Balance Due: <span className="text-base font-black">€{cashToCollect.toFixed(2)}</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                    Awaiting Payment
                  </span>
                </div>

                {/* TWO PROMINENT BUTTONS: ONLINE PAYMENT DONE vs CASH PAYMENT RECEIVED */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Button 1: Online Payment Done */}
                  <button
                    type="button"
                    onClick={() => setShowOnlineVerifyModal(true)}
                    className="py-3.5 px-3 bg-navy-800 hover:bg-navy-900 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md transition"
                  >
                    <CreditCard className="w-4 h-4 text-gold-400" />
                    <span>Online Payment Done</span>
                  </button>

                  {/* Button 2: Cash Payment Received */}
                  <button
                    type="button"
                    onClick={() => setShowCashModal(true)}
                    className="py-3.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md transition"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Cash Payment Received</span>
                  </button>
                </div>

                {/* Option to send online link via WhatsApp */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Customer wants to pay online?</span>
                  <button
                    type="button"
                    onClick={handleRequestOnlinePayment}
                    disabled={updating}
                    className="text-xs font-bold text-navy-800 hover:text-navy-950 flex items-center gap-1 underline"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Payment Link</span>
                  </button>
                </div>

                {onlinePaySent && onlinePayUrl && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="font-mono text-[11px] text-slate-500 truncate bg-white p-2 rounded-xl border border-slate-200">
                      {onlinePayUrl}
                    </div>
                    <a
                      href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(customerName)},%20please%20complete%20the%20remaining%20balance%20payment%20of%20€${cashToCollect.toFixed(2)}%20for%20your%20ride%20at:%20${encodeURIComponent(onlinePayUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Send via WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TURN-BY-TURN GPS NAVIGATION */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={mapsPickupUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 justify-center py-3.5 bg-navy-800 hover:bg-navy-900 text-white rounded-2xl font-bold text-xs shadow-md transition"
            >
              <Navigation className="w-4 h-4 text-gold-400" />
              <span>Maps to Pickup</span>
            </a>
            <a
              href={mapsNavUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 justify-center py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition"
            >
              <Car className="w-4 h-4" />
              <span>Navigate Dropoff</span>
            </a>
          </div>

          {/* REPORT OVERTIME / WAITING TIME (Only if enabled by admin in portal settings) */}
          {Boolean(rides?.overtimeEnabled) && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowWaitForm(!showWaitForm)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-600" />
                  <span>Report Delayed Passenger Waiting Time</span>
                </div>
                <span className="text-slate-400">{showWaitForm ? '▲' : '▼'}</span>
              </button>
              {showWaitForm && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Total Minutes Waited (Free allowance: {rideDetails.free_waiting_minutes || 15} mins)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={waitForm.minutes}
                      onChange={(e) => setWaitForm({ ...waitForm, minutes: Number(e.target.value) })}
                      placeholder="Total minutes"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-navy-800"
                    />
                  </div>
                  <input
                    type="text"
                    value={waitForm.reason}
                    onChange={(e) => setWaitForm({ ...waitForm, reason: e.target.value })}
                    placeholder="Reason (e.g. Flight delay, passport control)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
                  />
                  <button
                    onClick={reportWaiting}
                    disabled={updating || waitForm.minutes <= 0}
                    className="w-full py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {updating ? 'Calculating…' : 'Add Waiting Time Charge'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* VERIFY ONLINE PAYMENT MODAL */}
        {showOnlineVerifyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-navy-100 text-navy-800 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4 text-navy-800" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">Verify Online Payment</h3>
                </div>
                <button onClick={() => setShowOnlineVerifyModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remaining Balance</div>
                <div className="text-3xl font-black text-navy-900">€{cashToCollect.toFixed(2)}</div>
                <div className="text-xs text-slate-600 font-medium pt-1">
                  Passenger: <strong className="text-slate-900">{customerName}</strong>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Transaction Reference / Screenshot Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified customer screenshot / Stripe #txn_xxx"
                  value={onlineVerifyNote}
                  onChange={(e) => setOnlineVerifyNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
                />
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Check that the customer has completed online payment or presented a valid payment confirmation. Once marked, cash payment will be locked and the ride can be completed.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnlineVerifyModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOnlinePayment}
                  disabled={updating}
                  className="flex-1 py-3 text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-2xl transition shadow-md disabled:opacity-50"
                >
                  {updating ? 'Verifying…' : 'Confirm Online Payment Done'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CASH PAYMENT VERIFICATION MODAL */}
        {showCashModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    €
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">Verify Cash Payment</h3>
                </div>
                <button onClick={() => setShowCashModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount to Collect</div>
                <div className="text-3xl font-black text-emerald-700">
                  €{cashToCollect.toFixed(2)}
                </div>
                <div className="text-xs text-slate-600 font-medium pt-1">
                  Passenger: <strong className="text-slate-900">{customerName}</strong>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Booking #{bookingRef} • Driver: {driver?.name}
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Please verify you have received this exact cash amount from the passenger. Once confirmed, this booking will be marked as paid via CASH, online payment will be disabled, and the transaction will be reported to dispatch.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCashModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCashPayment}
                  disabled={updating}
                  className="flex-1 py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition shadow-md disabled:opacity-50"
                >
                  {updating ? 'Verifying…' : 'Confirm Cash Received'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GENERATE CUSTOMER RECEIPT MODAL */}
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-navy-800" />
                  <h3 className="text-sm font-extrabold text-slate-900">Official Passenger Receipt</h3>
                </div>
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div>
                    <div className="font-black text-slate-900 text-sm">BARCELONA TAXI TRANSFER</div>
                    <div className="text-[10px] text-slate-500">Official Regulated Private Chauffeur</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-800">{bookingRef}</div>
                    <div className="text-[10px] text-slate-400">{pickupTime}</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Passenger:</span>
                    <span className="font-bold text-slate-800">{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[220px] truncate">{pickupAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[220px] truncate">{destAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Category:</span>
                    <span className="font-bold text-slate-800">{rideDetails.vehicle_category || rideDetails.vehicleCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chauffeur:</span>
                    <span className="font-bold text-slate-800">{driver?.name} ({driver?.vehicle_plate || driver?.vehiclePlate})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Final Payment Method:</span>
                    <span className="font-bold text-slate-800 uppercase">{isPaidCash ? 'Cash to Driver' : 'Fully Paid Online'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-slate-900">Remaining Balance Paid:</span>
                  <span className="font-black text-emerald-800 text-base">
                    €{cashToCollect.toFixed(2)}
                  </span>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-[10px] tracking-wider uppercase">
                    ✓ PAID IN FULL · TAX INCLUDED
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-2xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="py-3 px-5 text-xs font-bold text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULLSCREEN AIRPORT GREETING BOARD MODAL */}
        {nameBoardCustomer && (
          <div className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 transition-colors duration-300 ${
            nameBoardTheme === 'GOLD' ? 'bg-[#0f172a] text-[#fbbf24]' :
            nameBoardTheme === 'YELLOW' ? 'bg-[#000000] text-[#ffeb3b]' :
            'bg-[#ffffff] text-[#000000]'
          }`}>
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b pb-4 border-current/20">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-widest uppercase opacity-80">
                  Barcelona Taxi Transfer • Airport Arrivals Chauffeur
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Theme buttons */}
                <div className="hidden sm:flex items-center gap-1 bg-current/10 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setNameBoardTheme('GOLD')}
                    className={`px-2.5 py-1 rounded-lg ${nameBoardTheme === 'GOLD' ? 'bg-amber-400 text-slate-900' : ''}`}
                  >
                    Gold
                  </button>
                  <button
                    onClick={() => setNameBoardTheme('YELLOW')}
                    className={`px-2.5 py-1 rounded-lg ${nameBoardTheme === 'YELLOW' ? 'bg-yellow-400 text-black' : ''}`}
                  >
                    Yellow
                  </button>
                  <button
                    onClick={() => setNameBoardTheme('LIGHT')}
                    className={`px-2.5 py-1 rounded-lg ${nameBoardTheme === 'LIGHT' ? 'bg-black text-white' : ''}`}
                  >
                    Light
                  </button>
                </div>
                <button
                  onClick={() => setNameBoardCustomer(null)}
                  className="p-2 sm:px-4 sm:py-2 rounded-xl bg-current/20 hover:bg-current/30 text-current font-extrabold text-sm transition flex items-center gap-1.5"
                >
                  <X className="w-5 h-5" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Middle: Giant Passenger Name */}
            <div className="flex-1 flex flex-col items-center justify-center my-6 text-center px-4">
              <div className="text-xs uppercase font-extrabold tracking-widest opacity-60 mb-4">
                Welcome to Barcelona
              </div>
              <div className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight leading-none break-words max-w-5xl drop-shadow-sm select-all">
                {nameBoardCustomer.name}
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono font-bold text-sm sm:text-xl opacity-90">
                <span className="px-4 py-1.5 rounded-full bg-current/15 border border-current/30">
                  TRF #{nameBoardCustomer.ref}
                </span>
                {nameBoardCustomer.flight && (
                  <span className="px-4 py-1.5 rounded-full bg-current/15 border border-current/30">
                    ✈ Flight {nameBoardCustomer.flight}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between border-t pt-4 border-current/20 text-xs sm:text-sm font-semibold opacity-75">
              <div>Chauffeur: {driver?.name} • Plate: {driver?.vehicle_plate || driver?.vehiclePlate || 'BTT'}</div>
              <div className="text-right">Tap anywhere or press Close to return</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- 3. DRIVER DASHBOARD WITH COMPLETED METRICS (DAY, MONTH, TOTAL) ----
  const allToday = rides?.todayRides || [];
  const upcoming = rides?.upcomingRides || [];
  const completedList = rides?.completedRides || [];

  const completedToday = rides?.stats?.completedToday ?? 0;
  const completedThisMonth = rides?.stats?.completedThisMonth ?? 0;
  const totalCompleted = rides?.stats?.totalCompleted ?? completedList.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-2 sm:px-4">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Barcelona Taxi Transfer" className="h-9 w-auto object-contain" />
            <div>
              <div className="font-black text-slate-900 text-sm leading-tight capitalize">{driver.name}</div>
              <div className="text-[10px] text-slate-500 font-mono font-bold">
                {driver.vehiclePlate || driver.vehicle_plate} • {driver.vehicleModel || driver.vehicle_model}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchRides(driver.id)}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl border border-slate-200 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 rounded-xl border border-rose-200 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* AVAILABILITY SWITCHER */}
        <div className="grid grid-cols-3 gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { key: 'AVAILABLE', label: '🟢 Online', activeClass: 'bg-emerald-600 text-white' },
            { key: 'BREAK', label: '☕ Break', activeClass: 'bg-amber-500 text-white' },
            { key: 'OFFLINE', label: '⚪ Offline', activeClass: 'bg-slate-700 text-white' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => {
                ApiClient.updateDriverAvailability(s.key as any);
                setDriver({ ...driver, currentStatus: s.key });
              }}
              className={`py-2 text-[11px] font-bold rounded-xl transition ${
                driver.currentStatus === s.key ? s.activeClass : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* COMPLETED RIDES KPI STATS (DAY, MONTH, TOTAL) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
            <Award className="w-4 h-4 text-gold-500" />
            <span>Driver Performance & Completed Rides</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-500">In a Day</div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{completedToday}</div>
              <div className="text-[10px] text-slate-400 font-medium">Today</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-500">In a Month</div>
              <div className="text-xl font-black text-sky-700 mt-0.5">{completedThisMonth}</div>
              <div className="text-[10px] text-slate-400 font-medium">This Month</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Rides</div>
              <div className="text-xl font-black text-navy-900 mt-0.5">{totalCompleted}</div>
              <div className="text-[10px] text-slate-400 font-medium">All Time</div>
            </div>
          </div>
        </div>

        {/* TABS: ACTIVE RIDES VS COMPLETED RIDES */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl font-bold text-xs">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ACTIVE' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Active Rides ({allToday.length + upcoming.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'COMPLETED' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed ({completedList.length})</span>
          </button>
        </div>

        {/* TAB 1: ACTIVE RIDES */}
        {activeTab === 'ACTIVE' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center justify-between">
                <span>Today's Dispatched Rides ({allToday.length})</span>
              </div>

              {allToday.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 bg-white border border-slate-200 rounded-3xl font-medium shadow-sm">
                  <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No rides assigned for today yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {allToday.map((ride: any) => {
                    const ref = ride.booking_reference || ride.bookingReference || 'BTT-RIDE';
                    const cName = ride.customer_name || ride.customerName || 'Customer';
                    const pAddress = ride.pickup_address || ride.pickupAddress || 'Barcelona';
                    const dAddress = ride.destination_address || ride.destinationAddress || 'Barcelona';
                    const pTime = formatDateTime(ride.pickup_datetime || ride.pickupDateTime);
                    const rawPhone = ride.customer_phone || ride.customerPhone || '';
                    const cleanPhone = cleanPhoneNumber(rawPhone);
                    const totalFare = Number(ride.total_fare || ride.totalFare || 0);
                    const balance = Number(ride.remaining_balance ?? ride.remainingBalance ?? 0);
                    const notesStr = String(ride.driver_notes || ride.driverNotes || '');
                    const isPaidCash = Boolean(
                      ride.isPaidCash ||
                      ride.is_paid_cash ||
                      (
                        (ride.balance_paid || ride.payment_status === 'PAID') &&
                        (
                          ride.final_payment_method === 'CASH' ||
                          ride.payment_method === 'CASH' ||
                          ride.fare_breakdown?.final_payment_method === 'CASH' ||
                          notesStr.includes('CASH RECEIVED') ||
                          notesStr.includes('CASH COLLECTED')
                        )
                      )
                    );
                    const isPaidOnline = Boolean(
                      !isPaidCash &&
                      (
                        ride.isPaidOnline ||
                        ride.is_paid_online ||
                        (
                          (ride.balance_paid || ride.payment_status === 'PAID') &&
                          (
                            ride.final_payment_method === 'ONLINE' ||
                            ride.payment_method === 'FULL_ONLINE' ||
                            ride.fare_breakdown?.final_payment_method === 'ONLINE' ||
                            ride.online_payment_transaction_id ||
                            ride.stripe_payment_intent_id ||
                            notesStr.includes('ONLINE PAYMENT')
                          )
                        )
                      )
                    );

                    const isOffer = Boolean(ride.isPendingOffer || ride.pending_offer);

                    return (
                      <div
                        key={ride.id}
                        className={`w-full text-left bg-white rounded-3xl p-4 transition shadow-sm hover:shadow-md space-y-3 border ${
                          isOffer
                            ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-300/40 shadow-md'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Reference Header with Copy */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-1.5 font-mono font-black text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            <span>{ref}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(ref, `card-ref-${ref}`);
                              }}
                              className="text-slate-500 hover:text-slate-800 transition"
                              title="Copy Reference"
                            >
                              {copiedKey === `card-ref-${ref}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {isOffer ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs flex items-center gap-1 animate-pulse">
                              <Zap className="w-3 h-3" />
                              <span>OFFER - Accept First</span>
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              ride.status === 'ASSIGNED' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                              ride.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              ride.status === 'IN_PROGRESS' || ride.status === 'ON_ROUTE' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {ride.status}
                            </span>
                          )}
                        </div>

                        {/* Customer Row with Eye button & Copy */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 text-base">{cName}</span>
                              {/* Eye Button for Airport Greeting Board */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNameBoardCustomer({
                                    name: cName,
                                    ref: ref,
                                    flight: ride.flight_or_train_number || ride.flightOrTrainNumber,
                                  });
                                }}
                                className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                                title="Open Full-Screen Greeting Board"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {/* Copy Customer Name */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(cName, `name-${ride.id}`);
                                }}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                title="Copy Customer Name"
                              >
                                {copiedKey === `name-${ride.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            {rawPhone && <div className="text-xs text-slate-500 font-medium">{rawPhone}</div>}
                          </div>

                          {/* Direct Contact Buttons */}
                          {cleanPhone && (
                            <div className="flex gap-1.5">
                              <a
                                href={`tel:${cleanPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                                title="Call Customer"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition"
                                title="WhatsApp Customer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`sms:${cleanPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition"
                                title="SMS Customer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Route Details */}
                        <div className="space-y-1 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{pTime}</span>
                          </div>
                          <div className="truncate font-medium">
                            <strong className="text-slate-800">Pickup:</strong> {pAddress}
                          </div>
                          <div className="truncate font-medium">
                            <strong className="text-slate-800">Drop-off:</strong> {dAddress}
                          </div>
                        </div>

                        {/* Balance Badge */}
                        <div className="pt-1 flex items-center justify-between text-xs">
                          {isPaidOnline ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-lg border border-emerald-300 text-[10px]">
                                Payment Status: Paid Online
                              </span>
                              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[10px]">
                                Cash Collection: Not Required
                              </span>
                            </div>
                          ) : isPaidCash ? (
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              ✓ Cash Collected: €{balance.toFixed(2)}
                            </span>
                          ) : balance > 0 ? (
                            <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                              💵 Remaining Due: €{balance.toFixed(2)}
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              ✓ Fully Paid
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100 flex gap-2">
                          {isOffer && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptRide(ride.id);
                                }}
                                disabled={updating}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                <span>Accept Ride</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectRide(ride.id);
                                }}
                                disabled={updating}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <X className="w-4 h-4" />
                                <span>Reject Ride</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openRide(ride)}
                            className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition shadow-sm ${
                              isOffer
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                : 'bg-navy-800 hover:bg-navy-900 text-white'
                            }`}
                          >
                            {isOffer ? 'View Details →' : 'Open Ride Actions & Payment →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* UPCOMING TRIPS */}
            {upcoming.length > 0 && (
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
                  Upcoming Trips ({upcoming.length})
                </div>
                <div className="space-y-2">
                  {upcoming.map((ride: any) => {
                    const isOffer = Boolean(ride.isPendingOffer || ride.pending_offer);
                    return (
                      <button
                        key={ride.id}
                        onClick={() => openRide(ride)}
                        className={`w-full text-left bg-white rounded-2xl p-3.5 transition shadow-sm border ${
                          isOffer
                            ? 'border-emerald-400 bg-emerald-50/30 ring-2 ring-emerald-300/40 hover:bg-emerald-50/50'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-slate-900 text-xs font-bold">
                              {ride.booking_reference || ride.bookingReference}
                            </span>
                            <span className="text-slate-400 text-xs">·</span>
                            <span className="text-slate-800 text-xs font-semibold">
                              {ride.customer_name || ride.customerName}
                            </span>
                            {isOffer && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs ml-1 flex items-center gap-1">
                                <Zap className="w-3 h-3 animate-pulse" />
                                <span>Accept Ride</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            {formatDateTime(ride.pickup_datetime || ride.pickupDateTime)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPLETED RIDES LIST */}
        {activeTab === 'COMPLETED' && (
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center justify-between">
              <span>Completed Trips History ({completedList.length})</span>
            </div>

            {completedList.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 bg-white border border-slate-200 rounded-3xl font-medium shadow-sm">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No completed rides recorded yet. Complete assigned rides to build your history!
              </div>
            ) : (
              <div className="space-y-3">
                {completedList.map((ride: any) => (
                  <div
                    key={ride.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-xs text-slate-700">
                        {ride.booking_reference || ride.bookingReference}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        COMPLETED
                      </span>
                    </div>
                    <div className="font-black text-slate-900 text-sm">{ride.customer_name || ride.customerName}</div>
                    <div className="text-xs text-slate-600 mt-1">📍 {ride.pickup_address || ride.pickupAddress}</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(ride.updated_at || ride.updatedAt || ride.pickup_datetime || ride.pickupDateTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULLSCREEN AIRPORT GREETING BOARD MODAL (from list or details) */}
      {nameBoardCustomer && (
        <div className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 transition-colors duration-300 ${
          nameBoardTheme === 'GOLD' ? 'bg-[#0f172a] text-[#fbbf24]' :
          nameBoardTheme === 'YELLOW' ? 'bg-[#000000] text-[#ffeb3b]' :
          'bg-[#ffffff] text-[#000000]'
        }`}>
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b pb-4 border-current/20">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black tracking-widest uppercase opacity-80">
                Barcelona Taxi Transfer • Airport Arrivals Chauffeur
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme buttons */}
              <div className="hidden sm:flex items-center gap-1 bg-current/10 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setNameBoardTheme('GOLD')}
                  className={`px-2.5 py-1 rounded-lg ${nameBoardTheme === 'GOLD' ? 'bg-amber-400 text-slate-900' : ''}`}
                >
                  Gold
                </button>
                <button
                  onClick={() => setNameBoardTheme('YELLOW')}
                  className={`px-2.5 py-1 rounded-lg ${nameBoardTheme === 'YELLOW' ? 'bg-yellow-400 text-black' : ''}`}
                >
                  Yellow
                </button>
                <button
                  onClick={() => setNameBoardTheme('LIGHT')}
                  className={`px-2.5 py-1 rounded-lg ${nameBoardTheme === 'LIGHT' ? 'bg-black text-white' : ''}`}
                >
                  Light
                </button>
              </div>
              <button
                onClick={() => setNameBoardCustomer(null)}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-current/20 hover:bg-current/30 text-current font-extrabold text-sm transition flex items-center gap-1.5"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Middle: Giant Passenger Name */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 text-center px-4">
            <div className="text-xs uppercase font-extrabold tracking-widest opacity-60 mb-4">
              Welcome to Barcelona
            </div>
            <div className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight leading-none break-words max-w-5xl drop-shadow-sm select-all">
              {nameBoardCustomer.name}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono font-bold text-sm sm:text-xl opacity-90">
              <span className="px-4 py-1.5 rounded-full bg-current/15 border border-current/30">
                TRF #{nameBoardCustomer.ref}
              </span>
              {nameBoardCustomer.flight && (
                <span className="px-4 py-1.5 rounded-full bg-current/15 border border-current/30">
                  ✈ Flight {nameBoardCustomer.flight}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between border-t pt-4 border-current/20 text-xs sm:text-sm font-semibold opacity-75">
            <div>Chauffeur: {driver?.name} • Plate: {driver?.vehicle_plate || driver?.vehiclePlate || 'BTT'}</div>
            <div className="text-right">Tap anywhere or press Close to return</div>
          </div>
        </div>
      )}
    </div>
  );
}
