'use client';

import React from 'react';
import Image from 'next/image';
import { FileText, Printer, X, Download } from 'lucide-react';

export function normalizeBookingData(data: any) {
  if (!data) return null;

  const rawFare =
    data.total_fare ??
    data.totalFare ??
    data.fare_breakdown?.totalFare ??
    data.fareBreakdown?.totalFare ??
    0;

  const rawDeposit =
    data.deposit_amount ??
    data.depositAmount ??
    data.fare_breakdown?.depositAmount ??
    data.fareBreakdown?.depositAmount ??
    0;

  const rawRemaining =
    data.remaining_balance ??
    data.remainingBalance ??
    data.fare_breakdown?.remainingBalance ??
    data.fareBreakdown?.remainingBalance ??
    0;

  const paymentStatus = (data.payment_status || data.paymentStatus || '').toUpperCase();
  const balancePaid = Boolean(data.balance_paid ?? data.balancePaid ?? paymentStatus === 'PAID');
  const depositPaid = Boolean(data.deposit_paid ?? data.depositPaid ?? true);

  return {
    ...data,
    bookingReference: (data.booking_reference || data.bookingReference || data.reference || '').toUpperCase(),
    transferType: data.transfer_type || data.transferType || 'AIRPORT',
    vehicleCategory: data.vehicle_category || data.vehicleCategory || 'STANDARD',
    status: data.status || 'CONFIRMED',
    paymentStatus: balancePaid ? 'PAID' : paymentStatus || 'PENDING',
    pickupAddress: data.pickup_address || data.pickupAddress || '',
    destinationAddress: data.destination_address || data.destinationAddress || '',
    pickupDateTime:
      data.pickup_datetime ||
      data.pickupDateTime ||
      (data.pickupDate && data.pickupTime ? `${data.pickupDate} ${data.pickupTime}` : null),
    pickupDate: data.pickupDate || (data.pickup_datetime ? new Date(data.pickup_datetime).toLocaleDateString() : ''),
    pickupTime: data.pickupTime || (data.pickup_datetime ? new Date(data.pickup_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
    customerName: data.customer_name || data.customerName || '',
    customerEmail: data.customer_email || data.customerEmail || '',
    customerPhone: data.customer_phone || data.customerPhone || '',
    totalFare: parseFloat(String(rawFare)) || 0,
    depositAmount: parseFloat(String(rawDeposit)) || 0,
    remainingBalance: parseFloat(String(rawRemaining)) || 0,
    depositPaid,
    balancePaid,
    passengers: data.passengers || 1,
    luggage: data.luggage || 0,
    cabinLuggage: data.flight_details?.cabin_luggage ?? data.cabin_luggage ?? data.cabinLuggage ?? 0,
    assignedDriver: data.driver
      ? {
          name: data.driver.name,
          phone: data.driver.phone,
          vehiclePlate: data.driver.vehicle_plate || data.driver.vehiclePlate,
          vehicleModel: data.driver.vehicle_model || data.driver.vehicleModel,
          rating: data.driver.rating,
        }
      : data.assignedDriver || null,
  };
}

interface BookingReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export default function BookingReceiptModal({ isOpen, onClose, booking }: BookingReceiptModalProps) {
  if (!isOpen || !booking) return null;

  const normalized = normalizeBookingData(booking);
  if (!normalized) return null;

  const isPaid = normalized.balancePaid || normalized.paymentStatus === 'PAID';

  let formattedDateTime = '-';
  if (normalized.pickupDateTime) {
    try {
      const d = new Date(normalized.pickupDateTime);
      if (!isNaN(d.getTime())) {
        formattedDateTime = d.toLocaleString([], {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        formattedDateTime = String(normalized.pickupDateTime);
      }
    } catch {
      formattedDateTime = String(normalized.pickupDateTime);
    }
  }

  return (
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
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close receipt modal"
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
              <p className="text-xs text-gray-500 mt-0.5">Premier Chauffeur &amp; Private Airport Transfers</p>
              <p className="text-xs text-gray-500">VAT ID: ES60064588L | Barcelona, Spain</p>
              <p className="text-xs text-gray-500">Phone: +34 687433263</p>
              <p className="text-xs text-gray-500">Email: bookings.barcelonataxitransfer@gmail.com</p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPaid ? 'Paid in Full' : 'Confirmed Booking'}
              </span>
              <div className="mt-2 text-xs text-gray-500">
                <div>Receipt Date: {new Date().toLocaleDateString()}</div>
                <div>Ref: {normalized.bookingReference}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <div>
              <span className="text-gray-400 uppercase font-bold tracking-wider block mb-1">
                Booking Reference
              </span>
              <span className="font-mono text-base font-bold text-navy-950">
                {normalized.bookingReference}
              </span>
              <div className="mt-2 text-gray-600">
                <strong>Service:</strong> {normalized.transferType?.replace('_', ' ')} Transfer
              </div>
              <div className="text-gray-600">
                <strong>Vehicle:</strong> {normalized.vehicleCategory?.replace('_', ' ')}
              </div>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-bold tracking-wider block mb-1">
                Billed To
              </span>
              <div className="font-bold text-navy-950 text-sm">
                {normalized.customerName || 'Valued Guest'}
              </div>
              <div className="text-gray-600">{normalized.customerEmail || '-'}</div>
              <div className="text-gray-600">{normalized.customerPhone || '-'}</div>
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
                  <td className="p-3 text-right font-medium text-navy-950">
                    {normalized.pickupAddress || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Drop-off Destination</td>
                  <td className="p-3 text-right font-medium text-navy-950">
                    {normalized.destinationAddress || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Scheduled Date & Time</td>
                  <td className="p-3 text-right text-navy-950 font-medium">
                    {formattedDateTime}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Passengers / Luggage</td>
                  <td className="p-3 text-right text-navy-950">
                    {normalized.passengers} Passenger{normalized.passengers > 1 ? 's' : ''}, {normalized.luggage} Suitcase{normalized.luggage !== 1 ? 's' : ''}
                    {Number(normalized.cabinLuggage) > 0 ? `, ${normalized.cabinLuggage} Cabin Bag${Number(normalized.cabinLuggage) > 1 ? 's' : ''}` : ''}
                  </td>
                </tr>
                {normalized.assignedDriver && (
                  <tr>
                    <td className="p-3 font-medium">Assigned Chauffeur</td>
                    <td className="p-3 text-right text-navy-950 font-medium">
                      {normalized.assignedDriver.name} ({normalized.assignedDriver.phone})
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-base font-bold text-navy-950 pt-2 border-t border-gray-300">
              <span>Total Fare (EUR)</span>
              <span className="text-[#c48e3a] text-xl">
                €{Number(normalized.totalFare || 0).toFixed(2)}
              </span>
            </div>
            {isPaid && (
              <div className="text-right text-xs font-semibold text-emerald-600">
                ✓ Paid in Full · VAT Included
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
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
  );
}
