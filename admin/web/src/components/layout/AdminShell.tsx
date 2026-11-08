'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ApiClient } from '@/lib/api';
import { supabase } from '@/lib/supabase';

function AuthLoadingScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-navy-800 flex items-center justify-center shadow-xl shadow-navy-900/10 animate-pulse">
            <img
              src="/logo.png"
              alt="Barcelona Taxi Transfer"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-gold-400/40 animate-ping opacity-25 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
          <span className="w-2 h-2 rounded-full bg-gold-500 animate-ping inline-block" />
          <span>{message || 'Verifying credentials...'}</span>
        </div>
        <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
          Barcelona Taxi Transfer Executive Portal
        </p>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Public driver routes bypass admin authentication completely
  const isDriverRoute = pathname.startsWith('/driver');
  const isLoginPage = pathname === '/login';

  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>(
    isDriverRoute ? 'unauthenticated' : 'checking'
  );

  const lastActivityRef = useRef<number>(Date.now());

  // Check authentication status on pathname change
  const checkAuth = useCallback(() => {
    if (isDriverRoute) {
      setAuthStatus('unauthenticated');
      return;
    }

    const authenticated = ApiClient.isAuthenticated();

    if (isLoginPage) {
      if (authenticated) {
        setAuthStatus('checking');
        router.replace('/');
      } else {
        setAuthStatus('unauthenticated');
      }
    } else {
      if (!authenticated) {
        setAuthStatus('checking');
        router.replace('/login');
      } else {
        setAuthStatus('authenticated');
      }
    }
  }, [isDriverRoute, isLoginPage, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Supabase Auth State Change Listener (Automatic Token Refresh & Sign Out handling)
  useEffect(() => {
    if (isDriverRoute) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        ApiClient.clearAdminSession();
        if (!isLoginPage) {
          router.replace('/login');
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        ApiClient.saveAdminSession({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          user: ApiClient.getAdminUser(),
          rememberMe: ApiClient.isRememberMe(),
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDriverRoute, isLoginPage, router]);

  // Activity tracker & Silent token keeper while working
  useEffect(() => {
    if (authStatus !== 'authenticated' || isDriverRoute || isLoginPage) {
      return;
    }

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // Periodic keeper: every 3 minutes
    const interval = setInterval(async () => {
      const minutesSinceActivity = (Date.now() - lastActivityRef.current) / (1000 * 60);

      // If active in the last 20 minutes, keep session alive & silently renew
      if (minutesSinceActivity < 20) {
        await ApiClient.keepSessionAlive();
        // Silent token check
        ApiClient.getMe().catch(() => {
          // 401 is handled by ApiClient.request automatically
        });
      }
    }, 3 * 60 * 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(interval);
    };
  }, [authStatus, isDriverRoute, isLoginPage]);

  // 1. Driver portal (publicly accessible)
  if (isDriverRoute) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  // 2. Checking state -> smooth loading screen avoiding page flickering
  if (authStatus === 'checking') {
    return <AuthLoadingScreen message={isLoginPage ? 'Redirecting to dashboard...' : 'Securing session...'} />;
  }

  // 3. Login page (unauthenticated)
  if (isLoginPage) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  // 4. Protected admin pages (authenticated)
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden bg-slate-50 text-slate-900 flex flex-col">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
