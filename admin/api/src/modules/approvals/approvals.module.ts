import { Module } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  controllers: [ApprovalsController],
  providers: [ApprovalsService, SupabaseService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
