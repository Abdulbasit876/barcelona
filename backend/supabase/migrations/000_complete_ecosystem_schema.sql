-- ==============================================================================
-- Barcelona Taxi Transfer - Complete Unified Ecosystem Database Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ognvbtzvblxgjimpecsx/sql
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    example_models TEXT NOT NULL,
    max_passengers INT NOT NULL,
    max_luggage INT NOT NULL,
    category_surcharge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Admin Users Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN', -- 'SUPER_ADMIN', 'ADMIN', 'DISPATCHER'
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Drivers Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    vehicle_plate VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_color VARCHAR(50) DEFAULT 'Black',
    license_number VARCHAR(100),
    assigned_categories TEXT[] DEFAULT ARRAY['ECONOMY', 'STANDARD', 'PREMIUM', 'STANDARD_VAN', 'PREMIUM_VAN', 'ELECTRIC', 'LARGE_GROUP'],
    rating NUMERIC(3,2) DEFAULT 5.00,
    total_trips INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_available BOOLEAN NOT NULL DEFAULT true,
    current_status VARCHAR(50) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'ON_TRIP', 'BREAK', 'OFFLINE'
    current_lat NUMERIC(10,7) DEFAULT 41.3879,
    current_lng NUMERIC(10,7) DEFAULT 2.16992,
    last_location_update TIMESTAMPTZ DEFAULT NOW(),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(50) NOT NULL UNIQUE,
    access_token VARCHAR(255) NOT NULL UNIQUE,
    transfer_type VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(50) NOT NULL REFERENCES public.vehicles(category) ON UPDATE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    approval_status VARCHAR(50) DEFAULT 'APPROVED', -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'REFUNDED', 'FAILED'
    payment_method VARCHAR(50) DEFAULT 'ONLINE_DEPOSIT', -- 'FULL_ONLINE', 'ONLINE_DEPOSIT', 'CASH_TO_DRIVER'
    pickup_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    pickup_datetime TIMESTAMPTZ NOT NULL,
    passengers INT NOT NULL DEFAULT 1,
    luggage INT NOT NULL DEFAULT 0,
    child_seats INT NOT NULL DEFAULT 0,
    baby_booster INT NOT NULL DEFAULT 0,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    flight_or_train_number VARCHAR(50),
    flight_details JSONB,
    cruise_ship_name VARCHAR(100),
    special_requests TEXT,
    admin_notes TEXT,
    driver_notes TEXT,
    preferred_language VARCHAR(10) DEFAULT 'en',
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    total_fare NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    deposit_percentage NUMERIC(5,2) DEFAULT 20.00,
    deposit_amount NUMERIC(10,2) DEFAULT 0.00,
    remaining_balance NUMERIC(10,2) DEFAULT 0.00,
    deposit_paid BOOLEAN DEFAULT false,
    balance_paid BOOLEAN DEFAULT false,
    waiting_time_extra_charge NUMERIC(10,2) DEFAULT 0.00,
    waiting_time_reported_minutes INT DEFAULT 0,
    cancellation_reason TEXT,
    fare_breakdown JSONB,
    stripe_payment_intent_id VARCHAR(100),
    stripe_customer_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Rides Execution & Tracking Table
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED', -- 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED_AT_PICKUP', 'PASSENGER_ONBOARD', 'COMPLETED', 'CANCELLED'
    started_at TIMESTAMPTZ,
    arrived_pickup_at TIMESTAMPTZ,
    passenger_boarded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    pickup_lat NUMERIC(10,7),
    pickup_lng NUMERIC(10,7),
    dropoff_lat NUMERIC(10,7),
    dropoff_lng NUMERIC(10,7),
    route_points JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_role VARCHAR(50) NOT NULL, -- 'ADMIN', 'DRIVER', 'CUSTOMER'
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type VARCHAR(50) NOT NULL, -- 'ADMIN', 'DRIVER', 'SYSTEM', 'CUSTOMER'
    actor_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Famous Places Table
CREATE TABLE IF NOT EXISTS public.famous_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    category VARCHAR(50),
    lat NUMERIC(10,7),
    lng NUMERIC(10,7),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Helper RPC Function to execute administrative SQL if called by service role
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE query;
    RETURN 'SUCCESS';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$;

