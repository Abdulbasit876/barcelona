import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorScheme?: 'gold' | 'emerald' | 'sky' | 'amber' | 'rose';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  colorScheme = 'gold',
}: StatCardProps) {
  const colorStyles = {
    gold: 'bg-amber-50 text-amber-600 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    sky: 'bg-sky-50 text-sky-600 border-sky-200',
    amber: 'bg-orange-50 text-orange-600 border-orange-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
  }[colorScheme];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </span>
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorStyles}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1">
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
            {value}
          </div>
          {trend && (
            <span
              className={`text-[10px] sm:text-xs font-bold flex-shrink-0 ${
                trendUp ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium leading-tight">
          {subtitle}
        </p>
      )}
    </div>
  );
}
