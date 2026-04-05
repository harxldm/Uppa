-- =============================================================
--  Uppa · Supabase Schema
--  Run this in the Supabase SQL Editor
-- =============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- TABLE: user_shopping_list
-- ------------------------------------------------------------
create table if not exists public.user_shopping_list (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  barcode       text not null,
  product_name  text not null,
  brand         text,
  image_url     text,
  nutriscore    char(1),
  price         numeric(10, 2) not null default 0,
  quantity      integer not null default 1,
  created_at    timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists idx_shopping_list_user_id
  on public.user_shopping_list (user_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.user_shopping_list enable row level security;

-- Users can only see their own rows
create policy "Users see own items"
  on public.user_shopping_list
  for select
  using (auth.uid() = user_id);

-- Users can only insert their own rows
create policy "Users insert own items"
  on public.user_shopping_list
  for insert
  with check (auth.uid() = user_id);

-- Users can only update their own rows
create policy "Users update own items"
  on public.user_shopping_list
  for update
  using (auth.uid() = user_id);

-- Users can only delete their own rows
create policy "Users delete own items"
  on public.user_shopping_list
  for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- OPTIONAL: quick budget view
-- ------------------------------------------------------------
create or replace view public.shopping_session_total as
  select
    user_id,
    date_trunc('day', created_at) as session_day,
    count(*)                       as item_count,
    sum(price * quantity)          as total_amount
  from public.user_shopping_list
  group by user_id, session_day;

-- ------------------------------------------------------------
-- TABLE: user_preferences
-- ------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  currency            text not null default 'MXN',
  language            text not null default 'es',
  setup_completed     boolean not null default false,
  updated_at          timestamptz not null default now()
);

-- Index for fast user queries
create index if not exists idx_user_preferences_user_id
  on public.user_preferences (user_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY: user_preferences
-- ------------------------------------------------------------
alter table public.user_preferences enable row level security;

create policy "Users see own preferences"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

create policy "Users insert own preferences"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Users update own preferences"
  on public.user_preferences
  for update
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- TABLE: global_products (CROWDSOURCED DB)
-- ------------------------------------------------------------
create table if not exists public.global_products (
  barcode            text primary key,
  name               text not null,
  brand              text,
  image_url          text,
  nutriscore         char(1),
  approximate_price  numeric(10, 2),
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY: global_products
-- ------------------------------------------------------------
alter table public.global_products enable row level security;

-- Everyone logged in can read the global catalog
create policy "Anyone can read global products"
  on public.global_products
  for select
  using (auth.role() = 'authenticated');

-- Everyone logged in can insert to the global catalog
create policy "Anyone can insert global products"
  on public.global_products
  for insert
  with check (auth.role() = 'authenticated');

-- Everyone logged in can update existing products (to update the price)
create policy "Anyone can update global products"
  on public.global_products
  for update
  using (auth.role() = 'authenticated');