-- 12. Automated Updated_At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER tr_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER tr_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_drivers_updated_at ON public.drivers;
CREATE TRIGGER tr_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_bookings_updated_at ON public.bookings;
CREATE TRIGGER tr_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_rides_updated_at ON public.rides;
CREATE TRIGGER tr_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 14. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_access_token ON public.bookings(access_token);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_datetime ON public.bookings(pickup_datetime);
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON public.drivers(phone);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON public.drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(current_status);
CREATE INDEX IF NOT EXISTS idx_rides_booking_id ON public.rides(booking_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);

-- 15. Row Level Security (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.famous_places ENABLE ROW LEVEL SECURITY;

-- Vehicles Policies
DROP POLICY IF EXISTS "Public can view active vehicles" ON public.vehicles;
CREATE POLICY "Public can view active vehicles" ON public.vehicles FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Service role full access on vehicles" ON public.vehicles;
CREATE POLICY "Service role full access on vehicles" ON public.vehicles FOR ALL USING (true);

-- Famous Places Policies
DROP POLICY IF EXISTS "Public can view famous places" ON public.famous_places;
CREATE POLICY "Public can view famous places" ON public.famous_places FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Service role full access on famous places" ON public.famous_places;
CREATE POLICY "Service role full access on famous places" ON public.famous_places FOR ALL USING (true);

-- Reviews Policies
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
CREATE POLICY "Public can submit reviews" ON public.reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access on reviews" ON public.reviews;
CREATE POLICY "Service role full access on reviews" ON public.reviews FOR ALL USING (true);

-- Bookings Policies
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
CREATE POLICY "Public can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can view their own booking with token" ON public.bookings;
CREATE POLICY "Public can view their own booking with token" ON public.bookings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role full access on bookings" ON public.bookings;
CREATE POLICY "Service role full access on bookings" ON public.bookings FOR ALL USING (true);

-- Drivers Policies
DROP POLICY IF EXISTS "Public can view basic driver info for assigned bookings" ON public.drivers;
CREATE POLICY "Public can view basic driver info for assigned bookings" ON public.drivers FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Service role full access on drivers" ON public.drivers;
CREATE POLICY "Service role full access on drivers" ON public.drivers FOR ALL USING (true);

-- Admin Users Policies
DROP POLICY IF EXISTS "Service role full access on admin_users" ON public.admin_users;
CREATE POLICY "Service role full access on admin_users" ON public.admin_users FOR ALL USING (true);

-- Rides Policies
DROP POLICY IF EXISTS "Service role full access on rides" ON public.rides;
CREATE POLICY "Service role full access on rides" ON public.rides FOR ALL USING (true);

-- Notifications & Audit Logs Policies
DROP POLICY IF EXISTS "Service role full access on notifications" ON public.notifications;
CREATE POLICY "Service role full access on notifications" ON public.notifications FOR ALL USING (true);
DROP POLICY IF EXISTS "Service role full access on audit_logs" ON public.audit_logs;
CREATE POLICY "Service role full access on audit_logs" ON public.audit_logs FOR ALL USING (true);

-- 16. Seed Default Vehicles
INSERT INTO public.vehicles (category, name, example_models, max_passengers, max_luggage, category_surcharge, image_url, features)
VALUES 
('ECONOMY', 'Economy', 'Toyota Corolla, Toyota Corolla Touring Sports, Toyota Prius+, Similar vehicles', 4, 4, 0.00, '/images/cars/economy.png', '["Air Conditioning", "Free WiFi", "Bottled Water"]'),
('STANDARD', 'Standard Sedan', 'Toyota Camry, Lexus ES, Toyota RAV4, Equivalent vehicles', 4, 3, 10.00, '/images/cars/standard.png', '["Leather Interior", "Bottled Water", "Mobile Charger"]'),
('PREMIUM', 'Premium Sedan', 'Mercedes-Benz E 220, High-spec Lexus ES, Similar high-end vehicles', 3, 3, 25.00, '/images/cars/premium.png', '["Chauffeur Service", "Complimentary Refreshments", "Executive Amenities"]'),
('STANDARD_VAN', 'Standard Van', 'Volkswagen Caddy Maxi, Mercedes-Benz Vito Tourer', 7, 7, 35.00, '/images/cars/standard_van.png', '["Spacious Luggage Trunk", "Dual AC", "Group Comfort"]'),
('PREMIUM_VAN', 'Premium / Group Van', 'Mercedes-Benz V-Class, Volkswagen Caravelle, Ford Tourneo Custom', 8, 8, 55.00, '/images/cars/premium_van.png', '["Conference Seating", "Privacy Tinted Glass", "Luxury Leather", "Ambient Lighting"]'),
('ELECTRIC', 'Electric / Green Transfer', 'Tesla Model 3, Tesla Model Y, Mercedes-Benz EQE, Similar electric vehicles', 4, 3, 15.00, '/images/cars/electric.png', '["Zero Emissions", "Quiet Smooth Ride", "High-Tech Cabin"]'),
('LARGE_GROUP', 'Large Group Transfers', 'Minibuses, Midibuses, Coaches, Multiple vehicles booked together', 16, 20, 120.00, '/images/cars/large_group.png', '["PA System", "Large Panoramic Windows", "Dedicated Luggage Bay"]')
ON CONFLICT (category) DO UPDATE SET
    name = EXCLUDED.name,
    example_models = EXCLUDED.example_models,
    max_passengers = EXCLUDED.max_passengers,
    max_luggage = EXCLUDED.max_luggage,
    category_surcharge = EXCLUDED.category_surcharge;

-- 17. Seed Initial Super Admin (Links with bookings.barcelonataxitransfer@gmail.com)
INSERT INTO public.admin_users (email, name, role, is_active)
VALUES ('bookings.barcelonataxitransfer@gmail.com', 'Barcelona Taxi Transfer Admin', 'SUPER_ADMIN', true)
ON CONFLICT (email) DO UPDATE SET role = 'SUPER_ADMIN', is_active = true;

-- Update user_id if already present in auth.users
UPDATE public.admin_users a
SET user_id = u.id
FROM auth.users u
WHERE a.email = u.email AND a.user_id IS NULL;

-- 18. Seed Initial Sample Drivers for Immediate Testing
INSERT INTO public.drivers (name, phone, email, vehicle_plate, vehicle_model, vehicle_color, rating, total_trips, is_active, is_available, current_status)
VALUES 
('Carlos Mendoza', '+34 611 789 012', 'carlos.mendoza@btt.com', '4829-LTM', 'Mercedes-Benz E 220 Black', 'Black', 4.95, 420, true, true, 'AVAILABLE'),
('Jordi Puig', '+34 622 345 678', 'jordi.puig@btt.com', '1942-KBL', 'Toyota Camry Hybrid', 'Dark Blue', 4.88, 310, true, true, 'AVAILABLE'),
('Marc Soler', '+34 633 901 234', 'marc.soler@btt.com', '8271-MVN', 'Mercedes-Benz V-Class Van', 'Silver', 5.00, 580, true, true, 'AVAILABLE')
ON CONFLICT (phone) DO NOTHING;

-- 19. Seed Barcelona Famous Places
INSERT INTO public.famous_places (slug, name, address, category, lat, lng, is_active)
VALUES 
('sagrada-familia', 'Basílica de la Sagrada Família', 'C/ de Mallorca, 401, 08013 Barcelona', 'MONUMENT', 41.4036, 2.1744, true),
('park-guell', 'Park Güell', '08024 Barcelona', 'PARK', 41.4145, 2.1527, true),
('camp-nou', 'Spotify Camp Nou', 'C. d''Arístides Maillol, 12, 08028 Barcelona', 'STADIUM', 41.3809, 2.1228, true),
('casa-batllo', 'Casa Batlló', 'Pg. de Gràcia, 43, 08007 Barcelona', 'MONUMENT', 41.3916, 2.1648, true),
('bcn-airport-t1', 'Barcelona-El Prat Airport Terminal 1', '08820 El Prat de Llobregat, Barcelona', 'AIRPORT', 41.2880, 2.0734, true),
('bcn-airport-t2', 'Barcelona-El Prat Airport Terminal 2', '08820 El Prat de Llobregat, Barcelona', 'AIRPORT', 41.3033, 2.0784, true),
('cruise-port', 'Port de Barcelona (Cruise Terminals A-E)', 'Moll Adossat, 08039 Barcelona', 'PORT', 41.3571, 2.1764, true),
('sants-station', 'Barcelona Sants Train Station', 'Plaça dels Països Catalans, 08014 Barcelona', 'STATION', 41.3790, 2.1402, true)
ON CONFLICT (slug) DO NOTHING;
