import { Module } from '@nestjs/common';
import { FamousPlacesService } from './famous-places.service';
import { FamousPlacesController } from './famous-places.controller';

@Module({
  controllers: [FamousPlacesController],
  providers: [FamousPlacesService],
  exports: [FamousPlacesService],
})
export class FamousPlacesModule {}

