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
import { AdminGuard } from '../../common/guards/admin.guard';
import {
  NotificationsService,
  PushSubscriptionPayload,
} from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Register a browser or mobile device for Web Push notifications' })
  async subscribe(@Body() body: PushSubscriptionPayload) {
    return this.notificationsService.subscribe(body);
  }

  @Post('test')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a test push notification to verify phone & browser alerts' })
  async sendTestNotification(@CurrentUser() user: any) {
    const testBooking = {
      id: 'test-' + Date.now(),
      booking_reference: 'BTT-TEST-99',
      customer_name: 'Test Passenger',
      transfer_type: 'AIRPORT',
      vehicle_category: 'PREMIUM',
      total_fare: 65.0,
      deposit_amount: 13.0,
      remaining_balance: 52.0,
      pickup_address: 'Barcelona Airport T1',
      pickup_datetime: new Date().toISOString(),
      status: 'CONFIRMED',
    };

    await this.notificationsService.notifyNewBooking(testBooking);
    return { success: true, message: 'Test notification triggered successfully' };
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent admin in-app notification alerts' })
  async getAdminNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getNotifications('ADMIN', user?.id);
  }

  @Patch(':id/read')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark an in-app notification as read' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all in-app notifications as read' })
  async markAllAsRead() {
    return this.notificationsService.markAllAsRead('ADMIN');
  }
}
