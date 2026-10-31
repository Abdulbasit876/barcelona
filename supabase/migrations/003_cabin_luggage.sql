-- Add cabin_luggage column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cabin_luggage INTEGER DEFAULT 0;
COMMENT ON COLUMN bookings.cabin_luggage IS 'Number of cabin size suitcases/bags';
