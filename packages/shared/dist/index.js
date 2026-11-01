"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_FAMOUS_PLACES = exports.VEHICLE_GALLERY_IMAGES = exports.SEED_VEHICLES = exports.PRICING_CONFIG = exports.VehicleCategory = exports.PaymentStatus = exports.BookingStatus = exports.TransferType = exports.DEFAULT_LOCALE = exports.SUPPORTED_LOCALES = void 0;
exports.SUPPORTED_LOCALES = ['en', 'es', 'fr', 'it'];
exports.DEFAULT_LOCALE = 'en';
var TransferType;
(function (TransferType) {
    TransferType["AIRPORT"] = "AIRPORT";
    TransferType["CRUISE_PORT"] = "CRUISE_PORT";
    TransferType["SANTS_STATION"] = "SANTS_STATION";
    TransferType["CITY_TRANSFER"] = "CITY_TRANSFER";
    TransferType["CITY_TOUR"] = "CITY_TOUR";
    TransferType["GROUP_TRANSFER"] = "GROUP_TRANSFER";
    TransferType["CUSTOM_QUOTE"] = "CUSTOM_QUOTE";
})(TransferType || (exports.TransferType = TransferType = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    BookingStatus["APPROVED"] = "APPROVED";
    BookingStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["ASSIGNED"] = "ASSIGNED";
    BookingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["REJECTED"] = "REJECTED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["FAILED"] = "FAILED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var VehicleCategory;
(function (VehicleCategory) {
    VehicleCategory["ECONOMY"] = "ECONOMY";
    VehicleCategory["STANDARD"] = "STANDARD";
    VehicleCategory["PREMIUM"] = "PREMIUM";
    VehicleCategory["STANDARD_VAN"] = "STANDARD_VAN";
    VehicleCategory["PREMIUM_VAN"] = "PREMIUM_VAN";
    VehicleCategory["ELECTRIC"] = "ELECTRIC";
    VehicleCategory["LARGE_GROUP"] = "LARGE_GROUP";
})(VehicleCategory || (exports.VehicleCategory = VehicleCategory = {}));
exports.PRICING_CONFIG = {
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
    // Inside Barcelona city transfers: â‚¬20 base for â‰¤2.5km, then +â‚¬3/km
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
exports.SEED_VEHICLES = [
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
            es: 'Traslados econÃ³micos y eficientes, ideales para viajeros individuales y parejas.',
            fr: 'Transferts Ã©conomiques et fiables, parfaits pour voyageurs seuls et couples.',
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
            es: 'Espaciosa berlina hÃ­brida para un trayecto suave y cÃ³modo por Barcelona.',
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
            fr: 'Chauffeur privÃ© de grand standing pour dirigeants et voyageurs VIP.',
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
            fr: 'Van spacieux idÃ©al pour vacances en famille et bagages volumineux.',
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
            es: 'El estÃ¡ndar de oro en transporte de grupos VIP, con asientos enfrentados y mÃ¡xima privacidad.',
            fr: 'La rÃ©fÃ©rence du transport de groupe VIP avec siÃ¨ges face-Ã -face et insonorisation.',
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
            fr: "Luxe silencieux zÃ©ro Ã©mission pour les voyageurs soucieux de l'environnement.",
            it: 'Lusso silenzioso a zero emissioni per viaggiatori attenti alla sostenibilitÃ .',
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
            es: 'LogÃ­stica personalizada para congresos, cruceristas, eventos deportivos y bodas.',
            fr: 'Logistique sur mesure pour groupes de croisiÃ¨res, sÃ©minaires et mariages.',
            it: 'Logistica personalizzata per gruppi turistici, matrimoni, congressi e squadre sportive.',
        },
    },
];
// Additional images per category for swipeable gallery — more-similar-vehicles is always last
exports.VEHICLE_GALLERY_IMAGES = {
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
exports.SEED_FAMOUS_PLACES = [
    {
        id: 'place-sagrada-familia',
        slug: 'sagrada-familia',
        category: 'Architecture',
        address: 'Carrer de Mallorca, 401, 08013 Barcelona',
        coordinates: { lat: 41.4036, lng: 2.1744 },
        imageUrl: '/famous-places/01_sagrada_familia.png',
        recommendedDuration: '2 - 3 hours',
        name: {
            en: 'BasÃ­lica de la Sagrada FamÃ­lia',
            es: 'BasÃ­lica de la Sagrada FamÃ­lia',
            fr: 'Basilique de la Sagrada FamÃ­lia',
            it: 'Basilica della Sagrada FamÃ­lia',
        },
        shortDescription: {
            en: "Antoni GaudÃ­'s awe-inspiring masterwork and Barcelona's most iconic landmark.",
            es: 'La obra maestra de Antoni GaudÃ­ y el monumento mÃ¡s emblemÃ¡tico de Barcelona.',
            fr: "Le chef-d'Å“uvre d'Antoni GaudÃ­ et le monument le plus emblÃ©matique de Barcelone.",
            it: 'Il capolavoro di Antoni GaudÃ­ e il monumento piÃ¹ celebre di Barcellona.',
        },
        description: {
            en: 'An extraordinary UNESCO World Heritage basilica combining Gothic and curvilinear Art Nouveau forms with stunning stained glass light shows.',
            es: 'Extraordinaria basÃ­lica Patrimonio de la Humanidad que fusiona el gÃ³tico con el modernismo catalÃ¡n y un impresionante juego de vidrieras.',
            fr: "Une basilique extraordinaire inscrite Ã  l'UNESCO mÃªlant formes gothiques, art nouveau et vitraux spectaculaires.",
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
            fr: 'La Rambla & MarchÃ© de la Boqueria',
            it: 'La Rambla e Mercato de La Boqueria',
        },
        shortDescription: {
            en: "Barcelona's historic tree-lined pedestrian boulevard extending from PlaÃ§a de Catalunya to the sea.",
            es: 'El bulevar peatonal arbolado mÃ¡s vibrante de Barcelona que conecta PlaÃ§a de Catalunya con el puerto.',
            fr: 'La cÃ©lÃ¨bre artÃ¨re piÃ©tonne arborÃ©e reliant la PlaÃ§a de Catalunya au vieux port.',
            it: 'Il celebre viale pedonale alberato che collega PlaÃ§a de Catalunya al porto antico.',
        },
        description: {
            en: 'Lined with historic kiosks, flower stalls, the Liceu Opera House, and the famous Mercat de Sant Josep de la Boqueria foodie paradise.',
            es: 'Repleta de quioscos tradicionales, puestos de flores, el Gran Teatre del Liceu y el paraÃ­so gastronÃ³mico de La Boqueria.',
            fr: 'JalonnÃ©e de marchands de fleurs, de terrasses animÃ©es et du rÃ©putÃ© marchÃ© gourmand de la Boqueria.',
            it: 'Piena di fiorai, caffÃ¨ storici, il Teatro Liceu e il famoso mercato gastronomico de La Boqueria.',
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
            en: 'Park GÃ¼ell',
            es: 'Park GÃ¼ell',
            fr: 'Parc GÃ¼ell',
            it: 'Parco GÃ¼ell',
        },
        shortDescription: {
            en: 'Whimsical public park featuring vibrant mosaic sculptures and sweeping views over the city.',
            es: 'Parque emblemÃ¡tico con vibrantes esculturas de mosaico y vistas panorÃ¡micas de la ciudad.',
            fr: 'Parc fÃ©erique cÃ©lÃ¨bre pour ses mosaÃ¯ques multicolores et ses panoramas sur Barcelone.',
            it: 'Parco fiabesco celebre per i mosaici colorati e la vista panoramica sul golfo di Barcellona.',
        },
        description: {
            en: 'Commissioned by Eusebi GÃ¼ell and designed by GaudÃ­, this hill-top garden complex blends organic architectural forms seamlessly into the Mediterranean nature.',
            es: 'DiseÃ±ado por GaudÃ­ por encargo de Eusebi GÃ¼ell, este parque en la colina del Carmel fusiona la arquitectura orgÃ¡nica con la vegetaciÃ³n mediterrÃ¡nea.',
            fr: "Chef-d'Å“uvre paysager de GaudÃ­ perchÃ© sur les hauteurs de Barcelone offrant une harmonie totale entre pierre et nature.",
            it: 'Realizzato da GaudÃ­ per Eusebi GÃ¼ell, questo parco fonde architettura organica e natura con vista spettacolare sul mare.',
        },
    },
    {
        id: 'place-gothic-quarter',
        slug: 'gothic-quarter',
        category: 'History',
        address: 'Barri GÃ²tic, 08002 Barcelona',
        coordinates: { lat: 41.3833, lng: 2.1764 },
        imageUrl: '/famous-places/04_gothic_quarter.png',
        recommendedDuration: '2 - 3 hours',
        name: {
            en: 'Gothic Quarter (Barri GÃ²tic)',
            es: 'Barrio GÃ³tico (Barri GÃ²tic)',
            fr: 'Quartier Gothique (Barri GÃ²tic)',
            it: 'Quartiere Gotico (Barri GÃ²tic)',
        },
        shortDescription: {
            en: 'Atmospheric medieval heart of Barcelona with labyrinthine stone alleyways and Roman walls.',
            es: 'CorazÃ³n medieval de Barcelona con callejuelas laberÃ­nticas, murallas romanas y plazas centenarias.',
            fr: 'Le cÅ“ur mÃ©diÃ©val envoÃ»tant de Barcelone avec ruelles pavÃ©es, vestiges romains et cathÃ©drale.',
            it: 'Il suggestivo centro medievale di Barcellona con vicoli in pietra, mura romane e piazze intime.',
        },
        description: {
            en: 'Home to the Cathedral of Santa EulÃ lia, PlaÃ§a del Rei, and quaint tapas bars tucked away in thousand-year-old stone buildings.',
            es: 'Alberga la Catedral de Santa EulÃ lia, la PlaÃ§a del Rei y encantadoras tabernas en palacetes milenarios.',
            fr: "Abrite la majestueuse cathÃ©drale de la Sainte-Croix, la PlaÃ§a del Rei et d'innombrables trÃ©sors cachÃ©s.",
            it: 'Ospita la maestosa Cattedrale di Santa EulÃ lia, PlaÃ§a del Rei e storici locali di tapas.',
        },
    },
    {
        id: 'place-casa-batllo',
        slug: 'casa-batllo',
        category: 'Architecture',
        address: 'Passeig de GrÃ cia, 43, 08007 Barcelona',
        coordinates: { lat: 41.3917, lng: 2.1649 },
        imageUrl: '/famous-places/05_casa_batllo.png',
        recommendedDuration: '1.5 hours',
        name: {
            en: 'Casa BatllÃ³',
            es: 'Casa BatllÃ³',
            fr: 'Casa BatllÃ³',
            it: 'Casa BatllÃ³',
        },
        shortDescription: {
            en: "GaudÃ­'s colorful marine-inspired modernist fantasy on prestigious Passeig de GrÃ cia.",
            es: 'FantasÃ­a modernista de GaudÃ­ inspirada en el ocÃ©ano en el seÃ±orial Passeig de GrÃ cia.',
            fr: 'FaÃ§ade fÃ©erique ondulÃ©e aux tons marins rÃ©alisÃ©e par GaudÃ­ sur le Passeig de GrÃ cia.',
            it: 'Fantasia modernista di GaudÃ­ inspirata al mondo marino nel prestigioso Passeig de GrÃ cia.',
        },
        description: {
            en: 'Known locally as the House of Bones (Casa dels ossos), famous for its dragon-back arched roof and radiant mosaic facade.',
            es: 'Conocida popularmente como la Casa de los huesos, cÃ©lebre por su tejado en forma de lomo de dragÃ³n y fachada iridiscente.',
            fr: "Connue sous le nom de Maison des os, cÃ©lÃ¨bre pour son toit en Ã©caille de dragon et sa faÃ§ade irisÃ©e.",
            it: 'Celebre come Casa delle Ossa per le sue forme scultoree, il tetto a dorso di drago e i balconi fiabeschi.',
        },
    },
    {
        id: 'place-montjuic',
        slug: 'montjuic',
        category: 'History',
        address: 'MontjuÃ¯c, 08038 Barcelona',
        coordinates: { lat: 41.3638, lng: 2.1645 },
        imageUrl: '/famous-places/06_montjuic_castle_olympic_hill.png',
        recommendedDuration: '3 - 4 hours',
        name: {
            en: 'MontjuÃ¯c Castle & Olympic Hill',
            es: 'MontjuÃ¯c: Castillo y Anillo OlÃ­mpico',
            fr: 'MontjuÃ¯c : ChÃ¢teau et Colline Olympique',
            it: 'Collina di MontjuÃ¯c e Castello',
        },
        shortDescription: {
            en: 'Picturesque hillside featuring military fortress, MNAC Museum, Magic Fountain, and 1992 Olympic stadiums.',
            es: 'Colina seÃ±orial con fortaleza militar, museo MNAC, Fuente MÃ¡gica y el estadio olÃ­mpico de 1992.',
            fr: 'Colline verdoyante surplombant la ville avec sa forteresse, le MNAC et le parc olympique de 1992.',
            it: 'Verde colle che domina Barcellona con fortezza storica, museo MNAC e impianti olimpici del 1992.',
        },
        description: {
            en: 'Offering panoramic 360-degree vistas over the Mediterranean Sea, commercial port, and the entire city grid.',
            es: 'Ofrece unas vistas panorÃ¡micas de 360 grados sobre el mar MediterrÃ¡neo, el puerto y toda la trama urbana.',
            fr: 'Offre une vue imprenable Ã  360 degrÃ©s sur la mer MÃ©diterranÃ©e, les quais et toute la citÃ© catalane.',
            it: "Offre una vista a 360 gradi sul Mar Mediterraneo, sul porto crociere e sull'intera cittÃ .",
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
            es: 'Playa de la Barceloneta y Paseo MarÃ­timo',
            fr: 'Plage de la Barceloneta & Front de Mer',
            it: 'Spiaggia della Barceloneta e Lungomare',
        },
        shortDescription: {
            en: 'Lively golden sand beach lined with traditional seafood chiringuitos and palm-fringed walkways.',
            es: 'Playa de arena dorada con chiringuitos de marisco fresco, palmeras y animado paseo marÃ­timo.',
            fr: 'Plage dorÃ©e bordÃ©e de restaurants de fruits de mer, palmiers et ambiance mÃ©diterranÃ©enne.',
            it: 'La celebre spiaggia dorata con storici chiringuitos di pesce fresco e passeggiata con palme.',
        },
        description: {
            en: "A historic fishermen's district converted into Barcelona's coastal hot spot for swimming, paella, and ocean breezes.",
            es: 'Antiguo barrio marinero convertido en el epicentro costero para degustar paella, baÃ±arse y pasear.',
            fr: "Ancien quartier de pÃªcheurs devenu le rendez-vous incontournable pour dÃ©guster une paella au bord de l'eau.",
            it: 'Antico borgo di pescatori trasformato nel cuore balneare della cittÃ  per gustare la paella in riva al mare.',
        },
    },
    {
        id: 'place-passeig-de-gracia',
        slug: 'passeig-de-gracia',
        category: 'Shopping',
        address: 'Passeig de GrÃ cia, 08007 Barcelona',
        coordinates: { lat: 41.3935, lng: 2.1634 },
        imageUrl: '/famous-places/08_passeig-de-gracia.png',
        recommendedDuration: '2 hours',
        name: {
            en: 'Passeig de GrÃ cia & Luxury Shopping',
            es: 'Passeig de GrÃ cia y Milla de Oro',
            fr: 'Passeig de GrÃ cia & Boutiques de Luxe',
            it: 'Passeig de GrÃ cia e Shopping di Lusso',
        },
        shortDescription: {
            en: "Barcelona's most elegant boulevard, home to haute couture boutiques and modernist architecture.",
            es: 'La avenida mÃ¡s aristocrÃ¡tica y distinguida de Barcelona con firmas de alta costura y obras maestras.',
            fr: 'La prestigieuse avenue barcelonaise rÃ©unissant boutiques de haute couture et joyaux architecturaux.',
            it: 'Il viale piÃ¹ elegante di Barcellona con boutique di alta moda e palazzi nobiliari modernisti.',
        },
        description: {
            en: 'Stroll past Casa MilÃ  (La Pedrera), Casa BatllÃ³, luxury designer flagships (Chanel, Loewe, HermÃ¨s), and Michelin-starred restaurants.',
            es: 'Pasea entre La Pedrera, Casa BatllÃ³, boutiques de renombre internacional (Loewe, Chanel) y restaurantes con estrella Michelin.',
            fr: 'FlÃ¢nez entre La Pedrera, Casa BatllÃ³, les plus grandes maisons de luxe et tables Ã©toilÃ©es.',
            it: 'Passeggia tra Casa MilÃ  (La Pedrera), Casa BatllÃ³, boutique di alta moda e ristoranti gourmet.',
        },
    },
    {
        id: 'place-palau-musica',
        slug: 'palau-de-la-musica',
        category: 'Culture',
        address: 'C/ Palau de la MÃºsica, 4-6, 08003 Barcelona',
        coordinates: { lat: 41.3876, lng: 2.1753 },
        imageUrl: '/famous-places/09_palau-de-la-musica-catalana.png',
        recommendedDuration: '1.5 hours',
        name: {
            en: 'Palau de la MÃºsica Catalana',
            es: 'Palau de la MÃºsica Catalana',
            fr: 'Palais de la Musique Catalane',
            it: 'Palazzo della Musica Catalana',
        },
        shortDescription: {
            en: 'UNESCO-listed concert hall famous for its astonishing stained-glass skylight dome.',
            es: 'Auditorio modernista declarado Patrimonio de la Humanidad con una cÃºpula de vidriera inigualable.',
            fr: 'Salle de concert inscrite Ã  l\'UNESCO rÃ©putÃ©e pour sa verriÃ¨re centrale baignÃ©e de lumiÃ¨re naturelle.',
            it: 'Auditorium patrimonio UNESCO celebre per la spettacolare cupola di cristallo policromo.',
        },
        description: {
            en: 'Designed by LluÃ­s DomÃ¨nech i Montaner, this architectural treasure is the only concert venue in Europe illuminated entirely by natural daylight.',
            es: 'DiseÃ±ado por DomÃ¨nech i Montaner, es la Ãºnica sala de conciertos de Europa iluminada exclusivamente con luz natural durante el dÃ­a.',
            fr: "Chef-d'Å“uvre de DomÃ¨nech i Montaner, c'est la seule salle de concert europÃ©enne entiÃ¨rement Ã©clairÃ©e par la lumiÃ¨re du jour.",
            it: 'Capolavoro di DomÃ¨nech i Montaner, unica sala concerti europea illuminata interamente dalla luce naturale.',
        },
    },
    {
        id: 'place-camp-nou',
        slug: 'camp-nou-stadium',
        category: 'Sports',
        address: "C/ d'ArÃ­stides Maillol, 12, 08028 Barcelona",
        coordinates: { lat: 41.3809, lng: 2.1228 },
        imageUrl: '/famous-places/10_spotify-camp-nou.png',
        recommendedDuration: '2 - 3 hours',
        name: {
            en: 'Spotify Camp Nou & FC Barcelona Museum',
            es: 'Spotify Camp Nou y Museo del FC Barcelona',
            fr: 'Spotify Camp Nou & MusÃ©e du FC Barcelone',
            it: "Spotify Camp Nou e Museo dell'FC Barcellona",
        },
        shortDescription: {
            en: 'The legendary temple of world football and home of FC Barcelona.',
            es: 'El mÃ­tico templo del fÃºtbol mundial y casa del FC Barcelona.',
            fr: 'Le sanctuaire mythique du football mondial et stade historique du FC Barcelone.',
            it: "Il leggendario tempio del calcio mondiale e casa dell'FC Barcellona.",
        },
        description: {
            en: 'Visit the immersive BarÃ§a Museum, championship trophies, and the revitalized stadium complex honoring football legends.',
            es: 'Visita el museo inmersivo del BarÃ§a, las Copas de Europa y el emblemÃ¡tico estadio en el corazÃ³n de Les Corts.',
            fr: 'Explorez le musÃ©e immersif, les trophÃ©es de lÃ©gende et le mythique complexe sportif du BarÃ§a.',
            it: 'Visita il museo immersivo del BarÃ§a, la sala dei trofei e lo storico stadio dei campioni blaugrana.',
        },
    },
];
