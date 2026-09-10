-- `categories` was another hand-made table. products.category_id references it
-- and the storefront reads it, but no migration ever created it.

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  parent_id  uuid references public.categories (id) on delete set null,
  sort_order integer default 0,
  is_active  boolean default true,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories
  for select using (true);
