import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import {
  DepositConfig,
  DispatchConfig,
  PricingRulesConfig,
  SettingsService,
} from './settings.service';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings (deposit, pricing, dispatch)' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Patch('deposit')
  @ApiOperation({ summary: 'Update global deposit percentage and cash balance settings' })
  async updateDepositConfig(@Body() body: Partial<DepositConfig>) {
    return this.settingsService.updateDepositConfig(body);
  }

  @Get('category-drivers/:category')
  @ApiOperation({ summary: 'Get assigned driver IDs for a vehicle category' })
  async getCategoryDriverIds(@Param('category') category: string) {
    const driverIds = await this.settingsService.getCategoryDriverIds(category);
    return { driverIds };
  }

  @Post('category-drivers/:category')
  @ApiOperation({ summary: 'Set assigned driver IDs for a vehicle category' })
  async setCategoryDriverIds(
    @Param('category') category: string,
    @Body() body: { driverIds: string[] },
  ) {
    return this.settingsService.setCategoryDriverIds(category, body.driverIds || []);
  }

  @Patch('pricing')
  @ApiOperation({ summary: 'Update Barcelona pricing rules (city rates, child seats, etc.)' })
  async updatePricingRules(@Body() body: Partial<PricingRulesConfig>) {
    return this.settingsService.updatePricingRules(body);
  }

  @Patch('dispatch')
  @ApiOperation({ summary: 'Update dispatch mode and auto-assign preferences' })
  async updateDispatchConfig(@Body() body: Partial<DispatchConfig>) {
    return this.settingsService.updateDispatchConfig(body);
  }
}
