import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FamousPlacesService } from './famous-places.service';

@ApiTags('famous-places')
@Controller('famous-places')
export class FamousPlacesController {
  constructor(private readonly famousPlacesService: FamousPlacesService) {}

  @Get()
  @ApiOperation({ summary: 'List Barcelona attractions with category and keyword search' })
  getAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return {
      success: true,
      data: this.famousPlacesService.getAll(category, search),
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get attraction details by slug' })
  getBySlug(@Param('slug') slug: string) {
    return {
      success: true,
      data: this.famousPlacesService.getBySlug(slug),
    };
  }
}

