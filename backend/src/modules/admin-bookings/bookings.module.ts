import { Module } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { DispatchModule } from '../dispatch/dispatch.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { AdminBookingsController } from './bookings.controller';
import { AdminBookingsService } from './bookings.service';

@Module({
  imports: [NotificationsModule, SettingsModule, DispatchModule],
  controllers: [AdminBookingsController],
  providers: [AdminBookingsService, SupabaseService],
  exports: [AdminBookingsService],
})
export class AdminBookingsModule {}

