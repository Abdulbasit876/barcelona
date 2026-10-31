import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import {
  DriverAvailabilityDto,
  DriverLocationDto,
  ReportWaitingTimeDto,
  UpdateRideStatusDto,
} from './driver-portal.dto';

@Injectable()
export class DriverPortalService {
  private readonly logger = new Logger(DriverPortalService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Driver login / token check
   */
  async driverLogin(phoneOrEmail: string, vehiclePlate?: string) {
    let query = this.supabase
      .getClient()
      .from('drivers')
      .select('*')
      .or(`email.eq.${phoneOrEmail},phone.eq.${phoneOrEmail}`)
      .eq('is_active', true);

    if (vehiclePlate) {
      query = query.eq('vehicle_plate', vehiclePlate.trim());
    }

    const { data: driver, error } = await query.single();

    if (error || !driver) {
      throw new ForbiddenException(
        'Driver account not found. Please contact administration.',
      );
    }

    // Return driver profile and session token
    return {
      token: `driver-${driver.id}`,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        vehiclePlate: driver.vehicle_plate,
        vehicleModel: driver.vehicle_model,
        rating: driver.rating || 5.0,
        currentStatus: driver.current_status,
      },
    };
  }

  /**
   * Strictly sanitize ride details for driver view
   * Returns normalized attributes for both camelCase and snake_case consumption
   */
  private sanitizeRideForDriver(ride: any) {
    const fb = (ride.fare_breakdown && typeof ride.fare_breakdown === 'object') ? ride.fare_breakdown : {};
    const notes = ride.driver_notes || '';
    const hasCashNote = notes.includes('CASH RECEIVED') || notes.includes('CASH COLLECTED');
    const hasOnlineNote = notes.includes('ONLINE PAYMENT');

    const isPaidCash = Boolean(
      (ride.balance_paid || ride.payment_status === 'PAID') &&
      (fb.final_payment_method === 'CASH' || ride.payment_method === 'CASH' || hasCashNote)
    );

    const isPaidOnline = Boolean(
      (ride.balance_paid || ride.payment_status === 'PAID') &&
      (
        fb.final_payment_method === 'ONLINE' ||
        ride.payment_method === 'FULL_ONLINE' ||
        Boolean(ride.stripe_payment_intent_id) ||
        hasOnlineNote
      ) &&
      !isPaidCash
    );

    const finalMethod = isPaidCash ? 'CASH' : isPaidOnline ? 'ONLINE' : null;
    const cashReceived = isPaidCash ? (fb.driver_cash_received || Number(ride.remaining_balance ?? 0)) : 0;
    const onlineTxn = ride.stripe_payment_intent_id || fb.online_payment_transaction_id || null;
    const verifiedAt = fb.payment_verified_at || ride.updated_at || null;

    return {
        id: ride.id,
        bookingReference: ride.booking_reference,
        booking_reference: ride.booking_reference,
        transferType: ride.transfer_type,
        transfer_type: ride.transfer_type,
        vehicleCategory: ride.vehicle_category,
        vehicle_category: ride.vehicle_category,
        status: ride.status,
        approvalStatus: ride.approval_status || 'APPROVED',
        approval_status: ride.approval_status || 'APPROVED',
        paymentStatus: (isPaidOnline || isPaidCash) ? 'PAID' : (ride.payment_status || 'PENDING'),
        payment_status: (isPaidOnline || isPaidCash) ? 'PAID' : (ride.payment_status || 'PENDING'),
        paymentMethod: ride.payment_method || (isPaidCash ? 'CASH' : 'FULL_ONLINE'),
        payment_method: ride.payment_method || (isPaidCash ? 'CASH' : 'FULL_ONLINE'),
        pickupAddress: ride.pickup_address,
        pickup_address: ride.pickup_address,
        destinationAddress: ride.destination_address,
        destination_address: ride.destination_address,
        pickupDateTime: ride.pickup_datetime,
        pickup_datetime: ride.pickup_datetime,
        passengers: ride.passengers || 1,
        luggage: ride.luggage || 0,
        cabinLuggage: ride.flight_details?.cabin_luggage ?? ride.cabin_luggage ?? 0,
        cabin_luggage: ride.flight_details?.cabin_luggage ?? ride.cabin_luggage ?? 0,
        childSeats: ride.child_seats || 0,
        child_seats: ride.child_seats || 0,
        babyBooster: ride.baby_booster || 0,
        baby_booster: ride.baby_booster || 0,
        customerName: ride.customer_name || 'Passenger',
        customer_name: ride.customer_name || 'Passenger',
        customerPhone: ride.customer_phone || '',
        customer_phone: ride.customer_phone || '',
        customerEmail: ride.customer_email || '',
        customer_email: ride.customer_email || '',
        flightOrTrainNumber: ride.flight_or_train_number,
        flight_or_train_number: ride.flight_or_train_number,
        flightDetails: ride.flight_details,
        flight_details: ride.flight_details,
        cruiseShipName: ride.cruise_ship_name,
        cruise_ship_name: ride.cruise_ship_name,
        specialRequests: ride.special_requests,
        special_requests: ride.special_requests,
        driverNotes: ride.driver_notes,
        driver_notes: ride.driver_notes,
        totalFare: ride.total_fare || 0,
        total_fare: ride.total_fare || 0,
        advanceAmount: ride.deposit_amount || ride.advance_amount || 0,
        advance_amount: ride.deposit_amount || ride.advance_amount || 0,
        deposit_amount: ride.deposit_amount || ride.advance_amount || 0,
        remainingBalance: (isPaidOnline || isPaidCash) ? 0 : (ride.remaining_balance ?? ride.remaining_amount ?? 0),
        remaining_balance: (isPaidOnline || isPaidCash) ? 0 : (ride.remaining_balance ?? ride.remaining_amount ?? 0),
        remaining_amount: (isPaidOnline || isPaidCash) ? 0 : (ride.remaining_balance ?? ride.remaining_amount ?? 0),
        depositPaid: isPaidOnline || isPaidCash || Boolean(ride.deposit_paid),
        deposit_paid: isPaidOnline || isPaidCash || Boolean(ride.deposit_paid),
        balancePaid: isPaidOnline || isPaidCash || Boolean(ride.balance_paid),
        balance_paid: isPaidOnline || isPaidCash || Boolean(ride.balance_paid),
        finalPaymentMethod: finalMethod,
        final_payment_method: finalMethod,
        driverCashReceived: cashReceived,
        driver_cash_received: cashReceived,
        onlinePaymentTransactionId: onlineTxn,
        online_payment_transaction_id: onlineTxn,
        paymentVerifiedAt: verifiedAt,
        payment_verified_at: verifiedAt,
        isPaidOnline,
        is_paid_online: isPaidOnline,
        isPaidCash,
        is_paid_cash: isPaidCash,
        freeWaitingMinutes: 15,
        free_waiting_minutes: 15,
        createdAt: ride.created_at,
        created_at: ride.created_at,
        updatedAt: ride.updated_at,
        updated_at: ride.updated_at,
      };
  }

