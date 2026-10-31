import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './common/services/supabase.service';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { DriverPortalModule } from './modules/driver-portal/driver-portal.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { FinancialsModule } from './modules/financials/financials.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
    AuthModule,
    BookingsModule,
    ApprovalsModule,
    DriversModule,
    DispatchModule,
    DriverPortalModule,
    FinancialsModule,
    SettingsModule,
    NotificationsModule,
  ],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}
