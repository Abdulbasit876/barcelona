export type Locale = 'en' | 'es' | 'fr' | 'it';
export declare const SUPPORTED_LOCALES: Locale[];
export declare const DEFAULT_LOCALE: Locale;
export declare enum TransferType {
    AIRPORT = "AIRPORT",
    CRUISE_PORT = "CRUISE_PORT",
    SANTS_STATION = "SANTS_STATION",
    CITY_TRANSFER = "CITY_TRANSFER",
    CITY_TOUR = "CITY_TOUR",
    GROUP_TRANSFER = "GROUP_TRANSFER",
    CUSTOM_QUOTE = "CUSTOM_QUOTE"
}
export declare enum BookingStatus {
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    PAYMENT_PENDING = "PAYMENT_PENDING",
    CONFIRMED = "CONFIRMED",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    REJECTED = "REJECTED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    REFUNDED = "REFUNDED",
    FAILED = "FAILED"
}
export declare enum VehicleCategory {
    ECONOMY = "ECONOMY",
    STANDARD = "STANDARD",
    PREMIUM = "PREMIUM",
    STANDARD_VAN = "STANDARD_VAN",
    PREMIUM_VAN = "PREMIUM_VAN",
    ELECTRIC = "ELECTRIC",
    LARGE_GROUP = "LARGE_GROUP"
}
export interface VehicleDefinition {
    id: string;
    category: VehicleCategory;
    name: string;
    exampleModels: string;
    maxPassengers: number;
    maxLuggage: number;
    categorySurcharge: number;
    description: Record<Locale, string>;
    imageUrl: string;
    features: string[];
}
export interface PricingBreakdown {
    transferType: TransferType;
    vehicleCategory: VehicleCategory;
    distanceKm?: number;
    durationHours?: number;
    isMetropolitanArea: boolean;
    baseFare: number;
    vehicleSurcharge: number;
    additionalCharges: number;
    totalFare: number;
    currency: 'EUR';
    requiresAdminApproval: boolean;
    isCustomQuote: boolean;
    pricingRuleApplied: string;
    freeWaitingTimeMinutes: number;
}
export interface CalculatePriceDto {
    transferType: TransferType;
    vehicleCategory: VehicleCategory;
    pickupAddress: string;
    destinationAddress?: string;
    distanceKm?: number;
    durationHours?: number;
    passengers: number;
    luggage: number;
    cabinLuggage?: number;
    isMetropolitan?: boolean;
}
export interface CreateBookingDto {
    transferType: TransferType;
    vehicleCategory: VehicleCategory;
    pickupAddress: string;
    destinationAddress: string;
    pickupDate: string;
    pickupTime: string;
    isReturnTrip?: boolean;
    returnDate?: string;
    returnTime?: string;
    flightOrTrainNumber?: string;
    cruiseShipName?: string;
    passengers: number;
    luggage: number;
    cabinLuggage?: number;
    childSeats?: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    specialRequests?: string;
    preferredLanguage: Locale;
    tourDurationHours?: number;
}
export interface BookingResponse {
    id: string;
    bookingReference: string;
    accessToken: string;
    transferType: TransferType;
    vehicleCategory: VehicleCategory;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    pickupAddress: string;
    destinationAddress: string;
    pickupDateTime: string;
    passengers: number;
    luggage: number;
    cabinLuggage?: number;
    childSeats: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    fareBreakdown: PricingBreakdown;
    originalFare?: number;
    revisedFare?: number;
    hasCustomerAcceptedRevision?: boolean;
    assignedDriver?: {
        id: string;
        name: string;
        phone: string;
        vehiclePlate: string;
        vehicleModel: string;
        currentLat?: number;
        currentLng?: number;
        lastUpdate?: string;
    } | null;
    flightOrTrainNumber?: string;
    cruiseShipName?: string;
    specialRequests?: string;
    preferredLanguage: Locale;
    createdAt: string;
}
export interface DriverLocationUpdate {
    bookingId: string;
    driverId: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speedKmh?: number;
    timestamp: string;
}
export interface FamousPlace {
    id: string;
    slug: string;
    name: Record<Locale, string>;
    category: 'Architecture' | 'History' | 'Culture' | 'Beaches' | 'Shopping' | 'Sports';
    description: Record<Locale, string>;
    shortDescription: Record<Locale, string>;
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    imageUrl: string;
    recommendedDuration: string;
}
export interface ContactMessageDto {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    locale: Locale;
}
export interface CustomQuoteRequestDto {
    name: string;
    email: string;
    phone: string;
    pickupAddress: string;
    destinationAddress: string;
    pickupDate: string;
    pickupTime: string;
    passengers: number;
    luggage: number;
    vehiclePreference?: string;
    specialRequirements: string;
    preferredLanguage: Locale;
}
export declare const PRICING_CONFIG: {
    AIRPORT: {
        METROPOLITAN_PER_KM: number;
        OUTSIDE_METROPOLITAN_PER_KM: number;
        FREE_WAITING_MINS: number;
    };
    CRUISE_PORT: {
        SEDAN_BASE: number;
        MAX_SEDAN_PASSENGERS: number;
        VAN_FIXED: number;
        MAX_VAN_PASSENGERS: number;
        FREE_WAITING_MINS: number;
    };
    SANTS_STATION: {
        SEDAN_BASE: number;
        MAX_SEDAN_PASSENGERS: number;
        VAN_FIXED: number;
        MAX_VAN_PASSENGERS: number;
        FREE_WAITING_MINS: number;
    };
    CITY_TOUR: {
        HOURLY_RATE_METROPOLITAN: number;
        FREE_WAITING_MINS: number;
    };
    COMPANY_TRIP: {
        HOURLY_RATE: number;
        FREE_WAITING_MINS: number;
    };
    CITY_TRANSFER: {
        BASE_FARE: number;
        BASE_KM_THRESHOLD: number;
        PER_KM_RATE: number;
        FREE_WAITING_MINS: number;
    };
    EXTRAS: {
        BABY_SEAT_PRICE: number;
        BOOSTER_SEAT_PRICE: number;
    };
    CATEGORY_SURCHARGES: {
        ECONOMY: number;
        STANDARD: number;
        PREMIUM: number;
        STANDARD_VAN: number;
        PREMIUM_VAN: number;
        ELECTRIC: number;
        LARGE_GROUP: number;
    };
};
export declare const SEED_VEHICLES: VehicleDefinition[];
export declare const VEHICLE_GALLERY_IMAGES: Record<VehicleCategory, string[]>;
export declare const SEED_FAMOUS_PLACES: FamousPlace[];
