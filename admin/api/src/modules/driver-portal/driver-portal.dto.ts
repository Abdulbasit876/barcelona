import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRideStatusDto {
  @ApiProperty({
    example: 'ON_ROUTE',
    enum: ['ACCEPTED', 'ON_ROUTE', 'ON_THE_WAY', 'ARRIVED_AT_PICKUP', 'PICKED_RIDE', 'PASSENGER_ON_BOARD', 'COMPLETED'],
  })
  @IsString()
  @IsIn(['ACCEPTED', 'ON_ROUTE', 'ON_THE_WAY', 'ARRIVED_AT_PICKUP', 'PICKED_RIDE', 'PASSENGER_ON_BOARD', 'COMPLETED'])
  status!: 'ACCEPTED' | 'ON_ROUTE' | 'ON_THE_WAY' | 'ARRIVED_AT_PICKUP' | 'PICKED_RIDE' | 'PASSENGER_ON_BOARD' | 'COMPLETED';

  @ApiPropertyOptional({ example: 'Passenger safely on board' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReportWaitingTimeDto {
  @ApiProperty({ example: 30, description: 'Total minutes driver waited past flight arrival' })
  @IsInt()
  @Min(1)
  waitedMinutes!: number;

  @ApiPropertyOptional({ example: 'Flight landed at 14:00, passenger exited at 15:00' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DriverLocationDto {
  @ApiPropertyOptional({ description: 'Active booking UUID if currently on a trip' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty({ example: 41.3879 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 2.1699 })
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  speedKmh?: number;
}

export class DriverAvailabilityDto {
  @ApiProperty({ example: 'AVAILABLE', enum: ['AVAILABLE', 'ON_TRIP', 'BREAK', 'OFFLINE'] })
  @IsString()
  @IsIn(['AVAILABLE', 'ON_TRIP', 'BREAK', 'OFFLINE'])
  status!: 'AVAILABLE' | 'ON_TRIP' | 'BREAK' | 'OFFLINE';
}
