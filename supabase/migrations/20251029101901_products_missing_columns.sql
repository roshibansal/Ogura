-- Columns added by hand to `products` in the old project, present in no
-- migration. Without them a rebuilt database has a products table the
-- application cannot use: no seller_id to attribute a piece to a boutique,
-- no status to publish it, no fabric or brand for the storefront.
--
-- Numbered immediately after the bootstrap so later migrations that add
-- constraints over these columns have something to constrain.

alter table public.products add column if not exists brand text;
alter table public.products add column if not exists care_instructions text;
alter table public.products add column if not exists category_id uuid;
alter table public.products add column if not exists dispatch_days integer;
alter table public.products add column if not exists fabric text;
alter table public.products add column if not exists is_made_to_order boolean default false;
alter table public.products add column if not exists is_returnable boolean default true;
alter table public.products add column if not exists occasion_tags jsonb default '[]'::jsonb;
alter table public.products add column if not exists rejection_reason text;
alter table public.products add column if not exists seller_id uuid;
alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists status text default 'draft';
alter table public.products add column if not exists style_tags jsonb default '[]'::jsonb;

create index if not exists products_seller_id_idx on public.products (seller_id);
create index if not exists products_status_idx    on public.products (status);
