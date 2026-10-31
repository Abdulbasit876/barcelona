import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DriverGuard } from '../../common/guards/driver.guard';
import {
  DriverAvailabilityDto,
  DriverLocationDto,
  ReportWaitingTimeDto,
  UpdateRideStatusDto,
} from './driver-portal.dto';
import { DriverPortalService } from './driver-portal.service';

@ApiTags('Driver Portal')
@Controller('driver-portal')
export class DriverPortalController {
  constructor(private readonly driverPortalService: DriverPortalService) {}

  @Post('login')
  @ApiOperation({ summary: 'Driver mobile login by phone or email' })
  async login(@Body() body: { phoneOrEmail: string; vehiclePlate?: string }) {
    return this.driverPortalService.driverLogin(body.phoneOrEmail, body.vehiclePlate);
  }

  @Get('my-rides')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assigned rides for the logged-in driver' })
  async getMyRides(@CurrentUser() driver: any) {
    return this.driverPortalService.getMyRides(driver.id);
  }

  @Get('rides/:id')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific ride details with GPS navigation links & cash to collect' })
  async getRideDetails(@CurrentUser() driver: any, @Param('id') id: string) {
    return this.driverPortalService.getRideDetails(driver.id, id);
  }

  @Post('rides/:id/accept')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a broadcasted ride offer (first driver to accept wins)' })
  async acceptRide(
    @CurrentUser() driver: any,
    @Param('id') id: string,
  ) {
    return this.driverPortalService.acceptRide(driver.id, id);
  }

  @Post('rides/:id/reject')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a broadcasted ride offer (removes it from this driver pending list)' })
  async rejectRide(
    @CurrentUser() driver: any,
    @Param('id') id: string,
  ) {
    return this.driverPortalService.rejectRide(driver.id, id);
  }

  @Patch('rides/:id/status')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ride status (ON_THE_WAY, ARRIVED, PASSENGER_ON_BOARD, COMPLETED)' })
  async updateRideStatus(
    @CurrentUser() driver: any,
    @Param('id') id: string,
    @Body() dto: UpdateRideStatusDto,
  ) {
    return this.driverPortalService.updateRideStatus(driver.id, id, dto);
  }

  @Post('rides/:id/collect-cash')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Driver verifies and records cash payment received from passenger' })
  async collectCash(
    @CurrentUser() driver: any,
    @Param('id') id: string,
    @Body() body: { amount?: number },
  ) {
    return this.driverPortalService.collectCash(driver.id, id, body?.amount);
  }

  @Post('rides/:id/confirm-online')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Driver verifies customer online payment' })
  async confirmOnlinePayment(
    @CurrentUser() driver: any,
    @Param('id') id: string,
    @Body() body: { transactionNote?: string },
  ) {
    return this.driverPortalService.confirmOnlinePayment(driver.id, id, body?.transactionNote);
  }

  @Post('rides/:id/request-online-payment')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Driver requests passenger to pay remaining balance online' })
  async requestOnlinePayment(
    @CurrentUser() driver: any,
    @Param('id') id: string,
  ) {
    return this.driverPortalService.requestOnlinePayment(driver.id, id);
  }

  @Post('rides/:id/waiting-time')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report late passenger waiting time and add waiting fee' })
  async reportWaitingTime(
    @CurrentUser() driver: any,
    @Param('id') id: string,
    @Body() dto: ReportWaitingTimeDto,
  ) {
    return this.driverPortalService.reportWaitingTime(driver.id, id, dto);
  }

  @Post('location')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream driver live GPS location' })
  async updateLocation(@CurrentUser() driver: any, @Body() dto: DriverLocationDto) {
    return this.driverPortalService.updateLocation(driver.id, dto);
  }

  @Patch('availability')
  @UseGuards(DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle driver online/offline/break availability' })
  async updateAvailability(
    @CurrentUser() driver: any,
    @Body() dto: DriverAvailabilityDto,
  ) {
    return this.driverPortalService.updateAvailability(driver.id, dto);
  }
}
