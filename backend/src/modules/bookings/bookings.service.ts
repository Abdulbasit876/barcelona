import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  BookingResponse,
  BookingStatus,
  CreateBookingDto,
  PaymentStatus,
  TransferType,
  VehicleCategory,
} from '../../shared';
import { PricingService } from '../pricing/pricing.service';
import { SEED_VEHICLES } from '../../common/data/seed-data';
import { SupabaseService } from '../../common/services/supabase.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  // In-memory backing store (primary)
  private bookings: Map<string, BookingResponse> = new Map();

  constructor(
    private readonly pricingService: PricingService,
    private readonly supabase: SupabaseService,
  ) {
    this.seedDemoBookings();
  }

  private seedDemoBookings() {
    const demoRef = 'BCN-2026-DEMO';
    const demoToken = 'tok_demo_secure_barcelona_guest_99881122';
    const breakdown = this.pricingService.calculatePrice({
      transferType: TransferType.AIRPORT,
      vehicleCategory: VehicleCategory.PREMIUM,
      pickupAddress: 'Barcelona El Prat Airport (BCN) Terminal 1',
      destinationAddress: 'Hotel Arts, Carrer de la Marina, 19, 08005 Barcelona',
      distanceKm: 18.5,
      passengers: 2,
      luggage: 2,
      isMetropolitan: true,
    });

    this.bookings.set(demoRef, {
      id: 'demo-booking-uuid-1',
      bookingReference: demoRef,
      accessToken: demoToken,
      transferType: TransferType.AIRPORT,
      vehicleCategory: VehicleCategory.PREMIUM,
      status: BookingStatus.ASSIGNED,
      paymentStatus: PaymentStatus.PAID,
      pickupAddress: 'Barcelona El Prat Airport (BCN) Terminal 1',
      destinationAddress: 'Hotel Arts, Carrer de la Marina, 19, 08005 Barcelona',
      pickupDateTime: new Date(Date.now() + 3600000 * 2).toISOString(),
      passengers: 2,
      luggage: 2,
      childSeats: 0,
      customerName: 'Alexander Wright',
      customerEmail: 'alexander@example.com',
      customerPhone: '+34 600 123 456',
      fareBreakdown: breakdown,
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
      assignedDriver: {
        id: 'driver-carlos-1',
        name: 'Carlos Mendoza',
        phone: '+34 611 789 012',
        vehiclePlate: '4829-LTM',
        vehicleModel: 'Mercedes-Benz E-Class Black',
        currentLat: 41.3851,
        currentLng: 2.1734,
        lastUpdate: new Date().toISOString(),
      },
    });
  }

  public async createBooking(dto: CreateBookingDto): Promise<BookingResponse> {
    // Validate vehicle capacity
    const vehicle = SEED_VEHICLES.find((v) => v.category === dto.vehicleCategory);
    if (vehicle) {
      if (dto.passengers > vehicle.maxPassengers) {
        throw new BadRequestException(
          `Selected vehicle (${vehicle.name}) allows a maximum of ${vehicle.maxPassengers} passengers.`,
        );
      }
      if (dto.luggage > vehicle.maxLuggage) {
        throw new BadRequestException(
          `Selected vehicle (${vehicle.name}) allows a maximum of ${vehicle.maxLuggage} suitcases.`,
        );
      }
    }

    // Backend calculates pricing as sole authority
    const pricingBreakdown = this.pricingService.calculatePrice({
      transferType: dto.transferType,
      vehicleCategory: dto.vehicleCategory,
      pickupAddress: dto.pickupAddress,
      destinationAddress: dto.destinationAddress,
      passengers: dto.passengers,
      luggage: dto.luggage,
      durationHours: dto.tourDurationHours || 3,
    });

    const accessToken = crypto.randomBytes(32).toString('hex');
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const bookingReference = `BCN-${randomSuffix}`;

    // Port and Sants Station start as PENDING_APPROVAL
    let initialStatus = BookingStatus.CONFIRMED;
    if (
      dto.transferType === TransferType.CRUISE_PORT ||
      dto.transferType === TransferType.SANTS_STATION
    ) {
      initialStatus = BookingStatus.PENDING_APPROVAL;
    }

    const booking: BookingResponse = {
      id: crypto.randomUUID(),
      bookingReference,
      accessToken,
      transferType: dto.transferType,
      vehicleCategory: dto.vehicleCategory,
      status: initialStatus,
      paymentStatus: PaymentStatus.PENDING,
      pickupAddress: dto.pickupAddress,
      destinationAddress: dto.destinationAddress,
      pickupDateTime: `${dto.pickupDate}T${dto.pickupTime}:00`,
      passengers: dto.passengers,
      luggage: dto.luggage,
      childSeats: dto.childSeats || 0,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      specialRequests: dto.specialRequests,
      preferredLanguage: dto.preferredLanguage || 'en',
      fareBreakdown: pricingBreakdown,
      originalFare: pricingBreakdown.totalFare,
      flightOrTrainNumber: dto.flightOrTrainNumber,
      cruiseShipName: dto.cruiseShipName,
      assignedDriver: null,
      createdAt: new Date().toISOString(),
    };

    // Primary: store in-memory
    this.bookings.set(bookingReference, booking);

    // Secondary: persist to Supabase (non-blocking dual-write)
    try {
      const { error } = await this.supabase.getClient().from('bookings').insert({
        id: booking.id,
        booking_reference: booking.bookingReference,
        access_token: booking.accessToken,
        transfer_type: booking.transferType,
        vehicle_category: booking.vehicleCategory,
        status: booking.status,
        payment_status: booking.paymentStatus,
        pickup_address: booking.pickupAddress,
        destination_address: booking.destinationAddress,
        pickup_datetime: booking.pickupDateTime,
        passengers: booking.passengers,
        luggage: booking.luggage,
        child_seats: booking.childSeats,
        customer_name: booking.customerName,
        customer_email: booking.customerEmail,
        customer_phone: booking.customerPhone,
        flight_or_train_number: booking.flightOrTrainNumber,
        cruise_ship_name: booking.cruiseShipName,
        special_requests: booking.specialRequests,
        preferred_language: booking.preferredLanguage,
        total_fare: pricingBreakdown.totalFare,
        fare_breakdown: pricingBreakdown,
        approval_status:
          initialStatus === BookingStatus.PENDING_APPROVAL ? 'PENDING_APPROVAL' : 'APPROVED',
        created_at: booking.createdAt,
      });
      if (error) {
        this.logger.error(`Supabase write failed for ${bookingReference}: ${error.message}`);
      } else {
        this.logger.log(`Booking ${bookingReference} persisted to Supabase ✓`);
      }
    } catch (err: any) {
      this.logger.error(`Supabase write error for ${bookingReference}: ${err?.message}`);
    }

    return booking;
  }

  public getBookingByToken(token: string): BookingResponse {
    if (!token) {
      throw new BadRequestException('Access token is required');
    }
    for (const b of this.bookings.values()) {
      if (b.accessToken === token) {
        return b;
      }
    }
    throw new NotFoundException('Booking not found with the provided access token');
  }

  public getBookingByReference(reference: string, token?: string): BookingResponse {
    const booking = this.bookings.get(reference.toUpperCase().trim());
    if (!booking) {
      throw new NotFoundException(`Booking with reference ${reference} not found.`);
    }
    if (token && booking.accessToken !== token) {
      throw new ForbiddenException('Invalid access token for this reservation.');
    }
    return booking;
  }

  public adminReviseFare(reference: string, newFare: number, reason: string): BookingResponse {
    const booking = this.getBookingByReference(reference);
    booking.originalFare = booking.fareBreakdown.totalFare;
    booking.revisedFare = newFare;
    booking.hasCustomerAcceptedRevision = false;
    booking.fareBreakdown.totalFare = newFare;
    booking.fareBreakdown.pricingRuleApplied += ` | Revised by Admin: ${reason}`;
    booking.status = BookingStatus.PENDING_APPROVAL;
    return booking;
  }

  public customerAcceptRevision(reference: string, token: string): BookingResponse {
    const booking = this.getBookingByReference(reference, token);
    if (!booking.revisedFare) {
      throw new BadRequestException('No revised fare is pending for this booking.');
    }
    booking.hasCustomerAcceptedRevision = true;
    booking.status = BookingStatus.PAYMENT_PENDING;
    return booking;
  }

  public cancelBooking(reference: string, token?: string): BookingResponse {
    const booking = this.getBookingByReference(reference, token);
    booking.status = BookingStatus.CANCELLED;
    // Also update in Supabase
    this.supabase
      .getClient()
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('booking_reference', reference)
      .then(
        () => {},
        () => {},
      );
    return booking;
  }

  public assignDriver(
    reference: string,
    driverData: {
      name: string;
      phone: string;
      vehiclePlate: string;
      vehicleModel: string;
      lat: number;
      lng: number;
    },
  ): BookingResponse {
    const booking = this.getBookingByReference(reference);
    booking.assignedDriver = {
      id: crypto.randomUUID(),
      name: driverData.name,
      phone: driverData.phone,
      vehiclePlate: driverData.vehiclePlate,
      vehicleModel: driverData.vehicleModel,
      currentLat: driverData.lat,
      currentLng: driverData.lng,
      lastUpdate: new Date().toISOString(),
    };
    booking.status = BookingStatus.ASSIGNED;
    return booking;
  }

  public updateDriverLocation(reference: string, lat: number, lng: number): BookingResponse {
    const booking = this.getBookingByReference(reference);
    if (!booking.assignedDriver) {
      throw new BadRequestException('No driver assigned to this booking.');
    }
    booking.assignedDriver.currentLat = lat;
    booking.assignedDriver.currentLng = lng;
    booking.assignedDriver.lastUpdate = new Date().toISOString();
    return booking;
  }
}

