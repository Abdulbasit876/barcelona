import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller(['api/v1/settings', 'settings'])
export class SettingsPublicController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get public settings (deposit %) - no auth required' })
  async getPublicSettings() {
    const depositConfig = await this.settingsService.getDepositConfig();
    return {
      deposit_percentage: depositConfig.deposit_percentage,
      minimum_deposit_eur: depositConfig.minimum_deposit_eur,
      allow_cash_balance: depositConfig.allow_cash_balance,
    };
  }
}

