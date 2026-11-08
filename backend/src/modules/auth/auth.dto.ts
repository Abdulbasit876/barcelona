import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@barcelonataxitransfer.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Supabase refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'admin@barcelonataxitransfer.com' })
  @IsEmail()
  email!: string;
}

export class CreateAdminDto {
  @ApiProperty({ example: 'dispatcher@barcelonataxitransfer.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'TempPassword123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Alex Dispatcher' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'ADMIN', enum: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER'] })
  @IsString()
  role!: 'SUPER_ADMIN' | 'ADMIN' | 'DISPATCHER';

  @ApiProperty({ example: '+34632415048', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

