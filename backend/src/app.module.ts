import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './common/services/supabase.service';

// Customer Modules
import { PricingModule } from './modules/pricing/pricing.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { FamousPlacesModule } from './modules/famous-places/famous-places.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { DriverTrackingModule } from './modules/driver-tracking/driver-tracking.module';
import { ContactModule } from './modules/contact/contact.module';
import { HealthController } from './modules/health/health.controller';

// Admin & Dispatch Modules
import { AuthModule } from './modules/auth/auth.module';
import { AdminBookingsModule } from './modules/admin-bookings/bookings.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { DriverPortalModule } from './modules/driver-portal/driver-portal.module';
import { FinancialsModule } from './modules/financials/financials.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Customer APIs
    PricingModule,
    BookingsModule,
    VehiclesModule,
    FamousPlacesModule,
    PaymentsModule,
    ReceiptsModule,
    DriverTrackingModule,
    ContactModule,
    // Admin & Driver APIs
    AuthModule,
    AdminBookingsModule,
    ApprovalsModule,
    DriversModule,
    DispatchModule,
    DriverPortalModule,
    FinancialsModule,
    SettingsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}

