import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CalculatePriceDto, PricingBreakdown, PRICING_CONFIG } from '@barcelona/shared';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate accurate trip fare according to official Barcelona rules' })
  @ApiResponse({ status: 200, description: 'Calculated fare breakdown' })
  calculatePrice(@Body() dto: CalculatePriceDto): PricingBreakdown {
    return this.pricingService.calculatePrice(dto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get current pricing configurations and surcharges' })
  getRules() {
    return {
      success: true,
      data: PRICING_CONFIG,
    };
  }
}
