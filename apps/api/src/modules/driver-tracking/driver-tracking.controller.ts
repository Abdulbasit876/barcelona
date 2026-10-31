import { Controller, Get, Post, Body, Param, Query, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { DriverTrackingService } from './driver-tracking.service';
import { DriverLocationUpdate } from '@barcelona/shared';

@ApiTags('driver-tracking')
@Controller('driver-tracking')
export class DriverTrackingController {
  constructor(private readonly trackingService: DriverTrackingService) {}

  @Get(':reference/status')
  @ApiOperation({ summary: 'Get current authorized driver status and coordinates' })
  getStatus(
    @Param('reference') reference: string,
    @Query('token') token: string,
  ) {
    return this.trackingService.getCurrentDriverLocation(reference, token);
  }

  @Sse(':reference/live-stream')
  @ApiOperation({ summary: 'Subscribe to real-time Server-Sent Events (SSE) driver GPS updates' })
  liveStream(
    @Param('reference') reference: string,
    @Query('token') token: string,
  ): Observable<MessageEvent> {
    return this.trackingService.getTrackingStream(reference, token) as any;
  }

  @Post('update-location')
  @ApiOperation({ summary: 'Driver mobile app pushes real-time GPS coordinates' })
  updateLocation(@Body() update: DriverLocationUpdate) {
    this.trackingService.pushDriverLocation(update);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
