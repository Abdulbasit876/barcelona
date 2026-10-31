import { Module } from '@nestjs/common';
import { FamousPlacesController } from './famous-places.controller';
import { FamousPlacesService } from './famous-places.service';

@Module({
  controllers: [FamousPlacesController],
  providers: [FamousPlacesService],
  exports: [FamousPlacesService],
})
export class FamousPlacesModule {}
