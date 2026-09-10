
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