  /**
   * Get rides assigned to this driver with completed metrics (day, month, total)
   */
  async getMyRides(driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const { data: rides, error } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('driver_id', driverId)
      .order('pickup_datetime', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    const todayRides: any[] = [];
    const upcomingRides: any[] = [];
    const completedRides: any[] = [];

    let completedToday = 0;
    let completedThisMonth = 0;
    let totalCompleted = 0;

    (rides || []).forEach((ride) => {
      const sanitized = this.sanitizeRideForDriver(ride);
      const isCompleted = ride.status === 'COMPLETED';

      if (isCompleted) {
        totalCompleted++;
        const finishDate = new Date(ride.updated_at || ride.pickup_datetime);
        if (finishDate >= startOfMonth) {
          completedThisMonth++;
        }
        if (finishDate >= today) {
          completedToday++;
        }
        completedRides.push(sanitized);
      } else if (ride.status === 'CANCELLED') {
        // Cancelled rides not counted in completed
      } else {
        // Active ride (ASSIGNED, ACCEPTED, ON_THE_WAY, ON_ROUTE, ARRIVED_AT_PICKUP, PASSENGER_ON_BOARD, PICKED_RIDE, IN_PROGRESS)
        const pDate = new Date(ride.pickup_datetime);
        const isToday =
          pDate.getFullYear() === today.getFullYear() &&
          pDate.getMonth() === today.getMonth() &&
          pDate.getDate() === today.getDate();

        if (
          isToday ||
          ride.status === 'IN_PROGRESS' ||
          ride.status === 'ON_THE_WAY' ||
          ride.status === 'ON_ROUTE' ||
          ride.status === 'ARRIVED_AT_PICKUP' ||
          ride.status === 'PASSENGER_ON_BOARD' ||
          ride.status === 'PICKED_RIDE' ||
          ride.status === 'ACCEPTED'
        ) {
          todayRides.push(sanitized);
        } else if (pDate > today) {
          upcomingRides.push(sanitized);
        } else {
          todayRides.push(sanitized);
        }
      }
    });

    // Also fetch broadcast offers pending for this driver
    try {
      let offerBookingIds: string[] = [];
      try {
        const { data: offers } = await this.supabase
          .getClient()
          .from('booking_driver_offers')
          .select('booking_id')
          .eq('driver_id', driverId)
          .eq('status', 'PENDING');
        if (offers) {
          offerBookingIds = offers.map((o: any) => o.booking_id);
        }
      } catch {}

      const { data: unassignedBookings } = await this.supabase
        .getClient()
        .from('bookings')
        .select('*')
        .is('driver_id', null)
        .not('status', 'in', '("COMPLETED","CANCELLED","REJECTED")')
        .order('pickup_datetime', { ascending: true });

      (unassignedBookings || []).forEach((b: any) => {
        const fb = b.fare_breakdown || {};
        const offers = Array.isArray(fb.pending_offers) ? fb.pending_offers : [];
        const isOfferedToThisDriver =
          offerBookingIds.includes(b.id) ||
          offers.some((o: any) => o.driver_id === driverId && o.status === 'PENDING');

        if (isOfferedToThisDriver && !(rides || []).some((r: any) => r.id === b.id)) {
          const sanitized = {
            ...this.sanitizeRideForDriver(b),
            isPendingOffer: true,
            pending_offer: true,
          };

          const pDate = new Date(b.pickup_datetime);
          const isToday =
            pDate.getFullYear() === today.getFullYear() &&
            pDate.getMonth() === today.getMonth() &&
            pDate.getDate() === today.getDate();

          if (isToday) {
            todayRides.unshift(sanitized);
          } else if (pDate > today) {
            upcomingRides.unshift(sanitized);
          } else {
            todayRides.unshift(sanitized);
          }
        }
      });
    } catch (offerErr) {
      this.logger.warn(`Could not load pending offers: ${offerErr}`);
    }

    // Check overtime setting from system_settings
    let overtimeEnabled = false;
    try {
      const { data: dispatchSetting } = await this.supabase
        .getClient()
        .from('system_settings')
        .select('value')
        .eq('key', 'dispatch_config')
        .single();
      if (dispatchSetting?.value?.overtime_enabled !== undefined) {
        overtimeEnabled = Boolean(dispatchSetting.value.overtime_enabled);
      }
    } catch {}

    return {
      todayRides,
      upcomingRides,
      completedRides,
      stats: {
        completedToday,
        completedThisMonth,
        totalCompleted,
      },
      completedToday,
      completedThisMonth,
      totalCompleted,
      totalCount: (rides || []).length,
      overtimeEnabled,
    };
  }

  /**
   * Get ride details for driver (supports both assigned rides and pending broadcast offers)
   */
  async getRideDetails(driverId: string, bookingId: string) {
    const client = this.supabase.getClient();

    // 1. Try finding ride directly assigned to driver
    const { data: booking, error } = await client
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new NotFoundException('Ride not found');
    }

    // Check authorization: must be either assigned to this driver, or offered to this driver
    const isAssigned = booking.driver_id === driverId;
    let isOffered = false;

    if (!isAssigned && !booking.driver_id) {
      const fb = booking.fare_breakdown || {};
      const offers = Array.isArray(fb.pending_offers) ? fb.pending_offers : [];
      isOffered = offers.some((o: any) => o.driver_id === driverId);

      if (!isOffered) {
        try {
          const { data: offerRow } = await client
            .from('booking_driver_offers')
            .select('id')
            .eq('booking_id', bookingId)
            .eq('driver_id', driverId)
            .maybeSingle();
          if (offerRow) isOffered = true;
        } catch {}
      }
    }

    if (!isAssigned && !isOffered) {
      throw new NotFoundException('Ride not found or not assigned/offered to you');
    }

    // Google Maps Navigation URLs
    const pickupEncoded = encodeURIComponent(booking.pickup_address || '');
    const destEncoded = encodeURIComponent(booking.destination_address || '');
    const mapsNavigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${destEncoded}&origin=${pickupEncoded}`;
    const mapsPickupUrl = `https://www.google.com/maps/search/?api=1&query=${pickupEncoded}`;
    const wazeUrl = `https://waze.com/ul?q=${pickupEncoded}&navigate=yes`;

    const sanitized = {
      ...this.sanitizeRideForDriver(booking),
      isPendingOffer: isOffered && !isAssigned,
      pending_offer: isOffered && !isAssigned,
      mapsNavigationUrl,
      mapsPickupUrl,
      wazeUrl,
    };

    return sanitized;
  }

