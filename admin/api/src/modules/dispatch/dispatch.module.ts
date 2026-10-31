import { Module } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [NotificationsModule, SettingsModule],
  controllers: [DispatchController],
  providers: [DispatchService, SupabaseService],
  exports: [DispatchService],
})
export class DispatchModule {}
