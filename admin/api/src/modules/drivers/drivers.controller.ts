import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CreateDriverDto, UpdateDriverDto } from './drivers.dto';
import { DriversService } from './drivers.service';

@ApiTags('Drivers')
@Controller('drivers')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'List all drivers with active rides and availability status' })
  async listDrivers() {
    return this.driversService.listDrivers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver profile with recent ride history' })
  async getDriver(@Param('id') id: string) {
    return this.driversService.getDriverById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new driver to the Barcelona fleet' })
  async createDriver(@Body() dto: CreateDriverDto) {
    return this.driversService.createDriver(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update driver profile, vehicle details, or active status' })
  async updateDriver(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.updateDriver(id, dto);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset driver portal login password' })
  async resetDriverPassword(@Param('id') id: string) {
    return this.driversService.resetDriverPassword(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate driver' })
  async deleteDriver(@Param('id') id: string) {
    return this.driversService.deleteDriver(id);
  }
}