  /**
   * Accept a broadcasted ride offer (First-Accept-Wins logic with race condition prevention)
   */
  async acceptRide(driverId: string, bookingId: string) {
    const client = this.supabase.getClient();

    // 1. Fetch booking with current driver_id and status
    const { data: booking, error: bErr } = await client
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bErr || !booking) {
      throw new NotFoundException('Booking not found');
    }

    // If already assigned to another driver
    if (booking.driver_id && booking.driver_id !== driverId) {
      throw new BadRequestException('This ride has already been accepted by another driver.');
    }

    // 2. Fetch driver profile
    const { data: driver } = await client
      .from('drivers')
      .select('id, name, phone, vehicle_plate, is_active')
      .eq('id', driverId)
      .single();

    if (!driver || !driver.is_active) {
      throw new BadRequestException('Driver not found or inactive');
    }

    const nowIso = new Date().toISOString();
    const fb = (booking.fare_breakdown && typeof booking.fare_breakdown === 'object') ? booking.fare_breakdown : {};
    const currentOffers = Array.isArray(fb.pending_offers) ? fb.pending_offers : [];
    const updatedOffers = currentOffers.map((o: any) => ({
      ...o,
      status: o.driver_id === driverId ? 'ACCEPTED' : 'EXPIRED',
      responded_at: nowIso,
    }));

