import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AdminCreateBookingDto {
  @ApiProperty({ example: 'AIRPORT', enum: ['AIRPORT', 'CRUISE_PORT', 'SANTS_STATION', 'CITY_TRANSFER', 'CITY_TOUR', 'GROUP_TRANSFER', 'CUSTOM_QUOTE'] })
  @IsString()
  @IsNotEmpty()
  transferType!: string;

  @ApiProperty({ example: 'PREMIUM' })
  @IsString()
  @IsNotEmpty()
  vehicleCategory!: string;

  @ApiProperty({ example: 'Josep Tarradellas Barcelona-El Prat Airport, Terminal 1' })
  @IsString()
  @IsNotEmpty()
  pickupAddress!: string;

  @ApiProperty({ example: 'Hotel Arts Barcelona, Carrer de la Marina 19, 08005 Barcelona' })
  @IsString()
  @IsNotEmpty()
  destinationAddress!: string;

  @ApiProperty({ example: '2026-11-15T10:00:00Z' })
  @IsString()
  @IsNotEmpty()
  pickupDatetime!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  customerEmail!: string;

  @ApiProperty({ example: '+34 612 345 678' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiProperty({ example: 2, default: 1 })
  @IsInt()
  @Min(1)
  passengers!: number;

  @ApiProperty({ example: 2, default: 1 })
  @IsInt()
  @Min(0)
  luggage!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cabinLuggage?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  childSeats?: number;

  @ApiPropertyOptional({ example: 'IB3802' })
  @IsOptional()
  @IsString()
  flightOrTrainNumber?: string;

  @ApiPropertyOptional({ example: 'Allure of the Seas' })
  @IsOptional()
  @IsString()
  cruiseShipName?: string;

  @ApiPropertyOptional({ example: 'Meet at arrival gate with name board' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ example: 65.0, description: 'Explicit total fare override if desired' })
  @IsOptional()
  @IsNumber()
  totalFare?: number;

  @ApiPropertyOptional({ example: 20.0, description: 'Deposit percentage (default 20%)' })
  @IsOptional()
  @IsNumber()
  depositPercentage?: number;

  @ApiPropertyOptional({ example: 'ONLINE_DEPOSIT', enum: ['FULL_ONLINE', 'ONLINE_DEPOSIT', 'CASH_TO_DRIVER'] })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class AdminUpdateBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupDatetime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  passengers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  luggage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  cabinLuggage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  childSeats?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flightOrTrainNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverNotes?: string;

  @ApiPropertyOptional({ enum: ['PENDING_APPROVAL', 'APPROVED', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'] })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  depositPaid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  balancePaid?: boolean;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Flight cancelled by airline' })
  @IsOptional()
  @IsString()
  reason?: string;
}

