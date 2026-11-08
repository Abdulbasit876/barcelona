import { Injectable, NotFoundException } from '@nestjs/common';
import { FamousPlace } from '../../shared';
import { SEED_FAMOUS_PLACES } from '../../common/data/seed-data';

@Injectable()
export class FamousPlacesService {
  private places: FamousPlace[] = SEED_FAMOUS_PLACES;

  public getAll(category?: string, search?: string): FamousPlace[] {
    let result = this.places;
    if (category && category !== 'All' && category !== 'all') {
      result = result.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase(),
      );
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.en.toLowerCase().includes(q) ||
          p.name.es.toLowerCase().includes(q) ||
          p.name.fr.toLowerCase().includes(q) ||
          p.name.it.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q),
      );
    }
    return result;
  }

  public getBySlug(slug: string): FamousPlace {
    const place = this.places.find((p) => p.slug === slug);
    if (!place) {
      throw new NotFoundException(`Attraction with slug ${slug} not found.`);
    }
    return place;
  }
}

