import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';

@Injectable()
export class FinancialsService {
  private readonly logger = new Logger(FinancialsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Executive Financial & Operational Overview
   */
  async getOverview(startDate?: string, endDate?: string) {
    let query = this.supabase
      .getClient()
      .from('bookings')
      .select('*');

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: bookings, error } = await query;
    if (error) throw new BadRequestException(error.message);

    const all = bookings || [];

    let grossBookingValue = 0;
    let totalPaymentsReceived = 0;
    let outstandingBalances = 0;
    let totalRefunds = 0;
    let totalCompletedFare = 0;

    let pendingApprovalsCount = 0;
    let awaitingPaymentCount = 0;
    let confirmedCount = 0;
    let activeRidesCount = 0;
    let completedRidesCount = 0;
    let cancelledRidesCount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    let todayBookingsCount = 0;

    all.forEach((b) => {
      const fare = Number(b.total_fare || 0);
      const deposit = Number(b.deposit_amount || (fare * 0.2));
      const remaining = Number(b.remaining_balance || (fare - deposit));

      grossBookingValue += fare;

      if (b.payment_status === 'PAID') {
        totalPaymentsReceived += fare;
      } else if (b.deposit_paid) {
        totalPaymentsReceived += deposit;
        if (!b.balance_paid && b.status !== 'CANCELLED') {
          outstandingBalances += remaining;
        }
      } else if (b.status !== 'CANCELLED') {
        outstandingBalances += fare;
      }

      if (b.payment_status === 'REFUNDED') {
        totalRefunds += fare;
      }

      // Status counters
      if (b.status === 'PENDING_APPROVAL' || b.approval_status === 'PENDING_APPROVAL') {
        pendingApprovalsCount++;
      } else if (b.status === 'CONFIRMED' && b.payment_status === 'PENDING') {
        awaitingPaymentCount++;
      } else if (b.status === 'CONFIRMED' || b.status === 'ASSIGNED') {
        confirmedCount++;
      } else if (b.status === 'IN_PROGRESS') {
        activeRidesCount++;
      } else if (b.status === 'COMPLETED') {
        completedRidesCount++;
        totalCompletedFare += fare;
      } else if (b.status === 'CANCELLED') {
        cancelledRidesCount++;
      }

      if (b.created_at && b.created_at.slice(0, 10) === todayStr) {
        todayBookingsCount++;
      }
    });

    // Driver availability count
    const { count: activeDriversCount } = await this.supabase
      .getClient()
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_available', true);

    const estimatedNetEarnings = Number((grossBookingValue * 0.25).toFixed(2)); // Platform commission / margin estimate

    return {
      totalBookings: all.length,
      todayBookings: todayBookingsCount,
      pendingApprovals: pendingApprovalsCount,
      awaitingPayments: awaitingPaymentCount,
      confirmedBookings: confirmedCount,
      activeRides: activeRidesCount,
      completedRides: completedRidesCount,
      cancelledRides: cancelledRidesCount,
      grossBookingValue: Number(grossBookingValue.toFixed(2)),
      totalPaymentsReceived: Number(totalPaymentsReceived.toFixed(2)),
      outstandingBalances: Number(outstandingBalances.toFixed(2)),
      totalRefunds: Number(totalRefunds.toFixed(2)),
      estimatedNetEarnings,
      activeDriversCount: activeDriversCount || 0,
    };
  }

  /**
   * Daily / Weekly Revenue Trends
   */
  async getRevenueTrends(days: number = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const { data: bookings, error } = await this.supabase
      .getClient()
      .from('bookings')
      .select('created_at, total_fare, status, payment_status')
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    const dailyMap = new Map<string, { date: string; revenue: number; bookings: number }>();

    for (let i = 0; i <= days; i++) {
      const d = new Date(sinceDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, revenue: 0, bookings: 0 });
    }

    (bookings || []).forEach((b) => {
      const day = b.created_at.slice(0, 10);
      if (dailyMap.has(day)) {
        const item = dailyMap.get(day)!;
        item.bookings += 1;
        if (b.status !== 'CANCELLED') {
          item.revenue += Number(b.total_fare || 0);
        }
      }
    });

    return Array.from(dailyMap.values()).map((item) => ({
      ...item,
      revenue: Number(item.revenue.toFixed(2)),
    }));
  }

  /**
   * Vehicle Category Distribution & Financial Performance
   */
  async getCategoryPerformance() {
    const { data: bookings, error } = await this.supabase
      .getClient()
      .from('bookings')
      .select('vehicle_category, total_fare, status');

    if (error) throw new BadRequestException(error.message);

    const catMap = new Map<
      string,
      { category: string; count: number; totalRevenue: number; completedCount: number }
    >();

    (bookings || []).forEach((b) => {
      const cat = b.vehicle_category || 'ECONOMY';
      if (!catMap.has(cat)) {
        catMap.set(cat, { category: cat, count: 0, totalRevenue: 0, completedCount: 0 });
      }
      const item = catMap.get(cat)!;
      item.count += 1;
      if (b.status !== 'CANCELLED') {
        item.totalRevenue += Number(b.total_fare || 0);
      }
      if (b.status === 'COMPLETED') {
        item.completedCount += 1;
      }
    });

    return Array.from(catMap.values()).map((item) => ({
      ...item,
      totalRevenue: Number(item.totalRevenue.toFixed(2)),
    }));
  }

  /**
   * Driver Performance & Earnings
   */
  async getDriverEarnings() {
    const { data: drivers } = await this.supabase
      .getClient()
      .from('drivers')
      .select('*');

    const { data: rides } = await this.supabase
      .getClient()
      .from('bookings')
      .select('driver_id, total_fare, remaining_balance, status, payment_status')
      .not('driver_id', 'is', null);

    const earningsMap = new Map<
      string,
      { totalTrips: number; completedTrips: number; totalFare: number; cashCollected: number }
    >();

    (rides || []).forEach((r) => {
      if (!r.driver_id) return;
      if (!earningsMap.has(r.driver_id)) {
        earningsMap.set(r.driver_id, {
          totalTrips: 0,
          completedTrips: 0,
          totalFare: 0,
          cashCollected: 0,
        });
      }
      const item = earningsMap.get(r.driver_id)!;
      item.totalTrips += 1;
      if (r.status === 'COMPLETED') {
        item.completedTrips += 1;
        item.totalFare += Number(r.total_fare || 0);
        item.cashCollected += Number(r.remaining_balance || 0);
      }
    });

    return (drivers || []).map((d) => {
      const stats = earningsMap.get(d.id) || {
        totalTrips: 0,
        completedTrips: 0,
        totalFare: 0,
        cashCollected: 0,
      };
      return {
        id: d.id,
        name: d.name,
        phone: d.phone,
        vehiclePlate: d.vehicle_plate,
        vehicleModel: d.vehicle_model,
        rating: d.rating || 5.0,
        totalTrips: stats.totalTrips,
        completedTrips: stats.completedTrips,
        totalRevenue: Number(stats.totalFare.toFixed(2)),
        cashBalancesCollected: Number(stats.cashCollected.toFixed(2)),
      };
    });
  }
}

