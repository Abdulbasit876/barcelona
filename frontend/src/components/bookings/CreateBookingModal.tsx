'use client';

import { useState } from 'react';
import { X, Calendar, User, MapPin, DollarSign } from 'lucide-react';
import { ApiClient } from '@/lib/api';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (booking: any) => void;
}

export function CreateBookingModal({ isOpen, onClose, onCreated }: CreateBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    transferType: 'AIRPORT',
    vehicleCategory: 'PREMIUM',
    pickupAddress: 'Josep Tarradellas Barcelona-El Prat Airport, Terminal 1',
    destinationAddress: 'Passeig de Gràcia 38, 08007 Barcelona',
    pickupDate: new Date().toISOString().slice(0, 10),
    pickupTime: '12:00',
    passengers: 2,
    luggage: 2,
    cabinLuggage: 1,
    childSeats: 0,
    flightOrTrainNumber: '',
    cruiseShipName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: '',
    totalFare: 55.0,
    depositPercentage: 20,
    paymentMethod: 'ONLINE_DEPOSIT',
  });

  if (!isOpen) return null;

  const depositAmount = Number(((form.totalFare * form.depositPercentage) / 100).toFixed(2));
  const remainingBalance = Number((form.totalFare - depositAmount).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const pickupDatetime = `${form.pickupDate}T${form.pickupTime}:00Z`;
      const created = await ApiClient.createBooking({
        ...form,
        pickupDatetime,
        passengers: Number(form.passengers),
        luggage: Number(form.luggage),
        cabinLuggage: Number(form.cabinLuggage),
        childSeats: Number(form.childSeats),
        totalFare: Number(form.totalFare),
        depositPercentage: Number(form.depositPercentage),
      });

      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              +
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Create Booking Manually</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Dispatch on behalf of customer with live deposit calculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Transfer & Vehicle Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transfer Type
              </label>
              <select
                value={form.transferType}
                onChange={(e) => setForm({ ...form, transferType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-navy-800"
              >
                <option value="AIRPORT">Airport Transfer (BCN El Prat)</option>
                <option value="CRUISE_PORT">Cruise Port / Terminal</option>
                <option value="SANTS_STATION">Barcelona Sants Station</option>
                <option value="CITY_TRANSFER">City Transfer (Inside Barcelona)</option>
                <option value="CITY_TOUR">City Tour (Hourly)</option>
                <option value="GROUP_TRANSFER">Large Group Transfer</option>
                <option value="CUSTOM_QUOTE">Custom Quote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Category
              </label>
              <select
                value={form.vehicleCategory}
                onChange={(e) => setForm({ ...form, vehicleCategory: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-navy-800"
              >
                <option value="ECONOMY">Economy (Toyota Corolla, Prius+)</option>
                <option value="STANDARD">Standard (Toyota Camry, Lexus ES)</option>
                <option value="PREMIUM">Premium (Mercedes E-Class, High-spec Lexus)</option>
                <option value="STANDARD_VAN">Standard Van (VW Caddy Maxi, Vito)</option>
                <option value="PREMIUM_VAN">Premium Van (Mercedes V-Class)</option>
                <option value="ELECTRIC">Electric (Tesla Model 3/Y, EQE)</option>
                <option value="LARGE_GROUP">Large Group Transfer (Minibus/Coach)</option>
              </select>
            </div>
          </div>

          {/* Pickup & Destination */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                Pickup Location
              </label>
              <input
                type="text"
                required
                value={form.pickupAddress}
                onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                Destination Address
              </label>
              <input
                type="text"
                required
                value={form.destinationAddress}
                onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                Pickup Date
              </label>
              <input
                type="date"
                required
                value={form.pickupDate}
                onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Time</label>
              <input
                type="time"
                required
                value={form.pickupTime}
                onChange={(e) => setForm({ ...form, pickupTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              Customer Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Gonzalez"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="maria@example.com"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone / WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="+34 600 000 000"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Extras */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Passengers</label>
              <input
                type="number"
                min={1}
                value={form.passengers}
                onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Luggage</label>
              <input
                type="number"
                min={0}
                value={form.luggage}
                onChange={(e) => setForm({ ...form, luggage: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cabin Luggage</label>
              <input
                type="number"
                min={0}
                value={form.cabinLuggage}
                onChange={(e) => setForm({ ...form, cabinLuggage: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Child Seats</label>
              <input
                type="number"
                min={0}
                value={form.childSeats}
                onChange={(e) => setForm({ ...form, childSeats: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
              />
            </div>
          </div>

          {/* Pricing & Deposit Engine Preview */}
          <div className="p-3.5 sm:p-4 bg-amber-50/70 text-slate-900 rounded-2xl border border-amber-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between flex-wrap gap-1">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                Fare & Deposit Breakdown
              </span>
              <span className="text-[11px] font-bold text-amber-800">
                Deposit Rate: {form.depositPercentage}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-center py-2 bg-white rounded-xl border border-amber-200/80 shadow-sm">
              <div className="p-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Total Fare</div>
                <div className="text-base font-black text-slate-900">€{Number(form.totalFare).toFixed(2)}</div>
              </div>
              <div className="p-1 sm:border-x border-slate-100">
                <div className="text-[10px] text-emerald-700 uppercase font-bold">Online Deposit ({form.depositPercentage}%)</div>
                <div className="text-base font-black text-emerald-700">€{depositAmount.toFixed(2)}</div>
              </div>
              <div className="p-1">
                <div className="text-[10px] text-amber-800 uppercase font-bold">Driver Balance</div>
                <div className="text-base font-black text-amber-800">€{remainingBalance.toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Fare (€)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.totalFare}
                  onChange={(e) => setForm({ ...form, totalFare: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Deposit %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.depositPercentage}
                  onChange={(e) => setForm({ ...form, depositPercentage: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create & Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
