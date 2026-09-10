DROP POLICY IF EXISTS "dev_allow_anon_update_sellers" ON public.sellers;
CREATE POLICY "dev_allow_anon_update_sellers" ON public.sellers FOR UPDATE TO anon
USING (true) WITH CHECK (true);