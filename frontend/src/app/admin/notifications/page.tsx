'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ApiClient } from '@/lib/api';
import { PushNotificationManager } from '@/lib/push';
import { Bell, Smartphone, CheckCircle, AlertCircle, Send, RefreshCw, Volume2 } from 'lucide-react';

export default function NotificationsPage() {
  const [pushState, setPushState] = useState<NotificationPermission>('default');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getNotifications();
      setNotifications(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPushState(PushNotificationManager.getPermissionState());
    fetchNotifs();
  }, []);

  const handleEnablePush = async () => {
    setIsRegistering(true);
    setResult(null);
    const res = await PushNotificationManager.requestAndSubscribe();
    setIsRegistering(false);
    setPushState(PushNotificationManager.getPermissionState());
    setResult({ type: res.success ? 'success' : 'error', msg: res.message });
    if (res.success) PushNotificationManager.playChime();
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    setResult(null);
    try {
      await ApiClient.sendTestNotification();
      PushNotificationManager.playChime();
      setResult({
        type: 'success',
        msg: '✅ Test notification triggered! Check your phone/browser.',
      });
      setTimeout(fetchNotifs, 1500);
    } catch (err: any) {
      setResult({ type: 'error', msg: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.markAllNotificationsRead();
      fetchNotifs();
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <Header title="Push Notification Center" subtitle="Manage phone alerts for every new booking" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Push Setup Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Smartphone className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Mobile & Browser Push Alerts</h3>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Explainer */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
              <div className="font-extrabold text-slate-900 mb-2">How instant phone notifications work:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Click "Activate Phone Alerts" below — browser will request notification permission</li>
                <li>Accept the permission in your phone or desktop browser</li>
                <li>Your device is registered to receive push alerts</li>
                <li>Every time a customer places a new booking, your phone will buzz instantly</li>
                <li>Tap the notification to open the booking directly in your admin panel</li>
              </ol>
              <div className="mt-3 text-amber-800 font-bold bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚡ Works on Chrome, Edge, Firefox, and Safari (iOS 16.4+). For iPhone, open this admin dashboard in Safari and add it to your Home Screen for full push support.
              </div>
            </div>

            {/* Status + Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {pushState === 'granted' ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-800">Push Notifications Active</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                      This device will receive real-time alerts for every new booking
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-amber-600 animate-bounce" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-900">Push Notifications Not Active</div>
                    <div className="text-[11px] text-amber-800 mt-0.5 font-medium">
                      {pushState === 'denied'
                        ? 'Permission denied. Open browser settings → Site Permissions → Allow Notifications.'
                        : 'Click below to enable instant phone & browser booking alerts.'}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 flex-shrink-0">
                {pushState !== 'denied' && (
                  <button
                    onClick={handleEnablePush}
                    disabled={isRegistering}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    <Smartphone className="w-4 h-4 text-gold-400" />
                    {isRegistering ? 'Activating…' : 'Activate Phone Alerts'}
                  </button>
                )}

                {pushState === 'granted' && (
                  <button
                    onClick={handleTestNotification}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-900 font-bold text-xs transition shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-slate-500" />
                    {isTesting ? 'Sending…' : 'Test Alert'}
                  </button>
                )}

                <button
                  onClick={() => PushNotificationManager.playChime()}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition shadow-sm"
                  title="Test alert chime sound"
                >
                  <Volume2 className="w-4 h-4 text-slate-500" />
                  Test Sound
                </button>
              </div>
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border ${
                  result.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {result.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                {result.msg}
              </div>
            )}
          </div>
        </div>

        {/* Notification Log */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Booking Alert Log
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-slate-600 hover:text-slate-900 transition font-bold"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={fetchNotifs}
                className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-8 text-center text-slate-400 text-xs">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <div className="text-xs text-slate-500 font-medium">No alerts yet. Alerts appear here when new bookings arrive.</div>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer ${
                    !n.is_read ? 'bg-amber-50/40' : ''
                  }`}
                  onClick={() => {
                    ApiClient.markNotificationRead(n.id);
                    fetchNotifs();
                  }}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                      n.is_read ? 'bg-slate-300' : 'bg-amber-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900">{n.title}</div>
                    <div className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">{n.body}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">
                      {new Date(n.created_at).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                      {n.data?.reference && (
                        <span className="ml-2 text-slate-900 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{n.data.reference}</span>
                      )}
                    </div>
                  </div>
                  {n.data?.bookingId && (
                    <a
                      href={`/bookings/${n.data.bookingId}`}
                      className="text-[11px] text-navy-800 hover:underline font-bold transition whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
