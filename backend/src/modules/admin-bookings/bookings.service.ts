import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SupabaseService } from '../../common/services/supabase.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import {
  AdminCreateBookingDto,
  AdminUpdateBookingDto,
  CancelBookingDto,
} from './bookings.dto';

export interface BookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: string;
  paymentStatus?: string;
  transferType?: string;
  vehicleCategory?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AdminBookingsService {
  private readonly logger = new Logger(AdminBookingsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService,
    private readonly dispatch: DispatchService,
  ) {}

  /**
   * List all bookings with search, filters, pagination
   */
  async listBookings(filters: BookingFilters) {
    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 20);
    const offset = (page - 1) * limit;

    let query = this.supabase
      .getClient()
      .from('bookings')
      .select('*, driver:drivers(id, name, phone, vehicle_plate, vehicle_model)', {
        count: 'exact',
      });

    // Filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    if (filters.transferType) {
      query = query.eq('transfer_type', filters.transferType);
    }
    if (filters.vehicleCategory) {
      query = query.eq('vehicle_category', filters.vehicleCategory);
    }
    if (filters.driverId) {
      query = query.eq('driver_id', filters.driverId);
    }
    if (filters.startDate) {
      query = query.gte('pickup_datetime', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('pickup_datetime', filters.endDate);
    }

    // Free text search
    if (filters.search) {
      const term = `%${filters.search}%`;
      query = query.or(
        `booking_reference.ilike.${term},customer_name.ilike.${term},customer_email.ilike.${term},customer_phone.ilike.${term},pickup_address.ilike.${term},destination_address.ilike.${term}`,
      );
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const isAscending = filters.sortOrder === 'ASC';
    query = query.order(sortBy, { ascending: isAscending });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get single booking details with full history
   */
  async getBookingById(id: string) {
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*, driver:drivers(*)')
      .eq('id', id)
      .single();

    if (bErr || !booking) throw new NotFoundException('Booking not found');

    // Audit logs
    const { data: auditLogs } = await this.supabase
      .getClient()
      .from('audit_logs')
      .select('*')
      .eq('entity_id', id)
      .order('created_at', { ascending: false });

    // Location logs if any
    const { data: locationLogs } = await this.supabase
      .getClient()
      .from('driver_location_logs')
      .select('*')
      .eq('booking_id', id)
      .order('recorded_at', { ascending: false })
      .limit(20);

    return {
      ...booking,
      auditLogs: auditLogs || [],
      locationLogs: locationLogs || [],
    };
  }

  /**
   * Create a manual booking on behalf of customer
   */
  async createManualBooking(dto: AdminCreateBookingDto, createdBy: string = 'ADMIN') {
    const depositSettings = await this.settings.getDepositConfig();
    const depositPct = dto.depositPercentage || depositSettings.deposit_percentage || 20;

    const totalFare = dto.totalFare || 50.0;
    const depositAmount = Number(((totalFare * depositPct) / 100).toFixed(2));
    const remainingBalance = Number((totalFare - depositAmount).toFixed(2));

    const bookingRef = `BTT-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      100 + Math.random() * 900,
    )}`;
    const accessToken = randomBytes(24).toString('hex');

    const newBooking = {
      booking_reference: bookingRef,
      access_token: accessToken,
      transfer_type: dto.transferType,
      vehicle_category: dto.vehicleCategory,
      status: 'CONFIRMED',
      payment_status: 'PENDING',
      pickup_address: dto.pickupAddress,
      destination_address: dto.destinationAddress,
      pickup_datetime: dto.pickupDatetime,
      passengers: dto.passengers,
      luggage: dto.luggage,
      flight_details: { cabin_luggage: dto.cabinLuggage || 0 },
      child_seats: dto.childSeats || 0,
      flight_or_train_number: dto.flightOrTrainNumber || null,
      cruise_ship_name: dto.cruiseShipName || null,
      customer_name: dto.customerName,
      customer_email: dto.customerEmail,
      customer_phone: dto.customerPhone,
      special_requests: dto.specialRequests || null,
      preferred_language: 'en',
      base_fare: totalFare,
      total_fare: totalFare,
      deposit_percentage: depositPct,
      deposit_amount: depositAmount,
      remaining_balance: remainingBalance,
      payment_method: dto.paymentMethod || 'ONLINE_DEPOSIT',
      deposit_paid: false,
      balance_paid: false,
      approval_status: 'APPROVED',
      free_waiting_minutes: dto.transferType === 'AIRPORT' ? 60 : 15,
      admin_notes: `Manual booking created by ${createdBy}`,
    };

    const { data: created, error } = await this.supabase
      .getClient()
      .from('bookings')
      .insert(newBooking)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Audit log
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        actor_type: 'ADMIN',
        actor_id: createdBy,
        action: 'CREATE_MANUAL_BOOKING',
        entity_type: 'booking',
        entity_id: created.id,
        metadata: { booking: created },
      });

    // Immediate Phone Push Notification to admin
    await this.notifications.notifyNewBooking(created);

    // Automatic Driver Assignment check
    try {
      await this.dispatch.autoAssign(created.id);
    } catch (autoErr) {
      this.logger.debug(`Auto-assign skipped/not applicable: ${autoErr}`);
    }

    return created;
  }

  /**
   * Edit permitted booking details
   */
  async updateBooking(id: string, dto: AdminUpdateBookingDto, updatedBy: string = 'ADMIN') {
    const { data: currentBooking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (bErr || !currentBooking) throw new NotFoundException('Booking not found');

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.pickupAddress !== undefined) updates.pickup_address = dto.pickupAddress;
    if (dto.destinationAddress !== undefined) updates.destination_address = dto.destinationAddress;
    if (dto.pickupDatetime !== undefined) updates.pickup_datetime = dto.pickupDatetime;
    if (dto.passengers !== undefined) updates.passengers = dto.passengers;
    if (dto.luggage !== undefined) updates.luggage = dto.luggage;
    if (dto.cabinLuggage !== undefined) updates.flight_details = { cabin_luggage: dto.cabinLuggage };
    if (dto.childSeats !== undefined) updates.child_seats = dto.childSeats;
    if (dto.flightOrTrainNumber !== undefined) updates.flight_or_train_number = dto.flightOrTrainNumber;
    if (dto.specialRequests !== undefined) updates.special_requests = dto.specialRequests;
    if (dto.adminNotes !== undefined) updates.admin_notes = dto.adminNotes;
    if (dto.driverNotes !== undefined) updates.driver_notes = dto.driverNotes;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.paymentStatus !== undefined) updates.payment_status = dto.paymentStatus;
    if (dto.depositPaid !== undefined) updates.deposit_paid = dto.depositPaid;
    if (dto.balancePaid !== undefined) updates.balance_paid = dto.balancePaid;

    const { data: updated, error: updateErr } = await this.supabase
      .getClient()
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw new BadRequestException(updateErr.message);

    // Audit log
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        actor_type: 'ADMIN',
        actor_id: updatedBy,
        action: 'UPDATE_BOOKING_DETAILS',
        entity_type: 'booking',
        entity_id: id,
        metadata: { old_values: currentBooking, new_values: updates },
      });

    return updated;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, dto: CancelBookingDto, cancelledBy: string = 'ADMIN') {
    const { data: updated, error } = await this.supabase
      .getClient()
      .from('bookings')
      .update({
        status: 'CANCELLED',
        cancellation_reason: dto.reason || 'Cancelled by admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Audit log
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        actor_type: 'ADMIN',
        actor_id: cancelledBy,
        action: 'CANCEL_BOOKING',
        entity_type: 'booking',
        entity_id: id,
        metadata: { status: 'CANCELLED', reason: dto.reason },
      });

    return updated;
  }

  /**
   * Export filtered bookings to CSV string
   */
  async exportCsv(filters: BookingFilters): Promise<string> {
    const { items } = await this.listBookings({ ...filters, limit: 1000 });

    const headers = [
      'Reference',
      'Customer Name',
      'Email',
      'Phone',
      'Transfer Type',
      'Vehicle Category',
      'Pickup Datetime',
      'Pickup Address',
      'Destination Address',
      'Status',
      'Payment Status',
      'Total Fare (EUR)',
      'Deposit (EUR)',
      'Remaining Balance (EUR)',
      'Driver Name',
      'Created At',
    ];

    const rows = items.map((b: any) => [
      `"${b.booking_reference || ''}"`,
      `"${b.customer_name || ''}"`,
      `"${b.customer_email || ''}"`,
      `"${b.customer_phone || ''}"`,
      `"${b.transfer_type || ''}"`,
      `"${b.vehicle_category || ''}"`,
      `"${b.pickup_datetime || ''}"`,
      `"${(b.pickup_address || '').replace(/"/g, '""')}"`,
      `"${(b.destination_address || '').replace(/"/g, '""')}"`,
      `"${b.status || ''}"`,
      `"${b.payment_status || ''}"`,
      b.total_fare || '0.00',
      b.deposit_amount || '0.00',
      b.remaining_balance || '0.00',
      `"${b.driver?.name || 'Unassigned'}"`,
      `"${b.created_at || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Permanently delete all bookings and associated rides from Supabase
   */
  async deleteAllBookings() {
    const client = this.supabase.getClient();
    // 1. Delete associated rides
    await client.from('rides').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // 2. Delete associated reviews
    try {
      await client.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch {}
    // 3. Delete all bookings
    const { error } = await client.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      this.logger.error(`Error deleting all bookings: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return { success: true, message: 'All bookings deleted successfully from database' };
  }
}

