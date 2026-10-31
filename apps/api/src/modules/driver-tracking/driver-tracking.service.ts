import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Subject, Observable, interval } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { BookingsService } from '../bookings/bookings.service';
import { DriverLocationUpdate, BookingStatus } from '@barcelona/shared';

@Injectable()
export class DriverTrackingService {
  private locationStream = new Subject<DriverLocationUpdate>();

  constructor(private readonly bookingsService: BookingsService) {}

  public pushDriverLocation(update: DriverLocationUpdate) {
    this.bookingsService.updateDriverLocation(update.bookingId, update.latitude, update.longitude);
    this.locationStream.next(update);
  }

  public getTrackingStream(bookingReference: string, token: string): Observable<{ data: any }> {
    const booking = this.bookingsService.getBookingByReference(bookingReference, token);

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw new ForbiddenException('Live tracking is not active for this journey.');
    }

    // Emit live SSE events whenever location updates for this booking
    return this.locationStream.asObservable().pipe(
      filter((loc) => loc.bookingId === booking.bookingReference || loc.bookingId === booking.id),
      map((loc) => ({ data: loc })),
    );
  }

  public getCurrentDriverLocation(bookingReference: string, token: string) {
    const booking = this.bookingsService.getBookingByReference(bookingReference, token);
    if (!booking.assignedDriver) {
      return {
        assigned: false,
        message: 'A chauffeur will be assigned approximately 2 hours before your scheduled pickup.',
      };
    }

    return {
      assigned: true,
      driver: booking.assignedDriver,
      status: booking.status,
    };
  }
}
