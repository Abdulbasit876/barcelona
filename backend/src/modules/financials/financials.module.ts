import { Module } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { FinancialsController } from './financials.controller';
import { FinancialsService } from './financials.service';

@Module({
  controllers: [FinancialsController],
  providers: [FinancialsService, SupabaseService],
  exports: [FinancialsService],
})
export class FinancialsModule {}

