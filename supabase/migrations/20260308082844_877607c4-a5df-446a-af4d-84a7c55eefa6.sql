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
USING (public.has_role(auth.uid(), 'admin'));