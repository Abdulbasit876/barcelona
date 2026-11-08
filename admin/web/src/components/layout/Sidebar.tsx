'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Car,
  Compass,
  DollarSign,
  Sliders,
  Bell,
  Smartphone,
  LogOut,
  Shield,
  ExternalLink,
  X,
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useSidebar } from '@/components/layout/SidebarContext';

const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Bookings', href: '/bookings', icon: CalendarCheck },
  { label: 'Approvals Queue', href: '/approvals', icon: Clock, badgeKey: 'pendingApprovals' },
  { label: 'Live Dispatch', href: '/dispatch', icon: Compass },
  { label: 'Drivers Fleet', href: '/drivers', icon: Car },
  { label: 'Financial Analytics', href: '/financials', icon: DollarSign },
  { label: 'Deposit & Pricing', href: '/settings', icon: Sliders },
  { label: 'Push Notifications', href: '/notifications', icon: Bell },
  { label: 'Driver Portal', href: 'http://localhost:3002', icon: Smartphone, external: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const [user, setUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    try {
      const adminUser = ApiClient.getAdminUser();
      if (adminUser) setUser(adminUser);
    } catch {}

    ApiClient.getPendingApprovals()
      .then((items) => setPendingCount(items?.length || 0))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Mobile/Tablet Backdrop (Clicking outside closes sidebar) */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shadow-xl lg:shadow-sm transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Logo & Mobile Close button */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Barcelona Taxi Transfer"
              className="h-10 w-auto max-w-[170px] object-contain"
            />
          </div>
          <button
            onClick={close}
            aria-label="Close sidebar"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Executive Operations
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/' ? pathname === '/' : !item.external && pathname.startsWith(item.href);

            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => close()}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-100 transition-all mt-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-sky-600" />
                    <span>{item.label}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => close()}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-navy-800 text-white shadow-md shadow-navy-800/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badgeKey === 'pendingApprovals' && pendingCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-gold-500 text-navy-950' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-navy-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                <Shield className="w-4 h-4 text-gold-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold truncate">
                  {user?.role || 'SUPER_ADMIN'}
                </div>
              </div>
            </div>
            <button
              onClick={() => ApiClient.logout()}
              title="Log Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-slate-500 font-medium text-center flex items-center justify-center gap-1.5 pt-1 border-t border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            System Live • Barcelona UTC+2
          </div>
        </div>
      </aside>
    </>
  );
}
