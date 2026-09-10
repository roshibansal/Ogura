-- Bootstrap: the role enum, the user_roles table and has_role().
--
-- has_role() is called by 17 later migrations and by policies throughout the
-- schema, but no migration ever created it — it was made by hand in the old
-- project's SQL editor. A rebuild therefore failed on the very first policy
-- that referenced it. Same story as orders/sellers/product_variants.
--
-- Deliberately numbered before every other migration so the function exists
-- when the first policy needs it.

do $$ begin
  DO $do$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'customer');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $do$;
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  role       public.app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- security definer so a policy can ask "is this user an admin?" without the
-- user needing read access to user_roles itself, which would be circular.
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = _user_id and role::text = _role
  );
end;
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
end;
$$;

drop policy if exists "Users read their own roles" on public.user_roles;
DROP POLICY IF EXISTS "Users read their own roles" ON public.user_roles;
CREATE POLICY "Users read their own roles" ON public.user_roles
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Core commerce tables, also hand-made in the old project and therefore absent
-- from the migration history. They live here rather than in a later migration
-- because `discounts`, `orders` and others carry foreign keys to `sellers`,
-- so it has to exist before any of them run.
-- ---------------------------------------------------------------------------

create table if not exists public.sellers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null,
  brand_name          text not null,
  city                text not null,
  seller_type         text not null,
  description         text,
  profile_image       text,
  banner_image        text,
  instagram_handle    text,
  application_status  text not null default 'submitted',
  is_verified         boolean default false,
  is_active           boolean default false,
  gstin               text,
  pan_number          text,
  bank_name           text,
  bank_account_number text,
  bank_ifsc           text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create unique index if not exists sellers_user_id_key on public.sellers (user_id);

create table if not exists public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null,
  size           text not null,
  color_name     text not null,
  color_hex      text,
  sku            text,
  price_override numeric,
  stock_quantity integer default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  customer_id      uuid not null,
  seller_id        uuid not null,
  status           text not null default 'pending',
  subtotal         numeric not null,
  discount         numeric default 0,
  shipping_fee     numeric default 0,
  total            numeric not null,
  shipping_address jsonb not null,
  shipping_carrier text,
  tracking_id      text,
  accepted_at      timestamptz,
  packed_at        timestamptz,
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  cancelled_at     timestamptz,
  created_at       timestamptz default now()
);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_seller_id_idx   on public.orders (seller_id);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid not null,
  variant_id  uuid,
  quantity    integer not null,
  unit_price  numeric not null,
  total_price numeric not null,
  size        text,
  color       text,
  created_at  timestamptz default now()
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.sellers          enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
-- Columns added by hand to `products` in the old project, present in no
-- migration. Without them a rebuilt database has a products table the
-- application cannot use: no seller_id to attribute a piece to a boutique,
-- no status to publish it, no fabric or brand for the storefront.
--
-- Numbered immediately after the bootstrap so later migrations that add
-- constraints over these columns have something to constrain.

alter table public.products add column if not exists brand text;
alter table public.products add column if not exists care_instructions text;
alter table public.products add column if not exists category_id uuid;
alter table public.products add column if not exists dispatch_days integer;
alter table public.products add column if not exists fabric text;
alter table public.products add column if not exists is_made_to_order boolean default false;
alter table public.products add column if not exists is_returnable boolean default true;
alter table public.products add column if not exists occasion_tags jsonb default '[]'::jsonb;
alter table public.products add column if not exists rejection_reason text;
alter table public.products add column if not exists seller_id uuid;
alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists status text default 'draft';
alter table public.products add column if not exists style_tags jsonb default '[]'::jsonb;

create index if not exists products_seller_id_idx on public.products (seller_id);
create index if not exists products_status_idx    on public.products (status);
-- `categories` was another hand-made table. products.category_id references it
-- and the storefront reads it, but no migration ever created it.

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  parent_id  uuid references public.categories (id) on delete set null,
  sort_order integer default 0,
  is_active  boolean default true,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories
  for select using (true);
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create designers table
CREATE TABLE IF NOT EXISTS public.designers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  price_range TEXT NOT NULL,
  instagram_link TEXT,
  followers INTEGER DEFAULT 0,
  contact_number TEXT,
  email TEXT,
  profile_image TEXT,
  product_images JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_designers_brand_name ON public.designers(brand_name);
CREATE INDEX IF NOT EXISTS idx_designers_category ON public.designers(category);
CREATE INDEX IF NOT EXISTS idx_designers_city ON public.designers(city);

-- Enable Row Level Security
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Anyone can view designers" ON public.designers;
CREATE POLICY "Anyone can view designers" ON public.designers 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert (for future admin panel)
DROP POLICY IF EXISTS "Authenticated users can insert designers" ON public.designers;
CREATE POLICY "Authenticated users can insert designers" ON public.designers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update (for future admin panel)
DROP POLICY IF EXISTS "Authenticated users can update designers" ON public.designers;
CREATE POLICY "Authenticated users can update designers" ON public.designers 
FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated users to delete (for future admin panel)
DROP POLICY IF EXISTS "Authenticated users can delete designers" ON public.designers;
CREATE POLICY "Authenticated users can delete designers" ON public.designers 
FOR DELETE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_designers_updated_at ON public.designers;
CREATE TRIGGER update_designers_updated_at
BEFORE UPDATE ON public.designers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert designer records
INSERT INTO public.designers (name, brand_name, city, category, price_range, instagram_link, followers, contact_number, email, profile_image, product_images, description) VALUES
(
  'Aisha Mehta',
  'Aisha Couture',
  'Delhi',
  'Bridal Wear',
  'Luxury',
  'https://instagram.com/aishacouture',
  12500,
  '+91 9876543210',
  'contact@aishacouture.in',
  'https://images.unsplash.com/photo-1542060742-0b3f3e8e9b87',
  '["https://images.unsplash.com/photo-1562158070-622a13db7f2d", "https://images.unsplash.com/photo-1520974735194-4cba3b04b26b"]'::jsonb,
  'Aisha Couture specializes in handcrafted bridal outfits with intricate zardozi work and luxurious fabric combinations.'
),
(
  'Karan Bhatia',
  'Karan Studio',
  'Mumbai',
  'Men''s Designer Wear',
  'Premium',
  'https://instagram.com/karanstudio',
  9800,
  '+91 9988776655',
  'hello@karanstudio.com',
  'https://images.unsplash.com/photo-1519744792095-2f2205e87b6f',
  '["https://images.unsplash.com/photo-1618354694983-7dc6dc07a7f4", "https://images.unsplash.com/photo-1616486364433-48f62d3a6435"]'::jsonb,
  'Karan Studio offers contemporary men''s fashion with an edge — known for Indo-Western fusion and sharp tailoring.'
),
(
  'Riya Kapoor',
  'Studio Riya',
  'Jaipur',
  'Ethnic & Festive',
  'Affordable',
  'https://instagram.com/studioriya',
  7200,
  '+91 9811122233',
  'riya@studioriya.com',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
  '["https://images.unsplash.com/photo-1532372320572-cda25653a26d", "https://images.unsplash.com/photo-1602407294553-6f9a5f0c8aa5"]'::jsonb,
  'Studio Riya offers affordable ethnic wear with pastel tones and minimalistic embroidery — perfect for festive occasions.'
),
(
  'Ananya Deshmukh',
  'House of Ananya',
  'Pune',
  'Western Wear',
  'Mid-range',
  'https://instagram.com/houseofananya',
  8600,
  '+91 9090909090',
  'hello@houseofananya.com',
  'https://images.unsplash.com/photo-1520974735194-4cba3b04b26b',
  '["https://images.unsplash.com/photo-1517841905240-472988babdf9", "https://images.unsplash.com/photo-1556909212-6e7c6d7c6b4d"]'::jsonb,
  'House of Ananya creates chic western wear for modern women — blending elegance with comfort.'
);

