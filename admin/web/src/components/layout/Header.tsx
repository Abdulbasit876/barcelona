'use client';

import { useEffect, useState } from 'react';
import { Bell, Plus, Smartphone, CheckCircle, RefreshCw, Menu } from 'lucide-react';
import { PushNotificationManager } from '@/lib/push';
import { ApiClient } from '@/lib/api';
import { useSidebar } from '@/components/layout/SidebarContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNewBookingClick?: () => void;
}

export function Header({ title, subtitle, onNewBookingClick }: HeaderProps) {
  const { toggle, isOpen } = useSidebar();
  const [pushStatus, setPushStatus] = useState<string>('default');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showBellDropdown, setShowBellDropdown] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const fetchNotifs = () => {
    ApiClient.getNotifications()
      .then((data) => setNotifications(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    setPushStatus(PushNotificationManager.getPermissionState());
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleEnablePush = async () => {
    setIsRegistering(true);
    const res = await PushNotificationManager.requestAndSubscribe();
    setIsRegistering(false);
    setPushStatus(PushNotificationManager.getPermissionState());
    if (res.success) {
      PushNotificationManager.playChime();
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile & Tablet Three-Line Hamburger Button */}
        <button
          onClick={toggle}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 lg:hidden transition flex items-center justify-center flex-shrink-0"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium truncate max-w-[200px] sm:max-w-md md:max-w-xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Phone Push Notification Quick Button */}
        {pushStatus === 'granted' ? (
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="hidden sm:inline">Phone Alerts Active</span>
          </div>
        ) : (
          <button
            onClick={handleEnablePush}
            disabled={isRegistering}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition shadow-sm"
            title="Enable Phone Alerts"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-600 animate-bounce flex-shrink-0" />
            <span className="hidden sm:inline">{isRegistering ? 'Connecting...' : 'Enable Phone Alerts'}</span>
            <span className="sm:hidden text-[11px] font-bold">Alerts</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowBellDropdown(!showBellDropdown)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 relative transition"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showBellDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowBellDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>Incoming Booking Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        ApiClient.markAllNotificationsRead().then(fetchNotifs);
                      }}
                      className="text-[10px] text-slate-500 hover:text-slate-900 font-semibold transition"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={fetchNotifs}
                      title="Refresh"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No recent alerts
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl text-xs border transition ${
                          n.is_read
                            ? 'bg-slate-50 border-slate-200 text-slate-500'
                            : 'bg-amber-50/70 border-amber-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-amber-800">{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(n.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-700 leading-snug">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Create Manual Booking Action */}
        {onNewBookingClick && (
          <button
            onClick={onNewBookingClick}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-md shadow-navy-800/10 transition"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span className="hidden sm:inline">New Booking</span>
          </button>
        )}
      </div>
    </header>
  );
}
