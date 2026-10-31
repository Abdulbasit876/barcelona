import { Injectable, NotFoundException } from '@nestjs/common';
import { VehicleDefinition, VehicleCategory } from '@barcelona/shared';
import { SEED_VEHICLES } from '../../common/data/seed-data';

@Injectable()
export class VehiclesService {
  private vehicles: VehicleDefinition[] = SEED_VEHICLES;

  public getAll(): VehicleDefinition[] {
    return this.vehicles;
  }

  public getByCategory(category: VehicleCategory): VehicleDefinition {
    const vehicle = this.vehicles.find((v) => v.category === category);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle category ${category} not found.`);
    }
    return vehicle;
  }

  public getEligibleVehicles(passengers: number, luggage: number): VehicleDefinition[] {
    return this.vehicles.filter((v) => {
      if (v.category === VehicleCategory.LARGE_GROUP) return true;
      return v.maxPassengers >= passengers && v.maxLuggage >= luggage;
    });
  }
}
