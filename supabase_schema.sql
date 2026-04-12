-- =============================================================
--  Uppa · Supabase Schema
--  Run this in the Supabase SQL Editor
-- =============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- TABLE: shopping_sessions
-- ------------------------------------------------------------
create table if not exists public.shopping_sessions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  status       text not null default 'active', -- 'active' or 'completed'
  total_spent  numeric(10, 2) default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Index for sessions
create index if not exists idx_sessions_user_id
  on public.shopping_sessions (user_id);

-- RLS for sessions
alter table public.shopping_sessions enable row level security;

create policy "Users see own sessions"
  on public.shopping_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own sessions"
  on public.shopping_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own sessions"
  on public.shopping_sessions for update
  using (auth.uid() = user_id);

create policy "Users delete own sessions"
  on public.shopping_sessions for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- TABLE: user_shopping_list
-- ------------------------------------------------------------
create table if not exists public.user_shopping_list (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  session_id    uuid references public.shopping_sessions(id) on delete cascade,
  barcode       text not null,
  product_name  text not null,
  brand         text,
  image_url     text,
  nutriscore    text,
  price         numeric(10, 2) not null default 0,
  quantity      integer not null default 1,
  created_at    timestamptz not null default now()
);

-- Index for fast per-user/per-session queries
create index if not exists idx_shopping_list_user_id
  on public.user_shopping_list (user_id);

create index if not exists idx_shopping_list_session_id
  on public.user_shopping_list (session_id);

-- RLS
alter table public.user_shopping_list enable row level security;

create policy "Users see own items"
  on public.user_shopping_list for select
  using (auth.uid() = user_id);

create policy "Users insert own items"
  on public.user_shopping_list for insert
  with check (auth.uid() = user_id);

create policy "Users update own items"
  on public.user_shopping_list for update
  using (auth.uid() = user_id);

create policy "Users delete own items"
  on public.user_shopping_list for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- TABLE: user_preferences
-- ------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  currency                text not null default 'COP',
  language                text not null default 'es',
  ai_detail_level         integer not null default 2,
  ai_strictness_level     integer not null default 1,
  ai_onboarding_completed boolean not null default false,
  setup_completed         boolean not null default false,
  updated_at              timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users see own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- TABLE: global_products (CROWDSOURCED DB)
-- ------------------------------------------------------------
create table if not exists public.global_products (
  barcode            text primary key,
  name               text not null,
  brand              text,
  image_url          text,
  nutriscore         text,
  approximate_price  numeric(10, 2),
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.global_products enable row level security;

create policy "Anyone can read global products"
  on public.global_products for select
  using (auth.role() = 'authenticated');

create policy "Anyone can insert global products"
  on public.global_products for insert
  with check (auth.role() = 'authenticated');

create policy "Anyone can update global products"
  on public.global_products for update
  using (auth.role() = 'authenticated');

