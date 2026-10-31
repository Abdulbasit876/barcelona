import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';
import { RejectBookingDto, ReviseBookingFareDto } from './approvals.dto';
import { ApprovalsService } from './approvals.service';

@ApiTags('Booking Approvals Queue')
@Controller('approvals')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'List all bookings awaiting admin approval or revision' })
  async getPendingApprovals() {
    return this.approvalsService.getPendingApprovals();
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a booking as-is and activate deposit / confirmation' })
  async approveBooking(@Param('id') id: string, @CurrentUser() user: any) {
    return this.approvalsService.approveBooking(id, user?.name || user?.email || 'ADMIN');
  }

  @Post(':id/revise')
  @ApiOperation({ summary: 'Revise booking fare and submit reason to customer' })
  async reviseBookingFare(
    @Param('id') id: string,
    @Body() dto: ReviseBookingFareDto,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.reviseBookingFare(
      id,
      dto,
      user?.name || user?.email || 'ADMIN',
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject/decline a booking request' })
  async rejectBooking(
    @Param('id') id: string,
    @Body() dto: RejectBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.rejectBooking(
      id,
      dto,
      user?.name || user?.email || 'ADMIN',
    );
  }
}
