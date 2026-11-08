import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { VehicleCategory } from '../../shared';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List all available fleet vehicles' })
  getAll() {
    return {
      success: true,
      data: this.vehiclesService.getAll(),
    };
  }

  @Get('eligible')
  @ApiOperation({ summary: 'Find eligible vehicles based on passenger and luggage limits' })
  getEligible(
    @Query('passengers') passengers = '1',
    @Query('luggage') luggage = '1',
  ) {
    return {
      success: true,
      data: this.vehiclesService.getEligibleVehicles(
        parseInt(passengers, 10),
        parseInt(luggage, 10),
      ),
    };
  }

  @Get(':category')
  @ApiOperation({ summary: 'Get vehicle category details' })
  getByCategory(@Param('category') category: VehicleCategory) {
    return {
      success: true,
      data: this.vehiclesService.getByCategory(category),
    };
  }
}

