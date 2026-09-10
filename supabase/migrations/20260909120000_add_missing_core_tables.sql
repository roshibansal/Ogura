-- Storefront-facing policies for the core commerce tables.
-- The tables themselves are created in 20251029101900_bootstrap_roles.sql,
-- because foreign keys from discounts/orders require sellers to exist first.

drop policy if exists "Public can read active sellers" on public.sellers;
create policy "Public can read active sellers" on public.sellers
  for select using (is_active is true);

drop policy if exists "Sellers manage their own row" on public.sellers;
create policy "Sellers manage their own row" on public.sellers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Public can read variants" on public.product_variants;
create policy "Public can read variants" on public.product_variants
  for select using (true);

drop policy if exists "Customers read their own orders" on public.orders;
create policy "Customers read their own orders" on public.orders
  for select using (auth.uid() = customer_id);

drop policy if exists "Sellers read orders for their store" on public.orders;
create policy "Sellers read orders for their store" on public.orders
  for select using (
    exists (select 1 from public.sellers s where s.id = orders.seller_id and s.user_id = auth.uid())
  );

drop policy if exists "Order items follow their order" on public.order_items;
create policy "Order items follow their order" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid()
             or exists (select 1 from public.sellers s where s.id = o.seller_id and s.user_id = auth.uid()))
    )
  );