    // 3. Atomically assign booking to this driver
    let updateQuery = client
      .from('bookings')
      .update({
        driver_id: driverId,
        status: 'ACCEPTED',
        driver_notes: (booking.driver_notes || '') + `\n[ACCEPTED]: Accepted by driver ${driver.name} on ${new Date().toLocaleString()}`,
        fare_breakdown: {
          ...fb,
          pending_offers: updatedOffers,
          accepted_by_driver_id: driverId,
          accepted_driver_name: driver.name,
          accepted_at: nowIso,
        },
        updated_at: nowIso,
      })
      .eq('id', bookingId);

    // Concurrency guard: if booking had no driver, only update if it is STILL null
    if (!booking.driver_id) {
      updateQuery = updateQuery.is('driver_id', null);
    }

    const { data: updatedBooking, error: updateErr } = await updateQuery.select().single();

    if (updateErr || !updatedBooking) {
      throw new BadRequestException('This ride was already accepted by another driver.');
    }

    // 4. Update booking_driver_offers table if available
    try {
      await client
        .from('booking_driver_offers')
        .update({ status: 'ACCEPTED', responded_at: nowIso })
        .eq('booking_id', bookingId)
        .eq('driver_id', driverId);

      await client
        .from('booking_driver_offers')
        .update({ status: 'EXPIRED', responded_at: nowIso })
        .eq('booking_id', bookingId)
        .neq('driver_id', driverId);
    } catch {}

    // 5. Audit log
    try {
      await client.from('audit_logs').insert({
        actor_type: 'DRIVER',
        actor_id: driverId,
        action: 'ACCEPT_RIDE',
        entity_type: 'booking',
        entity_id: bookingId,
        metadata: {
          driver_id: driverId,
          driver_name: driver.name,
          accepted_at: nowIso,
        },
      });
    } catch {}

    // 6. Notify admin
    try {
      await client.from('notifications').insert({
        recipient_role: 'ADMIN',
        title: `🚗 Ride Accepted: #${updatedBooking.booking_reference}`,
        message: `Driver ${driver.name} accepted ride #${updatedBooking.booking_reference} for ${updatedBooking.customer_name}.`,
        booking_id: bookingId,
        type: 'BOOKING',
        is_read: false,
      });
    } catch {}

