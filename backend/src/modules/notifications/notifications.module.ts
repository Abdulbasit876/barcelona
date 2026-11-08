import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from '../../common/services/supabase.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SupabaseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

