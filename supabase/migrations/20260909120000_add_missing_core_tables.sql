-- Tables that were created by hand in the Supabase dashboard and therefore had
-- no migration: orders, order_items, sellers, product_variants, user_roles.
--
-- Without these the schema could not be rebuilt on a new project — checkout,
-- the seller portal and the boutique pages all depend on them. Reconstructed
-- from the generated types, which are derived from the live database.

-- ---------------------------------------------------------------- app_role
do $$ begin
  create type public.app_role as enum ('admin', 'seller', 'customer');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- sellers
create table if not exists public.sellers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null,
  brand_name          text not null,
  city                text not null,
  seller_type         text not null,
  description         text,
  profile_image       text,
  banner_image        text,
  instagram_handle    text,
  application_status  text not null default 'submitted',
  is_verified         boolean default false,
  is_active           boolean default false,
  gstin               text,
  pan_number          text,
  bank_name           text,
  bank_account_number text,
  bank_ifsc           text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index if not exists sellers_user_id_idx on public.sellers (user_id);

-- ---------------------------------------------------------- product_variants
create table if not exists public.product_variants (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null,
  size            text not null,
  color_name      text not null,
  color_hex       text,
  sku             text,
  price_override  numeric,
  stock_quantity  integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------- orders
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  customer_id      uuid not null,
  seller_id        uuid not null,
  status           text not null default 'pending',
  subtotal         numeric not null,
  discount         numeric default 0,
  shipping_fee     numeric default 0,
  total            numeric not null,
  shipping_address jsonb not null,
  shipping_carrier text,
  tracking_id      text,
  accepted_at      timestamptz,
  packed_at        timestamptz,
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  cancelled_at     timestamptz,
  created_at       timestamptz default now()
);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_seller_id_idx   on public.orders (seller_id);

-- ------------------------------------------------------------- order_items
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid not null,
  variant_id  uuid,
  quantity    integer not null,
  unit_price  numeric not null,
  total_price numeric not null,
  size        text,
  color       text,
  created_at  timestamptz default now()
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- -------------------------------------------------------------- user_roles
create table if not exists public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  role       public.app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- ------------------------------------------------------------------- RLS
alter table public.sellers          enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.user_roles       enable row level security;

-- Storefront reads. Bank and tax columns are deliberately not exposed: the
-- client only ever selects the public-safe column list.
drop policy if exists "Public can read active sellers" on public.sellers;
create policy "Public can read active sellers" on public.sellers
  for select using (is_active is true);

drop policy if exists "Public can read variants" on public.product_variants;
create policy "Public can read variants" on public.product_variants
  for select using (true);

-- A seller owns their own row and their own orders.
drop policy if exists "Sellers manage their own row" on public.sellers;
create policy "Sellers manage their own row" on public.sellers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

drop policy if exists "Users read their own roles" on public.user_roles;
create policy "Users read their own roles" on public.user_roles
  for select using (auth.uid() = user_id);
