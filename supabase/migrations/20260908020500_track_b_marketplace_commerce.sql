-- ============================================================
-- OGURA — TRACK B MARKETPLACE COMMERCE MIGRATION
-- Multi-Seller Suborders, Atomic Inventory, and RLS
-- ============================================================

-- 1. Create Suborders Table (seller_orders)
CREATE TABLE IF NOT EXISTS public.seller_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  seller_subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  seller_payable NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded')),
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned')),
  tracking_id TEXT,
  shipping_carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Extend orders Table for Parent Order Semantics
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ALTER COLUMN seller_id DROP NOT NULL;

-- 3. Extend order_items with Seller and Suborder References
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS seller_order_id UUID REFERENCES public.seller_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

-- 4. Create Public Seller Profiles View (Public-Safe, Anon-Accessible)
CREATE OR REPLACE VIEW public.public_seller_profiles AS
SELECT
  id,
  brand_name,
  city,
  description,
  profile_image,
  banner_image,
  seller_type,
  instagram_handle,
  is_verified,
  is_active,
  created_at
FROM public.sellers
WHERE is_active = true AND is_verified = true;

GRANT SELECT ON public.public_seller_profiles TO anon, authenticated;

-- 5. Atomic Inventory Reservation RPC
CREATE OR REPLACE FUNCTION public.reserve_and_decrement_variant_stock(
  _variant_id UUID,
  _quantity INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_stock INT;
BEGIN
  -- Row-level lock using FOR UPDATE
  SELECT stock_quantity INTO _current_stock
  FROM public.product_variants
  WHERE id = _variant_id
  FOR UPDATE;

  IF _current_stock IS NULL OR _current_stock < _quantity THEN
    RETURN FALSE;
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - _quantity,
      updated_at = now()
  WHERE id = _variant_id;

  RETURN TRUE;
END;
$$;

-- 6. Atomic Inventory Restoration RPC
CREATE OR REPLACE FUNCTION public.restore_variant_stock(
  _variant_id UUID,
  _quantity INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity + _quantity,
      updated_at = now()
  WHERE id = _variant_id;
END;
$$;

-- 7. Enable RLS on seller_orders
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;

-- Customer can view their suborders via parent order ownership
DROP POLICY IF EXISTS "Customers can view their suborders" ON public.seller_orders;
CREATE POLICY "Customers can view their suborders" ON public.seller_orders
FOR SELECT USING (
  parent_order_id IN (
    SELECT id FROM public.orders WHERE customer_id = auth.uid()
  )
);

-- Sellers can view and update ONLY their own suborders
DROP POLICY IF EXISTS "Sellers can view own suborders" ON public.seller_orders;
CREATE POLICY "Sellers can view own suborders" ON public.seller_orders
FOR SELECT USING (
  seller_id IN (
    SELECT id FROM public.sellers WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Sellers can update own suborders" ON public.seller_orders;
CREATE POLICY "Sellers can update own suborders" ON public.seller_orders
FOR UPDATE USING (
  seller_id IN (
    SELECT id FROM public.sellers WHERE user_id = auth.uid()
  )
);

-- Service role has full bypass access
GRANT ALL ON public.seller_orders TO service_role;
GRANT SELECT ON public.seller_orders TO authenticated, anon;

-- 8. Justified Database Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller_id ON public.seller_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_parent_order_id ON public.seller_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_order_id ON public.order_items(seller_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON public.order_items(seller_id);
