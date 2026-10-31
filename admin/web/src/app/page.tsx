'use client';

import { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Activity,
  BanknoteIcon,
  Wallet,
  RotateCcw,
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal';
import Link from 'next/link';

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBooking, setShowCreateBooking] = useState(false);

  const fetchData = async () => {
    try {
      const [overviewData, trendsData, catsData, bookingsData] = await Promise.all([
        ApiClient.getFinancialOverview(),
        ApiClient.getRevenueTrends(30),
        ApiClient.getCategoryPerformance(),
        ApiClient.listBookings({ limit: 8, sortBy: 'created_at', sortOrder: 'DESC' }),
      ]);
      setOverview(overviewData);
      setTrends(trendsData || []);
      setCategories(catsData || []);
      setRecentBookings(bookingsData?.items || []);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColorMap: Record<string, string> = {
    CONFIRMED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    PENDING_APPROVAL: 'bg-amber-50 text-amber-800 border-amber-200',
    ASSIGNED: 'bg-sky-50 text-sky-800 border-sky-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-800 border-blue-200',
    COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
    CANCELLED: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  const categoryColor: Record<string, string> = {
    ECONOMY: 'bg-emerald-500',
    STANDARD: 'bg-sky-500',
    PREMIUM: 'bg-amber-500',
    STANDARD_VAN: 'bg-indigo-500',
    PREMIUM_VAN: 'bg-purple-500',
    ELECTRIC: 'bg-teal-500',
    LARGE_GROUP: 'bg-rose-500',
  };

  const catTotal = categories.reduce((acc, c) => acc + (c.count || 0), 0);

  return (
    <>
      <Header
        title="Executive Overview"
        subtitle={`Barcelona Taxi Transfer — ${new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`}
        onNewBookingClick={() => setShowCreateBooking(true)}
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Bookings"
            value={loading ? '—' : overview?.totalBookings ?? 0}
            subtitle="All time across all transfer types"
            icon={CalendarCheck}
            colorScheme="gold"
          />
          <StatCard
            title="Today's Bookings"
            value={loading ? '—' : overview?.todayBookings ?? 0}
            subtitle={`Active operational day — ${new Date().toLocaleDateString()}`}
            icon={Clock}
            colorScheme="sky"
          />
          <StatCard
            title="Pending Approvals"
            value={loading ? '—' : overview?.pendingApprovals ?? 0}
            subtitle="Cruise / Sants require manual review"
            icon={AlertCircle}
            colorScheme="amber"
          />
          <StatCard
            title="Active Rides Now"
            value={loading ? '—' : overview?.activeRides ?? 0}
            subtitle="Real-time rides in progress"
            icon={Activity}
            colorScheme="emerald"
          />
        </div>

        {/* KPI Cards Row 2 — Financial */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Gross Booking Value"
            value={loading ? '—' : `€${Number(overview?.grossBookingValue ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            subtitle="Total quoted fares across all bookings"
            icon={DollarSign}
            colorScheme="gold"
          />
          <StatCard
            title="Payments Received"
            value={loading ? '—' : `€${Number(overview?.totalPaymentsReceived ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            subtitle="Stripe deposits + driver cash balances"
            icon={BanknoteIcon}
            colorScheme="emerald"
          />
          <StatCard
            title="Outstanding Balances"
            value={loading ? '—' : `€${Number(overview?.outstandingBalances ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            subtitle="Cash to collect from passengers to driver"
            icon={Wallet}
            colorScheme="amber"
          />
          <StatCard
            title="Refunds Issued"
            value={loading ? '—' : `€${Number(overview?.totalRefunds ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            subtitle="Total refunded via Stripe"
            icon={RotateCcw}
            colorScheme="rose"
          />
        </div>

        {/* Ride Status Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Confirmed"
            value={loading ? '—' : overview?.confirmedBookings ?? 0}
            subtitle="Ready, driver not yet assigned"
            icon={CheckCircle}
            colorScheme="sky"
          />
          <StatCard
            title="Completed Rides"
            value={loading ? '—' : overview?.completedRides ?? 0}
            subtitle="Successfully delivered"
            icon={TrendingUp}
            colorScheme="emerald"
          />
          <StatCard
            title="Cancelled"
            value={loading ? '—' : overview?.cancelledRides ?? 0}
            subtitle="Customer or admin cancellations"
            icon={RotateCcw}
            colorScheme="rose"
          />
          <StatCard
            title="Drivers Available"
            value={loading ? '—' : overview?.activeDriversCount ?? 0}
            subtitle="Online & ready to accept rides"
            icon={Car}
            colorScheme="gold"
          />
        </div>

        {/* Revenue Chart + Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={trends} />
          </div>

          {/* Category Distribution */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Car className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Vehicle Category Mix</h3>
            </div>

            <div className="mt-4 space-y-3.5">
              {categories.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  {loading ? 'Loading...' : 'No booking data yet'}
                </div>
              ) : (
                categories.map((cat) => {
                  const pct = catTotal > 0 ? Math.round((cat.count / catTotal) * 100) : 0;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800">
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">{cat.count} rides</span>
                          <span className="text-slate-900 font-extrabold">€{Number(cat.totalRevenue).toFixed(0)}</span>
                          <span className="text-slate-400 font-semibold">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${categoryColor[cat.category] || 'bg-slate-400'} transition-all duration-700`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Recent Bookings</h3>
            </div>
            <Link
              href="/bookings"
              className="text-xs font-bold text-navy-800 hover:text-amber-600 transition"
            >
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['Reference', 'Customer', 'Transfer / Vehicle', 'Pickup Date', 'Fare', 'Status', 'Action'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Loading recent bookings…
                    </td>
                  </tr>
                ) : recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No bookings yet. Create one manually or wait for customer bookings.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {b.booking_reference}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{b.customer_name}</div>
                        <div className="text-slate-500 text-[10px]">{b.customer_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{b.transfer_type}</div>
                        <div className="text-slate-500 text-[10px]">{b.vehicle_category}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {b.pickup_datetime
                          ? new Date(b.pickup_datetime).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-slate-900">
                          €{Number(b.total_fare || 0).toFixed(2)}
                        </span>
                        {b.deposit_amount > 0 && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            Dep: €{Number(b.deposit_amount).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColorMap[b.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="text-navy-800 hover:text-amber-600 font-bold transition"
                        >
                          View →
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

      <CreateBookingModal
        isOpen={showCreateBooking}
        onClose={() => setShowCreateBooking(false)}
        onCreated={() => {
          fetchData();
          setShowCreateBooking(false);
        }}
      />
    </>
  );
}
