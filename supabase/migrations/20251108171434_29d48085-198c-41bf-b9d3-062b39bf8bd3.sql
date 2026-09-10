-- Create try-on history table
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
CREATE INDEX IF NOT EXISTS idx_tryon_history_created_at ON public.tryon_history(created_at DESC);