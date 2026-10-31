import { Module } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

@Module({
  controllers: [DriversController],
  providers: [DriversService, SupabaseService],
  exports: [DriversService],
})
export class DriversModule {}
