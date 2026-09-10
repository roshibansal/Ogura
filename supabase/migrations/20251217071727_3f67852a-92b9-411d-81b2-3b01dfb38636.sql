-- Add slug and banner_image to designers table
ALTER TABLE public.designers 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- CREATE INDEX IF NOT EXISTS for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_designers_slug ON public.designers(slug);

-- Generate slugs for existing designers (lowercase, replace spaces with hyphens)
UPDATE public.designers 
SET slug = lower(regexp_replace(regexp_replace(brand_name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE public.designers ALTER COLUMN slug SET NOT NULL;

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  images JSONB DEFAULT '[]'::jsonb,
  category TEXT NOT NULL,
  colors JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  material TEXT,
  is_available BOOLEAN DEFAULT true,
  designer_id UUID REFERENCES public.designers(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
FOR SELECT USING (true);

-- Authenticated users can insert products
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products" ON public.products
FOR INSERT WITH CHECK (true);

-- Authenticated users can update products
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products" ON public.products
FOR UPDATE USING (true);

-- Authenticated users can delete products
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Authenticated users can delete products" ON public.products
FOR DELETE USING (true);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_designer_id ON public.products(designer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();