-- 1) Archive current products (revert source)
CREATE TABLE IF NOT EXISTS public.products_archive_test AS
SELECT id, status, is_available, now() AS archived_at FROM public.products;

GRANT ALL ON public.products_archive_test TO service_role;
ALTER TABLE public.products_archive_test ENABLE ROW LEVEL SECURITY;

-- 2) Freeze all existing products out of Shop All
UPDATE public.products SET status = 'disabled', is_available = false, updated_at = now();

-- 3) Brand label column (used by storefront cards)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;

-- 4) Test seller Brand1
INSERT INTO public.sellers (user_id, brand_name, city, seller_type, application_status, is_active, is_verified, description)
SELECT id, 'Brand1', 'Test City', 'independent_designer', 'approved', true, true, 'Test seller account (temporary)'
FROM auth.users WHERE email = 'lovable9057@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET brand_name = 'Brand1', is_active = true, application_status = 'approved';

-- 5) 100 test SKUs with inline SVG label images
INSERT INTO public.products (title, brand, price, original_price, images, category, colors, sizes, description, material, is_available, status, seller_id)
SELECT
  'Brand1_cloth' || i,
  'Brand1',
  99 + i,
  99 + i,
  jsonb_build_array(
    'data:image/svg+xml;base64,' || encode(convert_to(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#f5f0ea"/><text x="150" y="210" font-family="Helvetica,Arial,sans-serif" font-size="40" font-weight="bold" fill="#111" text-anchor="middle">B1_C' || i || '</text></svg>', 'UTF8'), 'base64')
  ),
  'dresses',
  '[]'::jsonb,
  '["S","M","L"]'::jsonb,
  'Test product Brand1_cloth' || i,
  'Test',
  true,
  'live',
  (SELECT id FROM public.sellers WHERE brand_name = 'Brand1' LIMIT 1)
FROM generate_series(1, 100) AS i;