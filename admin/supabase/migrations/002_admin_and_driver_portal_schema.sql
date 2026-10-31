-- ==============================================================================
-- Barcelona Taxi Transfer - Admin Dashboard & Driver Portal Schema Migration
-- Migration 002: Adds Admin Users, Driver Portal fields, Deposit & Pricing settings,
-- Push Notification subscriptions, and Driver Assignment engine rules.
-- ==============================================================================

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN', -- 'SUPER_ADMIN', 'ADMIN', 'DISPATCHER'
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Extend Drivers Table for Driver Portal & Dispatch Engine
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS assigned_categories TEXT[] DEFAULT ARRAY['ECONOMY', 'STANDARD', 'PREMIUM'];
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.00;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_trips INT DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_status VARCHAR(50) DEFAULT 'AVAILABLE'; -- 'AVAILABLE', 'ON_TRIP', 'BREAK', 'OFFLINE'
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);

-- 3. Extend Bookings Table for Deposit Config, Approvals, and Driver Notes
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC(5,2) DEFAULT 20.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'ONLINE_DEPOSIT'; -- 'FULL_ONLINE', 'ONLINE_DEPOSIT', 'CASH_TO_DRIVER'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_paid BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'APPROVED'; -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REVISION_PROPOSED'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS waiting_time_extra_charge NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS waiting_time_reported_minutes INT DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50);

-- 4. System Settings (Deposit %, Pricing Rules, Dispatch Rules)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial settings if not present
INSERT INTO system_settings (key, value, description)
VALUES 
    (
        'deposit_config', 
        '{"deposit_percentage": 20, "allow_cash_balance": true, "minimum_deposit_eur": 10}',
        'Global deposit configuration: percentage collected online vs cash to driver'
    ),
    (
        'pricing_rules',
        '{"city_base_fare": 20.00, "city_base_threshold_km": 2.5, "city_per_km_rate": 3.00, "baby_seat_price": 9.00, "baby_booster_price": 4.50, "airport_metropolitan_km_rate": 3.00, "company_trip_hourly_rate": 65.00}',
        'Configurable live pricing rules across Barcelona transfers'
    ),
    (
        'dispatch_config',
        '{"mode": "HYBRID", "auto_assign_enabled": true, "max_active_rides_per_driver": 2}',
        'Dispatch configuration: AUTO, MANUAL, or HYBRID mode'
    )
ON CONFLICT (key) DO NOTHING;

-- 5. Driver Category Assignment Rules
CREATE TABLE IF NOT EXISTS driver_assignment_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL, -- e.g. 'ECONOMY', 'STANDARD', 'PREMIUM'
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    priority INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Push Notification Subscriptions (For Admin Phone & Driver Devices)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type VARCHAR(50) NOT NULL DEFAULT 'ADMIN', -- 'ADMIN', 'DRIVER'
    user_id UUID,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Notifications Log (Realtime & In-App Alert Center)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_type VARCHAR(50) NOT NULL DEFAULT 'ADMIN', -- 'ADMIN', 'DRIVER', 'ALL'
    recipient_id UUID,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Indexes for Instant Query Execution
CREATE INDEX IF NOT EXISTS idx_bookings_approval_status ON bookings(approval_status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_datetime ON bookings(pickup_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(current_status, is_available);
CREATE INDEX IF NOT EXISTS idx_push_subs_user_type ON push_subscriptions(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_rules_category ON driver_assignment_rules(category, priority);
