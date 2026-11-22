import { Injectable, BadRequestException, Optional, OnModuleInit } from '@nestjs/common';
import {
  TransferType,
  VehicleCategory,
  CalculatePriceDto,
  PricingBreakdown,
  PRICING_CONFIG,
  classifyBarcelonaZone,
  BarcelonaZone,
} from '../../shared';
import { SettingsService, PricingRulesConfig } from '../settings/settings.service';

@Injectable()
export class PricingService implements OnModuleInit {
  constructor(@Optional() private readonly settingsService?: SettingsService) {}

  async onModuleInit() {
    if (this.settingsService) {
      try {
        await this.settingsService.getPricingRules();
      } catch (err) {
        console.warn('Failed to pre-warm pricing rules cache on startup:', err);
      }
    }
  }

  public isMetropolitan(address: string): boolean {
    if (!address) return true;
    return classifyBarcelonaZone(address) === 'RED_ZONE';
  }

  public calculatePrice(dto: CalculatePriceDto): PricingBreakdown {
    const {
      transferType,
      vehicleCategory,
      distanceKm = 15,
      durationHours = 3,
      passengers = 1,
      pickupAddress = '',
      destinationAddress = '',
    } = dto;

    const activeRules = this.settingsService?.getPricingRulesSync();

    const getVehicleSurcharge = (cat: VehicleCategory): number => {
      if (!activeRules) return PRICING_CONFIG.CATEGORY_SURCHARGES[cat] || 0;
      switch (cat) {
        case VehicleCategory.ECONOMY:
          return activeRules.surcharge_economy ?? 0;
        case VehicleCategory.STANDARD:
          return activeRules.surcharge_standard ?? 5;
        case VehicleCategory.PREMIUM:
          return activeRules.surcharge_premium ?? 10;
        case VehicleCategory.STANDARD_VAN:
          return activeRules.surcharge_standard_van ?? 15;
        case VehicleCategory.PREMIUM_VAN:
          return activeRules.surcharge_premium_van ?? 22.5;
        case VehicleCategory.ELECTRIC:
          return activeRules.surcharge_electric ?? 12;
        default:
          return PRICING_CONFIG.CATEGORY_SURCHARGES[cat] || 0;
      }
    };

    const pickupZone = classifyBarcelonaZone(pickupAddress);
    const destZone = classifyBarcelonaZone(destinationAddress);

    const isMetro =
      dto.isMetropolitan !== undefined
        ? dto.isMetropolitan
        : (pickupZone === 'RED_ZONE' && destZone === 'RED_ZONE');

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
        freeWaitingTimeMinutes = activeRules?.free_waiting_mins_airport ?? PRICING_CONFIG.AIRPORT.FREE_WAITING_MINS; // 60 mins

        const redZoneRate = activeRules?.airport_metropolitan_km_rate ?? PRICING_CONFIG.AIRPORT.METROPOLITAN_PER_KM;
        const outsideRate = activeRules?.airport_outside_km_rate ?? PRICING_CONFIG.AIRPORT.OUTSIDE_METROPOLITAN_PER_KM;

        let perKmRate = outsideRate;

        if (pickupZone === 'RED_ZONE' && destZone === 'RED_ZONE') {
          // 1. Within Barcelona City (Red Zone)
          perKmRate = redZoneRate;
          pricingRuleApplied = `Airport Transfer - Within Barcelona (Red Zone) (€${perKmRate.toFixed(2)}/km)`;
        } else if (
          (pickupZone === 'RED_ZONE' && destZone === 'OUTSIDE_ZONE') ||
          (pickupZone === 'OUTSIDE_ZONE' && destZone === 'RED_ZONE')
        ) {
          // 2. Barcelona (Red Zone) ⇄ Outside Barcelona (Yellow/Green Zones) in both directions
          perKmRate = outsideRate;
          pricingRuleApplied = `Airport Transfer - Barcelona (Red Zone) ⇄ Outside (Yellow/Green Zones) (€${perKmRate.toFixed(2)}/km)`;
        } else if (pickupZone === 'OUTSIDE_ZONE' && destZone === 'OUTSIDE_ZONE') {
          // 3. Outside Barcelona ⇄ Outside Barcelona
          perKmRate = outsideRate;
          pricingRuleApplied = `Airport Transfer - Outside Metropolitan (Yellow/Green Zones) (€${perKmRate.toFixed(2)}/km)`;
        } else {
          // Ambiguous / Unverified Zone: Flag for admin review
          requiresAdminApproval = true;
          perKmRate = outsideRate;
          pricingRuleApplied = `Airport Transfer - Unverified Zone Flagged for Review (€${perKmRate.toFixed(2)}/km)`;
        }

        // Fare Calculation: Final Fare = Maximum of (Min Fare, Distance × Applicable Rate)
        const minimumAirportFare = activeRules?.airport_minimum_fare ?? (PRICING_CONFIG.AIRPORT.MINIMUM_FARE || 35.0);
        baseFare = Math.max(minimumAirportFare, Math.round(distanceKm * perKmRate * 100) / 100);

        vehicleSurcharge = getVehicleSurcharge(vehicleCategory);
        break;
      }

