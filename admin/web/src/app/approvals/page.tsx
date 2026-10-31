'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ApiClient } from '@/lib/api';
import { CheckCircle, XCircle, Edit3, AlertTriangle } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  PENDING_APPROVAL: 'bg-amber-50 text-amber-800 border-amber-200',
  REVISION_PROPOSED: 'bg-purple-50 text-purple-800 border-purple-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function ApprovalsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviseModal, setReviseModal] = useState<any | null>(null);
  const [reviseForm, setReviseForm] = useState({ revisedFare: 0, revisionReason: '', notes: '' });
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getPendingApprovals();
      setBookings(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      await ApiClient.approveBooking(id);
      fetchApprovals();
    } catch (err: any) {
      alert('Failed to approve: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevise = async () => {
    if (!reviseModal) return;
    setActionLoading(reviseModal.id + '-revise');
    try {
      await ApiClient.reviseBookingFare(
        reviseModal.id,
        reviseForm.revisedFare,
        reviseForm.revisionReason,
        reviseForm.notes
      );
      setReviseModal(null);
      fetchApprovals();
    } catch (err: any) {
      alert('Failed to revise fare: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id + '-reject');
    try {
      await ApiClient.rejectBooking(rejectModal.id, rejectReason);
      setRejectModal(null);
      fetchApprovals();
    } catch (err: any) {
      alert('Failed to reject: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Header
        title="Approvals Queue"
        subtitle={`${bookings.length} booking(s) awaiting review — Cruise Port & Sants Station require manual approval`}
      />

      <div className="p-6 space-y-5">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold mb-1">Manual Review Required</div>
            <div className="text-amber-800 leading-relaxed font-medium">
              Cruise Port and Sants Station bookings require admin approval before customer payment is processed.
              You may approve as-is, revise the fare (e.g. for pier access fees or special equipment), or reject the booking.
              All actions are logged to the audit trail and the customer is notified automatically.
            </div>
          </div>
        </div>

        {/* Approvals List */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading pending approvals…</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-sm">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-slate-900">All Clear!</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">No bookings are currently awaiting your approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {/* Top row */}
                <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-black text-slate-900 text-sm bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        {b.booking_reference}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          STATUS_COLOR[b.approval_status || b.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {b.approval_status || b.status}
                      </span>
                      <span className="text-[10px] text-slate-600 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {b.transfer_type} • {b.vehicle_category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      Received {new Date(b.created_at).toLocaleString('en-GB')}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setReviseModal(b);
                        setReviseForm({ revisedFare: b.total_fare, revisionReason: '', notes: '' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                      Revise Fare
                    </button>
                    <button
                      onClick={() => handleApprove(b.id)}
                      disabled={actionLoading === b.id + '-approve'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {actionLoading === b.id + '-approve' ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => { setRejectModal(b); setRejectReason(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition shadow-sm"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Reject
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Customer</div>
                    <div className="font-bold text-slate-900 text-sm">{b.customer_name}</div>
                    <div className="text-slate-600 font-medium">{b.customer_email}</div>
                    <div className="text-slate-600 font-medium">{b.customer_phone}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Pickup</div>
                    <div className="text-slate-900 font-semibold">
                      {new Date(b.pickup_datetime).toLocaleString('en-GB')}
                    </div>
                    <div className="text-slate-600 text-[11px] mt-0.5">{b.pickup_address}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Destination</div>
                    <div className="text-slate-900 font-semibold text-[11px]">{b.destination_address}</div>
                    {b.flight_or_train_number && (
                      <div className="text-amber-800 font-bold text-[10px] mt-1">
                        ✈ Flight/Train: {b.flight_or_train_number}
                      </div>
                    )}
                    {b.cruise_ship_name && (
                      <div className="text-sky-800 font-bold text-[10px] mt-1">
                        🚢 Cruise: {b.cruise_ship_name}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Fare & Deposit</div>
                    <div className="text-xl font-black text-slate-900">€{Number(b.total_fare || 0).toFixed(2)}</div>
                    <div className="text-emerald-700 font-bold text-[11px]">Deposit (20%): €{Number(b.deposit_amount || (b.total_fare * 0.2)).toFixed(2)}</div>
                    <div className="text-amber-800 font-bold text-[11px]">Bal due to driver: €{Number(b.remaining_balance || (b.total_fare * 0.8)).toFixed(2)}</div>
                    {b.passengers && (
                      <div className="text-slate-500 text-[10px] mt-1 font-medium">
                        {b.passengers} pax · {b.luggage} bags
                      </div>
                    )}
                  </div>
                </div>

                {b.special_requests && (
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Special requests: </span>
                    {b.special_requests}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revise Fare Modal */}
      {reviseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-600" />
              Revise Fare — {reviseModal.booking_reference}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Original Fare: €{Number(reviseModal.total_fare).toFixed(2)}
                </label>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  New Revised Total Fare (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={reviseForm.revisedFare}
                  onChange={(e) => setReviseForm({ ...reviseForm, revisedFare: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:border-navy-800 focus:outline-none"
                />
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                  New deposit (20%): €{((reviseForm.revisedFare * 0.2)).toFixed(2)} |
                  Cash to driver: €{((reviseForm.revisedFare * 0.8)).toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for Revision (shown to customer) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={reviseForm.revisionReason}
                  onChange={(e) => setReviseForm({ ...reviseForm, revisionReason: e.target.value })}
                  placeholder="e.g. Pier terminal access surcharge applied for Cruise Port transfer"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-navy-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Internal Admin Notes (not shown to customer)
                </label>
                <input
                  type="text"
                  value={reviseForm.notes}
                  onChange={(e) => setReviseForm({ ...reviseForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-navy-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setReviseModal(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRevise}
                disabled={!reviseForm.revisionReason || actionLoading !== null}
                className="flex-1 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition disabled:opacity-50 shadow-sm"
              >
                {actionLoading ? 'Sending...' : 'Submit Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              Reject Booking — {rejectModal.booking_reference}
            </h3>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Rejection Reason (customer will be notified) *
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. No vehicles available for this pickup window / Cruise terminal not serviced on this date"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-navy-800 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || actionLoading !== null}
                className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition disabled:opacity-50 shadow-sm"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
