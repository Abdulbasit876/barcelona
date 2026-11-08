'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ApiClient } from '@/lib/api';
import { Car, Users } from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/RevenueChart';

export default function FinancialsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [driverEarnings, setDriverEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(30);

  const fetchData = async (days = 30) => {
    setLoading(true);
    try {
      const [ov, tr, cat, de] = await Promise.all([
        ApiClient.getFinancialOverview(),
        ApiClient.getRevenueTrends(days),
        ApiClient.getCategoryPerformance(),
        ApiClient.getDriverEarnings(),
      ]);
      setOverview(ov);
      setTrends(tr || []);
      setCategories(cat || []);
      setDriverEarnings(de || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(trendDays); }, []);

  const fmtEur = (v: number) =>
    `€${Number(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

  const kpis = overview ? [
    { label: 'Gross Booking Value', value: fmtEur(overview.grossBookingValue), note: 'Total fare across all bookings', color: 'text-slate-900' },
    { label: 'Payments Received', value: fmtEur(overview.totalPaymentsReceived), note: 'Online Stripe + confirmed cash', color: 'text-emerald-700' },
    { label: 'Outstanding Balances', value: fmtEur(overview.outstandingBalances), note: 'Driver collects from passenger', color: 'text-amber-800' },
    { label: 'Total Refunds Issued', value: fmtEur(overview.totalRefunds), note: 'Via Stripe refund events', color: 'text-rose-700' },
  ] : [];

  return (
    <>
      <Header title="Financial Analytics" subtitle="Revenue breakdown, category performance, and driver earnings" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))
            : kpis.map((kpi) => (
                <div key={kpi.label} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">{kpi.label}</div>
                  <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">{kpi.note}</div>
                </div>
              ))}
        </div>

        {/* Revenue Chart */}
        <RevenueChart data={trends} onPeriodChange={(days) => { setTrendDays(days); fetchData(days); }} />

        {/* Category Performance + Driver Earnings side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Performance */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Car className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Category Revenue Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Category', 'Total Rides', 'Completed', 'Revenue'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(loading ? [] : categories).map((cat: any) => (
                    <tr key={cat.category} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{cat.category}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{cat.count}</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">{cat.completedCount}</td>
                      <td className="px-4 py-3 font-extrabold text-slate-900">€{Number(cat.totalRevenue).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!loading && categories.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No booking data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Driver Earnings */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Users className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Driver Earnings & Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Driver', 'Trips', 'Done', 'Revenue', 'Cash Collected'].map((h) => (
                      <th key={h} className="text-left px-3 py-3 text-[10px] font-bold uppercase text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(loading ? [] : driverEarnings).map((d: any) => (
                    <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900">{d.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{d.vehiclePlate}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-700 font-medium">{d.totalTrips}</td>
                      <td className="px-3 py-3 text-emerald-700 font-bold">{d.completedTrips}</td>
                      <td className="px-3 py-3 font-extrabold text-slate-900">€{Number(d.totalRevenue).toFixed(2)}</td>
                      <td className="px-3 py-3 text-amber-800 font-bold">€{Number(d.cashBalancesCollected).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!loading && driverEarnings.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No driver trip data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
