'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ApiClient } from '@/lib/api';
import Link from 'next/link';
import {
  User,
  MapPin,
  Car,
  DollarSign,
  Phone,
  Mail,
  UserCheck,
  ArrowLeft,
  Navigation,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export default function BookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [bookingData, driversData] = await Promise.all([
        ApiClient.getBooking(id),
        ApiClient.listDrivers(),
      ]);
      setBooking(bookingData);
      setDrivers(driversData || []);
      if (bookingData.driver_id) {
        setSelectedDriverId(bookingData.driver_id);
      }
    } catch (err: any) {
      console.error('Error fetching booking details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAssignDriver = async () => {
    if (!selectedDriverId) return;
    setActionLoading(true);
    try {
      const res = await ApiClient.assignDriver(booking.id, selectedDriverId);
      if (res.hasScheduleConflict) {
        alert(
          `⚠️ Note: Driver has ${res.conflictCount} other ride(s) scheduled within 90 minutes. Assignment confirmed.`,
        );
      }
      await fetchDetails();
    } catch (err: any) {
      alert('Assignment failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignDriver = async () => {
    if (!confirm('Unassign driver from this booking?')) return;
    setActionLoading(true);
    try {
      await ApiClient.unassignDriver(booking.id, 'Unassigned by administrator');
      setSelectedDriverId('');
      await fetchDetails();
    } catch (err: any) {
      alert('Unassign failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason) return alert('Please provide a reason');
    setActionLoading(true);
    try {
      await ApiClient.cancelBooking(booking.id, cancelReason);
      setShowCancelModal(false);
      await fetchDetails();
    } catch (err: any) {
      alert('Cancellation failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await ApiClient.approveBooking(booking.id);
      await fetchDetails();
    } catch (err: any) {
      alert('Approval failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Booking Details" />
        <div className="p-8 text-center text-slate-400 text-xs">Loading booking information…</div>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Header title="Booking Not Found" />
        <div className="p-8 text-center text-slate-400 text-xs">
          This booking could not be found or has been removed.
          <div className="mt-4">
            <Link href="/bookings" className="text-navy-800 hover:underline font-bold">
              ← Return to Bookings
            </Link>
          </div>
        </div>
      </>
    );
  }

  const pickupMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    booking.pickup_address,
  )}`;
  const routeMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    booking.pickup_address,
  )}&destination=${encodeURIComponent(booking.destination_address)}`;

  return (
    <>
      <Header
        title={`Booking #${booking.booking_reference}`}
        subtitle={`${booking.transfer_type} • ${booking.vehicle_category} • Created ${new Date(
          booking.created_at,
        ).toLocaleString('en-GB')}`}
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/bookings"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Bookings
          </Link>

          <div className="flex items-center gap-2">
            {booking.status !== 'CANCELLED' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition shadow-sm"
              >
                Cancel Booking
              </button>
            )}

            {booking.approval_status === 'PENDING_APPROVAL' && (
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
              >
                Approve Booking
              </button>
            )}
          </div>
        </div>

        {/* Top Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Ride Status
            </div>
            <div className="text-xl font-black text-slate-900">{booking.status}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Approval: {booking.approval_status || 'APPROVED'}
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Total Fare
            </div>
            <div className="text-xl font-black text-slate-900">
              €{Number(booking.total_fare || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Payment: {booking.payment_status}
            </div>
          </div>

          <div className="bg-white border border-emerald-200/90 bg-emerald-50/30 rounded-2xl p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
              Online Deposit ({booking.deposit_percentage || 20}%)
            </div>
            <div className="text-xl font-black text-emerald-800">
              €{Number(booking.deposit_amount || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              {booking.deposit_paid ? '✓ Deposit Collected' : '⏳ Deposit Awaiting'}
            </div>
          </div>

          <div className="bg-white border border-amber-200/90 bg-amber-50/30 rounded-2xl p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
              Remaining Balance
            </div>
            <div className="text-xl font-black text-amber-800">
              €{Number(booking.remaining_balance || 0).toFixed(2)}
            </div>
            <div className="text-[11px] font-semibold mt-0.5">
              {booking.driver_notes?.includes('CASH RECEIVED') || booking.fare_breakdown?.final_payment_method === 'CASH' ? (
                <span className="text-emerald-700 font-bold">✓ Collected in Cash by Chauffeur</span>
              ) : booking.balance_paid || booking.driver_notes?.includes('ONLINE PAYMENT') || booking.fare_breakdown?.final_payment_method === 'ONLINE' ? (
                <span className="text-emerald-700 font-bold">✓ Paid Online (No Cash Required)</span>
              ) : (
                <span className="text-amber-700">To Collect on Dropoff</span>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 spans): Route, Passenger, Logistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Trip Route & Schedule
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <a
                    href={pickupMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-800 font-semibold"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Pickup Map
                  </a>
                  <span className="text-slate-300">·</span>
                  <a
                    href={routeMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-semibold"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Full Route
                  </a>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                    Pickup Location
                  </div>
                  <div className="text-slate-900 font-semibold text-sm">{booking.pickup_address}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                    Destination Address
                  </div>
                  <div className="text-slate-900 font-semibold text-sm">{booking.destination_address}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                      Pickup Datetime
                    </div>
                    <div className="text-slate-900 font-bold">
                      {new Date(booking.pickup_datetime).toLocaleString('en-GB', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                      Capacity
                    </div>
                    <div className="text-slate-800 font-semibold">
                      {booking.passengers} Passengers • {booking.luggage} Suitcases •{' '}
                      {booking.flight_details?.cabin_luggage ?? booking.cabin_luggage ?? 0} Cabin Bags •{' '}
                      {booking.child_seats || 0} Child Seats
                    </div>
                  </div>
                </div>

                {(booking.flight_or_train_number || booking.cruise_ship_name) && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 mt-2">
                    {booking.flight_or_train_number && (
                      <div>
                        <div className="text-[10px] text-amber-700 font-bold uppercase">
                          Flight / Train #
                        </div>
                        <div className="text-slate-900 font-mono font-bold">
                          {booking.flight_or_train_number}
                        </div>
                      </div>
                    )}
                    {booking.cruise_ship_name && (
                      <div>
                        <div className="text-[10px] text-sky-700 font-bold uppercase">
                          Cruise Ship
                        </div>
                        <div className="text-slate-900 font-bold">{booking.cruise_ship_name}</div>
                      </div>
                    )}
                  </div>
                )}

                {booking.special_requests && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                      Customer Special Requests
                    </div>
                    <div className="text-slate-800 text-xs italic">
                      "{booking.special_requests}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Details Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600" />
                Customer Contact
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Name</div>
                  <div className="text-slate-900 font-bold text-sm">{booking.customer_name}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Email</div>
                  <a
                    href={`mailto:${booking.customer_email}`}
                    className="text-navy-800 hover:underline flex items-center gap-1.5 font-semibold"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {booking.customer_email}
                  </a>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Phone</div>
                  <a
                    href={`tel:${booking.customer_phone}`}
                    className="text-emerald-700 hover:underline flex items-center gap-1.5 font-bold"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {booking.customer_phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Audit Trail & History
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(!booking.auditLogs || booking.auditLogs.length === 0) ? (
                  <div className="text-xs text-slate-400 py-3">No audit actions recorded yet</div>
                ) : (
                  booking.auditLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{log.action}</div>
                        <div className="text-slate-500 text-[11px]">By: {log.changed_by}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleString('en-GB')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Driver Assignment */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
                Driver Assignment
              </div>

              {booking.driver ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-sky-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-800">{booking.driver.name}</span>
                    <span className="text-[10px] text-slate-600 font-mono font-bold">
                      {booking.driver.vehicle_plate}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 font-medium">{booking.driver.vehicle_model}</div>
                  <div className="text-xs text-slate-500">Phone: {booking.driver.phone}</div>

                  {booking.fare_breakdown?.accepted_at && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded-lg">
                      <div className="font-bold">✓ Accepted by Driver</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(booking.fare_breakdown.accepted_at).toLocaleString('en-GB')}
                      </div>
                    </div>
                  )}

                  {Array.isArray(booking.fare_breakdown?.progress_history) && booking.fare_breakdown.progress_history.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Ride Progress Updates</div>
                      {booking.fare_breakdown.progress_history.map((p: any, idx: number) => (
                        <div key={idx} className="text-[10px] text-slate-700 bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="font-bold text-sky-800">{p.status}</span>
                          <span className="text-slate-400">{new Date(p.timestamp).toLocaleTimeString('en-GB')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={handleUnassignDriver}
                      disabled={actionLoading}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold transition"
                    >
                      Unassign Driver
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    No driver assigned yet
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-bold block mb-1">
                      Choose Fleet Driver
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
                    >
                      <option value="">Select a driver…</option>
                      {drivers
                        .filter((d) => d.is_active)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} — {d.vehicle_plate} ({d.vehicle_model})
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAssignDriver}
                    disabled={!selectedDriverId || actionLoading}
                    className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Assigning…' : 'Dispatch Driver'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-slate-900">Cancel Booking #{booking.booking_reference}</h3>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Cancellation Reason *
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation via phone"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={actionLoading || !cancelReason}
                className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition disabled:opacity-50 shadow-sm"
              >
                {actionLoading ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
