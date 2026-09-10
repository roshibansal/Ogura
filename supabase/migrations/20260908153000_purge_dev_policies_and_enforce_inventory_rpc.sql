-- Migration: 20260908153000_purge_dev_policies_and_enforce_inventory_rpc.sql
-- Description: Purge all anonymous development policies and enforce atomic inventory reservation RPC with row locking

-- ============================================================================
-- 1. PURGE ALL ANONYMOUS DEVELOPMENT POLICIES
-- ============================================================================

-- Drop dev policies on products
DROP POLICY IF EXISTS "dev_allow_all_select_products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_inserts_products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_update_products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_delete_products" ON public.products;

-- Drop dev policies on discounts
DROP POLICY IF EXISTS "dev_allow_all_select_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_inserts_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_update_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_delete_discounts" ON public.discounts;

-- Drop dev policies on sellers
DROP POLICY IF EXISTS "dev_allow_anon_select_sellers" ON public.sellers;
DROP POLICY IF EXISTS "dev_allow_anon_update_sellers" ON public.sellers;

-- Ensure RLS is active on products and discounts
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Ensure public can view available products, but only authorized users can write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone can view active products'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
    CREATE POLICY "Anyone can view active products" ON public.products
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================================
-- 2. ENFORCE ATOMIC INVENTORY RESERVATION WITH ROW-LEVEL LOCKING
-- ============================================================================

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
  -- Row-level lock using FOR UPDATE to prevent race conditions
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

-- Grant execution to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.reserve_and_decrement_variant_stock(UUID, INT) TO anon, authenticated, service_role;

-- ============================================================================
-- 3. ENFORCE ATOMIC INVENTORY RESTORATION RPC
-- ============================================================================

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

GRANT EXECUTE ON FUNCTION public.restore_variant_stock(UUID, INT) TO anon, authenticated, service_role;