-- Enable realtime for designers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.designers;-- Create storage bucket for try-on images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tryon-images',
  'tryon-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view images
DROP POLICY IF EXISTS "Public can view try-on images" ON storage.objects;
CREATE POLICY "Public can view try-on images" ON storage.objects FOR SELECT
USING (bucket_id = 'tryon-images');

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload try-on images" ON storage.objects;
CREATE POLICY "Authenticated users can upload try-on images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tryon-images' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete their own try-on images" ON storage.objects;
CREATE POLICY "Users can delete their own try-on images" ON storage.objects FOR DELETE
USING (bucket_id = 'tryon-images' AND auth.role() = 'authenticated');-- Create try-on history table
CREATE TABLE IF NOT EXISTS public.tryon_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  model_image_url TEXT NOT NULL,
  product_image_url TEXT NOT NULL,
  result_image_url TEXT NOT NULL,
  model_name TEXT,
  product_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tryon_history ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own try-on history" ON public.tryon_history;
CREATE POLICY "Users can view their own try-on history" ON public.tryon_history
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own try-on history" ON public.tryon_history;
CREATE POLICY "Users can insert their own try-on history" ON public.tryon_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own try-on history" ON public.tryon_history;
CREATE POLICY "Users can delete their own try-on history" ON public.tryon_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tryon_history_user_id ON public.tryon_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tryon_history_created_at ON public.tryon_history(created_at DESC);-- Create a public storage bucket for influencer videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'influencer-videos',
  'influencer-videos',
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all videos
DROP POLICY IF EXISTS "Public can view influencer videos" ON storage.objects;
CREATE POLICY "Public can view influencer videos" ON storage.objects
FOR SELECT
USING (bucket_id = 'influencer-videos');

-- Allow authenticated users to upload videos
DROP POLICY IF EXISTS "Authenticated users can upload influencer videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload influencer videos" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'influencer-videos' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
DROP POLICY IF EXISTS "Authenticated users can update influencer videos" ON storage.objects;
CREATE POLICY "Authenticated users can update influencer videos" ON storage.objects
FOR UPDATE
USING (bucket_id = 'influencer-videos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete videos
DROP POLICY IF EXISTS "Authenticated users can delete influencer videos" ON storage.objects;
CREATE POLICY "Authenticated users can delete influencer videos" ON storage.objects
FOR DELETE
USING (bucket_id = 'influencer-videos' AND auth.role() = 'authenticated');-- CREATE TABLE IF NOT EXISTS for influencer videos
CREATE TABLE IF NOT EXISTS public.influencer_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_filename TEXT NOT NULL,
  poster_url TEXT,
  caption TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '/collections/dresses',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.influencer_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view active videos
DROP POLICY IF EXISTS "Anyone can view active influencer videos" ON public.influencer_videos;
CREATE POLICY "Anyone can view active influencer videos" ON public.influencer_videos
FOR SELECT
USING (is_active = true);

-- Authenticated users can manage videos
DROP POLICY IF EXISTS "Authenticated users can insert influencer videos" ON public.influencer_videos;
CREATE POLICY "Authenticated users can insert influencer videos" ON public.influencer_videos
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update influencer videos" ON public.influencer_videos;
CREATE POLICY "Authenticated users can update influencer videos" ON public.influencer_videos
FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete influencer videos" ON public.influencer_videos;
CREATE POLICY "Authenticated users can delete influencer videos" ON public.influencer_videos
FOR DELETE
USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_influencer_videos_updated_at ON public.influencer_videos;
CREATE TRIGGER update_influencer_videos_updated_at
BEFORE UPDATE ON public.influencer_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default placeholder data (will use Pexels until custom videos are uploaded)
INSERT INTO public.influencer_videos (video_filename, poster_url, caption, link, sort_order) VALUES
('video-1.mp4', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&q=80', 'outfit @ogura', '/collections/dresses', 1),
('video-2.mp4', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80', '✨💛', '/collections/dresses', 2),
('video-3.mp4', 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&q=80', 'Get ready with me for a date 💜✨', '/collections/tops', 3),
('video-4.mp4', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&q=80', '"Don''t buy another dress, you got enough"', '/collections/dresses', 4),
('video-5.mp4', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80', 'outfit @ogura', '/collections/outerwear', 5);-- CREATE TABLE IF NOT EXISTS for OTP storage with security features
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verifications(expires_at);

-- Enable RLS (edge functions use service role, no public access needed)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Function to cleanup expired OTPs (runs on insert)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_verifications WHERE expires_at < now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-cleanup on new OTP insert
DROP TRIGGER IF EXISTS trigger_cleanup_expired_otps ON public.otp_verifications;
CREATE TRIGGER trigger_cleanup_expired_otps
  BEFORE INSERT ON public.otp_verifications
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_otps();-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'),
    NEW.phone
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();-- Add slug and banner_image to designers table
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
EXECUTE FUNCTION public.update_updated_at_column();-- Add collection_name column to designers table
ALTER TABLE public.designers ADD COLUMN IF NOT EXISTS collection_name text;-- Create vendors table
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
  CHECK (designer_id IS NOT NULL OR vendor_id IS NOT NULL);-- Add email and avatar_url columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Update handle_new_user function to capture Google OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      'User'
    ),
    NEW.phone,
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;-- Add location columns to profiles table
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
ON CONFLICT (pincode) DO NOTHING;-- Create user_addresses table for storing delivery addresses
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  mobile text NOT NULL,
  pincode text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  landmark text,
  address_type text DEFAULT 'home' CHECK (address_type IN ('home', 'work')),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies for users to manage their own addresses
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.user_addresses;
CREATE POLICY "Users can view their own addresses" ON public.user_addresses
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own addresses" ON public.user_addresses;
CREATE POLICY "Users can create their own addresses" ON public.user_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.user_addresses;
CREATE POLICY "Users can update their own addresses" ON public.user_addresses
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.user_addresses;
CREATE POLICY "Users can delete their own addresses" ON public.user_addresses
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER update_user_addresses_updated_at
BEFORE UPDATE ON public.user_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add is_onboarded column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded boolean DEFAULT false;

-- Update the handle_new_user function to include is_onboarded and handle upserts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email, avatar_url, is_onboarded)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      'User'
    ),
    NEW.phone,
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$function$;
-- Create the product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow anyone to view product images (public bucket)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
CREATE POLICY "Users can delete own product images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (auth.uid()::text = (storage.foldername(name))[1]));
CREATE TABLE IF NOT EXISTS public.seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  brand_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  category text NOT NULL,
  portfolio_link text,
  sample_images jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit application" ON public.seller_applications;
CREATE POLICY "Anyone can submit application" ON public.seller_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view applications" ON public.seller_applications;
CREATE POLICY "Admins can view applications" ON public.seller_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update applications" ON public.seller_applications;
CREATE POLICY "Admins can update applications" ON public.seller_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));DROP POLICY IF EXISTS "Anyone can upload application images" ON storage.objects;
CREATE POLICY "Anyone can upload application images" ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'applications'
);CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  code text NOT NULL,
  type text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  applies_to text DEFAULT 'all',
  min_quantity integer DEFAULT 0,
  min_purchase integer DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can manage own discounts" ON public.discounts;
