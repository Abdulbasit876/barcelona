'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface RevenueTrendPoint {
  date: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  data: RevenueTrendPoint[];
  onPeriodChange?: (days: number) => void;
}

export function RevenueChart({ data, onPeriodChange }: RevenueChartProps) {
  const [period, setPeriod] = useState<number>(14);

  const points = data && data.length > 0 ? data.slice(-period) : [];
  const maxRevenue = Math.max(...points.map((p) => p.revenue), 100);

  const handlePeriod = (p: number) => {
    setPeriod(p);
    if (onPeriodChange) onPeriodChange(p);
  };

  const totalPeriodRevenue = points.reduce((acc, p) => acc + p.revenue, 0);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Revenue & Ride Trends
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Total {period}d Volume: <span className="font-bold text-slate-900">€{totalPeriodRevenue.toFixed(2)}</span>
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => handlePeriod(days)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                period === days
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* SVG Bar / Area visualization */}
      <div className="mt-6 h-56 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-slate-200">
        {points.map((point) => {
          const heightPct = Math.max((point.revenue / maxRevenue) * 100, 4);
          const dayLabel = new Date(point.date).toLocaleDateString([], {
            weekday: 'narrow',
            day: 'numeric',
          });

          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center group relative h-full justify-end"
            >
              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 bg-slate-900 text-white rounded-xl p-2 text-[10px] shadow-xl whitespace-nowrap">
                <div className="font-bold text-amber-400">{point.date}</div>
                <div>Revenue: €{point.revenue.toFixed(2)}</div>
                <div className="text-slate-400">{point.bookings} ride(s)</div>
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPct}%` }}
                className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500 transition-all shadow-sm cursor-pointer"
              />

              {/* Label */}
              <span className="text-[10px] text-slate-500 font-semibold mt-2 truncate w-full text-center">
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-3 text-[11px] text-slate-500 font-medium">
        <span>* Calculated from verified booking & payment transactions</span>
        <span className="text-slate-900 font-bold">Peak Day: €{maxRevenue.toFixed(2)}</span>
      </div>
    </div>
  );
}
