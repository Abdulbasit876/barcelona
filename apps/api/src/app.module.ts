import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PricingModule } from './modules/pricing/pricing.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { FamousPlacesModule } from './modules/famous-places/famous-places.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { DriverTrackingModule } from './modules/driver-tracking/driver-tracking.module';
import { ContactModule } from './modules/contact/contact.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PricingModule,
    BookingsModule,
    VehiclesModule,
    FamousPlacesModule,
    PaymentsModule,
    ReceiptsModule,
    DriverTrackingModule,
    ContactModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
