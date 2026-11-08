'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { ApiClient } from '@/lib/api';
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal';
import Link from 'next/link';
import {
  Search,
  Download,
  Filter,
  RefreshCw,
  X,
  Eye,
  Copy,
  Check,
  Trash2,
  DollarSign,
  CreditCard,
  TrendingUp,
  Users,
  AlertTriangle,
} from 'lucide-react';

const TRANSFER_TYPES = ['', 'AIRPORT', 'CRUISE_PORT', 'SANTS_STATION', 'CITY_TRANSFER', 'CITY_TOUR', 'GROUP_TRANSFER', 'CUSTOM_QUOTE'];
const VEHICLE_CATEGORIES = ['', 'ECONOMY', 'STANDARD', 'PREMIUM', 'STANDARD_VAN', 'PREMIUM_VAN', 'ELECTRIC', 'LARGE_GROUP'];
const STATUSES = ['', 'PENDING_APPROVAL', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_ROUTE', 'COMPLETED', 'CANCELLED'];
const PAYMENT_STATUSES = ['', 'PENDING', 'PAID', 'REFUNDED', 'FAILED'];

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-800 border-amber-200',
  ASSIGNED: 'bg-sky-50 text-sky-800 border-sky-200',
  ACCEPTED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-800 border-blue-200',
  ON_ROUTE: 'bg-blue-50 text-blue-800 border-blue-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function BookingsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, totalPages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [fullscreenCustomerName, setFullscreenCustomerName] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    transferType: '',
    vehicleCategory: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiClient.listBookings(filters);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBookings();
    // Auto-refresh every 20s to reflect driver acceptance and status changes
    const interval = setInterval(fetchBookings, 20000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleExportCsv = async () => {
    try {
      const csv = await ApiClient.exportBookingsCsv(filters);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcelona-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await ApiClient.deleteAllBookings();
      setShowDeleteAllModal(false);
      await fetchBookings();
      alert('All bookings have been successfully deleted from the database.');
    } catch (err: any) {
      alert('Failed to delete bookings: ' + (err.message || 'Server error'));
    } finally {
      setIsDeletingAll(false);
    }
  };

  const setFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      transferType: '',
      vehicleCategory: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 20,
      sortBy: 'created_at',
      sortOrder: 'DESC',
    });
  };

  const hasFilters = !!(
    filters.search ||
    filters.status ||
    filters.paymentStatus ||
    filters.transferType ||
    filters.vehicleCategory ||
    filters.startDate ||
    filters.endDate
  );

  // Financial KPI calculations
  const totalRevenue = data.items
    .filter((b: any) => b.status !== 'CANCELLED')
    .reduce((sum: number, b: any) => sum + Number(b.total_fare || 0), 0);

  const todayCashCollected = data.items
    .filter((b: any) => b.driver_notes?.includes('CASH RECEIVED'))
    .reduce((sum: number, b: any) => sum + Number(b.remaining_balance || (b.total_fare * 0.8) || 0), 0);

  const todayOnlinePayments = data.items
    .filter((b: any) => b.deposit_paid || b.balance_paid)
    .reduce((sum: number, b: any) => {
      let val = Number(b.deposit_amount || 0);
      if (b.balance_paid && !b.driver_notes?.includes('CASH RECEIVED')) {
        val += Number(b.remaining_balance || 0);
      }
      return sum + val;
    }, 0);

  const driverCashMap: Record<string, number> = {};
  data.items.forEach((b: any) => {
    if (b.driver_notes?.includes('CASH RECEIVED') && b.driver?.name) {
      const driverName = b.driver.name;
      const cash = Number(b.remaining_balance || (b.total_fare * 0.8) || 0);
      driverCashMap[driverName] = (driverCashMap[driverName] || 0) + cash;
    }
  });

  return (
    <>
      <Header
        title="Booking Management"
        subtitle={`${data.total} total bookings — Full search, filters, payment tracking, and CSV export`}
        onNewBookingClick={() => setShowCreate(true)}
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Revenue
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">
                €{totalRevenue.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Active reservations</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Today's Cash Collected
              </div>
              <div className="text-xl font-black text-emerald-800 mt-1">
                €{todayCashCollected.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Collected by drivers</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                Online Payments
              </div>
              <div className="text-xl font-black text-sky-900 mt-1">
                €{todayOnlinePayments.toFixed(2)}
              </div>
              <div className="text-[10px] text-sky-600 mt-0.5">Deposits & online balances</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Driver-Wise Cash
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1 space-y-0.5 max-h-12 overflow-y-auto">
                {Object.keys(driverCashMap).length > 0 ? (
                  Object.entries(driverCashMap).map(([driver, amount]) => (
                    <div key={driver} className="flex justify-between gap-2">
                      <span className="truncate max-w-[90px]">{driver}:</span>
                      <span className="text-emerald-700 font-black">€{amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 font-normal">No cash rides today</span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Quick Status Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'All Bookings', value: '' },
            { label: 'Confirmed', value: 'CONFIRMED' },
            { label: 'Assigned', value: 'ASSIGNED' },
            { label: 'In Progress', value: 'IN_PROGRESS' },
            { label: 'Completed', value: 'COMPLETED' },
            { label: '🚫 Cancelled', value: 'CANCELLED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter('status', tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                filters.status === tab.value
                  ? tab.value === 'CANCELLED'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-navy-800 text-white border-navy-800 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-sm">
          {/* Search + Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, name, email, phone, address…"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-800 transition font-medium"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}

            <button
              onClick={fetchBookings}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200 rounded-xl transition"
              title="Refresh bookings list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:border-slate-400 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>

            {/* DELETE ALL BOOKINGS BUTTON */}
            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition shadow-sm ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Bookings</span>
            </button>
          </div>

          {/* Filter Dropdowns Row */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Status', key: 'status', options: STATUSES },
              { label: 'Payment', key: 'paymentStatus', options: PAYMENT_STATUSES },
              { label: 'Transfer', key: 'transferType', options: TRANSFER_TYPES },
              { label: 'Vehicle', key: 'vehicleCategory', options: VEHICLE_CATEGORIES },
            ].map(({ label, key, options }) => (
              <select
                key={key}
                value={(filters as any)[key]}
                onChange={(e) => setFilter(key, e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-navy-800 transition"
              >
                <option value="">{label}: All</option>
                {options.filter(Boolean).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ))}

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilter('startDate', e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-navy-800"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilter('endDate', e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-navy-800"
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['Reference', 'Customer', 'Transfer / Vehicle', 'Pickup Date & Location', 'Fare & Balance', 'Payment Status', 'Driver', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 animate-pulse">
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-slate-100 rounded w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="w-6 h-6 opacity-40 text-slate-400" />
                        <span className="font-medium">No bookings match your current filters</span>
                        {hasFilters && (
                          <button onClick={clearFilters} className="text-navy-800 hover:underline text-xs font-bold">
                            Clear filters to see all bookings
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.items.map((b: any) => (
                    <tr
                      key={b.id}
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition"
                    >
                      {/* Reference with Copy Button */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {b.booking_reference}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(b.booking_reference, `ref-${b.id}`)}
                            title="Copy booking reference"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                          >
                            {copiedItem === `ref-${b.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          {new Date(b.created_at).toLocaleDateString('en-GB')}
                        </div>
                      </td>

                      {/* Customer with Eye Button (Fullscreen) & Copy Button */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{b.customer_name}</span>
                          <button
                            type="button"
                            onClick={() => setFullscreenCustomerName(b.customer_name)}
                            title="View customer name full screen"
                            className="p-1 rounded text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(b.customer_name, `name-${b.id}`)}
                            title="Copy customer name"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            {copiedItem === `name-${b.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-slate-500 text-[10px] truncate max-w-[140px]">
                          {b.customer_email}
                        </div>
                        <div className="text-slate-400 text-[10px]">{b.customer_phone}</div>
                      </td>

                      {/* Transfer Type & Vehicle */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{b.transfer_type}</div>
                        <div className="text-slate-500 text-[10px]">{b.vehicle_category}</div>
                        <div className="text-slate-400 text-[10px]">
                          {b.passengers}P / {b.luggage}L + {b.flight_details?.cabin_luggage ?? b.cabin_luggage ?? 0}C
                        </div>
                      </td>

                      {/* Pickup Date & Location */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <div className="text-slate-900 font-semibold text-[11px]">
                          {b.pickup_datetime
                            ? new Date(b.pickup_datetime).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </div>
                        <div className="text-slate-500 text-[10px] truncate">
                          {b.pickup_address}
                        </div>
                      </td>

                      {/* Fare Breakdown (Total, Advance, Remaining) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-black text-slate-900 text-sm">
                          €{Number(b.total_fare || 0).toFixed(2)}
                        </div>
                        <div className="text-emerald-700 font-semibold text-[10px]">
                          Dep: €{Number(b.deposit_amount || 0).toFixed(2)}
                        </div>
                        <div className="text-amber-800 font-semibold text-[10px]">
                          Bal: €{Number(b.remaining_balance || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Payment Status & Final Method */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold ${
                            b.deposit_paid
                              ? 'text-emerald-700'
                              : 'text-amber-800'
                          }`}
                        >
                          {b.deposit_paid ? '✓ Dep Paid' : '⏳ Dep Pending'}
                        </span>
                        <div
                          className={`text-[10px] font-medium mt-0.5 ${
                            b.balance_paid ? 'text-emerald-700 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {b.balance_paid ? 'Balance ✓ Paid' : 'Bal Due'}
                        </div>
                        {b.driver_notes?.includes('CASH RECEIVED') || b.fare_breakdown?.final_payment_method === 'CASH' ? (
                          <div className="mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              💵 Cash Collected
                            </span>
                          </div>
                        ) : b.balance_paid || b.driver_notes?.includes('ONLINE PAYMENT') || b.fare_breakdown?.final_payment_method === 'ONLINE' ? (
                          <div className="mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-100 text-sky-800 border border-sky-200">
                              💳 Online Paid
                            </span>
                          </div>
                        ) : null}
                      </td>

                      {/* Driver Assigned & Status */}
                      <td className="px-4 py-3">
                        {b.driver ? (
                          <div>
                            <div className="font-bold text-navy-800 text-[11px]">
                              {b.driver.name}
                            </div>
                            <div className="text-[10px] text-slate-500">{b.driver.vehicle_plate}</div>
                            {b.driver_notes?.includes('CASH RECEIVED') && (
                              <div className="text-[9px] text-emerald-700 font-bold">
                                Received Cash
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className="text-navy-800 hover:text-amber-600 font-bold transition"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FULLSCREEN CUSTOMER NAME BOARD (EYE BUTTON MODAL) */}
      {fullscreenCustomerName && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-150">
          <button
            onClick={() => setFullscreenCustomerName(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 transition shadow-sm border border-slate-300"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="text-center space-y-4 max-w-4xl">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
              Passenger Name Board · Barcelona Taxi Transfer
            </span>
            <div className="text-5xl sm:text-7xl lg:text-9xl font-black text-black tracking-tight uppercase select-all break-words leading-none py-6 border-y-2 border-slate-200">
              {fullscreenCustomerName}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              High-contrast display board for airport arrivals hall greeting
            </p>
          </div>
        </div>
      )}

      {/* DELETE ALL BOOKINGS CONFIRMATION MODAL */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Delete All Bookings?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will permanently remove <strong>all {data.total} bookings</strong> and their corresponding tracking logs from the Supabase database. This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeletingAll}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isDeletingAll ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Booking Creation Modal */}
      {showCreate && (
        <CreateBookingModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchBookings();
          }}
        />
      )}
    </>
  );
}
