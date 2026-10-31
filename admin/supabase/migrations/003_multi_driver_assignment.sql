-- Multi-driver assignments per vehicle category
CREATE TABLE IF NOT EXISTS public.vehicle_category_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_vcd_category ON public.vehicle_category_drivers(category);
CREATE INDEX IF NOT EXISTS idx_vcd_driver_id ON public.vehicle_category_drivers(driver_id);

-- Booking driver offers (broadcast ride offers to multiple drivers)
CREATE TABLE IF NOT EXISTS public.booking_driver_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, ACCEPTED, EXPIRED
  offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(booking_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_bdo_booking_id ON public.booking_driver_offers(booking_id);
CREATE INDEX IF NOT EXISTS idx_bdo_driver_id ON public.booking_driver_offers(driver_id);
CREATE INDEX IF NOT EXISTS idx_bdo_status ON public.booking_driver_offers(status);

-- Enable RLS
ALTER TABLE public.vehicle_category_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_driver_offers ENABLE ROW LEVEL SECURITY;

-- Allow all access (admin handles auth in NestJS)
CREATE POLICY IF NOT EXISTS "allow_all_vcd" ON public.vehicle_category_drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all_bdo" ON public.booking_driver_offers FOR ALL USING (true) WITH CHECK (true);
