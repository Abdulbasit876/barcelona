import { Module } from '@nestjs/common';
import { DriverTrackingController } from './driver-tracking.controller';
import { DriverTrackingService } from './driver-tracking.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [BookingsModule],
  controllers: [DriverTrackingController],
  providers: [DriverTrackingService],
  exports: [DriverTrackingService],
})
export class DriverTrackingModule {}
