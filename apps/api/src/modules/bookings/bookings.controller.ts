import { Controller, Post, Get, Body, Param, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, BookingResponse } from '@barcelona/shared';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transfer booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  async createBooking(@Body() dto: CreateBookingDto): Promise<BookingResponse> {
    return this.bookingsService.createBooking(dto);
  }

  @Get('lookup/:reference')
  @ApiOperation({ summary: 'Lookup booking by reference code' })
  getBooking(
    @Param('reference') reference: string,
    @Query('token') token?: string,
  ): BookingResponse {
    return this.bookingsService.getBookingByReference(reference, token);
  }

  @Get('token/:token')
  @ApiOperation({ summary: 'Secure guest access via high-entropy token' })
  getBookingByToken(@Param('token') token: string): BookingResponse {
    return this.bookingsService.getBookingByToken(token);
  }

  @Patch(':reference/accept-revised-fare')
  @ApiOperation({ summary: 'Customer accepts revised fare before payment' })
  acceptRevisedFare(
    @Param('reference') reference: string,
    @Body('token') token: string,
  ): BookingResponse {
    return this.bookingsService.customerAcceptRevision(reference, token);
  }

  @Patch(':reference/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  cancelBooking(
    @Param('reference') reference: string,
    @Body('token') token?: string,
  ): BookingResponse {
    return this.bookingsService.cancelBooking(reference, token);
  }

  @Post(':reference/admin-revise-fare')
  @ApiOperation({ summary: 'Admin revises price for cruise/sants bookings' })
  adminReviseFare(
    @Param('reference') reference: string,
    @Body() body: { newFare: number; reason: string },
  ): BookingResponse {
    return this.bookingsService.adminReviseFare(reference, body.newFare, body.reason);
  }

  @Post(':reference/assign-driver')
  @ApiOperation({ summary: 'Assign a chauffeur to a confirmed ride' })
  assignDriver(
    @Param('reference') reference: string,
    @Body()
    body: {
      name: string;
      phone: string;
      vehiclePlate: string;
      vehicleModel: string;
      lat: number;
      lng: number;
    },
  ): BookingResponse {
    return this.bookingsService.assignDriver(reference, body);
  }
}