CREATE POLICY "Sellers can manage own discounts" ON public.discounts FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active discounts" ON public.discounts;
CREATE POLICY "Anyone can view active discounts" ON public.discounts FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND (end_date IS NULL OR end_date > now()));
-- Dev-mode: allow anonymous inserts, updates, selects, deletes on products
DROP POLICY IF EXISTS "dev_allow_all_inserts_products" ON public.products;
CREATE POLICY "dev_allow_all_inserts_products" ON public.products FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all_select_products" ON public.products;
CREATE POLICY "dev_allow_all_select_products" ON public.products FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "dev_allow_all_update_products" ON public.products;
CREATE POLICY "dev_allow_all_update_products" ON public.products FOR UPDATE TO anon
USING (true);

DROP POLICY IF EXISTS "dev_allow_all_delete_products" ON public.products;
CREATE POLICY "dev_allow_all_delete_products" ON public.products FOR DELETE TO anon
USING (true);

-- Dev-mode: allow anonymous inserts, updates, selects, deletes on discounts
DROP POLICY IF EXISTS "dev_allow_all_inserts_discounts" ON public.discounts;
CREATE POLICY "dev_allow_all_inserts_discounts" ON public.discounts FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all_select_discounts" ON public.discounts;
CREATE POLICY "dev_allow_all_select_discounts" ON public.discounts FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "dev_allow_all_update_discounts" ON public.discounts;
CREATE POLICY "dev_allow_all_update_discounts" ON public.discounts FOR UPDATE TO anon
USING (true);

DROP POLICY IF EXISTS "dev_allow_all_delete_discounts" ON public.discounts;
CREATE POLICY "dev_allow_all_delete_discounts" ON public.discounts FOR DELETE TO anon
USING (true);

-- Dev-mode: allow anonymous reads on sellers table (for seller lookup fallback)
DROP POLICY IF EXISTS "dev_allow_anon_select_sellers" ON public.sellers;
CREATE POLICY "dev_allow_anon_select_sellers" ON public.sellers FOR SELECT TO anon
USING (true);

-- Dev-mode: allow anonymous uploads to product-images storage
DROP POLICY IF EXISTS "dev_allow_anon_upload_product_images" ON storage.objects;
CREATE POLICY "dev_allow_anon_upload_product_images" ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "dev_allow_anon_select_product_images" ON storage.objects;
CREATE POLICY "dev_allow_anon_select_product_images" ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'product-images');
ALTER TABLE public.products DROP CONSTRAINT product_must_have_owner;
ALTER TABLE public.products ADD CONSTRAINT product_must_have_owner
  CHECK (designer_id IS NOT NULL OR vendor_id IS NOT NULL OR seller_id IS NOT NULL);DROP POLICY IF EXISTS "dev_allow_anon_update_sellers" ON public.sellers;
CREATE POLICY "dev_allow_anon_update_sellers" ON public.sellers FOR UPDATE TO anon
USING (true) WITH CHECK (true);
-- Allow anonymous uploads to tryon-images bucket
DROP POLICY IF EXISTS "Anyone can upload tryon images" ON storage.objects;
CREATE POLICY "Anyone can upload tryon images" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'tryon-images');

-- Allow anonymous reads from tryon-images bucket
DROP POLICY IF EXISTS "Anyone can read tryon images" ON storage.objects;
CREATE POLICY "Anyone can read tryon images" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tryon-images');

DROP POLICY IF EXISTS "dev_allow_all_select_products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_inserts_products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_update_products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_delete_products" ON public.products;

DROP POLICY IF EXISTS "dev_allow_all_select_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_inserts_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_update_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_delete_discounts" ON public.discounts;

DROP POLICY IF EXISTS "dev_allow_anon_select_sellers" ON public.sellers;
DROP POLICY IF EXISTS "dev_allow_anon_update_sellers" ON public.sellers;

DROP POLICY IF EXISTS "Authenticated users can insert designers" ON public.designers;
DROP POLICY IF EXISTS "Authenticated users can update designers" ON public.designers;
DROP POLICY IF EXISTS "Authenticated users can delete designers" ON public.designers;
DROP POLICY IF EXISTS "Admins can manage designers" ON public.designers;
CREATE POLICY "Admins can manage designers" ON public.designers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can delete vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can manage vendors" ON public.vendors;
CREATE POLICY "Admins can manage vendors" ON public.vendors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can insert influencer videos" ON public.influencer_videos;
DROP POLICY IF EXISTS "Authenticated users can update influencer videos" ON public.influencer_videos;
DROP POLICY IF EXISTS "Authenticated users can delete influencer videos" ON public.influencer_videos;
DROP POLICY IF EXISTS "Admins can manage influencer videos" ON public.influencer_videos;
CREATE POLICY "Admins can manage influencer videos" ON public.influencer_videos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.otp_verifications FROM anon, authenticated;
GRANT ALL ON public.otp_verifications TO service_role;

DROP POLICY IF EXISTS "dev_allow_anon_select_product_images" ON storage.objects;
DROP POLICY IF EXISTS "dev_allow_anon_upload_product_images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload application images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload tryon images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read tryon images" ON storage.objects;
CREATE TABLE IF NOT EXISTS public.brand_waitlist_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  handle_or_website TEXT NOT NULL,
  what_you_make TEXT NOT NULL,
  city TEXT NOT NULL,
  brand_age TEXT NOT NULL,
  sell_channels TEXT[] NOT NULL DEFAULT '{}',
  monthly_orders TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.brand_waitlist_applications TO anon;
GRANT INSERT ON public.brand_waitlist_applications TO authenticated;
GRANT ALL ON public.brand_waitlist_applications TO service_role;

