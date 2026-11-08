import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDriverDto {
  @ApiProperty({ example: 'Carlos Mendoza' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+34 632 41 50 48' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'carlos.mendoza@barcelonataxitransfer.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '1234-XYZ' })
  @IsString()
  @IsNotEmpty()
  vehiclePlate!: string;

  @ApiProperty({ example: 'Mercedes-Benz E 220' })
  @IsString()
  @IsNotEmpty()
  vehicleModel!: string;

  @ApiPropertyOptional({ example: ['ECONOMY', 'STANDARD', 'PREMIUM'] })
  @IsOptional()
  @IsArray()
  assignedCategories?: string[];

  @ApiPropertyOptional({ example: 'B-12345678' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'DriverPass123!' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class ResetDriverPasswordDto {
  @ApiPropertyOptional({ example: 'NewDriverPass123!' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateDriverDto {
  @ApiPropertyOptional({ example: 'Carlos Mendoza' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+34 632 41 50 48' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1234-XYZ' })
  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @ApiPropertyOptional({ example: 'Mercedes-Benz E 220' })
  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @ApiPropertyOptional({ example: ['ECONOMY', 'STANDARD', 'PREMIUM'] })
  @IsOptional()
  @IsArray()
  assignedCategories?: string[];

  @ApiPropertyOptional({ example: 'B-12345678' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 'AVAILABLE', enum: ['AVAILABLE', 'ON_TRIP', 'BREAK', 'OFFLINE'] })
  @IsOptional()
  @IsString()
  currentStatus?: string;
}