    return {
      success: true,
      message: `Ride accepted successfully! Assigned to ${driver.name}.`,
      booking: this.sanitizeRideForDriver(updatedBooking),
    };
  }

  /**
   * Reject a broadcasted ride offer (removes it from this driver's pending list)
   */
  async rejectRide(driverId: string, bookingId: string) {
    const client = this.supabase.getClient();
    const nowIso = new Date().toISOString();

    // 1. Verify the booking exists and driver has an offer for it
    const { data: booking, error: bErr } = await client
      .from('bookings')
      .select('id, booking_reference, customer_name, driver_id, fare_breakdown')
      .eq('id', bookingId)
      .single();

    if (bErr || !booking) {
      throw new NotFoundException('Booking not found');
    }

    // Already accepted by someone else
    if (booking.driver_id && booking.driver_id !== driverId) {
      throw new BadRequestException('This ride has already been accepted by another driver.');
    }

    // 2. Mark offer as REJECTED in booking_driver_offers
    try {
      await client
        .from('booking_driver_offers')
        .update({ status: 'REJECTED', responded_at: nowIso })
        .eq('booking_id', bookingId)
        .eq('driver_id', driverId);
    } catch {}

    // 3. Also remove from fare_breakdown.pending_offers if stored there
    try {
      const fb = (booking.fare_breakdown && typeof booking.fare_breakdown === 'object') ? booking.fare_breakdown : {};
      const currentOffers = Array.isArray(fb.pending_offers) ? fb.pending_offers : [];
      const updatedOffers = currentOffers.map((o: any) =>
        o.driver_id === driverId ? { ...o, status: 'REJECTED', responded_at: nowIso } : o,
      );
      if (updatedOffers.length > 0) {
        await client
          .from('bookings')
          .update({ fare_breakdown: { ...fb, pending_offers: updatedOffers }, updated_at: nowIso })
          .eq('id', bookingId);
      }
    } catch {}

    // 4. Audit log
    try {
      await client.from('audit_logs').insert({
        actor_type: 'DRIVER',
        actor_id: driverId,
        action: 'REJECT_RIDE',
        entity_type: 'booking',
        entity_id: bookingId,
        metadata: { driver_id: driverId, rejected_at: nowIso },
      });
    } catch {}

    return {
      success: true,
      message: 'Ride offer rejected. It will no longer appear in your pending list.',
    };
  }

  /**
   * Driver verifies and records cash payment received from passenger
   */
  async collectCash(driverId: string, bookingId: string, amount?: number) {
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('driver_id', driverId)
      .single();

    if (bErr || !booking) throw new NotFoundException('Ride not found');

    const fb = (booking.fare_breakdown && typeof booking.fare_breakdown === 'object') ? booking.fare_breakdown : {};
    const notes = booking.driver_notes || '';

    // Rule: If remaining amount is paid online, cash payment option must be automatically disabled / rejected
    const isAlreadyPaidOnline = Boolean(
      (booking.balance_paid || booking.payment_status === 'PAID') &&
      (
        fb.final_payment_method === 'ONLINE' ||
        booking.payment_method === 'FULL_ONLINE' ||
        Boolean(booking.stripe_payment_intent_id) ||
        notes.includes('ONLINE PAYMENT')
      ) &&
      fb.final_payment_method !== 'CASH' &&
      booking.payment_method !== 'CASH' &&
      !notes.includes('CASH RECEIVED')
    );

    if (isAlreadyPaidOnline) {
      throw new BadRequestException('Cash payment is disabled: This booking has already been paid online.');
    }

    const isAlreadyPaidCash = Boolean(
      (booking.balance_paid || booking.payment_status === 'PAID') &&
      (
        fb.final_payment_method === 'CASH' ||
        booking.payment_method === 'CASH' ||
        notes.includes('CASH RECEIVED')
      )
    );

    if (isAlreadyPaidCash) {
      throw new BadRequestException('Cash payment for this booking has already been recorded.');
    }

    const { data: driver } = await this.supabase
      .getClient()
      .from('drivers')
      .select('name')
      .eq('id', driverId)
      .single();

    const collectedAmount = amount ?? booking.remaining_balance ?? booking.total_fare ?? 0;
    const driverName = driver?.name || 'Driver';
    const nowIso = new Date().toISOString();

    const currentNotes = booking.driver_notes || '';
    const updatedNotes = `${currentNotes}\n[CASH RECEIVED]: €${collectedAmount} verified collected in cash by driver ${driverName} on ${new Date().toLocaleString()}`.trim();

    const updatedFareBreakdown = {
      ...fb,
      final_payment_method: 'CASH',
      driver_cash_received: collectedAmount,
      payment_verified_at: nowIso,
      cash_verified_by: driverName,
      audit_log: `Cash payment of €${collectedAmount} collected by driver ${driverName} on ${nowIso}`,
    };

    const { data: updated, error } = await this.supabase
      .getClient()
      .from('bookings')
      .update({
        payment_status: 'PAID',
        payment_method: 'CASH',
        balance_paid: true,
        deposit_paid: true,
        remaining_balance: 0,
        fare_breakdown: updatedFareBreakdown,
        driver_notes: updatedNotes,
        updated_at: nowIso,
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Audit log
    try {
      await this.supabase.getClient().from('audit_logs').insert({
        booking_id: bookingId,
        action: 'PAYMENT_COLLECTED_CASH',
        changed_by: `DRIVER_${driverId} (${driverName})`,
        new_values: {
          amount: collectedAmount,
          driver_name: driverName,
          final_payment_method: 'CASH',
          timestamp: nowIso,
        },
      });
    } catch {}

    // Notify admin dashboard immediately
    try {
      await this.supabase.getClient().from('notifications').insert({
        recipient_role: 'ADMIN',
        title: `💵 Cash Payment Received: #${booking.booking_reference}`,
        message: `Driver ${driverName} received €${collectedAmount} in cash from passenger for booking #${booking.booking_reference}.`,
        booking_id: bookingId,
        type: 'PAYMENT_COLLECTED',
      });
    } catch {}

    return {
      success: true,
      message: `Cash payment of €${collectedAmount} verified successfully.`,
      collectedAmount,
      driverName,
      booking: this.sanitizeRideForDriver(updated),
    };
  }

  /**
   * Driver verifies customer's online payment
   */
  async confirmOnlinePayment(driverId: string, bookingId: string, transactionNote?: string) {
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('driver_id', driverId)
      .single();

    if (bErr || !booking) throw new NotFoundException('Ride not found');

    const fb = (booking.fare_breakdown && typeof booking.fare_breakdown === 'object') ? booking.fare_breakdown : {};
    const notes = booking.driver_notes || '';

    const isAlreadyPaidCash = Boolean(
      (booking.balance_paid || booking.payment_status === 'PAID') &&
      (
        fb.final_payment_method === 'CASH' ||
        booking.payment_method === 'CASH' ||
        notes.includes('CASH RECEIVED')
      )
    );

    if (isAlreadyPaidCash) {
      throw new BadRequestException('This booking was already paid via cash. Cannot verify online payment.');
    }

    const isAlreadyPaidOnline = Boolean(
      (booking.balance_paid || booking.payment_status === 'PAID') &&
      (
        fb.final_payment_method === 'ONLINE' ||
        booking.payment_method === 'FULL_ONLINE' ||
        Boolean(booking.stripe_payment_intent_id) ||
        notes.includes('ONLINE PAYMENT')
      )
    );

    if (isAlreadyPaidOnline) {
      throw new BadRequestException('Online payment has already been verified for this booking.');
    }

    const { data: driver } = await this.supabase
      .getClient()
      .from('drivers')
      .select('name')
      .eq('id', driverId)
      .single();

    const driverName = driver?.name || 'Driver';
    const nowIso = new Date().toISOString();
    const txnId = transactionNote?.trim() || `ONLINE_VERIF_${Date.now()}`;

    const currentNotes = booking.driver_notes || '';
    const updatedNotes = `${currentNotes}\n[ONLINE PAYMENT VERIFIED]: Verified by driver ${driverName} on ${new Date().toLocaleString()}${transactionNote ? ` (${transactionNote})` : ''}`.trim();

    const updatedFareBreakdown = {
      ...fb,
      final_payment_method: 'ONLINE',
      online_payment_transaction_id: txnId,
      payment_verified_at: nowIso,
      online_verified_by: driverName,
      audit_log: `Online payment verified by driver ${driverName} on ${nowIso}${transactionNote ? ` (${transactionNote})` : ''}`,
    };

    const { data: updated, error } = await this.supabase
      .getClient()
      .from('bookings')
      .update({
        payment_status: 'PAID',
        payment_method: 'FULL_ONLINE',
        balance_paid: true,
        deposit_paid: true,
        remaining_balance: 0,
        stripe_payment_intent_id: booking.stripe_payment_intent_id || txnId,
        fare_breakdown: updatedFareBreakdown,
        driver_notes: updatedNotes,
        updated_at: nowIso,
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    try {
      await this.supabase.getClient().from('audit_logs').insert({
        booking_id: bookingId,
        action: 'PAYMENT_VERIFIED_ONLINE',
        changed_by: `DRIVER_${driverId} (${driverName})`,
        new_values: {
          verified_by: driverName,
          final_payment_method: 'ONLINE',
          transaction_note: txnId,
          timestamp: nowIso,
        },
      });
    } catch {}

    try {
      await this.supabase.getClient().from('notifications').insert({
        recipient_role: 'ADMIN',
        title: `💳 Online Payment Verified: #${booking.booking_reference}`,
        message: `Driver ${driverName} verified online payment for booking #${booking.booking_reference}.`,
        booking_id: bookingId,
        type: 'PAYMENT_RECEIVED',
      });
    } catch {}

    return {
      success: true,
      message: 'Online payment verified successfully.',
      booking: this.sanitizeRideForDriver(updated),
    };
  }

  /**
   * Driver requests customer to pay remaining balance online
   */
  async requestOnlinePayment(driverId: string, bookingId: string) {
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('driver_id', driverId)
      .single();

    if (bErr || !booking) throw new NotFoundException('Ride not found');

    const paymentLink = `http://localhost:3000/booking-confirmation/${booking.booking_reference}?payment_required=true`;

    return {
      success: true,
      message: 'Online payment link generated',
      paymentLink,
      customerPhone: booking.customer_phone,
      customerName: booking.customer_name,
      remainingBalance: booking.remaining_balance,
      bookingReference: booking.booking_reference,
    };
  }

  /**
   * Update ride status
   */
  async updateRideStatus(
    driverId: string,
    bookingId: string,
    dto: UpdateRideStatusDto,
  ) {
    const { data: booking, error: bErr } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('driver_id', driverId)
      .single();

    if (bErr || !booking) {
      throw new NotFoundException('Ride not found or not assigned to you');
    }

    const nowIso = new Date().toISOString();
    const fb = (booking.fare_breakdown && typeof booking.fare_breakdown === 'object') ? booking.fare_breakdown : {};
    const progressHistory = Array.isArray(fb.progress_history) ? fb.progress_history : [];
    progressHistory.push({
      status: dto.status,
      timestamp: nowIso,
      driver_id: driverId,
      notes: dto.notes,
    });

    const updates: Record<string, any> = {
      updated_at: nowIso,
      fare_breakdown: {
        ...fb,
        progress_history: progressHistory,
        last_progress_status: dto.status,
        last_progress_at: nowIso,
      },
    };

    if (dto.status === 'ACCEPTED') {
      updates.status = 'ACCEPTED';
      updates.driver_notes = (booking.driver_notes || '') + `\n[ACCEPTED]: ${dto.notes || 'Driver accepted ride assignment'} on ${new Date().toLocaleString()}`;
    } else if (dto.status === 'ON_THE_WAY' || dto.status === 'ON_ROUTE') {
      updates.status = 'IN_PROGRESS';
      updates.driver_notes = (booking.driver_notes || '') + `\n[ON_ROUTE]: ${dto.notes || 'Driver is on route to pickup location'} on ${new Date().toLocaleTimeString()}`;
    } else if (dto.status === 'ARRIVED_AT_PICKUP') {
      updates.status = 'IN_PROGRESS';
      updates.driver_notes = (booking.driver_notes || '') + `\n[ARRIVED]: ${dto.notes || 'Driver arrived at pickup'} on ${new Date().toLocaleTimeString()}`;
    } else if (dto.status === 'PASSENGER_ON_BOARD' || dto.status === 'PICKED_RIDE') {
      updates.status = 'IN_PROGRESS';
      updates.driver_notes = (booking.driver_notes || '') + `\n[PICKED_UP]: ${dto.notes || 'Passenger on board (Picked ride), heading to destination'} on ${new Date().toLocaleTimeString()}`;
    } else if (dto.status === 'COMPLETED') {
      updates.status = 'COMPLETED';
      updates.balance_paid = true;
      updates.driver_notes = (booking.driver_notes || '') + `\n[COMPLETED]: ${dto.notes || 'Ride completed successfully'} on ${new Date().toLocaleTimeString()}`;

      // Increment driver trip count and set status back to AVAILABLE
      try {
        const { data: currentDriver } = await this.supabase
          .getClient()
          .from('drivers')
          .select('total_trips')
          .eq('id', driverId)
          .single();
        const trips = (currentDriver?.total_trips || 0) + 1;
        await this.supabase
          .getClient()
          .from('drivers')
          .update({ total_trips: trips, current_status: 'AVAILABLE' })
          .eq('id', driverId);
      } catch (err) {
        this.logger.warn('Could not increment driver trips count: ' + err);
      }
    }

    const { data: updatedBooking, error: updateErr } = await this.supabase
      .getClient()
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateErr) throw new BadRequestException(updateErr.message);

    // Audit log
    await this.supabase
      .getClient()
      .from('audit_logs')
      .insert({
        booking_id: bookingId,
        action: `DRIVER_STATUS_${dto.status}`,
        changed_by: `DRIVER_${driverId}`,
        new_values: updates,
      });

    return this.sanitizeRideForDriver(updatedBooking);
  }

  /**
   * Report waiting time beyond free allowance
   */
  async reportWaitingTime(
    driverId: string,
    bookingId: string,
    dto: ReportWaitingTimeDto,
  ) {
    const { data: booking, error } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('driver_id', driverId)
      .single();

    if (error || !booking) {
      throw new NotFoundException('Ride not found or not assigned to you');
    }

    // Rate: standard 15 min free, after that e.g. 0.50€/min (30€/hr)
    const freeMinutes = booking.free_waiting_minutes || 15;
    const billableMinutes = Math.max(0, dto.waitedMinutes - freeMinutes);
    const extraCharge = Number((billableMinutes * 0.5).toFixed(2));

    const newTotal = Number(booking.total_fare || 0) + extraCharge;
    const newRemainingBalance = Number(booking.remaining_balance || 0) + extraCharge;

    const { data: updated, error: updateErr } = await this.supabase
      .getClient()
      .from('bookings')
      .update({
        waiting_time_reported_minutes: dto.waitedMinutes,
        waiting_time_extra_charge: extraCharge,
        total_fare: newTotal,
        remaining_balance: newRemainingBalance,
        driver_notes: `Extra waiting time reported: ${dto.waitedMinutes} mins (${billableMinutes} billable mins = +€${extraCharge}). Reason: ${dto.reason || 'Delayed passenger'}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateErr) throw new BadRequestException(updateErr.message);

    return {
      success: true,
      freeMinutes,
      waitedMinutes: dto.waitedMinutes,
      billableMinutes,
      extraCharge,
      newTotalFare: newTotal,
      newRemainingBalance,
      booking: updated,
    };
  }

  /**
   * Update Driver Live GPS Location
   */
  async updateLocation(driverId: string, dto: DriverLocationDto) {
    const now = new Date().toISOString();

    // 1. Update driver record
    await this.supabase
      .getClient()
      .from('drivers')
      .update({
        current_lat: dto.latitude,
        current_lng: dto.longitude,
        last_location_update: now,
      })
      .eq('id', driverId);

    // 2. Insert into location logs if on trip
    if (dto.bookingId) {
      await this.supabase
        .getClient()
        .from('driver_location_logs')
        .insert({
          booking_id: dto.bookingId,
          driver_id: driverId,
          latitude: dto.latitude,
          longitude: dto.longitude,
          heading: dto.heading || null,
          speed_kmh: dto.speedKmh || null,
          recorded_at: now,
        });
    }

    return { success: true, timestamp: now };
  }

  /**
   * Toggle driver availability
   */
  async updateAvailability(driverId: string, dto: DriverAvailabilityDto) {
    const isAvailable = dto.status === 'AVAILABLE';

    const { data, error } = await this.supabase
      .getClient()
      .from('drivers')
      .update({
        current_status: dto.status,
        is_available: isAvailable,
      })
      .eq('id', driverId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
