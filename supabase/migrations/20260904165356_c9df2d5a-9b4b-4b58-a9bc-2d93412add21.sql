DROP POLICY IF EXISTS "Anyone can view approved active sellers" ON public.sellers;
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
USING (public.has_role(auth.uid(), 'admin'));