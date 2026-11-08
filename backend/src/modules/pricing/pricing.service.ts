import { Injectable, BadRequestException } from '@nestjs/common';
import {
  TransferType,
  VehicleCategory,
  CalculatePriceDto,
  PricingBreakdown,
  PRICING_CONFIG,
} from '../../shared';

@Injectable()
export class PricingService {
  // Common Barcelona metropolitan municipalities
  private readonly METROPOLITAN_MUNICIPALITIES = [
    'barcelona',
    'hospitalet',
    'badalona',
    'santa coloma',
    'cornella',
    'sant boi',
    'el prat',
    'viladecans',
    'castelldefels',
    'gava',
    'esplugues',
    'sant just desvern',
    'sant joan despi',
    'sant feliu de llobregat',
    'montcada',
    'cerdanyola',
    'ripollet',
    'sant cugat',
  ];

  public isMetropolitan(address: string): boolean {
    if (!address) return true;
    const lower = address.toLowerCase();
    // Check postal codes for Barcelona metropolitan (080xx, 089xx, 088xx)
    if (/080\d{2}|089\d{2}|088\d{2}/.test(lower)) {
      return true;
    }
    return this.METROPOLITAN_MUNICIPALITIES.some((muni) => lower.includes(muni));
  }

  public calculatePrice(dto: CalculatePriceDto): PricingBreakdown {
    const {
      transferType,
      vehicleCategory,
      distanceKm = 15,
      durationHours = 3,
      passengers = 1,
      pickupAddress,
      destinationAddress = '',
    } = dto;

    const isMetro =
      dto.isMetropolitan !== undefined
        ? dto.isMetropolitan
        : this.isMetropolitan(destinationAddress || pickupAddress);

    // If large group, it requires a custom quote
    if (vehicleCategory === VehicleCategory.LARGE_GROUP || passengers > 8) {
      return {
        transferType,
        vehicleCategory,
        distanceKm,
        durationHours,
        isMetropolitanArea: isMetro,
        baseFare: 0,
        vehicleSurcharge: 0,
        additionalCharges: 0,
        totalFare: 0,
        currency: 'EUR',
        requiresAdminApproval: true,
        isCustomQuote: true,
        pricingRuleApplied: 'Large Group Transfers (>8 pax) Custom Quote Protocol',
        freeWaitingTimeMinutes: 30,
      };
    }

    let baseFare = 0;
    let vehicleSurcharge = 0;
    let requiresAdminApproval = false;
    let pricingRuleApplied = '';
    let freeWaitingTimeMinutes = 15;

    switch (transferType) {
      case TransferType.AIRPORT: {
        freeWaitingTimeMinutes = PRICING_CONFIG.AIRPORT.FREE_WAITING_MINS; // 60 mins
        const perKmRate = isMetro
          ? PRICING_CONFIG.AIRPORT.METROPOLITAN_PER_KM // 3.00/km
          : PRICING_CONFIG.AIRPORT.OUTSIDE_METROPOLITAN_PER_KM; // 2.50/km

        baseFare = Math.round(distanceKm * perKmRate * 100) / 100;
        // Minimum airport fare threshold
        if (baseFare < 35) {
          baseFare = 35.0;
        }

        vehicleSurcharge = PRICING_CONFIG.CATEGORY_SURCHARGES[vehicleCategory] || 0;
        pricingRuleApplied = isMetro
          ? `Airport to Barcelona Metropolitan Area (€${perKmRate.toFixed(2)}/km)`
          : `Airport to Outside Metropolitan Area (€${perKmRate.toFixed(2)}/km)`;
        break;
      }

      case TransferType.CRUISE_PORT: {
        freeWaitingTimeMinutes = PRICING_CONFIG.CRUISE_PORT.FREE_WAITING_MINS; // 30 mins
        requiresAdminApproval = true; // Section 9: Cruise Port bookings created with PENDING_APPROVAL

        const isVan =
          passengers > 4 ||
          vehicleCategory === VehicleCategory.STANDARD_VAN ||
          vehicleCategory === VehicleCategory.PREMIUM_VAN;

        if (isVan) {
          // Van fixed fare: €70. No automatic surcharge stacking on fixed fare
          baseFare = PRICING_CONFIG.CRUISE_PORT.VAN_FIXED;
          vehicleSurcharge = 0;
          pricingRuleApplied = 'Cruise Port to City Centre - Fixed Fare Van (Up to 8 pax)';
        } else {
          // Sedan base fare: €42. Surcharges apply
          baseFare = PRICING_CONFIG.CRUISE_PORT.SEDAN_BASE;
          vehicleSurcharge = PRICING_CONFIG.CATEGORY_SURCHARGES[vehicleCategory] || 0;
          pricingRuleApplied = 'Cruise Port to City Centre - Sedan Base Fare (€42)';
        }
        break;
      }

      case TransferType.SANTS_STATION: {
        freeWaitingTimeMinutes = PRICING_CONFIG.SANTS_STATION.FREE_WAITING_MINS; // 15 mins
        requiresAdminApproval = true; // Section 9: Sants Train Station created with PENDING_APPROVAL

        const isVan =
          passengers > 4 ||
          vehicleCategory === VehicleCategory.STANDARD_VAN ||
          vehicleCategory === VehicleCategory.PREMIUM_VAN;

        if (isVan) {
          // Van fixed fare: €45. No automatic surcharge stacking
          baseFare = PRICING_CONFIG.SANTS_STATION.VAN_FIXED;
          vehicleSurcharge = 0;
          pricingRuleApplied = 'Sants Train Station to City Centre - Fixed Fare Van (Up to 8 pax)';
        } else {
          // Sedan base fare: €32. Surcharges apply
          baseFare = PRICING_CONFIG.SANTS_STATION.SEDAN_BASE;
          vehicleSurcharge = PRICING_CONFIG.CATEGORY_SURCHARGES[vehicleCategory] || 0;
          pricingRuleApplied = 'Sants Station to City Centre - Sedan Base Fare (€32)';
        }
        break;
      }

      case TransferType.CITY_TOUR: {
        freeWaitingTimeMinutes = PRICING_CONFIG.CITY_TOUR.FREE_WAITING_MINS;
        if (!isMetro) {
          return {
            transferType,
            vehicleCategory,
            distanceKm,
            durationHours,
            isMetropolitanArea: false,
            baseFare: 0,
            vehicleSurcharge: 0,
            additionalCharges: 0,
            totalFare: 0,
            currency: 'EUR',
            requiresAdminApproval: true,
            isCustomQuote: true,
            pricingRuleApplied: 'City Tour Outside Metropolitan Area requires Custom Quote',
            freeWaitingTimeMinutes: 15,
          };
        }

        const hours = Math.max(2, durationHours);
        baseFare = hours * PRICING_CONFIG.CITY_TOUR.HOURLY_RATE_METROPOLITAN; // €65/hr
        vehicleSurcharge = (PRICING_CONFIG.CATEGORY_SURCHARGES[vehicleCategory] || 0) * (hours / 3);
        vehicleSurcharge = Math.round(vehicleSurcharge * 100) / 100;
        pricingRuleApplied = `Barcelona City Tour - €${PRICING_CONFIG.CITY_TOUR.HOURLY_RATE_METROPOLITAN}/hr (Min 2 hrs)`;
        break;
      }

      case TransferType.CITY_TRANSFER:
      default: {
        freeWaitingTimeMinutes = PRICING_CONFIG.CITY_TRANSFER.FREE_WAITING_MINS;
        baseFare = Math.round((PRICING_CONFIG.CITY_TRANSFER.BASE_FARE + distanceKm * PRICING_CONFIG.CITY_TRANSFER.PER_KM_RATE) * 100) / 100;
        vehicleSurcharge = PRICING_CONFIG.CATEGORY_SURCHARGES[vehicleCategory] || 0;
        pricingRuleApplied = 'Barcelona Point-to-Point City Transfer';
        break;
      }
    }

    const totalFare = Math.round((baseFare + vehicleSurcharge) * 100) / 100;

    return {
      transferType,
      vehicleCategory,
      distanceKm,
      durationHours,
      isMetropolitanArea: isMetro,
      baseFare,
      vehicleSurcharge,
      additionalCharges: 0,
      totalFare,
      currency: 'EUR',
      requiresAdminApproval,
      isCustomQuote: false,
      pricingRuleApplied,
      freeWaitingTimeMinutes,
    };
  }
}

