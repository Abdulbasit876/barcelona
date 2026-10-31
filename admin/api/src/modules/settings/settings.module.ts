import { Module } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { SettingsController } from './settings.controller';
import { SettingsPublicController } from './settings-public.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController, SettingsPublicController],
  providers: [SettingsService, SupabaseService],
  exports: [SettingsService],
})
export class SettingsModule {}