ALTER TABLE public.brand_waitlist_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a waitlist application" ON public.brand_waitlist_applications;
CREATE POLICY "Anyone can submit a waitlist application" ON public.brand_waitlist_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view waitlist applications" ON public.brand_waitlist_applications;
CREATE POLICY "Admins can view waitlist applications" ON public.brand_waitlist_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image text,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published collections are viewable by everyone" ON public.collections;
CREATE POLICY "Published collections are viewable by everyone" ON public.collections FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can view all collections" ON public.collections;
CREATE POLICY "Admins can view all collections" ON public.collections FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert collections" ON public.collections;
CREATE POLICY "Admins can insert collections" ON public.collections FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update collections" ON public.collections;
CREATE POLICY "Admins can update collections" ON public.collections FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete collections" ON public.collections;
CREATE POLICY "Admins can delete collections" ON public.collections FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'android',
  device_info jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON public.device_tokens (user_id);
CREATE INDEX IF NOT EXISTS device_tokens_active_idx ON public.device_tokens (is_active) WHERE is_active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;
GRANT ALL ON public.device_tokens TO service_role;

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can view their own device tokens" ON public.device_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can register their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can register their own device tokens" ON public.device_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can update their own device tokens" ON public.device_tokens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can delete their own device tokens" ON public.device_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_device_tokens_updated_at ON public.device_tokens;
CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  deep_link_path text,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  sent_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);

GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view notification history" ON public.notifications;
CREATE POLICY "Admins can view notification history" ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));DROP POLICY IF EXISTS "Anyone can view approved active sellers" ON public.sellers;
CREATE POLICY "Anyone can view approved active sellers" ON public.sellers FOR SELECT
USING (application_status = 'approved' AND is_active = true);

GRANT SELECT ON public.sellers TO anon;

CREATE TABLE IF NOT EXISTS public.seed_import_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seed_batch_key text NOT NULL,
  actor_user_id uuid,
  mode text NOT NULL,
  step text NOT NULL,
  counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  failures jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seed_import_runs TO authenticated;
GRANT ALL ON public.seed_import_runs TO service_role;

ALTER TABLE public.seed_import_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view seed import runs" ON public.seed_import_runs;
CREATE POLICY "Admins can view seed import runs" ON public.seed_import_runs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));REVOKE SELECT ON public.sellers FROM anon, authenticated;

GRANT SELECT (
  id, user_id, brand_name, city, instagram_handle, profile_image, banner_image,
  description, is_verified, is_active, application_status, seller_type,
  created_at, updated_at
) ON public.sellers TO anon, authenticated;

GRANT UPDATE ON public.sellers TO authenticated;
GRANT INSERT ON public.sellers TO authenticated;
GRANT ALL ON public.sellers TO service_role;

