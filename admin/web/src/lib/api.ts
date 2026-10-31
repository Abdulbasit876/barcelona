const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

export class ApiClient {
  private static getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('btt_admin_token') || 'dev-admin-master-token';
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
    // Attach dev fallback key during development when no session token exists
    if (process.env.NODE_ENV !== 'production' && !token) {
      headers['x-admin-dev-key'] = 'btt-admin-super-secret-dev';
    }

    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
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
  static async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.accessToken) {
      localStorage.setItem('btt_admin_token', data.accessToken);
      localStorage.setItem('btt_admin_user', JSON.stringify(data.user));
    }
    return data;
  }

  static logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('btt_admin_token');
      localStorage.removeItem('btt_admin_user');
      window.location.href = '/login';
    }
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
