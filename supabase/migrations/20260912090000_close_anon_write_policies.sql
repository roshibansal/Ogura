-- Close the anonymous write hole on products and vendors.
--
-- The policies named "Authenticated users can insert/update/delete ..." were
-- created with USING (true) / WITH CHECK (true) and NO "TO authenticated"
-- clause. A policy with no TO clause applies to PUBLIC, which includes anon,
-- so despite their names these granted every anonymous visitor full write
-- access to the catalogue. Verified by probe: an anon key could PATCH a live
-- product's price.
--
-- The earlier purge migration removed only the dev_allow_all_* policies and
-- left these in place. The production database had been patched by hand in
-- the dashboard, so the hole only became visible when the schema was rebuilt
-- from migrations.

-- ---------------------------------------------------------------- products
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_inserts_products"        ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_update_products"         ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_delete_products"         ON public.products;
DROP POLICY IF EXISTS "dev_allow_all_select_products"         ON public.products;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Reading the catalogue stays public: this is a storefront.
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

-- A seller may write only their own products; admins may write anything.
CREATE POLICY "Sellers manage own products, admins manage all"
  ON public.products FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
  );

-- ----------------------------------------------------------------- vendors
DROP POLICY IF EXISTS "Authenticated users can insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can delete vendors" ON public.vendors;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage vendors" ON public.vendors;
CREATE POLICY "Admins manage vendors" ON public.vendors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- --------------------------------------------------------------- discounts
-- Codes must never be writable (or enumerable) by the public.
DROP POLICY IF EXISTS "dev_allow_all_inserts_discounts" ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_update_discounts"  ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_delete_discounts"  ON public.discounts;
DROP POLICY IF EXISTS "dev_allow_all_select_discounts"  ON public.discounts;

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage discounts" ON public.discounts;
CREATE POLICY "Admins manage discounts" ON public.discounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ----------------------------------------------------------------- sellers
DROP POLICY IF EXISTS "dev_allow_anon_update_sellers" ON public.sellers;
DROP POLICY IF EXISTS "dev_allow_anon_select_sellers" ON public.sellers;
