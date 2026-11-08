import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';
import {
  AdminCreateBookingDto,
  AdminUpdateBookingDto,
  CancelBookingDto,
} from './bookings.dto';
import { AdminBookingsService } from './bookings.service';

@ApiTags('Admin Booking Management')
@Controller(['api/v1/bookings', 'admin/bookings'])
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminBookingsController {
  constructor(private readonly bookingsService: AdminBookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List all bookings with search, filters, pagination' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  @ApiQuery({ name: 'transferType', required: false })
  @ApiQuery({ name: 'vehicleCategory', required: false })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async listBookings(@Query() query: any) {
    return this.bookingsService.listBookings(query);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export filtered bookings to CSV' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="barcelona-bookings.csv"')
  async exportCsv(@Query() query: any) {
    return this.bookingsService.exportCsv(query);
  }

  @Delete('all')
  @ApiOperation({ summary: 'Permanently delete all bookings from database' })
  async deleteAllBookings() {
    return this.bookingsService.deleteAllBookings();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full booking details, pricing breakdown, driver & audit log' })
  async getBooking(@Param('id') id: string) {
    return this.bookingsService.getBookingById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a manual booking on behalf of customer' })
  async createBooking(
    @Body() dto: AdminCreateBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.createManualBooking(
      dto,
      user?.name || user?.email || 'ADMIN',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit permitted booking details' })
  async updateBooking(
    @Param('id') id: string,
    @Body() dto: AdminUpdateBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.updateBooking(
      id,
      dto,
      user?.name || user?.email || 'ADMIN',
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking with cancellation reason' })
  async cancelBooking(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.cancelBooking(
      id,
      dto,
      user?.name || user?.email || 'ADMIN',
    );
  }
}

