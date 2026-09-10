
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
