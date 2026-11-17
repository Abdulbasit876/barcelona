-- Add customer_whatsapp column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_whatsapp VARCHAR(50);
COMMENT ON COLUMN bookings.customer_whatsapp IS 'Customer WhatsApp phone number with country code';