      case TransferType.CRUISE_PORT: {
        freeWaitingTimeMinutes = activeRules?.free_waiting_mins_port ?? PRICING_CONFIG.CRUISE_PORT.FREE_WAITING_MINS;
        requiresAdminApproval = true;

        const isVan =
          passengers > 4 ||
          vehicleCategory === VehicleCategory.STANDARD_VAN ||
          vehicleCategory === VehicleCategory.PREMIUM_VAN;

        if (isVan) {
          baseFare = activeRules?.cruise_port_van_fixed ?? PRICING_CONFIG.CRUISE_PORT.VAN_FIXED;
          vehicleSurcharge = 0;
          pricingRuleApplied = `Cruise Port to City Centre - Fixed Fare Van (€${baseFare})`;
        } else {
          baseFare = activeRules?.cruise_port_sedan_base ?? PRICING_CONFIG.CRUISE_PORT.SEDAN_BASE;
          vehicleSurcharge = getVehicleSurcharge(vehicleCategory);
          pricingRuleApplied = `Cruise Port to City Centre - Sedan Base Fare (€${baseFare})`;
        }
        break;
      }

      case TransferType.SANTS_STATION: {
        freeWaitingTimeMinutes = activeRules?.free_waiting_mins_sants ?? PRICING_CONFIG.SANTS_STATION.FREE_WAITING_MINS;
        requiresAdminApproval = true;

        const isVan =
          passengers > 4 ||
          vehicleCategory === VehicleCategory.STANDARD_VAN ||
          vehicleCategory === VehicleCategory.PREMIUM_VAN;

        if (isVan) {
          baseFare = activeRules?.sants_station_van_fixed ?? PRICING_CONFIG.SANTS_STATION.VAN_FIXED;
          vehicleSurcharge = 0;
          pricingRuleApplied = `Sants Train Station to City Centre - Fixed Fare Van (€${baseFare})`;
        } else {
          baseFare = activeRules?.sants_station_sedan_base ?? PRICING_CONFIG.SANTS_STATION.SEDAN_BASE;
          vehicleSurcharge = getVehicleSurcharge(vehicleCategory);
          pricingRuleApplied = `Sants Station to City Centre - Sedan Base Fare (€${baseFare})`;
        }
        break;
      }

      case TransferType.CITY_TOUR: {
        freeWaitingTimeMinutes = activeRules?.free_waiting_mins_tour ?? PRICING_CONFIG.CITY_TOUR.FREE_WAITING_MINS;
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

        const minHours = activeRules?.city_tour_min_hours ?? 2;
        const hourlyRate = activeRules?.city_tour_hourly_rate ?? PRICING_CONFIG.CITY_TOUR.HOURLY_RATE_METROPOLITAN;
        const hours = Math.max(minHours, durationHours);
        baseFare = hours * hourlyRate;
        vehicleSurcharge = (getVehicleSurcharge(vehicleCategory)) * (hours / 3);
        vehicleSurcharge = Math.round(vehicleSurcharge * 100) / 100;
        pricingRuleApplied = `Barcelona City Tour - €${hourlyRate}/hr (Min ${minHours} hrs)`;
        break;
      }

      case TransferType.CITY_TRANSFER:
      default: {
        freeWaitingTimeMinutes = activeRules?.free_waiting_mins_standard ?? PRICING_CONFIG.CITY_TRANSFER.FREE_WAITING_MINS;
        const threshold = activeRules?.city_base_threshold_km ?? (PRICING_CONFIG.CITY_TRANSFER.BASE_KM_THRESHOLD || 2.5);
        const baseRate = activeRules?.city_base_fare ?? (PRICING_CONFIG.CITY_TRANSFER.BASE_FARE || 25.0);
        const perKmRate = activeRules?.city_per_km_rate ?? (PRICING_CONFIG.CITY_TRANSFER.PER_KM_RATE || 3.0);
        if (distanceKm <= threshold) {
          baseFare = baseRate;
        } else {
          baseFare = Math.round((baseRate + (distanceKm - threshold) * perKmRate) * 100) / 100;
        }
        vehicleSurcharge = getVehicleSurcharge(vehicleCategory);
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

