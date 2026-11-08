-- Barcelona Taxi Transfer Initial Schema
-- Migration 001

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Famous Places in Barcelona
CREATE TABLE IF NOT EXISTS famous_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    name_es VARCHAR(150) NOT NULL,
    name_fr VARCHAR(150) NOT NULL,
    name_it VARCHAR(150) NOT NULL,
    short_desc_en TEXT NOT NULL,
    short_desc_es TEXT NOT NULL,
    short_desc_fr TEXT NOT NULL,
    short_desc_it TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_es TEXT NOT NULL,
    description_fr TEXT NOT NULL,
    description_it TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    image_url TEXT NOT NULL,
    recommended_duration VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    vehicle_plate VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_available BOOLEAN NOT NULL DEFAULT true,
    last_location_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(30) UNIQUE NOT NULL,
    access_token VARCHAR(128) UNIQUE NOT NULL,
    transfer_type VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    pickup_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    pickup_datetime TIMESTAMPTZ NOT NULL,
    is_return_trip BOOLEAN DEFAULT false,
    return_datetime TIMESTAMPTZ,
    passengers INT NOT NULL DEFAULT 1,
    luggage INT NOT NULL DEFAULT 1,
    child_seats INT NOT NULL DEFAULT 0,
    flight_or_train_number VARCHAR(100),
    cruise_ship_name VARCHAR(150),
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    special_requests TEXT,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    base_fare NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    vehicle_surcharge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    additional_charges NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_fare NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    original_fare NUMERIC(10,2),
    revised_fare NUMERIC(10,2),
    revision_reason TEXT,
    customer_accepted_revision BOOLEAN DEFAULT false,
    free_waiting_minutes INT NOT NULL DEFAULT 15,
    actual_landing_time TIMESTAMPTZ,
    pickup_arrived_time TIMESTAMPTZ,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Driver Location Logs (For Live Tracking & History)
CREATE TABLE IF NOT EXISTS driver_location_logs (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION,
    speed_kmh DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment Events Table (Idempotency & Webhook audit)
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    status VARCHAR(50) NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    changed_by VARCHAR(150) NOT NULL DEFAULT 'SYSTEM',
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom Quotes
CREATE TABLE IF NOT EXISTS custom_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    pickup_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    pickup_date VARCHAR(50) NOT NULL,
    pickup_time VARCHAR(50) NOT NULL,
    passengers INT NOT NULL,
    luggage INT NOT NULL,
    vehicle_preference VARCHAR(100),
    special_requirements TEXT,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    quoted_price NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance query & security
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_access_token ON bookings(access_token);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_booking ON driver_location_logs(booking_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_famous_places_category ON famous_places(category);
