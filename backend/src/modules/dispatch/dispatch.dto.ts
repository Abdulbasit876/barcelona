import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignDriverDto {
  @ApiProperty({ description: 'Booking UUID' })
  @IsUUID()
  @IsNotEmpty()
  bookingId!: string;

  @ApiProperty({ description: 'Driver UUID' })
  @IsUUID()
  @IsNotEmpty()
  driverId!: string;

  @ApiPropertyOptional({ description: 'Optional dispatcher notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UnassignDriverDto {
  @ApiProperty({ description: 'Booking UUID' })
  @IsUUID()
  @IsNotEmpty()
  bookingId!: string;

  @ApiPropertyOptional({ description: 'Reason for unassigning driver' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateAssignmentRuleDto {
  @ApiProperty({ example: 'ECONOMY', description: 'Vehicle category code' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ description: 'Driver UUID' })
  @IsUUID()
  @IsNotEmpty()
  driverId!: string;

  @ApiPropertyOptional({ example: 1, description: 'Priority order (1 = highest)' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

