export type Locale = 'en' | 'es' | 'fr' | 'it';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'es', 'fr', 'it'];
export const DEFAULT_LOCALE: Locale = 'en';

export enum TransferType {
  AIRPORT = 'AIRPORT',
  CRUISE_PORT = 'CRUISE_PORT',
  SANTS_STATION = 'SANTS_STATION',
  CITY_TRANSFER = 'CITY_TRANSFER',
  CITY_TOUR = 'CITY_TOUR',
  GROUP_TRANSFER = 'GROUP_TRANSFER',
  CUSTOM_QUOTE = 'CUSTOM_QUOTE',
}

export enum BookingStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum VehicleCategory {
  ECONOMY = 'ECONOMY',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  STANDARD_VAN = 'STANDARD_VAN',
  PREMIUM_VAN = 'PREMIUM_VAN',
  ELECTRIC = 'ELECTRIC',
  LARGE_GROUP = 'LARGE_GROUP',
}

export interface VehicleDefinition {
  id: string;
  category: VehicleCategory;
  name: string;
  exampleModels: string;
  maxPassengers: number;
  maxLuggage: number;
  categorySurcharge: number; // in EUR
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

export const PRICING_CONFIG = {
  AIRPORT: {
    METROPOLITAN_PER_KM: 3.0,
    OUTSIDE_METROPOLITAN_PER_KM: 2.5,
    FREE_WAITING_MINS: 60,
  },
  CRUISE_PORT: {
    SEDAN_BASE: 42.0,
    MAX_SEDAN_PASSENGERS: 4,
    VAN_FIXED: 70.0,
    MAX_VAN_PASSENGERS: 8,
    FREE_WAITING_MINS: 30,
  },
  SANTS_STATION: {
    SEDAN_BASE: 32.0,
    MAX_SEDAN_PASSENGERS: 4,
    VAN_FIXED: 45.0,
    MAX_VAN_PASSENGERS: 8,
    FREE_WAITING_MINS: 15,
  },
  CITY_TOUR: {
    HOURLY_RATE_METROPOLITAN: 65.0,
    FREE_WAITING_MINS: 15,
  },
  COMPANY_TRIP: {
    HOURLY_RATE: 65.0,
    FREE_WAITING_MINS: 15,
  },
  // Inside Barcelona city transfers: €20 base for ≤2.5km, then +€3/km
  CITY_TRANSFER: {
    BASE_FARE: 20.0,
    BASE_KM_THRESHOLD: 2.5,
    PER_KM_RATE: 3.0,
    FREE_WAITING_MINS: 15,
  },
  // Extra items pricing (not shown to customers, added to backend fare)
  EXTRAS: {
    BABY_SEAT_PRICE: 4.50,
    BOOSTER_SEAT_PRICE: 9.00,
  },
  CATEGORY_SURCHARGES: {
    [VehicleCategory.ECONOMY]: 0.0,
    [VehicleCategory.STANDARD]: 5.0,
    [VehicleCategory.PREMIUM]: 10.0,
    [VehicleCategory.STANDARD_VAN]: 15.0,
    [VehicleCategory.PREMIUM_VAN]: 22.5,
    [VehicleCategory.ELECTRIC]: 12.0,
    [VehicleCategory.LARGE_GROUP]: 0.0, // On request / custom quote
  },
};

export const SEED_VEHICLES: VehicleDefinition[] = [
  {
    id: 'veh-economy',
    category: VehicleCategory.ECONOMY,
    name: 'Economy Transfer',
    exampleModels: 'Toyota Corolla · Toyota Corolla Touring Sports · Toyota Prius+ · Similar vehicles',
    maxPassengers: 4,
    maxLuggage: 4,
    categorySurcharge: 0,
    imageUrl: '/cars/economy/33.png',
    features: ['Air Conditioning', 'Clean Modern Interior', 'Complimentary Bottled Water', 'Contactless Payment'],
    description: {
      en: 'Reliable and cost-effective sedan transfers ideal for solo travelers and couples.',
      es: 'Traslados económicos y eficientes, ideales para viajeros individuales y parejas.',
      fr: 'Transferts économiques et fiables, parfaits pour voyageurs seuls et couples.',
      it: 'Trasferimenti economici ed efficienti, ideali per singoli e coppie.',
    },
  },
  {
    id: 'veh-standard',
    category: VehicleCategory.STANDARD,
    name: 'Standard Sedan',
    exampleModels: 'Toyota Camry · Lexus ES · Toyota RAV4 · Equivalent vehicles',
    maxPassengers: 4,
    maxLuggage: 3,
    categorySurcharge: 5,
    imageUrl: '/cars/standard/11.jpg',
    features: ['Generous Legroom', 'USB Charging Ports', 'Bottled Mineral Water', 'Flight Tracking Included'],
    description: {
      en: 'Spacious, comfortable hybrid sedan ensuring a smooth ride through Barcelona.',
      es: 'Espaciosa berlina híbrida para un trayecto suave y cómodo por Barcelona.',
      fr: 'Berline hybride spacieuse assurant un confort optimal dans tout Barcelone.',
      it: 'Berlina ibrida spaziosa e confortevole per muoversi comodamente a Barcellona.',
    },
  },
  {
    id: 'veh-premium',
    category: VehicleCategory.PREMIUM,
    name: 'Premium Executive Chauffeur',
    exampleModels: 'Mercedes-Benz E 220 · High-spec Lexus ES · Similar high-end vehicles',
    maxPassengers: 4,
    maxLuggage: 3,
    categorySurcharge: 10,
    imageUrl: '/cars/premium/11.jpg',
    features: ['Luxury Leather Upholstery', 'Wi-Fi Onboard', 'Chilled Refreshments', 'Suit Carrier Space'],
    description: {
      en: 'Executive luxury chauffeur service for business executives and VIP guests.',
      es: 'Servicio ejecutivo de alta gama para profesionales y clientes VIP.',
      fr: 'Chauffeur privé de grand standing pour dirigeants et voyageurs VIP.',
      it: 'Servizio di alta classe per dirigenti e ospiti VIP.',
    },
  },
  {
    id: 'veh-standard-van',
    category: VehicleCategory.STANDARD_VAN,
    name: 'Standard Van',
    exampleModels: 'Volkswagen Caddy Maxi · Mercedes-Benz Vito Tourer',
    maxPassengers: 7,
    maxLuggage: 7,
    categorySurcharge: 15,
    imageUrl: '/cars/standard-van/11.jpg',
    features: ['High Roof & Large Boot', 'Dual Zone Climate', 'Rear Luggage Compartment', 'Child Seats Upon Request'],
    description: {
      en: 'Roomy van perfect for family vacations and travelers with abundant luggage.',
      es: 'Furgoneta amplia perfecta para vacaciones familiares y mucho equipaje.',
      fr: 'Van spacieux idéal pour vacances en famille et bagages volumineux.',
      it: 'Van spazioso perfetto per vacanze in famiglia e molti bagagli.',
    },
  },
  {
    id: 'veh-premium-van',
    category: VehicleCategory.PREMIUM_VAN,
    name: 'Premium / Group Van',
    exampleModels: 'Mercedes-Benz V-Class · Volkswagen Caravelle · Ford Tourneo Custom',
    maxPassengers: 8,
    maxLuggage: 8,
    categorySurcharge: 22.5,
    imageUrl: '/cars/premium-van/11.jpg',
    features: ['Conference Seating', 'Tinted Privacy Windows', 'High-Speed Wi-Fi', 'Bottled Mineral Water'],
    description: {
      en: 'The benchmark of luxury group travel, featuring conference seating and silent cabin.',
      es: 'El estándar de oro en transporte de grupos VIP, con asientos enfrentados y máxima privacidad.',
      fr: 'La référence du transport de groupe VIP avec sièges face-à-face et insonorisation.',
      it: 'Il punto di riferimento per il trasporto di gruppo VIP con sedili a salotto e privacy.',
    },
  },
  {
    id: 'veh-electric',
    category: VehicleCategory.ELECTRIC,
    name: 'Electric / Green Transfer',
    exampleModels: 'Tesla Model 3 · Tesla Model Y · Mercedes-Benz EQE · Similar electric vehicles',
    maxPassengers: 4,
    maxLuggage: 3,
    categorySurcharge: 12,
    imageUrl: '/cars/electric/11.jpg',
    features: ['Zero Emission Travel', 'Panoramic Glass Roof', 'Silent Electric Ride', 'Premium Audio'],
    description: {
      en: 'Zero-emission quiet luxury for environmentally conscious travelers.',
      es: 'Lujo silencioso de cero emisiones para viajeros comprometidos con el medio ambiente.',
      fr: 'Luxe silencieux zéro émission pour les voyageurs soucieux de l’environnement.',
      it: 'Lusso silenzioso a zero emissioni per viaggiatori attenti alla sostenibilità.',
    },
  },
  {
    id: 'veh-large-group',
    category: VehicleCategory.LARGE_GROUP,
    name: 'Large Group Transfers',
    exampleModels: 'Minibuses · Midibuses · Coaches · Multiple vehicles booked together',
    maxPassengers: 55,
    maxLuggage: 55,
    categorySurcharge: 0,
    imageUrl: '/cars/large-group/11.jpg',
    features: ['PA Audio System', 'Air Suspension', 'Large Cargo Bays', 'Custom Route Itineraries'],
    description: {
      en: 'Custom logistics for tour groups, wedding parties, conferences, and sports teams.',
      es: 'Logística personalizada para congresos, cruceristas, eventos deportivos y bodas.',
      fr: 'Logistique sur mesure pour groupes de croisières, séminaires et mariages.',
      it: 'Logistica personalizzata per gruppi turistici, matrimoni, congressi e squadre sportive.',
    },
  },
];

export const VEHICLE_GALLERY_IMAGES: Record<VehicleCategory, string[]> = {
  [VehicleCategory.ECONOMY]: [
    '/cars/economy/33.png',
    '/cars/economy/22.jpg',
    '/cars/economy/11.jpg',
    '/cars/economy/toyota-corolla-black.jpg',
    '/cars/economy/toyota-corolla-black-yellow-doors.jpg',
    '/cars/economy/toyota-prius-plus-black.jpg',
    '/cars/economy/toyota-prius-plus-black-yellow-doors.jpg',
    '/cars/economy/more-similar-vehicles.jpg',
  ],
  [VehicleCategory.STANDARD]: [
    '/cars/standard/11.jpg',
    '/cars/standard/toyota-camry-black.jpg',
    '/cars/standard/toyota-camry-black-yellow-doors.jpg',
    '/cars/standard/lexus-es-black.jpg',
    '/cars/standard/lexus-es-black-yellow-doors.jpg',
    '/cars/standard/more-similar-vehicles.jpg',
  ],
  [VehicleCategory.PREMIUM]: [
    '/cars/premium/11.jpg',
    '/cars/premium/mercedes-benz-e220-black.jpg',
    '/cars/premium/mercedes-benz-e220-black-yellow-doors.jpg',
    '/cars/premium/lexus-es-high-spec-black.jpg',
    '/cars/premium/lexus-es-high-spec-black-yellow-doors.jpg',
    '/cars/premium/more-similar-vehicles.jpg',
  ],
  [VehicleCategory.STANDARD_VAN]: [
    '/cars/standard-van/11.jpg',
    '/cars/standard-van/mercedes-benz-vito-tourer-black-16x9.jpg',
    '/cars/standard-van/mercedes-benz-vito-tourer-black-16x9-yellow-doors.jpg',
    '/cars/standard-van/volkswagen-caddy-maxi-black-16x9.jpg',
    '/cars/standard-van/volkswagen-caddy-maxi-black-16x9-yellow-doors.jpg',
    '/cars/standard-van/more-similar-vehicles.jpg',
  ],
  [VehicleCategory.PREMIUM_VAN]: [
    '/cars/premium-van/11.jpg',
    '/cars/premium-van/mercedes-benz-v-class-black.jpg',
    '/cars/premium-van/mercedes-benz-v-class-black-yellow-doors.jpg',
    '/cars/premium-van/ford-tourneo-custom-black.jpg',
    '/cars/premium-van/ford-tourneo-custom-black-yellow-doors.jpg',
    '/cars/premium-van/more-similar-vehicles.jpg',
  ],
  [VehicleCategory.ELECTRIC]: [
    '/cars/electric/11.jpg',
    '/cars/electric/tesla-model-3-black-16x9.jpg',
    '/cars/electric/tesla-model-3-black-16x9-yellow-doors.jpg',
    '/cars/electric/mercedes-benz-eqe-black-16x9.jpg',
    '/cars/electric/mercedes-benz-eqe-black-16x9-yellow-doors.jpg',
    '/cars/electric/more-similar-vehicles.jpg',
  ],
  [VehicleCategory.LARGE_GROUP]: [
    '/cars/large-group/11.jpg',
    '/cars/large-group/minibuses-black-multiple-widescreen-16x9.jpg',
    '/cars/large-group/minibuses-black-multiple-16x9-yellow-doors.jpg',
    '/cars/large-group/coaches-black-multiple-16x9.jpg',
    '/cars/large-group/coaches-black-multiple-16x9-yellow-doors.jpg',
    '/cars/large-group/more-similar-vehicles.jpg',
  ],
};

export const SEED_FAMOUS_PLACES: FamousPlace[] = [
  {
    id: 'place-sagrada-familia',
    slug: 'sagrada-familia',
    category: 'Architecture',
    address: 'Carrer de Mallorca, 401, 08013 Barcelona',
    coordinates: { lat: 41.4036, lng: 2.1744 },
    imageUrl: '/famous-places/01_sagrada_familia.png',
    recommendedDuration: '2 - 3 hours',
    name: {
      en: 'Basílica de la Sagrada Família',
      es: 'Basílica de la Sagrada Família',
      fr: 'Basilique de la Sagrada Família',
      it: 'Basilica della Sagrada Família',
    },
    shortDescription: {
      en: "Antoni Gaudí's awe-inspiring masterwork and Barcelona's most iconic landmark.",
      es: 'La obra maestra de Antoni Gaudí y el monumento más emblemático de Barcelona.',
      fr: "Le chef-d'œuvre d'Antoni Gaudí et le monument le plus emblématique de Barcelone.",
      it: 'Il capolavoro di Antoni Gaudí e il monumento più celebre di Barcellona.',
    },
    description: {
      en: 'An extraordinary UNESCO World Heritage basilica combining Gothic and curvilinear Art Nouveau forms with stunning stained glass light shows.',
      es: 'Extraordinaria basílica Patrimonio de la Humanidad que fusiona el gótico con el modernismo catalán y un impresionante juego de vidrieras.',
      fr: 'Une basilique extraordinaire inscrite à l’UNESCO mêlant formes gothiques, art nouveau et vitraux spectaculaires.',
      it: 'Uno straordinario capolavoro patrimonio UNESCO che fonde forme gotiche e Liberty catalano con giochi di luce unici.',
    },
  },
  {
    id: 'place-la-rambla',
    slug: 'la-rambla',
    category: 'Culture',
    address: 'La Rambla, 08002 Barcelona',
    coordinates: { lat: 41.3809, lng: 2.1734 },
    imageUrl: '/famous-places/02_la_rambla_la_boqueria.png',
    recommendedDuration: '1 - 2 hours',
    name: {
      en: 'La Rambla & La Boqueria',
      es: 'La Rambla y Mercado de La Boqueria',
      fr: 'La Rambla & Marché de la Boqueria',
      it: 'La Rambla e Mercato de La Boqueria',
    },
    shortDescription: {
      en: "Barcelona's historic tree-lined pedestrian boulevard extending from Plaça de Catalunya to the sea.",
      es: 'El bulevar peatonal arbolado más vibrante de Barcelona que conecta Plaça de Catalunya con el puerto.',
      fr: 'La célèbre artère piétonne arborée reliant la Plaça de Catalunya au vieux port.',
      it: 'Il celebre viale pedonale alberato che collega Plaça de Catalunya al porto antico.',
    },
    description: {
      en: 'Lined with historic kiosks, flower stalls, the Liceu Opera House, and the famous Mercat de Sant Josep de la Boqueria foodie paradise.',
      es: 'Repleta de quioscos tradicionales, puestos de flores, el Gran Teatre del Liceu y el paraíso gastronómico de La Boqueria.',
      fr: 'Jalonnée de marchands de fleurs, de terrasses animées et du réputé marché gourmand de la Boqueria.',
      it: 'Piena di fiorai, caffè storici, il Teatro Liceu e il famoso mercato gastronomico de La Boqueria.',
    },
  },
  {
    id: 'place-park-guell',
    slug: 'park-guell',
    category: 'Culture',
    address: '08024 Barcelona',
    coordinates: { lat: 41.4145, lng: 2.1527 },
    imageUrl: '/famous-places/03_park_guell.png',
    recommendedDuration: '2 hours',
    name: {
      en: 'Park Güell',
      es: 'Park Güell',
      fr: 'Parc Güell',
      it: 'Parco Güell',
    },
    shortDescription: {
      en: 'Whimsical public park featuring vibrant mosaic sculptures and sweeping views over the city.',
      es: 'Parque emblemático con vibrantes esculturas de mosaico y vistas panorámicas de la ciudad.',
      fr: 'Parc féerique célèbre pour ses mosaïques multicolores et ses panoramas sur Barcelone.',
      it: 'Parco fiabesco celebre per i mosaici colorati e la vista panoramica sul golfo di Barcellona.',
    },
    description: {
      en: 'Commissioned by Eusebi Güell and designed by Gaudí, this hill-top garden complex blends organic architectural forms seamlessly into the Mediterranean nature.',
      es: 'Diseñado por Gaudí por encargo de Eusebi Güell, este parque en la colina del Carmel fusiona la arquitectura orgánica con la vegetación mediterránea.',
      fr: "Chef-d'œuvre paysager de Gaudí perché sur les hauteurs de Barcelone offrant une harmonie totale entre pierre et nature.",
      it: 'Realizzato da Gaudí per Eusebi Güell, questo parco fonde architettura organica e natura con vista spettacolare sul mare.',
    },
  },
  {
    id: 'place-gothic-quarter',
    slug: 'gothic-quarter',
    category: 'History',
    address: 'Barri Gòtic, 08002 Barcelona',
    coordinates: { lat: 41.3833, lng: 2.1764 },
    imageUrl: '/famous-places/04_gothic_quarter.png',
    recommendedDuration: '2 - 3 hours',
    name: {
      en: 'Gothic Quarter (Barri Gòtic)',
      es: 'Barrio Gótico (Barri Gòtic)',
      fr: 'Quartier Gothique (Barri Gòtic)',
      it: 'Quartiere Gotico (Barri Gòtic)',
    },
    shortDescription: {
      en: 'Atmospheric medieval heart of Barcelona with labyrinthine stone alleyways and Roman walls.',
      es: 'Corazón medieval de Barcelona con callejuelas laberínticas, murallas romanas y plazas centenarias.',
      fr: 'Le cœur médiéval envoûtant de Barcelone avec ruelles pavées, vestiges romains et cathédrale.',
      it: 'Il suggestivo centro medievale di Barcellona con vicoli in pietra, mura romane e piazze intime.',
    },
    description: {
      en: 'Home to the Cathedral of Santa Eulàlia, Plaça del Rei, and quaint tapas bars tucked away in thousand-year-old stone buildings.',
      es: 'Alberga la Catedral de Santa Eulàlia, la Plaça del Rei y encantadoras tabernas en palacetes milenarios.',
      fr: 'Abrite la majestueuse cathédrale de la Sainte-Croix, la Plaça del Rei et d’innombrables trésors cachés.',
      it: 'Ospita la maestosa Cattedrale di Santa Eulàlia, Plaça del Rei e storici locali di tapas.',
    },
  },
  {
    id: 'place-casa-batllo',
    slug: 'casa-batllo',
    category: 'Architecture',
    address: 'Passeig de Gràcia, 43, 08007 Barcelona',
    coordinates: { lat: 41.3917, lng: 2.1649 },
    imageUrl: '/famous-places/05_casa_batllo.png',
    recommendedDuration: '1.5 hours',
    name: {
      en: 'Casa Batlló',
      es: 'Casa Batlló',
      fr: 'Casa Batlló',
      it: 'Casa Batlló',
    },
    shortDescription: {
      en: "Gaudí's colorful marine-inspired modernist fantasy on prestigious Passeig de Gràcia.",
      es: 'Fantasía modernista de Gaudí inspirada en el océano en el señorial Passeig de Gràcia.',
      fr: 'Façade féerique ondulée aux tons marins réalisée par Gaudí sur le Passeig de Gràcia.',
      it: 'Fantasia modernista di Gaudí inspirata al mondo marino nel prestigioso Passeig de Gràcia.',
    },
    description: {
      en: 'Known locally as the House of Bones (Casa dels ossos), famous for its dragon-back arched roof and radiant mosaic facade.',
      es: 'Conocida popularmente como la Casa de los huesos, célebre por su tejado en forma de lomo de dragón y fachada iridiscente.',
      fr: 'Connue sous le nom de Maison des os, célèbre pour son toit en écaille de dragon et sa façade irisée.',
      it: 'Celebre come Casa delle Ossa per le sue forme scultoree, il tetto a dorso di drago e i balconi fiabeschi.',
    },
  },
  {
    id: 'place-montjuic',
    slug: 'montjuic',
    category: 'History',
    address: 'Montjuïc, 08038 Barcelona',
    coordinates: { lat: 41.3638, lng: 2.1645 },
    imageUrl: '/famous-places/06_montjuic_castle_olympic_hill.png',
    recommendedDuration: '3 - 4 hours',
    name: {
      en: 'Montjuïc Castle & Olympic Hill',
      es: 'Montjuïc: Castillo y Anillo Olímpico',
      fr: 'Montjuïc : Château et Colline Olympique',
      it: 'Collina di Montjuïc e Castello',
    },
    shortDescription: {
      en: 'Picturesque hillside featuring military fortress, MNAC Museum, Magic Fountain, and 1992 Olympic stadiums.',
      es: 'Colina señorial con fortaleza militar, museo MNAC, Fuente Mágica y el estadio olímpico de 1992.',
      fr: 'Colline verdoyante surplombant la ville avec sa forteresse, le MNAC et le parc olympique de 1992.',
      it: 'Verde colle che domina Barcellona con fortezza storica, museo MNAC e impianti olimpici del 1992.',
    },
    description: {
      en: 'Offering panoramic 360-degree vistas over the Mediterranean Sea, commercial port, and the entire city grid.',
      es: 'Ofrece unas vistas panorámicas de 360 grados sobre el mar Mediterráneo, el puerto y toda la trama urbana.',
      fr: 'Offre une vue imprenable à 360 degrés sur la mer Méditerranée, les quais et toute la cité catalane.',
      it: 'Offre una vista a 360 gradi sul Mar Mediterraneo, sul porto crociere e sull’intera città.',
    },
  },
  {
    id: 'place-barceloneta',
    slug: 'barceloneta-beach',
    category: 'Beaches',
    address: 'Platja de la Barceloneta, 08003 Barcelona',
    coordinates: { lat: 41.3784, lng: 2.1925 },
    imageUrl: '/famous-places/07_barceloneta-beach.png',
    recommendedDuration: '2 - 3 hours',
    name: {
      en: 'Barceloneta Beach & Seaside Promenade',
      es: 'Playa de la Barceloneta y Paseo Marítimo',
      fr: 'Plage de la Barceloneta & Front de Mer',
      it: 'Spiaggia della Barceloneta e Lungomare',
    },
    shortDescription: {
      en: 'Lively golden sand beach lined with traditional seafood chiringuitos and palm-fringed walkways.',
      es: 'Playa de arena dorada con chiringuitos de marisco fresco, palmeras y animado paseo marítimo.',
      fr: 'Plage dorée bordée de restaurants de fruits de mer, palmiers et ambiance méditerranéenne.',
      it: 'La celebre spiaggia dorata con storici chiringuitos di pesce fresco e passeggiata con palme.',
    },
    description: {
      en: "A historic fishermen's district converted into Barcelona's coastal hot spot for swimming, paella, and ocean breezes.",
      es: 'Antiguo barrio marinero convertido en el epicentro costero para degustar paella, bañarse y pasear.',
      fr: 'Ancien quartier de pêcheurs devenu le rendez-vous incontournable pour déguster une paella au bord de l’eau.',
      it: 'Antico borgo di pescatori trasformato nel cuore balneare della città per gustare la paella in riva al mare.',
    },
  },
  {
    id: 'place-passeig-de-gracia',
    slug: 'passeig-de-gracia',
    category: 'Shopping',
    address: 'Passeig de Gràcia, 08007 Barcelona',
    coordinates: { lat: 41.3935, lng: 2.1634 },
    imageUrl: '/famous-places/08_passeig-de-gracia.png',
    recommendedDuration: '2 hours',
    name: {
      en: 'Passeig de Gràcia & Luxury Shopping',
      es: 'Passeig de Gràcia y Milla de Oro',
      fr: 'Passeig de Gràcia & Boutiques de Luxe',
      it: 'Passeig de Gràcia e Shopping di Lusso',
    },
    shortDescription: {
      en: "Barcelona's most elegant boulevard, home to haute couture boutiques and modernist architecture.",
      es: 'La avenida más aristocrática y distinguida de Barcelona con firmas de alta costura y obras maestras.',
      fr: 'La prestigieuse avenue barcelonaise réunissant boutiques de haute couture et joyaux architecturaux.',
      it: 'Il viale più elegante di Barcellona con boutique di alta moda e palazzi nobiliari modernisti.',
    },
    description: {
      en: 'Stroll past Casa Milà (La Pedrera), Casa Batlló, luxury designer flagships (Chanel, Loewe, Hermès), and Michelin-starred restaurants.',
      es: 'Pasea entre La Pedrera, Casa Batlló, boutiques de renombre internacional (Loewe, Chanel) y restaurantes con estrella Michelin.',
      fr: 'Flânez entre La Pedrera, Casa Batlló, les plus grandes maisons de luxe et tables étoilées.',
      it: 'Passeggia tra Casa Milà (La Pedrera), Casa Batlló, boutique di alta moda e ristoranti gourmet.',
    },
  },
  {
    id: 'place-palau-musica',
    slug: 'palau-de-la-musica',
    category: 'Culture',
    address: 'C/ Palau de la Música, 4-6, 08003 Barcelona',
    coordinates: { lat: 41.3876, lng: 2.1753 },
    imageUrl: '/famous-places/09_palau-de-la-musica-catalana.png',
    recommendedDuration: '1.5 hours',
    name: {
      en: 'Palau de la Música Catalana',
      es: 'Palau de la Música Catalana',
      fr: 'Palais de la Musique Catalane',
      it: 'Palazzo della Musica Catalana',
    },
    shortDescription: {
      en: 'UNESCO-listed concert hall famous for its astonishing stained-glass skylight dome.',
      es: 'Auditorio modernista declarado Patrimonio de la Humanidad con una cúpula de vidriera inigualable.',
      fr: 'Salle de concert inscrite à l’UNESCO réputée pour sa verrière centrale baignée de lumière naturelle.',
      it: 'Auditorium patrimonio UNESCO celebre per la spettacolare cupola di cristallo policromo.',
    },
    description: {
      en: 'Designed by Lluís Domènech i Montaner, this architectural treasure is the only concert venue in Europe illuminated entirely by natural daylight.',
      es: 'Diseñado por Domènech i Montaner, es la única sala de conciertos de Europa iluminada exclusivamente con luz natural durante el día.',
      fr: 'Chef-d’œuvre de Domènech i Montaner, c’est la seule salle de concert européenne entièrement éclairée par la lumière du jour.',
      it: 'Capolavoro di Domènech i Montaner, unica sala concerti europea illuminata interamente dalla luce naturale.',
    },
  },
  {
    id: 'place-camp-nou',
    slug: 'camp-nou-stadium',
    category: 'Sports',
    address: "C/ d'Arístides Maillol, 12, 08028 Barcelona",
    coordinates: { lat: 41.3809, lng: 2.1228 },
    imageUrl: '/famous-places/10_spotify-camp-nou.png',
    recommendedDuration: '2 - 3 hours',
    name: {
      en: 'Spotify Camp Nou & FC Barcelona Museum',
      es: 'Spotify Camp Nou y Museo del FC Barcelona',
      fr: 'Spotify Camp Nou & Musée du FC Barcelone',
      it: 'Spotify Camp Nou e Museo dell’FC Barcellona',
    },
    shortDescription: {
      en: 'The legendary temple of world football and home of FC Barcelona.',
      es: 'El mítico templo del fútbol mundial y casa del FC Barcelona.',
      fr: 'Le sanctuaire mythique du football mondial et stade historique du FC Barcelone.',
      it: 'Il leggendario tempio del calcio mondiale e casa dell’FC Barcellona.',
    },
    description: {
      en: 'Visit the immersive Barça Museum, championship trophies, and the revitalized stadium complex honoring football legends.',
      es: 'Visita el museo inmersivo del Barça, las Copas de Europa y el emblemático estadio en el corazón de Les Corts.',
      fr: 'Explorez le musée immersif, les trophées de légende et le mythique complexe sportif du Barça.',
      it: 'Visita il museo immersivo del Barça, la sala dei trofei e lo storico stadio dei campioni blaugrana.',
    },
  },
];

