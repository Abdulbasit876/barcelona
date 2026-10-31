import { PricingService } from '../src/modules/pricing/pricing.service';
import { TransferType, VehicleCategory } from '@barcelona/shared';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  describe('Metropolitan area detection', () => {
    it('should identify Barcelona city center as metropolitan', () => {
      expect(service.isMetropolitan('Passeig de Gràcia, 43, 08007 Barcelona')).toBe(true);
      expect(service.isMetropolitan('L\'Hospitalet de Llobregat')).toBe(true);
      expect(service.isMetropolitan('Badalona')).toBe(true);
    });

    it('should identify distant towns as outside metropolitan area', () => {
      expect(service.isMetropolitan('Girona City Centre, 17001')).toBe(false);
      expect(service.isMetropolitan('Tarragona Port')).toBe(false);
      expect(service.isMetropolitan('Lloret de Mar, Costa Brava')).toBe(false);
    });
  });

  describe('Airport Transfer Pricing', () => {
    it('should calculate airport to metropolitan destination at €3.00 per km plus category surcharge', () => {
      const result = service.calculatePrice({
        transferType: TransferType.AIRPORT,
        vehicleCategory: VehicleCategory.STANDARD,
        pickupAddress: 'Barcelona Airport Terminal 1',
        destinationAddress: 'Hotel Arts, Barcelona',
        distanceKm: 20,
        isMetropolitan: true,
        passengers: 2,
        luggage: 2,
      });

      // 20 km * 3.00 = €60.00 base fare. Standard surcharge = +€5.00 => Total = €65.00
      expect(result.baseFare).toBe(60.0);
      expect(result.vehicleSurcharge).toBe(5.0);
      expect(result.totalFare).toBe(65.0);
      expect(result.freeWaitingTimeMinutes).toBe(60);
      expect(result.requiresAdminApproval).toBe(false);
    });

    it('should calculate airport to outside metropolitan area at €2.50 per km', () => {
      const result = service.calculatePrice({
        transferType: TransferType.AIRPORT,
        vehicleCategory: VehicleCategory.PREMIUM,
        pickupAddress: 'Barcelona Airport Terminal 1',
        destinationAddress: 'Girona Historic District',
        distanceKm: 100,
        isMetropolitan: false,
        passengers: 2,
        luggage: 2,
      });

      // 100 km * 2.50 = €250.00 base fare. Premium surcharge = +€10.00 => Total = €260.00
      expect(result.baseFare).toBe(250.0);
      expect(result.vehicleSurcharge).toBe(10.0);
      expect(result.totalFare).toBe(260.0);
      expect(result.freeWaitingTimeMinutes).toBe(60);
    });
  });

  describe('Cruise Port Pricing Rules', () => {
    it('should apply Sedan base fare €42 plus category surcharge for <= 4 passengers', () => {
      const result = service.calculatePrice({
        transferType: TransferType.CRUISE_PORT,
        vehicleCategory: VehicleCategory.STANDARD,
        pickupAddress: 'Barcelona Cruise Port Pier A',
        destinationAddress: 'Plaça Catalunya, Barcelona',
        passengers: 3,
        luggage: 3,
      });

      expect(result.baseFare).toBe(42.0);
      expect(result.vehicleSurcharge).toBe(5.0);
      expect(result.totalFare).toBe(47.0);
      expect(result.freeWaitingTimeMinutes).toBe(30);
      expect(result.requiresAdminApproval).toBe(true);
    });

    it('should apply fixed fare of €70 for van journeys without stacking generic surcharges', () => {
      const result = service.calculatePrice({
        transferType: TransferType.CRUISE_PORT,
        vehicleCategory: VehicleCategory.STANDARD_VAN,
        pickupAddress: 'Barcelona Cruise Port Pier A',
        destinationAddress: 'Plaça Catalunya, Barcelona',
        passengers: 6,
        luggage: 6,
      });

      expect(result.baseFare).toBe(70.0);
      expect(result.vehicleSurcharge).toBe(0.0); // No double-charging or stacking
      expect(result.totalFare).toBe(70.0);
      expect(result.requiresAdminApproval).toBe(true);
    });
  });

  describe('Sants Train Station Pricing Rules', () => {
    it('should apply Sedan base fare €32 plus category surcharge for <= 4 passengers', () => {
      const result = service.calculatePrice({
        transferType: TransferType.SANTS_STATION,
        vehicleCategory: VehicleCategory.PREMIUM,
        pickupAddress: 'Barcelona Sants Train Station',
        destinationAddress: 'Sagrada Família, Barcelona',
        passengers: 2,
        luggage: 2,
      });

      expect(result.baseFare).toBe(32.0);
      expect(result.vehicleSurcharge).toBe(10.0);
      expect(result.totalFare).toBe(42.0);
      expect(result.freeWaitingTimeMinutes).toBe(15);
      expect(result.requiresAdminApproval).toBe(true);
    });

    it('should apply fixed fare of €45 for van without stacking surcharge', () => {
      const result = service.calculatePrice({
        transferType: TransferType.SANTS_STATION,
        vehicleCategory: VehicleCategory.STANDARD_VAN,
        pickupAddress: 'Barcelona Sants Train Station',
        destinationAddress: 'Hotel W, Barcelona',
        passengers: 6,
        luggage: 5,
      });

      expect(result.baseFare).toBe(45.0);
      expect(result.vehicleSurcharge).toBe(0.0);
      expect(result.totalFare).toBe(45.0);
      expect(result.requiresAdminApproval).toBe(true);
    });
  });

  describe('City Tour Pricing Rules', () => {
    it('should calculate city tours at €65 per hour inside metropolitan area', () => {
      const result = service.calculatePrice({
        transferType: TransferType.CITY_TOUR,
        vehicleCategory: VehicleCategory.STANDARD,
        pickupAddress: 'Hotel Majestic, Passeig de Gràcia',
        destinationAddress: 'Barcelona City Sightseeing',
        durationHours: 4,
        isMetropolitan: true,
        passengers: 2,
        luggage: 0,
      });

      // 4 hours * 65 = €260 base fare
      expect(result.baseFare).toBe(260.0);
      expect(result.isCustomQuote).toBe(false);
    });

    it('should require a custom quote for city tours outside metropolitan area', () => {
      const result = service.calculatePrice({
        transferType: TransferType.CITY_TOUR,
        vehicleCategory: VehicleCategory.PREMIUM,
        pickupAddress: 'Barcelona',
        destinationAddress: 'Montserrat & Pyrenees Full Day',
        durationHours: 8,
        isMetropolitan: false,
        passengers: 4,
        luggage: 0,
      });

      expect(result.isCustomQuote).toBe(true);
      expect(result.requiresAdminApproval).toBe(true);
    });
  });
});
