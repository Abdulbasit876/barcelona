import { Module } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { DriverPortalController } from './driver-portal.controller';
import { DriverPortalService } from './driver-portal.service';

@Module({
  controllers: [DriverPortalController],
  providers: [DriverPortalService, SupabaseService],
  exports: [DriverPortalService],
})
export class DriverPortalModule {}
