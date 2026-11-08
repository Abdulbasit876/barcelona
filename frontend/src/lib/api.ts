import { supabase } from './supabase';

const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const API_BASE = rawBase.endsWith('/api/v1') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api/v1`;

const ADMIN_TOKEN_KEY = 'btt_admin_token';
const ADMIN_REFRESH_TOKEN_KEY = 'btt_admin_refresh_token';
const ADMIN_USER_KEY = 'btt_admin_user';
const REMEMBER_ME_KEY = 'btt_admin_remember_me';
const SAVED_EMAIL_KEY = 'btt_admin_saved_email';

export class ApiClient {
  private static isRefreshing = false;
  private static refreshPromise: Promise<boolean> | null = null;

  // Cookie Helpers
  private static setCookie(name: string, value: string, days?: number) {
    if (typeof document === 'undefined') return;
    let expires = '';
    if (days !== undefined) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `; expires=${date.toUTCString()}; max-age=${days * 24 * 60 * 60}`;
    }
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
  }

  private static getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  private static deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
  }

  public static getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;

    // 1. Session Storage (active browser session)
    const sessionToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (sessionToken) return sessionToken;

    // 2. Persistent Storage (Remember Me)
    const localToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (localToken) return localToken;

    // 3. Cookie fallback
    const cookieToken = this.getCookie(ADMIN_TOKEN_KEY);
    if (cookieToken) return cookieToken;

    return null;
  }

  public static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      sessionStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) ||
      localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) ||
      this.getCookie(ADMIN_REFRESH_TOKEN_KEY) ||
      null
    );
  }

  public static getAdminUser(): any | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(ADMIN_USER_KEY) || localStorage.getItem(ADMIN_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public static isRememberMe(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  }

  public static getSavedEmail(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(SAVED_EMAIL_KEY) || localStorage.getItem('btt_saved_email') || '';
  }

  public static isTokenExpired(token?: string): boolean {
    const tok = token || this.getAdminToken();
    if (!tok) return true;
    const parts = tok.split('.');
    if (parts.length !== 3) return false;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload && typeof payload.exp === 'number') {
        // 30 seconds threshold buffer
        return Date.now() / 1000 + 30 >= payload.exp;
      }
    } catch {
      return false;
    }
    return false;
  }

  public static isAuthenticated(): boolean {
    const token = this.getAdminToken();
    if (!token) return false;
    if (this.isTokenExpired(token)) return false;
    return true;
  }

  public static saveAdminSession({
    accessToken,
    refreshToken,
    user,
    rememberMe,
    email,
  }: {
    accessToken: string;
    refreshToken?: string;
    user?: any;
    rememberMe: boolean;
    email?: string;
  }) {
    if (typeof window === 'undefined') return;

    if (rememberMe) {
      // 1. Persistent storage
      localStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
      if (user) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
      if (email) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
        localStorage.setItem('btt_saved_email', email);
      }

      // 2. Persistent 30-day cookies (30 days = 2592000s)
      this.setCookie(ADMIN_TOKEN_KEY, accessToken, 30);
      if (refreshToken) this.setCookie(ADMIN_REFRESH_TOKEN_KEY, refreshToken, 30);

      // Clean temporary session storage
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_USER_KEY);
    } else {
      // 1. Session-only storage (automatically expires when browser/tab is closed)
      sessionStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
      if (refreshToken) sessionStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
      if (user) sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));

      // 2. Session cookie (no max-age/expires => cleared when browser is closed)
      this.setCookie(ADMIN_TOKEN_KEY, accessToken);
      if (refreshToken) this.setCookie(ADMIN_REFRESH_TOKEN_KEY, refreshToken);

      // Clean persistent auth credentials
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(SAVED_EMAIL_KEY);
      localStorage.removeItem('btt_saved_email');
    }

    // Sync Supabase Client Session
    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).catch(() => {});
    }
  }

  public static clearAdminSession() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);

    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);

    this.deleteCookie(ADMIN_TOKEN_KEY);
    this.deleteCookie(ADMIN_REFRESH_TOKEN_KEY);

    supabase.auth.signOut().catch(() => {});
  }

  public static async logout() {
    try {
      const token = this.getAdminToken();
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
    this.clearAdminSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  }

  public static handleSessionExpired() {
    this.clearAdminSession();
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/admin/login' && !currentPath.startsWith('/driver')) {
        window.location.href = '/admin/login?expired=1';
      }
    }
  }

  public static async trySilentRefresh(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) {
            this.saveAdminSession({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken || refreshToken,
              user: data.user || this.getAdminUser(),
              rememberMe: this.isRememberMe(),
            });
            return true;
          }
        }
      } catch {
        // fail silently
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
      return false;
    })();

    return this.refreshPromise;
  }

  // Extend active session while admin is actively working
  public static async keepSessionAlive(): Promise<void> {
    if (typeof window === 'undefined') return;
    const token = this.getAdminToken();
    if (!token) return;

    // Renew persistent cookie expiry if remember me is active
    if (this.isRememberMe()) {
      this.setCookie(ADMIN_TOKEN_KEY, token, 30);
      const ref = this.getRefreshToken();
      if (ref) this.setCookie(ADMIN_REFRESH_TOKEN_KEY, ref, 30);
    }

    // If token has less than 10 minutes left, try silent refresh
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload?.exp && Date.now() / 1000 + 600 >= payload.exp) {
          await this.trySilentRefresh();
        }
      } catch {
        // ignore
      }
    }
  }

  private static getDriverToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('btt_driver_token') || localStorage.getItem('btt_driver_token');
  }

  private static async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isDriver: boolean = false,
    driverId?: string,
  ): Promise<T> {
    const token = isDriver
      ? (driverId ? `driver-${driverId}` : this.getDriverToken())
      : this.getAdminToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const effDriverId = driverId || (token?.startsWith('driver-') ? token.replace('driver-', '') : null);
    if (effDriverId) {
      headers['x-driver-id'] = effDriverId;
    }

    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 401 && !isDriver && !endpoint.includes('/auth/login')) {
        const refreshed = await this.trySilentRefresh();
        if (refreshed) {
          return this.request<T>(endpoint, options, isDriver, driverId);
        }
        this.handleSessionExpired();
        throw new Error('Session expired. Please log in again.');
      }

      let errorMessage = 'An error occurred';
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || res.statusText;
      } catch {
        errorMessage = res.statusText || 'Network request failed';
      }
      throw new Error(errorMessage);
    }

    // Check if CSV
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return (await res.text()) as any;
    }

    return res.json();
  }

  // Auth
  static async login(email: string, password: string, rememberMe: boolean = false) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.accessToken) {
      this.saveAdminSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        rememberMe,
        email,
      });
    }
    return data;
  }

  static async getMe() {
    return this.request('/auth/me');
  }

  static async listAdmins() {
    return this.request('/auth/admins');
  }

  static async createAdmin(dto: any) {
    return this.request('/auth/create-admin', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  static async resetPassword(email: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Financials & Dashboard KPIs
  static async getFinancialOverview(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/financials/overview?${params.toString()}`);
  }

  static async getRevenueTrends(days: number = 30) {
    return this.request(`/financials/revenue-trends?days=${days}`);
  }

  static async getCategoryPerformance() {
    return this.request('/financials/category-performance');
  }

  static async getDriverEarnings() {
    return this.request('/financials/driver-earnings');
  }

  // Bookings
  static async listBookings(params: Record<string, any> = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    return this.request(`/bookings?${qs.toString()}`);
  }

  static async getBooking(id: string) {
    return this.request(`/bookings/${id}`);
  }

  static async createBooking(dto: any) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  static async updateBooking(id: string, dto: any) {
    return this.request(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  static async cancelBooking(id: string, reason: string) {
    return this.request(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async deleteAllBookings() {
    return this.request('/bookings/all', {
      method: 'DELETE',
    });
  }

  static async exportBookingsCsv(params: Record<string, any> = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    return this.request(`/bookings/export/csv?${qs.toString()}`);
  }

  // Approvals Queue
  static async getPendingApprovals() {
    return this.request('/approvals/pending');
  }

  static async approveBooking(id: string) {
    return this.request(`/approvals/${id}/approve`, { method: 'POST' });
  }

  static async reviseBookingFare(id: string, revisedFare: number, revisionReason: string, notes?: string) {
    return this.request(`/approvals/${id}/revise`, {
      method: 'POST',
      body: JSON.stringify({ revisedFare, revisionReason, notes }),
    });
  }

  static async rejectBooking(id: string, rejectionReason: string) {
    return this.request(`/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  }

  // Drivers
  static async listDrivers() {
    return this.request('/drivers');
  }

  static async getDrivers() {
    return this.listDrivers();
  }

  static async getDriver(id: string) {
    return this.request(`/drivers/${id}`);
  }

  static async createDriver(dto: any) {
    return this.request('/drivers', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  static async updateDriver(id: string, dto: any) {
    return this.request(`/drivers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  static async deleteDriver(id: string) {
    return this.request(`/drivers/${id}`, { method: 'DELETE' });
  }

  // Dispatch Engine
  static async assignDriver(bookingId: string, driverId: string, notes?: string) {
    return this.request('/dispatch/assign', {
      method: 'POST',
      body: JSON.stringify({ bookingId, driverId, notes }),
    });
  }

  static async unassignDriver(bookingId: string, reason?: string) {
    return this.request('/dispatch/unassign', {
      method: 'POST',
      body: JSON.stringify({ bookingId, reason }),
    });
  }

  static async autoAssign(bookingId: string) {
    return this.request(`/dispatch/auto-assign/${bookingId}`, { method: 'POST' });
  }

  static async getDispatchBoard() {
    return this.request('/dispatch/board');
  }

  static async getDispatchRules() {
    return this.request('/dispatch/rules');
  }

  static async createDispatchRule(dto: any) {
    return this.request('/dispatch/rules', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  static async deleteDispatchRule(id: string) {
    return this.request(`/dispatch/rules/${id}`, { method: 'DELETE' });
  }

  // Settings
  static async getSettings() {
    return this.request('/settings');
  }

  static async getPublicSettings() {
    return this.request('/settings/public');
  }

  static async getCategoryDriverIds(category: string) {
    return this.request(`/settings/category-drivers/${category}`);
  }

  static async setCategoryDriverIds(category: string, driverIds: string[]) {
    return this.request(`/settings/category-drivers/${category}`, {
      method: 'POST',
      body: JSON.stringify({ driverIds }),
    });
  }

  static async updateDepositConfig(dto: any) {
    return this.request('/settings/deposit', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  static async updatePricingRules(dto: any) {
    return this.request('/settings/pricing', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  static async updateDispatchConfig(dto: any) {
    return this.request('/settings/dispatch', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  // Notifications
  static async subscribePush(payload: any) {
    return this.request('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async sendTestNotification() {
    return this.request('/notifications/test', { method: 'POST' });
  }

  static async getNotifications() {
    return this.request('/notifications');
  }

  static async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  static async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'POST' });
  }

  // Driver Portal (Mobile)
  static async driverLogin(phoneOrEmail: string, vehiclePlate?: string) {
    const data = await this.request('/driver-portal/login', {
      method: 'POST',
      body: JSON.stringify({ phoneOrEmail, vehiclePlate }),
    });
    if (data.token) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('btt_driver_token', data.token);
        sessionStorage.setItem('btt_driver_profile', JSON.stringify(data.driver));
        localStorage.setItem('btt_driver_token', data.token);
        localStorage.setItem('btt_driver_profile', JSON.stringify(data.driver));
      }
    }
    return data;
  }

  static async getDriverMyRides(driverId?: string) {
    return this.request('/driver-portal/my-rides', {}, true, driverId);
  }

  static async getDriverRideDetails(id: string, driverId?: string) {
    return this.request(`/driver-portal/rides/${id}`, {}, true, driverId);
  }

  static async acceptRide(id: string, driverId?: string) {
    return this.request(`/driver-portal/rides/${id}/accept`, { method: 'POST' }, true, driverId);
  }

  static async rejectRide(id: string, driverId?: string) {
    return this.request(`/driver-portal/rides/${id}/reject`, { method: 'POST' }, true, driverId);
  }

  static async updateDriverRideStatus(id: string, status: string, notes?: string, driverId?: string) {
    return this.request(
      `/driver-portal/rides/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      },
      true,
      driverId,
    );
  }

  static async collectDriverCashPayment(id: string, amount?: number, driverId?: string) {
    return this.request(
      `/driver-portal/rides/${id}/collect-cash`,
      {
        method: 'POST',
        body: JSON.stringify({ amount }),
      },
      true,
      driverId,
    );
  }

  static async confirmDriverOnlinePayment(id: string, transactionNote?: string, driverId?: string) {
    return this.request(
      `/driver-portal/rides/${id}/confirm-online`,
      {
        method: 'POST',
        body: JSON.stringify({ transactionNote }),
      },
      true,
      driverId,
    );
  }

  static async requestDriverOnlinePayment(id: string, driverId?: string) {
    return this.request(
      `/driver-portal/rides/${id}/request-online-payment`,
      {
        method: 'POST',
      },
      true,
      driverId,
    );
  }

  static async reportDriverWaitingTime(id: string, waitedMinutes: number, reason?: string, driverId?: string) {
    return this.request(
      `/driver-portal/rides/${id}/waiting-time`,
      {
        method: 'POST',
        body: JSON.stringify({ waitedMinutes, reason }),
      },
      true,
      driverId,
    );
  }

  static async updateDriverLocation(dto: {
    latitude: number;
    longitude: number;
    bookingId?: string;
    heading?: number;
    speedKmh?: number;
  }) {
    return this.request(
      '/driver-portal/location',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
      true,
    );
  }

  static async updateDriverAvailability(status: 'AVAILABLE' | 'ON_TRIP' | 'BREAK' | 'OFFLINE') {
    return this.request(
      '/driver-portal/availability',
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      true,
    );
  }
}
