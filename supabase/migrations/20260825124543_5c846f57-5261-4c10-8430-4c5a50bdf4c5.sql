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
USING (public.has_role(auth.uid(), 'admin'));