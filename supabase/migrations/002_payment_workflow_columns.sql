-- ============================================================
-- Migration 002: Payment Workflow Columns
-- Barcelona Taxi Transfer
-- Adds full payment tracking fields to bookings table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add payment workflow columns if they don't exist
DO $$
BEGIN

  -- final_payment_method: 'ONLINE' or 'CASH'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'final_payment_method'
  ) THEN
    ALTER TABLE bookings ADD COLUMN final_payment_method TEXT DEFAULT NULL;
  END IF;

  -- driver_cash_received: amount driver physically collected in cash
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'driver_cash_received'
  ) THEN
    ALTER TABLE bookings ADD COLUMN driver_cash_received NUMERIC(10,2) DEFAULT 0;
  END IF;

  -- online_payment_transaction_id: Stripe or other payment gateway transaction ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'online_payment_transaction_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN online_payment_transaction_id TEXT DEFAULT NULL;
  END IF;

  -- payment_verified_at: timestamp when driver verified payment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_verified_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_verified_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- advance_amount: alias for deposit_amount (some code uses both)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'advance_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN advance_amount NUMERIC(10,2) DEFAULT 0;
  END IF;

  -- remaining_amount: alias for remaining_balance (some code uses both)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'remaining_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN remaining_amount NUMERIC(10,2) DEFAULT 0;
  END IF;

  -- tracking_token: secure token for customer-only booking access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'tracking_token'
  ) THEN
    ALTER TABLE bookings ADD COLUMN tracking_token TEXT DEFAULT NULL;
  END IF;

  -- booking_reference: human-readable reference like TRF-1001
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'booking_reference'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_reference TEXT UNIQUE DEFAULT NULL;
  END IF;

  -- deposit_amount: 20% advance paid at booking time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount NUMERIC(10,2) DEFAULT 0;
  END IF;

  -- remaining_balance: 80% balance due to driver
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'remaining_balance'
  ) THEN
    ALTER TABLE bookings ADD COLUMN remaining_balance NUMERIC(10,2) DEFAULT 0;
  END IF;

  -- deposit_paid: whether advance deposit has been received
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_paid'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE;
  END IF;

  -- balance_paid: whether remaining balance has been paid (cash or online)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'balance_paid'
  ) THEN
    ALTER TABLE bookings ADD COLUMN balance_paid BOOLEAN DEFAULT FALSE;
  END IF;

END $$;

-- Add index for tracking token lookups (security-critical for customer access)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_tracking_token
  ON bookings (tracking_token)
  WHERE tracking_token IS NOT NULL;

-- Add index for booking_reference lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_booking_reference
  ON bookings (booking_reference)
  WHERE booking_reference IS NOT NULL;

-- Add index for driver cash queries (admin dashboard: driver-wise cash)
CREATE INDEX IF NOT EXISTS idx_bookings_driver_cash
  ON bookings (driver_id, final_payment_method, payment_verified_at)
  WHERE final_payment_method = 'CASH';

-- Add payment_status check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_payment_status;
ALTER TABLE bookings ADD CONSTRAINT chk_payment_status
  CHECK (payment_status IN ('PENDING', 'DEPOSIT_PAID', 'PAID', 'REFUNDED', 'FAILED', 'AWAITING_BALANCE'));

-- Backfill booking_reference for existing records that have none
UPDATE bookings
SET booking_reference = 'TRF-' || LPAD(CAST(FLOOR(RANDOM() * 9000 + 1000) AS TEXT), 4, '0')
WHERE booking_reference IS NULL;

-- Backfill tracking_token for existing records that have none
UPDATE bookings
SET tracking_token = REPLACE(gen_random_uuid()::TEXT, '-', '')
WHERE tracking_token IS NULL;

-- Backfill advance_amount and remaining_amount from existing fields
UPDATE bookings
SET
  advance_amount = COALESCE(deposit_amount, total_fare * 0.2, 0),
  remaining_amount = COALESCE(remaining_balance, total_fare * 0.8, 0)
WHERE advance_amount = 0 OR remaining_amount = 0;

-- View for admin: driver cash collection report
CREATE OR REPLACE VIEW driver_cash_collection AS
SELECT
  d.name AS driver_name,
  d.id AS driver_id,
  b.id AS booking_id,
  b.booking_reference,
  b.driver_cash_received AS amount,
  b.payment_verified_at AS verified_at,
  b.customer_name,
  DATE(b.payment_verified_at) AS collection_date
FROM bookings b
JOIN drivers d ON b.driver_id = d.id
WHERE b.final_payment_method = 'CASH'
  AND b.driver_cash_received > 0
ORDER BY b.payment_verified_at DESC;

-- View for admin: payment summary per booking
CREATE OR REPLACE VIEW booking_payment_summary AS
SELECT
  b.id,
  b.booking_reference,
  b.customer_name,
  b.total_fare,
  COALESCE(b.deposit_amount, b.total_fare * 0.2) AS advance_paid,
  COALESCE(b.remaining_balance, b.total_fare * 0.8) AS remaining,
  b.payment_status,
  b.final_payment_method,
  b.driver_cash_received,
  b.balance_paid,
  b.payment_verified_at,
  d.name AS driver_name,
  b.status AS booking_status
FROM bookings b
LEFT JOIN drivers d ON b.driver_id = d.id
ORDER BY b.created_at DESC;

-- ============================================================
-- END OF MIGRATION 002
-- ============================================================
