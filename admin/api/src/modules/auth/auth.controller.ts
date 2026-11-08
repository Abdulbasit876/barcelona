import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CreateAdminDto, LoginDto, RefreshTokenDto, ResetPasswordDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Admin Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in as an Administrator with Supabase Auth' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh authentication token using refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshSession(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out administrator session' })
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user);
  }

  @Get('me')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in admin user profile' })
  async me(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Send admin password reset link to email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email);
  }

  @Post('create-admin')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new admin or dispatcher account (Super Admin only)' })
  async createAdmin(@Body() dto: CreateAdminDto, @CurrentUser() user: any) {
    return this.authService.createAdmin(dto, user);
  }

  @Get('admins')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all administrator and dispatcher accounts' })
  async listAdmins() {
    return this.authService.listAdmins();
  }
}