CREATE OR REPLACE FUNCTION public.get_own_seller_bank_details()
RETURNS TABLE (
  id uuid,
  gstin text,
  pan_number text,
  bank_account_number text,
  bank_ifsc text,
  bank_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.gstin, s.pan_number, s.bank_account_number, s.bank_ifsc, s.bank_name
  FROM public.sellers s
  WHERE s.user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.get_own_seller_bank_details() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_own_seller_bank_details() TO authenticated;-- ============================================================
-- OGURA — TRACK B MARKETPLACE COMMERCE MIGRATION
-- Multi-Seller Suborders, Atomic Inventory, and RLS
-- ============================================================

-- 1. Create Suborders Table (seller_orders)
CREATE TABLE IF NOT EXISTS public.seller_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  seller_subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  seller_payable NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded')),
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned')),
  tracking_id TEXT,
  shipping_carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Extend orders Table for Parent Order Semantics
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ALTER COLUMN seller_id DROP NOT NULL;

-- 3. Extend order_items with Seller and Suborder References
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS seller_order_id UUID REFERENCES public.seller_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

-- 4. Create Public Seller Profiles View (Public-Safe, Anon-Accessible)
CREATE OR REPLACE VIEW public.public_seller_profiles AS
SELECT
  id,
  brand_name,
  city,
  description,
  profile_image,
  banner_image,
  seller_type,
  instagram_handle,
  is_verified,
  is_active,
  created_at
FROM public.sellers
WHERE is_active = true AND is_verified = true;

GRANT SELECT ON public.public_seller_profiles TO anon, authenticated;

-- 5. Atomic Inventory Reservation RPC
CREATE OR REPLACE FUNCTION public.reserve_and_decrement_variant_stock(
  _variant_id UUID,
  _quantity INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_stock INT;
BEGIN
  -- Row-level lock using FOR UPDATE
  SELECT stock_quantity INTO _current_stock
  FROM public.product_variants
  WHERE id = _variant_id
  FOR UPDATE;

  IF _current_stock IS NULL OR _current_stock < _quantity THEN
    RETURN FALSE;
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - _quantity,
      updated_at = now()
  WHERE id = _variant_id;

  RETURN TRUE;
END;
$$;

-- 6. Atomic Inventory Restoration RPC
CREATE OR REPLACE FUNCTION public.restore_variant_stock(
  _variant_id UUID,
  _quantity INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity + _quantity,
      updated_at = now()
  WHERE id = _variant_id;
END;
$$;

-- 7. Enable RLS on seller_orders
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;

-- Customer can view their suborders via parent order ownership
DROP POLICY IF EXISTS "Customers can view their suborders" ON public.seller_orders;
CREATE POLICY "Customers can view their suborders" ON public.seller_orders
FOR SELECT USING (
  parent_order_id IN (
    SELECT id FROM public.orders WHERE customer_id = auth.uid()
  )
);

-- Sellers can view and update ONLY their own suborders
DROP POLICY IF EXISTS "Sellers can view own suborders" ON public.seller_orders;
CREATE POLICY "Sellers can view own suborders" ON public.seller_orders
FOR SELECT USING (
  seller_id IN (
    SELECT id FROM public.sellers WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Sellers can update own suborders" ON public.seller_orders;
CREATE POLICY "Sellers can update own suborders" ON public.seller_orders
FOR UPDATE USING (
  seller_id IN (
    SELECT id FROM public.sellers WHERE user_id = auth.uid()
  )
);

-- Service role has full bypass access
GRANT ALL ON public.seller_orders TO service_role;
GRANT SELECT ON public.seller_orders TO authenticated, anon;

-- 8. Justified Database Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller_id ON public.seller_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_parent_order_id ON public.seller_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_order_id ON public.order_items(seller_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON public.order_items(seller_id);
-- Migration: 20260908153000_purge_dev_policies_and_enforce_inventory_rpc.sql
-- Description: Purge all anonymous development policies and enforce atomic inventory reservation RPC with row locking

-- ============================================================================
-- 1. PURGE ALL ANONYMOUS DEVELOPMENT POLICIES
-- ============================================================================

-- Drop dev policies on products
DROP POLICY IF EXISTS "dev_allow_all_select_products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_inserts_products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_update_products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_delete_products" ON public.products;

-- Drop dev policies on discounts
DROP POLICY IF EXISTS "dev_allow_all_select_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_inserts_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_update_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_delete_discounts" ON public.discounts;

-- Drop dev policies on sellers
DROP POLICY IF EXISTS "dev_allow_anon_select_sellers" ON public.sellers;
DROP POLICY IF EXISTS "dev_allow_anon_update_sellers" ON public.sellers;

-- Ensure RLS is active on products and discounts
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Ensure public can view available products, but only authorized users can write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone can view active products'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
    CREATE POLICY "Anyone can view active products" ON public.products
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================================
-- 2. ENFORCE ATOMIC INVENTORY RESERVATION WITH ROW-LEVEL LOCKING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reserve_and_decrement_variant_stock(
  _variant_id UUID,
  _quantity INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_stock INT;
BEGIN
  -- Row-level lock using FOR UPDATE to prevent race conditions
  SELECT stock_quantity INTO _current_stock
  FROM public.product_variants
  WHERE id = _variant_id
  FOR UPDATE;

  IF _current_stock IS NULL OR _current_stock < _quantity THEN
    RETURN FALSE;
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - _quantity,
      updated_at = now()
  WHERE id = _variant_id;

  RETURN TRUE;
END;
$$;

-- Grant execution to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.reserve_and_decrement_variant_stock(UUID, INT) TO anon, authenticated, service_role;

-- ============================================================================
-- 3. ENFORCE ATOMIC INVENTORY RESTORATION RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.restore_variant_stock(
  _variant_id UUID,
  _quantity INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity + _quantity,
      updated_at = now()
  WHERE id = _variant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_variant_stock(UUID, INT) TO anon, authenticated, service_role;
-- Migration: 20260908160000_payment_webhook_events_and_recovery.sql
-- Description: Tables and indexes for durable webhook event idempotency, crash-safe processing leases, and payment order session recovery

-- 1. Payment Orders (Pre-payment checkout session snapshots)
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id TEXT UNIQUE NOT NULL,
  customer_id UUID,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  shipping_fee NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  shipping_address JSONB,
  status TEXT NOT NULL DEFAULT 'created', -- 'created', 'processing', 'paid', 'failed', 'expired'
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  lease_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay_order_id ON public.payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_customer_id ON public.payment_orders(customer_id);

-- 2. Payment Webhook Events (Durable Event Idempotency & Crash-Safe Processing Lease Store)
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed', 'ignored'
  payload JSONB NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  error TEXT,
  attempt_count INT NOT NULL DEFAULT 1,
  max_attempts INT NOT NULL DEFAULT 5,
  lease_token UUID NOT NULL DEFAULT gen_random_uuid(),
  processing_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lease_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '60 seconds'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Ensure crash-safe lease columns exist if table was already created in an earlier migration
ALTER TABLE public.payment_webhook_events ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 1;
ALTER TABLE public.payment_webhook_events ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 5;
ALTER TABLE public.payment_webhook_events ADD COLUMN IF NOT EXISTS lease_token UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.payment_webhook_events ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.payment_webhook_events ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '60 seconds');

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_id ON public.payment_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_payment_id ON public.payment_webhook_events(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_order_id ON public.payment_webhook_events(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_lease ON public.payment_webhook_events(status, lease_expires_at);

-- 3. Security: Enable RLS and isolate tables
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.payment_orders TO service_role;
GRANT ALL ON public.payment_webhook_events TO service_role;

-- Allow authenticated users to view only their own payment_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_orders' AND policyname = 'Users can view own payment_orders'
  ) THEN
    DROP POLICY IF EXISTS "Users can view own payment_orders" ON public.payment_orders;
    CREATE POLICY "Users can view own payment_orders" ON public.payment_orders
      FOR SELECT TO authenticated
      USING (auth.uid() = customer_id);
  END IF;
END $$;

-- 4. Order reconciliation unique constraints (Enforce exactly 1 OGURA order per payment/order)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_order_id_unique 
  ON public.orders(payment_order_id) 
  WHERE payment_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_id_unique 
  ON public.orders(tracking_id) 
  WHERE tracking_id IS NOT NULL;
-- Migration: 20260908170000_confirm_checkout_atomic.sql
-- Description: Implement atomic checkout confirmation procedure (public.confirm_checkout_atomic)
-- Consolidates inventory reservation, parent order creation, seller suborders, order items,
-- and payment session finalization into a single unified atomic PostgreSQL transaction.

CREATE OR REPLACE FUNCTION public.confirm_checkout_atomic(
  p_razorpay_order_id TEXT,
  p_razorpay_payment_id TEXT,
  p_order_data JSONB DEFAULT NULL,
  p_event_id TEXT DEFAULT NULL,
  p_lease_token UUID DEFAULT NULL,
  p_fail_at TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment_order RECORD;
  v_existing_order RECORD;
  v_raw_items JSONB;
  v_item JSONB;
  v_customer_id UUID;
  v_shipping_address JSONB;
  v_shipping_fee NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_computed_subtotal NUMERIC := 0;
  v_final_total NUMERIC := 0;
  v_order_number TEXT;
  v_parent_order RECORD;
  v_primary_seller_id UUID;
  v_suborders_count INT := 0;
  v_items_count INT := 0;

  -- Working records
  v_prod RECORD;
  v_var RECORD;
  v_prod_id UUID;
  v_var_id UUID;
  v_qty INT;
  v_unit_price NUMERIC;
  v_line_total NUMERIC;
  v_size TEXT;
  v_color TEXT;
  v_seller_id UUID;

  -- Temporary structures in jsonb
  v_validated_items JSONB := '[]'::jsonb;
  v_seller_map JSONB := '{}'::jsonb;
  v_suborder_map JSONB := '{}'::jsonb;
  v_seller_key TEXT;
  v_seller_subtotal NUMERIC;
  v_comm_rate NUMERIC := 15.00;
  v_comm_amount NUMERIC;
  v_seller_payable NUMERIC;
  v_suborder_id UUID;
BEGIN
  -- =========================================================================
  -- 1. VALIDATE MANDATORY PAYMENT IDENTIFIERS
  -- =========================================================================
  IF p_razorpay_order_id IS NULL OR TRIM(p_razorpay_order_id) = '' THEN
    RAISE EXCEPTION 'confirm_checkout_atomic: Missing required p_razorpay_order_id';
  END IF;

  IF p_razorpay_payment_id IS NULL OR TRIM(p_razorpay_payment_id) = '' THEN
    RAISE EXCEPTION 'confirm_checkout_atomic: Missing required p_razorpay_payment_id';
  END IF;

  -- =========================================================================
  -- 2. PARENT ORDER IDEMPOTENCY CHECK (BEFORE ANY MUTATION)
  -- =========================================================================
  SELECT id, order_number, total, subtotal, status, customer_id, payment_order_id, tracking_id
  INTO v_existing_order
  FROM public.orders
  WHERE tracking_id = p_razorpay_payment_id
     OR payment_order_id = p_razorpay_order_id
  LIMIT 1;

  IF v_existing_order.id IS NOT NULL THEN
    -- Identity isolation guard: Reject cross-session identifier mixing
    IF (v_existing_order.payment_order_id IS NOT NULL AND v_existing_order.payment_order_id <> p_razorpay_order_id) OR
       (v_existing_order.tracking_id IS NOT NULL AND v_existing_order.tracking_id <> p_razorpay_payment_id) THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Security violation - payment identifier mismatch for order %', v_existing_order.order_number;
    END IF;

    -- Ensure payment_orders reflects finalized state
    UPDATE public.payment_orders
    SET status = 'paid',
        order_id = v_existing_order.id,
        updated_at = now()
    WHERE razorpay_order_id = p_razorpay_order_id
      AND status <> 'paid';

    -- Mark webhook event completed if event info provided
    IF p_event_id IS NOT NULL AND p_lease_token IS NOT NULL THEN
      UPDATE public.payment_webhook_events
      SET status = 'completed',
          order_id = v_existing_order.id,
          processed_at = now()
      WHERE event_id = p_event_id
        AND lease_token = p_lease_token;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'order_id', v_existing_order.id,
      'order_number', v_existing_order.order_number,
      'total', v_existing_order.total,
      'message', 'Order already confirmed'
    );
  END IF;

  -- =========================================================================
  -- 3. PAYMENT SESSION LOCKING & STATE MACHINE
  -- =========================================================================
  SELECT *
  INTO v_payment_order
  FROM public.payment_orders
  WHERE razorpay_order_id = p_razorpay_order_id
  FOR UPDATE;

  IF v_payment_order.id IS NOT NULL THEN
    -- If session is already paid and order_id exists
    IF v_payment_order.status = 'paid' AND v_payment_order.order_id IS NOT NULL THEN
      SELECT id, order_number, total INTO v_existing_order
      FROM public.orders WHERE id = v_payment_order.order_id;

      IF v_existing_order.id IS NOT NULL THEN
        RETURN jsonb_build_object(
          'success', true,
          'idempotent', true,
          'order_id', v_existing_order.id,
          'order_number', v_existing_order.order_number,
          'total', v_existing_order.total,
          'message', 'Payment session already paid and finalized'
        );
      END IF;
    END IF;

    IF v_payment_order.status = 'failed' THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Payment session % is marked failed', p_razorpay_order_id;
    END IF;

    -- Extract checkout context from session snapshot
    v_raw_items := COALESCE(v_payment_order.items, '[]'::jsonb);
    v_customer_id := v_payment_order.customer_id;
    v_shipping_address := v_payment_order.shipping_address;
    v_shipping_fee := COALESCE(v_payment_order.shipping_fee, 0);
    v_discount := COALESCE(v_payment_order.discount, 0);
  ELSE
    -- Payment order snapshot does not exist: use p_order_data
    IF p_order_data IS NOT NULL THEN
      IF jsonb_typeof(p_order_data) = 'array' THEN
        v_raw_items := p_order_data;
      ELSE
        v_raw_items := COALESCE(p_order_data->'items', '[]'::jsonb);
        v_customer_id := (p_order_data->>'customer_id')::UUID;
        v_shipping_address := p_order_data->'shipping_address';
        v_shipping_fee := COALESCE((p_order_data->>'shipping_fee')::NUMERIC, 0);
        v_discount := COALESCE((p_order_data->>'discount')::NUMERIC, 0);
      END IF;
    ELSE
      v_raw_items := '[]'::jsonb;
    END IF;
  END IF;

  -- Allow p_order_data to enrich missing customer/address fields if snapshot lacked them
  IF p_order_data IS NOT NULL AND jsonb_typeof(p_order_data) = 'object' THEN
    IF v_customer_id IS NULL AND p_order_data ? 'customer_id' THEN
      v_customer_id := (p_order_data->>'customer_id')::UUID;
    END IF;
    IF v_shipping_address IS NULL AND p_order_data ? 'shipping_address' THEN
      v_shipping_address := p_order_data->'shipping_address';
    END IF;
    IF (v_raw_items IS NULL OR jsonb_array_length(v_raw_items) = 0) AND p_order_data ? 'items' THEN
      v_raw_items := p_order_data->'items';
    END IF;
  END IF;

  IF v_raw_items IS NULL OR jsonb_array_length(v_raw_items) = 0 THEN
    RAISE EXCEPTION 'confirm_checkout_atomic: Order must contain at least one line item';
  END IF;

  -- =========================================================================
  -- 4. RESOLVE VARIANTS, QUANTITIES, AND VALIDATE INPUT SHAPES
  -- =========================================================================
  FOR i IN 0 .. (jsonb_array_length(v_raw_items) - 1) LOOP
    v_item := v_raw_items->i;
    v_prod_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;
    v_size := v_item->>'size';
    v_color := v_item->>'color';

    IF v_prod_id IS NULL THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Item % missing product_id', i;
    END IF;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Invalid quantity %, quantity must be positive', (v_item->>'quantity');
    END IF;

    -- Resolve variant_id
    v_var_id := NULL;
    IF v_item ? 'variant_id' AND v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' <> '' THEN
      v_var_id := (v_item->>'variant_id')::UUID;
      -- Verify variant actually exists and belongs to the product
      IF NOT EXISTS (SELECT 1 FROM public.product_variants WHERE id = v_var_id AND product_id = v_prod_id) THEN
        RAISE EXCEPTION 'confirm_checkout_atomic: Variant % does not exist or does not belong to product %', v_var_id, v_prod_id;
      END IF;
    END IF;

    IF v_var_id IS NULL THEN
      -- Lookup variant by size and/or color
      SELECT id INTO v_var_id
      FROM public.product_variants
      WHERE product_id = v_prod_id
        AND (size = v_size OR v_size IS NULL)
        AND (color_name ILIKE v_color OR v_color IS NULL)
      LIMIT 1;

      IF v_var_id IS NULL THEN
        -- Fallback to any variant for the product
        SELECT id INTO v_var_id
        FROM public.product_variants
        WHERE product_id = v_prod_id
        LIMIT 1;
      END IF;
    END IF;

    IF v_var_id IS NULL THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: No variant found for product %', v_prod_id;
    END IF;

    -- Store pre-resolved item in validated list
    v_validated_items := v_validated_items || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_prod_id,
        'variant_id', v_var_id,
        'quantity', v_qty,
        'size', COALESCE(v_size, 'Free Size'),
        'color', COALESCE(v_color, 'Studio Original'),
        'unit_price', COALESCE((v_item->>'unit_price')::NUMERIC, NULL)
      )
    );
  END LOOP;

  -- =========================================================================
  -- 5. DEADLOCK-FREE INVENTORY LOCKING & STOCK VALIDATION (ORDER BY variant_id)
  -- =========================================================================
  FOR v_var IN
    WITH aggregated_demand AS (
      SELECT 
        (elem->>'variant_id')::UUID AS variant_id,
        SUM((elem->>'quantity')::INT) AS req_quantity
      FROM jsonb_array_elements(v_validated_items) AS elem
      GROUP BY (elem->>'variant_id')::UUID
    )
    SELECT 
      pv.id AS variant_id,
      pv.product_id,
      pv.stock_quantity,
      ad.req_quantity,
      p.title AS product_title,
      p.price AS catalog_price,
      p.seller_id,
      p.is_available
    FROM aggregated_demand ad
    JOIN public.product_variants pv ON pv.id = ad.variant_id
    JOIN public.products p ON p.id = pv.product_id
    ORDER BY pv.id ASC
    FOR UPDATE OF pv
  LOOP
    -- Validate product availability
    IF v_var.is_available IS FALSE THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Product "%" is currently unavailable', v_var.product_title;
    END IF;

    -- Validate stock sufficiency
    IF v_var.stock_quantity IS NULL OR v_var.stock_quantity < v_var.req_quantity THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Insufficient stock for product "%" (variant %): requested %, available %',
        v_var.product_title, v_var.variant_id, v_var.req_quantity, COALESCE(v_var.stock_quantity, 0);
    END IF;

    -- Validate seller relationship
    IF v_var.seller_id IS NULL THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Product "%" lacks authoritative seller_id', v_var.product_title;
    END IF;
  END LOOP;

  -- Controlled Failure Injection Hook 1 & 2
  IF p_fail_at = 'after_inventory_lock' THEN
    RAISE EXCEPTION 'Simulated failure: after_inventory_lock';
  END IF;

  IF p_fail_at = 'after_inventory_validation' THEN
    RAISE EXCEPTION 'Simulated failure: after_inventory_validation';
  END IF;

  -- =========================================================================
  -- 6. ATOMIC INVENTORY MUTATION
  -- =========================================================================
  WITH aggregated_demand AS (
    SELECT 
      (elem->>'variant_id')::UUID AS variant_id,
      SUM((elem->>'quantity')::INT) AS req_quantity
    FROM jsonb_array_elements(v_validated_items) AS elem
    GROUP BY (elem->>'variant_id')::UUID
  )
  UPDATE public.product_variants pv
  SET stock_quantity = pv.stock_quantity - ad.req_quantity,
      updated_at = now()
  FROM aggregated_demand ad
  WHERE pv.id = ad.variant_id;

  -- Controlled Failure Injection Hook 3
  IF p_fail_at = 'after_inventory_decrement' THEN
    RAISE EXCEPTION 'Simulated failure: after_inventory_decrement';
  END IF;

  -- =========================================================================
  -- 7. DERIVE AUTHORITATIVE MONETARY VALUES & SELLER PARTITIONING
  -- =========================================================================
  v_computed_subtotal := 0;

  FOR i IN 0 .. (jsonb_array_length(v_validated_items) - 1) LOOP
    v_item := v_validated_items->i;
    v_prod_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    SELECT id, title, price, seller_id
    INTO v_prod
    FROM public.products
    WHERE id = v_prod_id;

    -- Determine authoritative unit price: derive strictly from catalog price to prevent client tampering
    IF v_payment_order.id IS NOT NULL AND v_payment_order.items IS NOT NULL THEN
      v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_prod.price);
    ELSE
      v_unit_price := v_prod.price;
    END IF;

    v_line_total := v_unit_price * v_qty;
    v_computed_subtotal := v_computed_subtotal + v_line_total;

    -- Track primary seller
    IF v_primary_seller_id IS NULL THEN
      v_primary_seller_id := v_prod.seller_id;
    END IF;

    -- Partition by seller for suborders
    v_seller_key := v_prod.seller_id::TEXT;
    v_seller_subtotal := COALESCE((v_seller_map->>v_seller_key)::NUMERIC, 0) + v_line_total;
    v_seller_map := jsonb_set(v_seller_map, ARRAY[v_seller_key], to_jsonb(v_seller_subtotal));

    -- Update validated item with authoritative seller_id, unit_price, line_total
    v_validated_items := jsonb_set(v_validated_items, ARRAY[i::TEXT, 'seller_id'], to_jsonb(v_prod.seller_id::TEXT));
    v_validated_items := jsonb_set(v_validated_items, ARRAY[i::TEXT, 'unit_price'], to_jsonb(v_unit_price));
    v_validated_items := jsonb_set(v_validated_items, ARRAY[i::TEXT, 'total_price'], to_jsonb(v_line_total));
  END LOOP;

  -- Authoritative Total Calculation
  IF v_payment_order.total IS NOT NULL AND v_payment_order.total > 0 THEN
    v_final_total := v_payment_order.total;
    IF v_payment_order.subtotal IS NOT NULL AND v_payment_order.subtotal > 0 THEN
      v_computed_subtotal := v_payment_order.subtotal;
    END IF;
  ELSE
    v_final_total := GREATEST(0, v_computed_subtotal + v_shipping_fee - v_discount);
  END IF;

  -- =========================================================================
  -- 8. CREATE PARENT ORDER (public.orders)
  -- =========================================================================
  v_order_number := 'OGR' || UPPER(TO_HEX(EXTRACT(EPOCH FROM now())::BIGINT)) || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 4));

  INSERT INTO public.orders (
    order_number,
    customer_id,
    seller_id,
    subtotal,
    shipping_fee,
    discount,
    total,
    shipping_address,
    status,
    tracking_id,
    payment_order_id,
    created_at,
    updated_at
  ) VALUES (
    v_order_number,
    v_customer_id,
    v_primary_seller_id,
    v_computed_subtotal,
    v_shipping_fee,
    v_discount,
    v_final_total,
    v_shipping_address,
    'confirmed',
    p_razorpay_payment_id,
    p_razorpay_order_id,
    now(),
    now()
  )
  RETURNING * INTO v_parent_order;

  -- Controlled Failure Injection Hook 4
  IF p_fail_at = 'after_parent_order' THEN
    RAISE EXCEPTION 'Simulated failure: after_parent_order';
  END IF;

  -- =========================================================================
  -- 9. CREATE SELLER SUBORDERS (public.seller_orders)
  -- =========================================================================
  FOR v_seller_key IN SELECT jsonb_object_keys(v_seller_map) LOOP
    v_seller_id := v_seller_key::UUID;
    v_seller_subtotal := (v_seller_map->>v_seller_key)::NUMERIC;
    v_comm_amount := ROUND(v_seller_subtotal * (v_comm_rate / 100.0), 2);
    v_seller_payable := v_seller_subtotal - v_comm_amount;

    INSERT INTO public.seller_orders (
      parent_order_id,
      seller_id,
      seller_subtotal,
      commission_rate,
      commission_amount,
      seller_payable,
      status,
      fulfillment_status,
      tracking_id,
      created_at,
      updated_at
    ) VALUES (
      v_parent_order.id,
      v_seller_id,
      v_seller_subtotal,
      v_comm_rate,
      v_comm_amount,
      v_seller_payable,
      'confirmed',
      'unfulfilled',
      p_razorpay_payment_id,
      now(),
      now()
    )
    RETURNING id INTO v_suborder_id;

    v_suborder_map := jsonb_set(v_suborder_map, ARRAY[v_seller_key], to_jsonb(v_suborder_id::TEXT));
    v_suborders_count := v_suborders_count + 1;
  END LOOP;

  -- Controlled Failure Injection Hook 5
  IF p_fail_at = 'after_seller_order' THEN
    RAISE EXCEPTION 'Simulated failure: after_seller_order';
  END IF;

  -- =========================================================================
  -- 10. CREATE ORDER ITEMS (public.order_items)
  -- =========================================================================
  FOR i IN 0 .. (jsonb_array_length(v_validated_items) - 1) LOOP
    v_item := v_validated_items->i;
    v_seller_key := v_item->>'seller_id';
    v_suborder_id := (v_suborder_map->>v_seller_key)::UUID;

    INSERT INTO public.order_items (
      order_id,
      seller_order_id,
      seller_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      total_price,
      size,
      color
    ) VALUES (
      v_parent_order.id,
      v_suborder_id,
      (v_item->>'seller_id')::UUID,
      (v_item->>'product_id')::UUID,
      (v_item->>'variant_id')::UUID,
      (v_item->>'quantity')::INT,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'total_price')::NUMERIC,
      v_item->>'size',
      v_item->>'color'
    );

    v_items_count := v_items_count + 1;
  END LOOP;

  -- Controlled Failure Injection Hook 6
  IF p_fail_at = 'after_order_items' THEN
    RAISE EXCEPTION 'Simulated failure: after_order_items';
  END IF;

  -- =========================================================================
  -- 11. FINALIZE PAYMENT SESSION IN payment_orders
  -- =========================================================================
  IF v_payment_order.id IS NOT NULL THEN
    UPDATE public.payment_orders
    SET status = 'paid',
        order_id = v_parent_order.id,
        updated_at = now()
    WHERE id = v_payment_order.id;
  ELSE
    INSERT INTO public.payment_orders (
      razorpay_order_id,
      customer_id,
      items,
      subtotal,
      shipping_fee,
      discount,
      total,
      shipping_address,
      status,
      order_id,
      created_at,
      updated_at
    ) VALUES (
      p_razorpay_order_id,
      v_customer_id,
      v_raw_items,
      v_computed_subtotal,
      v_shipping_fee,
      v_discount,
      v_final_total,
      v_shipping_address,
      'paid',
      v_parent_order.id,
      now(),
      now()
    );
  END IF;

  -- =========================================================================
  -- 12. FINALIZE WEBHOOK EVENT IF PROVIDED
  -- =========================================================================
  IF p_event_id IS NOT NULL AND p_lease_token IS NOT NULL THEN
    UPDATE public.payment_webhook_events
    SET status = 'completed',
        order_id = v_parent_order.id,
        processed_at = now()
    WHERE event_id = p_event_id
      AND lease_token = p_lease_token;
  END IF;

  -- Controlled Failure Injection Hook 7
  IF p_fail_at = 'after_payment_finalization' THEN
    RAISE EXCEPTION 'Simulated failure: after_payment_finalization';
  END IF;

  -- =========================================================================
  -- 13. RETURN SUCCESS RESULT
  -- =========================================================================
  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'order_id', v_parent_order.id,
    'order_number', v_parent_order.order_number,
    'total', v_parent_order.total,
    'suborders_count', v_suborders_count,
    'items_count', v_items_count
  );

EXCEPTION
  -- Catch unique violation for concurrent parent order insertions
  WHEN unique_violation THEN
    SELECT id, order_number, total, subtotal, status, customer_id, payment_order_id, tracking_id
    INTO v_existing_order
    FROM public.orders
    WHERE tracking_id = p_razorpay_payment_id
       OR payment_order_id = p_razorpay_order_id
    LIMIT 1;

    IF v_existing_order.id IS NOT NULL THEN
      -- Identity isolation guard: Reject cross-session identifier mixing
      IF (v_existing_order.payment_order_id IS NOT NULL AND v_existing_order.payment_order_id <> p_razorpay_order_id) OR
         (v_existing_order.tracking_id IS NOT NULL AND v_existing_order.tracking_id <> p_razorpay_payment_id) THEN
        RAISE EXCEPTION 'confirm_checkout_atomic: Security violation - payment identifier mismatch for order %', v_existing_order.order_number;
      END IF;

      UPDATE public.payment_orders
      SET status = 'paid',
          order_id = v_existing_order.id,
          updated_at = now()
      WHERE razorpay_order_id = p_razorpay_order_id
        AND status <> 'paid';

      IF p_event_id IS NOT NULL AND p_lease_token IS NOT NULL THEN
        UPDATE public.payment_webhook_events
        SET status = 'completed',
            order_id = v_existing_order.id,
            processed_at = now()
        WHERE event_id = p_event_id
          AND lease_token = p_lease_token;
      END IF;

      RETURN jsonb_build_object(
        'success', true,
        'idempotent', true,
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'total', v_existing_order.total,
        'message', 'Order resolved via concurrent unique constraint catch'
      );
    ELSE
      RAISE;
    END IF;
  WHEN OTHERS THEN
    -- Automatic transaction rollback
    RAISE;
END;
$$;

-- =========================================================================
-- STRICT PRODUCTION FINANCIAL PRIVILEGES: SERVICE_ROLE EXCLUSIVE
-- =========================================================================
-- Revoke all execution permissions from PUBLIC, anon, and authenticated
REVOKE ALL ON FUNCTION public.confirm_checkout_atomic(TEXT, TEXT, JSONB, TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirm_checkout_atomic(TEXT, TEXT, JSONB, TEXT, UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_checkout_atomic(TEXT, TEXT, JSONB, TEXT, UUID, TEXT) FROM authenticated;

-- Grant execution permissions EXCLUSIVELY to service_role (trusted Edge Functions)
GRANT EXECUTE ON FUNCTION public.confirm_checkout_atomic(TEXT, TEXT, JSONB, TEXT, UUID, TEXT) TO service_role;
-- Storefront-facing policies for the core commerce tables.
-- The tables themselves are created in 20251029101900_bootstrap_roles.sql,
-- because foreign keys from discounts/orders require sellers to exist first.

drop policy if exists "Public can read active sellers" on public.sellers;
create policy "Public can read active sellers" on public.sellers
  for select using (is_active is true);

drop policy if exists "Sellers manage their own row" on public.sellers;
create policy "Sellers manage their own row" on public.sellers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Public can read variants" on public.product_variants;
create policy "Public can read variants" on public.product_variants
  for select using (true);

drop policy if exists "Customers read their own orders" on public.orders;
create policy "Customers read their own orders" on public.orders
  for select using (auth.uid() = customer_id);

drop policy if exists "Sellers read orders for their store" on public.orders;
create policy "Sellers read orders for their store" on public.orders
  for select using (
    exists (select 1 from public.sellers s where s.id = orders.seller_id and s.user_id = auth.uid())
  );

drop policy if exists "Order items follow their order" on public.order_items;
create policy "Order items follow their order" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid()
             or exists (select 1 from public.sellers s where s.id = o.seller_id and s.user_id = auth.uid()))
    )
  );
