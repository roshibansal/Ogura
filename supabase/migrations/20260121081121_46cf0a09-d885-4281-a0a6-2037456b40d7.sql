-- Add location columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude double precision;

-- Create delivery_zones table for delivery availability
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode text NOT NULL UNIQUE,
  city text,
  state text,
  is_deliverable boolean DEFAULT true,
  delivery_days integer DEFAULT 5,
  express_available boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on delivery_zones
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Public read access for delivery zones
DROP POLICY IF EXISTS "Anyone can view delivery zones" ON public.delivery_zones;
CREATE POLICY "Anyone can view delivery zones" ON public.delivery_zones FOR SELECT USING (true);

-- Insert some sample delivery zones for major Indian cities
INSERT INTO public.delivery_zones (pincode, city, state, is_deliverable, delivery_days, express_available) VALUES
  ('110001', 'New Delhi', 'Delhi', true, 2, true),
  ('110002', 'New Delhi', 'Delhi', true, 2, true),
  ('110003', 'New Delhi', 'Delhi', true, 2, true),
  ('400001', 'Mumbai', 'Maharashtra', true, 2, true),
  ('400002', 'Mumbai', 'Maharashtra', true, 2, true),
  ('400003', 'Mumbai', 'Maharashtra', true, 2, true),
  ('560001', 'Bangalore', 'Karnataka', true, 3, true),
  ('560002', 'Bangalore', 'Karnataka', true, 3, true),
  ('600001', 'Chennai', 'Tamil Nadu', true, 3, true),
  ('600002', 'Chennai', 'Tamil Nadu', true, 3, true),
  ('700001', 'Kolkata', 'West Bengal', true, 3, true),
  ('700002', 'Kolkata', 'West Bengal', true, 3, true),
  ('500001', 'Hyderabad', 'Telangana', true, 3, true),
  ('380001', 'Ahmedabad', 'Gujarat', true, 4, false),
  ('411001', 'Pune', 'Maharashtra', true, 3, true),
  ('302001', 'Jaipur', 'Rajasthan', true, 4, false),
  ('226001', 'Lucknow', 'Uttar Pradesh', true, 4, false),
  ('440001', 'Nagpur', 'Maharashtra', true, 4, false),
  ('682001', 'Kochi', 'Kerala', true, 4, false),
  ('751001', 'Bhubaneswar', 'Odisha', true, 5, false)
ON CONFLICT (pincode) DO NOTHING;