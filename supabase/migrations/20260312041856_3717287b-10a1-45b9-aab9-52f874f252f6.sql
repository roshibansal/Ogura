CREATE TABLE IF NOT EXISTS public.discounts (
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