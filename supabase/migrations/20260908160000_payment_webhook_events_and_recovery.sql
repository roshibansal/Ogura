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
