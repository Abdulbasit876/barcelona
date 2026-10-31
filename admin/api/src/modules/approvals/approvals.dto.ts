import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ReviseBookingFareDto {
  @ApiProperty({ example: 85.0, description: 'Revised total fare in EUR' })
  @IsNumber()
  @IsPositive()
  revisedFare!: number;

  @ApiProperty({ example: 'Additional luggage capacity requested / Pier special access fee' })
  @IsString()
  @IsNotEmpty()
  revisionReason!: string;

  @ApiPropertyOptional({ example: 'Standard Van with cruise terminal meet & greet' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectBookingDto {
  @ApiProperty({ example: 'No vehicles available for this specific time slot' })
  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;
}
