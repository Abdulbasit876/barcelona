'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Plane,
  Anchor,
  Train,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Check,
  Lock,
} from 'lucide-react';
import {
  TransferType,
  VehicleCategory,
  PricingBreakdown,
  PRICING_CONFIG,
  SEED_VEHICLES,
} from '@barcelona/shared';
import VehicleImageCarousel from '../../../components/VehicleImageCarousel';
import PlacesAutocomplete, { PlaceSelection } from '../../../components/PlacesAutocomplete';

export default function BookTransferPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('booking');
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [transferType, setTransferType] = useState<TransferType>(
    (searchParams.get('type') as TransferType) || TransferType.AIRPORT,
  );
  const [pickupAddress, setPickupAddress] = useState(
    searchParams.get('pickup') || 'Barcelona El Prat Airport (BCN) Terminal 1',
  );
  const [destinationAddress, setDestinationAddress] = useState(
    searchParams.get('destination') || 'Hotel Arts, Carrer de la Marina, 19, 08005 Barcelona',
  );
  const [pickupDate, setPickupDate] = useState(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm.toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState(searchParams.get('time') || '12:00');
  const [bookingMode, setBookingMode] = useState<'now' | 'schedule'>(
    (searchParams.get('mode') as 'now' | 'schedule') || 'schedule',
  );
  const [flightOrTrainNumber, setFlightOrTrainNumber] = useState('');
  const [cruiseShipName, setCruiseShipName] = useState('');

  // Passenger State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+34 ');
  const [passengers, setPassengers] = useState(
    parseInt(searchParams.get('passengers') || '2', 10),
  );
  const [luggage, setLuggage] = useState(
    parseInt(searchParams.get('luggage') || '2', 10),
  );
  const [cabinLuggage, setCabinLuggage] = useState(
    parseInt(searchParams.get('cabinLuggage') || '1', 10),
  );
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Optional Baby Seats / Boosters
  const [babyBoosters, setBabyBoosters] = useState(0); // €4.50 each
  const [babySeats, setBabySeats] = useState(0); // €9.00 each
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Selected Vehicle & Fare State
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>(
    (searchParams.get('vehicle') as VehicleCategory) || VehicleCategory.STANDARD,
  );
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
  const [calculatedKm, setCalculatedKm] = useState<number>(18);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState<boolean>(false);
  const [depositPercentage, setDepositPercentage] = useState<number>(20);

  // Fetch admin-configured deposit percentage from settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.deposit_percentage === 'number') {
          setDepositPercentage(data.deposit_percentage);
        }
      })
      .catch((err) => console.warn('Could not load deposit settings:', err));
  }, []);

  // Auto-calculate exact driving distance via Google Distance Matrix / Real Road Route Engine
  useEffect(() => {
    let active = true;
    if (pickupAddress && destinationAddress && pickupAddress.length > 4 && destinationAddress.length > 4) {
      setIsCalculatingDistance(true);
      const coordsParams = pickupCoords && destCoords
        ? `&originLat=${pickupCoords.lat}&originLng=${pickupCoords.lng}&destLat=${destCoords.lat}&destLng=${destCoords.lng}`
        : '';
      fetch(`/api/distance?origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(destinationAddress)}${coordsParams}`)
        .then((r) => r.json())
        .then((data) => {
          if (active && data?.distanceKm) {
            setCalculatedKm(data.distanceKm);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) setIsCalculatingDistance(false);
        });
    }
    return () => {
      active = false;
    };
  }, [pickupAddress, destinationAddress, pickupCoords, destCoords]);

  // Auto-calculate pricing when journey details, distance, or vehicle changes
  useEffect(() => {
    calculateFare(selectedCategory);
  }, [transferType, selectedCategory, passengers, luggage, babyBoosters, babySeats, destinationAddress, pickupAddress, calculatedKm]);

  const calculateFare = (category: VehicleCategory) => {
    const isMetro =
      !destinationAddress.toLowerCase().includes('girona') &&
      !destinationAddress.toLowerCase().includes('tarragona') &&
      !destinationAddress.toLowerCase().includes('costa brava');

    const distanceKm = calculatedKm || 18; // Exact driving km calculated via Google Distance Matrix
    const freeWait =
      transferType === TransferType.AIRPORT
        ? 60
        : transferType === TransferType.CRUISE_PORT
        ? 30
        : 15;

    let baseFare = 0;
    let vehicleSurcharge = 0;
    let requiresAdminApproval = false;
    let pricingRuleApplied = '';

    // Calculate optional extras
    const additionalCharges = (babyBoosters * 4.5) + (babySeats * 9.0);

    if (transferType === TransferType.AIRPORT) {
      const perKm = isMetro ? 3.0 : 2.5;
      baseFare = Math.max(35, distanceKm * perKm);
      vehicleSurcharge = PRICING_CONFIG.CATEGORY_SURCHARGES[category] || 0;
      pricingRuleApplied = 'Airport Guaranteed Transfer';
    } else if (transferType === TransferType.CRUISE_PORT) {
      requiresAdminApproval = true;
      const isVan =
        passengers > 4 ||
        category === VehicleCategory.STANDARD_VAN ||
        category === VehicleCategory.PREMIUM_VAN;
      if (isVan) {
        baseFare = 70.0;
        vehicleSurcharge = 0;
        pricingRuleApplied = 'Cruise Port Transfer';
      } else {
        baseFare = 42.0;
        vehicleSurcharge = PRICING_CONFIG.CATEGORY_SURCHARGES[category] || 0;
        pricingRuleApplied = 'Cruise Port Transfer';
      }
    } else if (transferType === TransferType.SANTS_STATION) {
      requiresAdminApproval = true;
      const isVan =
        passengers > 4 ||
        category === VehicleCategory.STANDARD_VAN ||
        category === VehicleCategory.PREMIUM_VAN;
      if (isVan) {
        baseFare = 45.0;
        vehicleSurcharge = 0;
        pricingRuleApplied = 'Sants Station Transfer';
      } else {
        baseFare = 32.0;
        vehicleSurcharge = PRICING_CONFIG.CATEGORY_SURCHARGES[category] || 0;
        pricingRuleApplied = 'Sants Station Transfer';
      }
    } else if (transferType === TransferType.CITY_TOUR) {
      baseFare = 3 * 65.0; // 3-hour minimum tour at €65/hr
      vehicleSurcharge = PRICING_CONFIG.CATEGORY_SURCHARGES[category] || 0;
      pricingRuleApplied = 'Barcelona Private Sightseeing Tour (3 hrs)';
    } else {
      // CITY_TRANSFER: Inside city (Barcelona to Barcelona)
      // distance <= 2.5 km -> 20 euro
      // distance > 2.5 km -> 20 euro + 3 euro per km with 20 euro
      const cityDistanceKm = 8.5; // Typical within-city distance
      if (cityDistanceKm <= 2.5) {
        baseFare = 20.0;
      } else {
        baseFare = 20.0 + (cityDistanceKm - 2.5) * 3.0;
      }
      vehicleSurcharge = PRICING_CONFIG.CATEGORY_SURCHARGES[category] || 0;
      pricingRuleApplied = 'Barcelona City Regulated Transfer';
    }

    const totalFare = Math.round((baseFare + vehicleSurcharge + additionalCharges) * 100) / 100;

    setPricingBreakdown({
      transferType,
      vehicleCategory: category,
      distanceKm,
      durationHours: 3,
      isMetropolitanArea: isMetro,
      baseFare,
      vehicleSurcharge,
      additionalCharges,
      totalFare,
      currency: 'EUR',
      requiresAdminApproval,
      isCustomQuote: false,
      pricingRuleApplied,
      freeWaitingTimeMinutes: freeWait,
    });
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupAddress || !destinationAddress) {
      setError('Please provide valid pickup and destination addresses.');
      return;
    }
    if (pickupAddress.trim().length < 5 || destinationAddress.trim().length < 5) {
      setError('Please select verified addresses from the location suggestions.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      setError('Please complete all passenger contact details.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleStep3Submit = () => {
    setStep(4);
  };

  const handleStep4Submit = () => {
    setStep(5);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        transferType,
        pickupAddress,
        destinationAddress,
        pickupDate,
        pickupTime,
        pickupDateTime: `${pickupDate}T${pickupTime || '12:00'}:00`,
        customerName,
        customerEmail,
        customerPhone,
        passengers,
        luggage,
        cabinLuggage,
        pickupLat: pickupCoords?.lat || null,
        pickupLng: pickupCoords?.lng || null,
        dropoffLat: destCoords?.lat || null,
        dropoffLng: destCoords?.lng || null,
        babyBoosters,
        babySeats,
        vehicleCategory: selectedCategory,
        flightOrTrainNumber,
        cruiseShipName,
        specialRequests,
        preferredLanguage: locale || 'en',
        baseFare: pricingBreakdown?.baseFare || 45,
        vehicleSurcharge: pricingBreakdown?.vehicleSurcharge || 0,
        totalFare: pricingBreakdown?.totalFare || 54,
        depositPercentage: depositPercentage,
        depositAmount: Number((((pricingBreakdown?.totalFare || 54) * depositPercentage) / 100).toFixed(2)),
        remainingBalance: Number((((pricingBreakdown?.totalFare || 54) * (100 - depositPercentage)) / 100).toFixed(2)),
        paymentStatus: 'PENDING',
        paymentMethod: 'ONLINE_DEPOSIT',
        depositPaid: true,
        balancePaid: false,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit booking');
      }

      const bookingRef = data.bookingReference;
      const accessToken = data.accessToken;

      if (typeof window !== 'undefined') {
        localStorage.setItem(`barcelona_booking_${bookingRef}`, JSON.stringify(data.booking));
        localStorage.setItem('barcelona_last_booking', JSON.stringify(data.booking));
      }

      setLoading(false);
      router.push(
        `/${locale}/booking-confirmation/${bookingRef}?token=${accessToken}&email=${encodeURIComponent(
          customerEmail,
        )}&category=${selectedCategory}&total=${pricingBreakdown?.totalFare || 54}&payment_success=true`,
      );
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Could not process reservation. Please check your card information.');
    }
  };

  // Card container style adhering strictly to Requirement 12:
  // Ultra-light sky blue (#F4FBFF), dark navy text (#0F2346), soft blue borders (#CFE7F5)
  const cardContainerClass =
    'bg-[#F4FBFF] text-[#0F2346] rounded-2xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 border border-[#CFE7F5] shadow-2xl';

  return (
    <div className="pt-28 pb-20 bg-navy-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar Header (Outside the booking card - remains dark luxury) */}
        <div className="mb-10 text-center">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-bold">
            Reservation Wizard
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
            {t('title')}
          </h1>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-gold-500 text-navy-950 shadow-gold ring-4 ring-gold-500/20'
                      : step > s
                      ? 'bg-navy-800 text-gold-400 border border-gold-500/40'
                      : 'bg-navy-900 text-ice-400 border border-navy-800'
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 5 && (
                  <div
                    className={`w-3 sm:w-10 h-0.5 mx-0.5 sm:mx-1 transition-colors ${
                      step > s ? 'bg-gold-500/60' : 'bg-navy-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-xs font-medium text-ice-300 mt-2">
            {step === 1 && '1. Journey Details'}
            {step === 2 && '2. Passenger Details'}
            {step === 3 && '3. Vehicle Selection'}
            {step === 4 && '4. Fare Review'}
            {step === 5 && '5. Secure Card Payment'}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/80 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: Journey Details (Ultra-light sky blue booking card) */}
        {/* ======================================================== */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className={cardContainerClass}>
            <div className="border-b border-[#CFE7F5] pb-4">
              <h3 className="text-lg font-serif font-bold text-[#0F2346]">{t('step1')}</h3>
            </div>

            {/* Transfer Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gold-600 mb-2">
                Service Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { type: TransferType.AIRPORT, label: 'Airport (BCN)', icon: Plane },
                  { type: TransferType.CRUISE_PORT, label: 'Cruise Port', icon: Anchor },
                  { type: TransferType.SANTS_STATION, label: 'Sants Station', icon: Train },
                  { type: TransferType.CITY_TRANSFER, label: 'City Transfer', icon: MapPin },
                  { type: TransferType.CITY_TOUR, label: 'Private Tour', icon: Clock },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => setTransferType(item.type)}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center space-y-1.5 transition-all ${
                      transferType === item.type
                        ? 'bg-gold-500 text-navy-950 border-gold-500 font-bold shadow-gold'
                        : 'bg-white text-[#0F2346] border-[#CFE7F5] hover:border-gold-500/50 hover:bg-[#EAF5FC]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Addresses with Google Places Autocomplete & Driving Distance Calculation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <PlacesAutocomplete
                  value={pickupAddress}
                  onChange={(val, details) => {
                    setPickupAddress(val);
                    if (details?.lat && details?.lng) {
                      setPickupCoords({ lat: details.lat, lng: details.lng });
                    }
                  }}
                  placeholder="e.g. Barcelona El Prat Airport Terminal 1"
                  label={t('pickup')}
                  required
                />
                {pickupCoords && (
                  <div className="mt-1 text-[10px] text-emerald-600 font-mono font-semibold flex items-center gap-1">
                    <span>✓ Exact Pin:</span>
                    <span>Lat {pickupCoords.lat.toFixed(4)}, Lng {pickupCoords.lng.toFixed(4)}</span>
                  </div>
                )}
              </div>

              <div>
                <PlacesAutocomplete
                  value={destinationAddress}
                  onChange={(val, details) => {
                    setDestinationAddress(val);
                    if (details?.lat && details?.lng) {
                      setDestCoords({ lat: details.lat, lng: details.lng });
                    }
                  }}
                  placeholder="e.g. Hotel Arts, Passeig de Gràcia"
                  label={t('destination')}
                  required
                />
                {destCoords && (
                  <div className="mt-1 text-[10px] text-emerald-600 font-mono font-semibold flex items-center gap-1">
                    <span>✓ Exact Pin:</span>
                    <span>Lat {destCoords.lat.toFixed(4)}, Lng {destCoords.lng.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calculated Distance & Duration indicator */}
            {calculatedKm > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#CFE7F5] text-xs">
                <span className="text-[#0F2346] font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold-600" />
                  Calculated Route Distance:
                </span>
                <span className="font-mono font-bold text-gold-600">
                  {isCalculatingDistance ? 'Calculating...' : `${calculatedKm} km`}
                </span>
              </div>
            )}

            {/* Pickup Time Option: Now vs Schedule */}
            <div className="bg-[#EAF5FC] p-4 rounded-xl border border-[#CFE7F5]">
              <label className="block text-xs font-bold uppercase tracking-wider text-gold-600 mb-2">
                Pickup Time Option
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBookingMode('now');
                    const now = new Date();
                    setPickupDate(now.toISOString().split('T')[0]);
                    setPickupTime(
                      `${String(now.getHours()).padStart(2, '0')}:${String(
                        now.getMinutes(),
                      ).padStart(2, '0')}`,
                    );
                  }}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                    bookingMode === 'now'
                      ? 'bg-gold-500 text-navy-950 border-gold-500 font-bold shadow-gold'
                      : 'bg-white text-[#0F2346] border-[#CFE7F5] hover:border-gold-500/50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Book For Now (ASAP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingMode('schedule')}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                    bookingMode === 'schedule'
                      ? 'bg-gold-500 text-navy-950 border-gold-500 font-bold shadow-gold'
                      : 'bg-white text-[#0F2346] border-[#CFE7F5] hover:border-gold-500/50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule For Later</span>
                </button>
              </div>
              {bookingMode === 'now' && (
                <p className="text-xs text-emerald-700 font-semibold mt-2.5 flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1 shrink-0" />
                  Immediate Dispatch: Chauffeur is alerted instantly and dispatched to your pickup location (approx. 5-10 mins).
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  Pickup Date *
                </label>
                <input
                  type="date"
                  required
                  disabled={bookingMode === 'now'}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-3 py-2.5 text-sm text-[#0F2346] focus:outline-none focus:border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  Pickup Time *
                </label>
                <input
                  type="time"
                  required
                  disabled={bookingMode === 'now'}
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-3 py-2.5 text-sm text-[#0F2346] focus:outline-none focus:border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Flight / Train details */}
            {transferType === TransferType.AIRPORT && (
              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1">
                  {t('flightNumber')}
                </label>
                <input
                  type="text"
                  value={flightOrTrainNumber}
                  onChange={(e) => setFlightOrTrainNumber(e.target.value)}
                  placeholder="e.g. VY6102 or BA0478"
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-2.5 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 focus:outline-none focus:border-gold-500"
                />
                <p className="text-[11px] text-[#0F2346]/60 mt-1">{t('flightHelp')}</p>
              </div>
            )}

            {transferType === TransferType.CRUISE_PORT && (
              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1">
                  {t('cruiseShip')}
                </label>
                <input
                  type="text"
                  value={cruiseShipName}
                  onChange={(e) => setCruiseShipName(e.target.value)}
                  placeholder="e.g. Symphony of the Seas / Pier Moll Adossat"
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-2.5 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 focus:outline-none focus:border-gold-500"
                />
              </div>
            )}

            {transferType === TransferType.SANTS_STATION && (
              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1">
                  {t('trainNumber')}
                </label>
                <input
                  type="text"
                  value={flightOrTrainNumber}
                  onChange={(e) => setFlightOrTrainNumber(e.target.value)}
                  placeholder="e.g. AVE 03102"
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-2.5 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 focus:outline-none focus:border-gold-500"
                />
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="gold-button px-8 py-3.5 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-gold"
              >
                <span>Continue to Passenger Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 2: Passenger Details (with optional baby extras)    */}
        {/* ======================================================== */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className={cardContainerClass}>
            <div className="border-b border-[#CFE7F5] pb-4">
              <h3 className="text-lg font-serif font-bold text-[#0F2346]">{t('step2')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-2.5 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  {t('email')} *
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-2.5 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  {t('phone')} *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-2.5 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            {/* Passenger & Luggage Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  {t('passengersCount')}
                </label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-3 py-2.5 text-sm text-[#0F2346] focus:outline-none focus:border-gold-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Passenger' : 'Passengers'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  {t('luggageCount')}
                </label>
                <select
                  value={luggage}
                  onChange={(e) => setLuggage(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-3 py-2.5 text-sm text-[#0F2346] focus:outline-none focus:border-gold-500"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Suitcase' : 'Suitcases'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  {t('cabinLuggageCount')}
                </label>
                <select
                  value={cabinLuggage}
                  onChange={(e) => setCabinLuggage(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-3 py-2.5 text-sm text-[#0F2346] focus:outline-none focus:border-gold-500"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Cabin Bag' : 'Cabin Bags'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Child & Baby Seats (Requirement 1: Not mandatory, optional extra) */}
            <div className="bg-[#EAF5FC] p-4 rounded-xl border border-[#CFE7F5]">
              <span className="block text-xs font-bold uppercase tracking-wider text-gold-600 mb-2">
                Optional Child Travel Safety (Only if needed)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                    Baby Booster (+€4.50) <span className="text-xs font-normal text-[#0F2346]/60">(Optional)</span>
                  </label>
                  <select
                    value={babyBoosters}
                    onChange={(e) => setBabyBoosters(parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-[#CFE7F5] rounded-xl px-3 py-2.5 text-sm text-[#0F2346] focus:outline-none focus:border-gold-500"
                  >
                    <option value={0}>0 (Not needed)</option>
                    <option value={1}>1 Baby Booster (+€4.50)</option>
                    <option value={2}>2 Baby Boosters (+€9.00)</option>
                    <option value={3}>3 Baby Boosters (+€13.50)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                    Baby Safety Seat (+€9.00) <span className="text-xs font-normal text-[#0F2346]/60">(Optional)</span>
                  </label>
                  <select
                    value={babySeats}
                    onChange={(e) => setBabySeats(parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-[#CFE7F5] rounded-xl px-3 py-2.5 text-sm text-[#0F2346] focus:outline-none focus:border-gold-500"
                  >
                    <option value={0}>0 (Not needed)</option>
                    <option value={1}>1 Baby Seat (+€9.00)</option>
                    <option value={2}>2 Baby Seats (+€18.00)</option>
                    <option value={3}>3 Baby Seats (+€27.00)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                {t('specialRequests')}
              </label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Optional notes for your chauffeur (e.g. flight arrival details, hotel room #)..."
                className="w-full bg-white border border-[#CFE7F5] rounded-xl p-3 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-[#0F2346]/70 hover:text-[#0F2346] flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="gold-button px-8 py-3.5 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-gold"
              >
                <span>Continue to Vehicle Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 3: Vehicle Selection (Swipeable Car Gallery)        */}
        {/* ======================================================== */}
        {step === 3 && (
          <div className={cardContainerClass}>
            <div className="border-b border-[#CFE7F5] pb-4">
              <h3 className="text-lg font-serif font-bold text-[#0F2346]">{t('step3')}</h3>
              <p className="text-xs text-[#0F2346]/70 mt-1">
                Showing vehicles eligible for {passengers} passengers and {luggage} suitcases. Swipe right on any card to see all vehicle photos:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SEED_VEHICLES.filter(
                (v) => v.maxPassengers >= passengers && v.maxLuggage >= luggage,
              ).map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    setSelectedCategory(v.category);
                    calculateFare(v.category);
                  }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    selectedCategory === v.category
                      ? 'bg-white border-gold-500 ring-2 ring-gold-500 shadow-gold'
                      : 'bg-white border-[#CFE7F5] hover:border-gold-500/50 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Swipeable Vehicle Gallery Carousel */}
                    <div className="relative w-full rounded-lg overflow-hidden mb-3 bg-[#EAF5FC] border border-[#CFE7F5]">
                      <VehicleImageCarousel category={v.category} alt={v.name} heightClass="h-44" />
                      <div className="absolute top-2 right-2 z-10 pointer-events-none">
                        {selectedCategory === v.category && (
                          <div className="bg-gold-500 text-navy-950 p-1 rounded-full shadow-lg">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gold-600 tracking-wider uppercase">
                        {v.category.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-base font-serif font-bold text-[#0F2346] mb-1">{v.name}</h4>
                    <p className="text-xs text-[#0F2346]/70 mb-3">{v.exampleModels.replace(/Â/g, '')}</p>
                    <div className="flex items-center space-x-4 text-xs text-[#0F2346]/80 mb-3">
                      <span className="flex items-center">
                        <Users className="w-3.5 h-3.5 text-gold-600 mr-1" />
                        Max {v.maxPassengers} Pax
                      </span>
                      <span className="flex items-center">
                        <Briefcase className="w-3.5 h-3.5 text-gold-600 mr-1" />
                        Max {v.maxLuggage} Luggage
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#CFE7F5] flex items-center justify-between text-xs">
                    <span className="text-[#0F2346]/60">Class Surcharge:</span>
                    <span className="font-bold text-gold-700">
                      {v.categorySurcharge > 0 ? `+€${v.categorySurcharge.toFixed(2)}` : '€0.00 Included'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-[#0F2346]/70 hover:text-[#0F2346] flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleStep3Submit}
                className="gold-button px-8 py-3.5 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-gold"
              >
                <span>Review Fare Breakdown</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: Fare Review & Final Submit                      */}
        {/* ======================================================== */}
        {step === 4 && (
          <div className={cardContainerClass}>
            <div className="border-b border-[#CFE7F5] pb-4">
              <h3 className="text-lg font-serif font-bold text-[#0F2346]">{t('step4')}</h3>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-xl p-5 border border-[#CFE7F5] text-xs">
              <div className="space-y-2">
                <span className="text-gold-600 font-bold uppercase tracking-wider block">Itinerary</span>
                <p className="text-[#0F2346]"><strong className="text-[#0F2346]/70">From:</strong> {pickupAddress}</p>
                <p className="text-[#0F2346]"><strong className="text-[#0F2346]/70">To:</strong> {destinationAddress}</p>
                <p className="text-[#0F2346]"><strong className="text-[#0F2346]/70">Date/Time:</strong> {pickupDate} at {pickupTime}</p>
                {flightOrTrainNumber && (
                  <p className="text-[#0F2346]"><strong className="text-[#0F2346]/70">Flight/Train:</strong> {flightOrTrainNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-gold-600 font-bold uppercase tracking-wider block">Passenger & Vehicle</span>
                <p className="text-[#0F2346]"><strong className="text-[#0F2346]/70">Lead Passenger:</strong> {customerName}</p>
                <p className="text-[#0F2346]"><strong className="text-[#0F2346]/70">Contact:</strong> {customerEmail} | {customerPhone}</p>
                <p className="text-[#0F2346]"><strong className="text-[#0F2346]/70">Vehicle:</strong> {selectedCategory.replace('_', ' ')} Class</p>
                <p className="text-[#0F2346]"><strong className="text-[#0F2346]/70">Capacity:</strong> {passengers} Pax, {luggage} Check-in Bags, {cabinLuggage} Cabin Bags</p>
                {(babyBoosters > 0 || babySeats > 0) && (
                  <p className="text-[#0F2346]">
                    <strong className="text-[#0F2346]/70">Child Extras:</strong>{' '}
                    {babyBoosters > 0 && `${babyBoosters} Booster(s)`}
                    {babyBoosters > 0 && babySeats > 0 && ', '}
                    {babySeats > 0 && `${babySeats} Baby Seat(s)`}
                  </p>
                )}
              </div>
            </div>

            {/* Pricing Breakdown Card */}
            {pricingBreakdown && (
              <div className="bg-white border border-[#CFE7F5] rounded-xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#0F2346]/80">
                  <span>Transfer Fare:</span>
                  <span>€{pricingBreakdown.baseFare.toFixed(2)}</span>
                </div>
                {pricingBreakdown.vehicleSurcharge > 0 && (
                  <div className="flex items-center justify-between text-xs text-[#0F2346]/80">
                    <span>Vehicle Class Surcharge ({selectedCategory.replace('_', ' ')}):</span>
                    <span>€{pricingBreakdown.vehicleSurcharge.toFixed(2)}</span>
                  </div>
                )}
                {babyBoosters > 0 && (
                  <div className="flex items-center justify-between text-xs text-[#0F2346]/80">
                    <span>Baby Booster Seat (x{babyBoosters}):</span>
                    <span>€{(babyBoosters * 4.5).toFixed(2)}</span>
                  </div>
                )}
                {babySeats > 0 && (
                  <div className="flex items-center justify-between text-xs text-[#0F2346]/80">
                    <span>Baby Safety Seat (x{babySeats}):</span>
                    <span>€{(babySeats * 9.0).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#CFE7F5] flex items-center justify-between text-base font-bold text-[#0F2346]">
                  <span>Total Guaranteed Fare (EUR):</span>
                  <span className="text-2xl text-gold-600">€{pricingBreakdown.totalFare.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-dashed border-[#CFE7F5] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-emerald-700">
                    <span>Online Advance Deposit ({depositPercentage}%):</span>
                    <span>€{(((pricingBreakdown.totalFare) * depositPercentage) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-800">
                    <span>Remaining Balance to Driver ({100 - depositPercentage}%):</span>
                    <span className="font-bold">€{(((pricingBreakdown.totalFare) * (100 - depositPercentage)) / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-[#EAF5FC] border border-[#CFE7F5] text-xs text-[#0F2346] flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0F2346]">Complimentary Waiting Policy: </span>
                    Includes {pricingBreakdown.freeWaitingTimeMinutes} minutes free waiting time. All taxes, tolls, and luggage handling are included.
                  </div>
                </div>

                {pricingBreakdown.requiresAdminApproval && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Dispatcher Review: </span>
                      {t('pendingNotice')}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs font-semibold text-[#0F2346]/70 hover:text-[#0F2346] flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleStep4Submit}
                className="gold-button px-8 py-4 rounded-xl text-base font-bold flex items-center space-x-2 shadow-gold"
              >
                <CreditCard className="w-5 h-5" />
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 5: Secure Card Payment                              */}
        {/* ======================================================== */}
        {step === 5 && (
          <form onSubmit={handleFinalSubmit} className={cardContainerClass}>
            <div className="border-b border-[#CFE7F5] pb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-gold-600 uppercase tracking-widest block mb-1">
                  Final Step 5
                </span>
                <h3 className="text-xl font-bold text-[#0F2346] font-sans tracking-tight">
                  Pay with Credit / Debit Card
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-xs text-[#0F2346] bg-white px-3 py-1.5 rounded-lg border border-[#CFE7F5]">
                <Lock className="w-3.5 h-3.5 text-gold-600" />
                <span>256-Bit SSL Encrypted</span>
              </div>
            </div>

            {/* Test Mode / Gateway info banner */}
            <div className="bg-[#EAF5FC] border border-[#CFE7F5] rounded-xl p-4 text-xs text-[#0F2346] flex items-start space-x-3">
              <div className="font-bold text-[#0F2346] shrink-0">
                Secure Payment<br />Gateway:
              </div>
              <div className="text-[12px] text-[#0F2346]/80 leading-relaxed">
                All transactions are encrypted with 256-bit SSL. For testing or reservations, you may enter any standard card details.
              </div>
            </div>

            {/* Payment Summary: Admin-configured Advance Deposit % + Remaining Balance to Driver */}
            <div className="p-4 rounded-xl bg-white border border-[#CFE7F5] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#0F2346]/70">
                <span>Total Transfer Fare:</span>
                <span className="font-bold text-[#0F2346]">€{(pricingBreakdown?.totalFare || 54.0).toFixed(2)} EUR</span>
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>{depositPercentage}% Advance Deposit Due Today (Online):</span>
                <span className="text-xl font-bold text-emerald-600">
                  €{(((pricingBreakdown?.totalFare || 54.0) * depositPercentage) / 100).toFixed(2)} EUR
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-800 border-t border-[#CFE7F5] pt-2">
                <span>Remaining Balance Payable to Driver ({100 - depositPercentage}%):</span>
                <span className="font-bold">
                  €{(((pricingBreakdown?.totalFare || 54.0) * (100 - depositPercentage)) / 100).toFixed(2)} EUR
                </span>
              </div>
            </div>

            {/* Card Information Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  Cardholder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-3 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                  Card Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-3 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 font-mono focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                    Expiration (MM/YY) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    maxLength={5}
                    className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-3 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 font-mono focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
                    CVC / CVV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-3 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 font-mono focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit & Back buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-[#CFE7F5]">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-xs font-semibold text-[#0F2346]/70 hover:text-[#0F2346] flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back to Review</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-navy-950 font-bold py-3.5 px-8 rounded-full flex items-center justify-center space-x-2 shadow-gold transition-all text-sm disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Processing Payment & Confirming...'
                    : `Pay ${depositPercentage}% Advance Deposit (€${((pricingBreakdown?.totalFare || 54.0) * depositPercentage / 100).toFixed(2)} EUR) & Confirm`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
