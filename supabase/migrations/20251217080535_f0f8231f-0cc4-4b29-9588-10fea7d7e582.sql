-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  banner_image TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendors
DROP POLICY IF EXISTS "Anyone can view vendors" ON public.vendors;
CREATE POLICY "Anyone can view vendors" ON public.vendors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert vendors" ON public.vendors;
CREATE POLICY "Authenticated users can insert vendors" ON public.vendors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update vendors" ON public.vendors;
CREATE POLICY "Authenticated users can update vendors" ON public.vendors FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete vendors" ON public.vendors;
CREATE POLICY "Authenticated users can delete vendors" ON public.vendors FOR DELETE USING (true);

-- Update trigger for vendors
DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Modify products table: make designer_id nullable and add vendor_id
ALTER TABLE public.products ALTER COLUMN designer_id DROP NOT NULL;

-- Add vendor_id column
ALTER TABLE public.products ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;

-- Add constraint: product must belong to either a designer OR a vendor
ALTER TABLE public.products ADD CONSTRAINT product_must_have_owner 
  CHECK (designer_id IS NOT NULL OR vendor_id IS NOT NULL);