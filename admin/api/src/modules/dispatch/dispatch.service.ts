import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import {
  AssignDriverDto,
  CreateAssignmentRuleDto,
  UnassignDriverDto,
} from './dispatch.dto';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService,
  ) {}

  /**
   * Manually assign driver to a booking
   */
  async assignDriver(dto: AssignDriverDto, assignedBy: string = 'ADMIN') {
    // 1. Fetch booking
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', dto.bookingId)
      .single();

    if (bErr || !booking) throw new NotFoundException('Booking not found');

    // 2. Fetch driver
    const { data: driver, error: dErr } = await this.supabase
      .getClient()
      .from('drivers')
      .select('*')
      .eq('id', dto.driverId)
      .single();

    if (dErr || !driver) throw new NotFoundException('Driver not found');

    if (!driver.is_active) {
      throw new BadRequestException('Cannot assign an inactive driver');
    }

    // 3. Conflict Check (warn if driver has ride within 90 minutes)
    const bookingTime = new Date(booking.pickup_datetime).getTime();
    const windowStart = new Date(bookingTime - 90 * 60 * 1000).toISOString();
    const windowEnd = new Date(bookingTime + 90 * 60 * 1000).toISOString();

    const { data: conflicts } = await this.supabase
      .getClient()
      .from('bookings')
      .select('id, booking_reference, pickup_datetime')
      .eq('driver_id', dto.driverId)
      .neq('id', dto.bookingId)
      .gte('pickup_datetime', windowStart)
      .lte('pickup_datetime', windowEnd)
      .in('status', ['ASSIGNED', 'IN_PROGRESS']);

    const hasScheduleConflict = conflicts && conflicts.length > 0;

    // 4. Update booking
    const newStatus =
      booking.status === 'CONFIRMED' || booking.status === 'PENDING_APPROVAL'
        ? 'ASSIGNED'
        : booking.status;

    const { data: updatedBooking, error: updateErr } = await this.supabase
      .getClient()
      .from('bookings')
      .update({
        driver_id: dto.driverId,
        status: newStatus,
        driver_notes: dto.notes || booking.driver_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dto.bookingId)
      .select()
      .single();

    if (updateErr) throw new BadRequestException(updateErr.message);

    // 5. Audit Log
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        actor_type: 'ADMIN',
        actor_id: assignedBy,
        action: 'ASSIGN_DRIVER',
        entity_type: 'booking',
        entity_id: dto.bookingId,
        metadata: {
          driverId: dto.driverId,
          driverName: driver.name,
          driverPhone: driver.phone,
          vehiclePlate: driver.vehicle_plate,
        },
      });

    // 6. Push notification to the driver
    await this.notifications.notifyDriverAssigned(driver.id, updatedBooking);

    return {
      success: true,
      booking: updatedBooking,
      assignedDriver: driver,
      hasScheduleConflict,
      conflictCount: conflicts?.length || 0,
      conflictDetails: conflicts || [],
    };
  }

  /**
   * Unassign driver from booking
   */
  async unassignDriver(dto: UnassignDriverDto, unassignedBy: string = 'ADMIN') {
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', dto.bookingId)
      .single();

    if (bErr || !booking) throw new NotFoundException('Booking not found');

    const previousDriverId = booking.driver_id;

    const { data: updatedBooking, error: updateErr } = await this.supabase
      .getClient()
      .from('bookings')
      .update({
        driver_id: null,
        status: 'CONFIRMED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', dto.bookingId)
      .select()
      .single();

    if (updateErr) throw new BadRequestException(updateErr.message);

    // Audit log
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        actor_type: 'ADMIN',
        actor_id: unassignedBy,
        action: 'UNASSIGN_DRIVER',
        entity_type: 'booking',
        entity_id: dto.bookingId,
        metadata: { previousDriverId, reason: dto.reason || 'Unassigned by dispatcher' },
      });

    return { success: true, booking: updatedBooking };
  }

  /**
   * Auto-assign driver based on vehicle category rules or multi-driver broadcast distribution
   */
  async autoAssign(bookingId: string) {
    const { data: booking } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) throw new NotFoundException('Booking not found');

    // 1. Check Multi-Driver Assignment by Vehicle Category
    const assignedDriverIds = await this.settings.getCategoryDriverIds(booking.vehicle_category);

    if (assignedDriverIds && assignedDriverIds.length > 0) {
      // Fetch all active drivers assigned to this vehicle category
      const { data: activeDrivers } = await this.supabase
        .getClient()
        .from('drivers')
        .select('*')
        .in('id', assignedDriverIds)
        .eq('is_active', true);

      if (activeDrivers && activeDrivers.length > 0) {
        const nowIso = new Date().toISOString();
        const offerRows = activeDrivers.map((d: any) => ({
          booking_id: bookingId,
          driver_id: d.id,
          status: 'PENDING',
          offered_at: nowIso,
        }));

        // Try dedicated table
        try {
          await this.supabase
            .getClient()
            .from('booking_driver_offers')
            .upsert(offerRows, { onConflict: 'booking_id,driver_id' });
        } catch {}

        // Also record in booking metadata & audit log for full resilience
        const fb = (booking.fare_breakdown && typeof booking.fare_breakdown === 'object') ? booking.fare_breakdown : {};
        await this.supabase
          .getClient()
          .from('bookings')
          .update({
            fare_breakdown: {
              ...fb,
              pending_offers: offerRows,
              broadcast_at: nowIso,
            },
            updated_at: nowIso,
          })
          .eq('id', bookingId);

        try {
          await this.supabase.getClient().from('audit_logs').insert({
            actor_type: 'SYSTEM',
            action: 'MULTI_DRIVER_BROADCAST',
            entity_type: 'booking',
            entity_id: bookingId,
            metadata: {
              category: booking.vehicle_category,
              driver_count: activeDrivers.length,
              driver_ids: activeDrivers.map((d: any) => d.id),
              driver_names: activeDrivers.map((d: any) => d.name),
            },
          });
        } catch {}

        // Send push notifications to all assigned drivers
        for (const d of activeDrivers) {
          try {
            await this.notifications.notifyDriverAssigned(d.id, booking);
          } catch {}
        }

        return {
          success: true,
          message: `Ride automatically broadcast to ${activeDrivers.length} driver(s) for ${booking.vehicle_category}`,
          driverCount: activeDrivers.length,
          drivers: activeDrivers.map((d: any) => ({ id: d.id, name: d.name })),
        };
      }
    }

    let chosenDriver: any = null;

    // 2. Check Single-Driver Automatic Ride Assignment rule from Settings (legacy / fallback)
    const categoryRule = await this.settings.getAutoAssignmentForCategory(booking.vehicle_category);
    if (categoryRule && categoryRule.autoAssignEnabled && categoryRule.driverId) {
      // Fetch the assigned primary driver
      const { data: primaryDriver } = await this.supabase
        .getClient()
        .from('drivers')
        .select('*')
        .eq('id', categoryRule.driverId)
        .maybeSingle();

      if (primaryDriver && primaryDriver.is_active) {
        chosenDriver = primaryDriver;
      } else if (categoryRule.fallbackDriverId) {
        // Primary unavailable or inactive, check fallback driver
        const { data: fallbackDriver } = await this.supabase
          .getClient()
          .from('drivers')
          .select('*')
          .eq('id', categoryRule.fallbackDriverId)
          .maybeSingle();

        if (fallbackDriver && fallbackDriver.is_active) {
          chosenDriver = fallbackDriver;
        }
      }
    }

    // 3. If no category rule is active, check legacy rules table if present
    if (!chosenDriver) {
      try {
        const { data: rules } = await this.supabase
          .getClient()
          .from('driver_assignment_rules')
          .select('*, driver:drivers(*)')
          .eq('category', booking.vehicle_category)
          .eq('is_active', true)
          .order('priority', { ascending: true });

        if (rules && rules.length > 0) {
          for (const rule of rules) {
            if (rule.driver && rule.driver.is_active && rule.driver.is_available) {
              chosenDriver = rule.driver;
              break;
            }
          }
        }
      } catch {}
    }

    if (!chosenDriver) {
      return {
        success: false,
        message: 'No active automatic assignment rule configured or driver available for this category',
      };
    }

    return this.assignDriver(
      {
        bookingId: booking.id,
        driverId: chosenDriver.id,
        notes: `Auto-assigned based on ${booking.vehicle_category} rule (${chosenDriver.name})`,
      },
      'SYSTEM_AUTO_DISPATCH',
    );
  }

  /**
   * Get Live Dispatch Board
   */
  async getDispatchBoard() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: rides, error } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*, driver:drivers(*)')
      .gte('pickup_datetime', todayStart.toISOString())
      .order('pickup_datetime', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    const pending = (rides || []).filter(
      (r) => !r.driver_id && (r.status === 'CONFIRMED' || r.status === 'PENDING_APPROVAL'),
    );
    const assigned = (rides || []).filter(
      (r) => r.driver_id && (r.status === 'ASSIGNED' || r.status === 'CONFIRMED'),
    );
    const inProgress = (rides || []).filter((r) => r.status === 'IN_PROGRESS');
    const completed = (rides || []).filter((r) => r.status === 'COMPLETED');

    return {
      unassignedCount: pending.length,
      assignedCount: assigned.length,
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      pending,
      assigned,
      inProgress,
      completed,
    };
  }

  /**
   * Category Assignment Rules CRUD
   */
  async getRules() {
    const { data, error } = await this.supabase
      .getClient()
      .from('driver_assignment_rules')
      .select('*, driver:drivers(name, vehicle_plate, phone)')
      .order('priority', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createRule(dto: CreateAssignmentRuleDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('driver_assignment_rules')
      .insert({
        category: dto.category,
        driver_id: dto.driverId,
        priority: dto.priority || 1,
        is_active: dto.isActive !== undefined ? dto.isActive : true,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteRule(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('driver_assignment_rules')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }
}
