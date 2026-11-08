import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { FinancialsService } from './financials.service';

@ApiTags('Financial & Operational Analytics')
@Controller(['api/v1/financials', 'financials'])
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Executive summary metrics (gross value, payments, balances, margins)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialsService.getOverview(startDate, endDate);
  }

  @Get('revenue-trends')
  @ApiOperation({ summary: 'Daily/weekly revenue trends over time' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  async getRevenueTrends(@Query('days') days?: number) {
    return this.financialsService.getRevenueTrends(days ? Number(days) : 30);
  }

  @Get('category-performance')
  @ApiOperation({ summary: 'Vehicle category distribution and financial performance' })
  async getCategoryPerformance() {
    return this.financialsService.getCategoryPerformance();
  }

  @Get('driver-earnings')
  @ApiOperation({ summary: 'Driver performance, total trips, and collected cash balances' })
  async getDriverEarnings() {
    return this.financialsService.getDriverEarnings();
  }
}

