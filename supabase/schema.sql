-- ============================================================
-- MetaEdge — Schema Supabase
-- Execute no SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  current_bankroll numeric(12,2) not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own data" on public.profiles
  for all using (auth.uid() = id);

-- Trigger: cria perfil automático ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. GOALS
create table if not exists public.goals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  strategy         text not null check (strategy in ('fixed', 'compound')),
  initial_bankroll numeric(12,2) not null,
  target_bankroll  numeric(12,2),
  daily_percentage numeric(6,2),
  weeks            integer,
  play_weekends    boolean not null default false,
  start_date       date not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "goals: own data" on public.goals
  for all using (auth.uid() = user_id);

-- ============================================================
-- 3. SESSIONS
create table if not exists public.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  date             date not null,
  start_time       time,
  end_time         time,
  initial_bankroll numeric(12,2) not null,
  final_bankroll   numeric(12,2) not null,
  result           text not null check (result in ('win', 'loss', 'partial')),
  profit           numeric(12,2) not null default 0,
  created_at       timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "sessions: own data" on public.sessions
  for all using (auth.uid() = user_id);

create index if not exists idx_sessions_user_date on public.sessions(user_id, date desc);

-- ============================================================
-- 4. DAILY PROGRESS (reservada para uso futuro — cache de evolução diária)
-- Nota: esta tabela existe no schema mas NÃO é utilizada pela aplicação.
-- Mantida para possível implementação futura de cache de progresso diário.
-- ============================================================
create table if not exists public.daily_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  date       date not null,
  bankroll   numeric(12,2) not null,
  daily_goal numeric(12,2),
  result     text check (result in ('win', 'loss', 'partial')),
  unique (user_id, date)
);

alter table public.daily_progress enable row level security;

create policy "daily_progress: own data" on public.daily_progress
  for all using (auth.uid() = user_id);
