-- Bootstrap: the role enum, the user_roles table and has_role().
--
-- has_role() is called by 17 later migrations and by policies throughout the
-- schema, but no migration ever created it — it was made by hand in the old
-- project's SQL editor. A rebuild therefore failed on the very first policy
-- that referenced it. Same story as orders/sellers/product_variants.
--
-- Deliberately numbered before every other migration so the function exists
-- when the first policy needs it.

do $$ begin
  DO $do$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'customer');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $do$;
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  role       public.app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- security definer so a policy can ask "is this user an admin?" without the
-- user needing read access to user_roles itself, which would be circular.
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = _user_id and role::text = _role
  );
end;
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
end;
$$;

drop policy if exists "Users read their own roles" on public.user_roles;
DROP POLICY IF EXISTS "Users read their own roles" ON public.user_roles;
CREATE POLICY "Users read their own roles" ON public.user_roles
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Core commerce tables, also hand-made in the old project and therefore absent
-- from the migration history. They live here rather than in a later migration
-- because `discounts`, `orders` and others carry foreign keys to `sellers`,
-- so it has to exist before any of them run.
-- ---------------------------------------------------------------------------

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
create unique index if not exists sellers_user_id_key on public.sellers (user_id);

create table if not exists public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null,
  size           text not null,
  color_name     text not null,
  color_hex      text,
  sku            text,
  price_override numeric,
  stock_quantity integer default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

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

alter table public.sellers          enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
