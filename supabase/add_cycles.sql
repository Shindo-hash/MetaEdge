-- ============================================================
-- MetaEdge — Ciclos Mensais e Histórico
-- Execute no SQL Editor após o schema.sql base
-- ============================================================

-- 1. CYCLES — um ciclo = um mês ativo de uma meta
create table if not exists public.cycles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  goal_id          uuid not null references public.goals(id) on delete cascade,
  year             int  not null,
  month            int  not null,
  start_date       date not null,   -- sempre dia 1 do mês
  end_date         date,            -- preenchido ao fechar
  initial_bankroll numeric(12,2) not null,
  daily_goal_fixed numeric(12,2) not null,
  op_days_total    int  not null,   -- dias operacionais do mês
  status           text not null default 'active'
                   check (status in ('active','closed')),
  created_at       timestamptz not null default now(),
  unique (user_id, year, month)
);

alter table public.cycles enable row level security;

create policy "cycles: own data" on public.cycles
  for all using (auth.uid() = user_id);

create index if not exists idx_cycles_user_status
  on public.cycles(user_id, status);

-- ============================================================
-- 2. MONTHLY_HISTORY — snapshot imutável ao fechar o mês
create table if not exists public.monthly_history (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  cycle_id         uuid not null references public.cycles(id),
  year             int  not null,
  month            int  not null,
  initial_bankroll numeric(12,2) not null,
  final_bankroll   numeric(12,2) not null,
  total_profit     numeric(12,2) not null,
  return_pct       numeric(6,2)  not null,
  daily_goal_fixed numeric(12,2) not null,
  op_days_total    int  not null,
  days_operated    int  not null,
  days_positive    int  not null,
  days_negative    int  not null,
  created_at       timestamptz not null default now(),
  unique (user_id, year, month)
);

alter table public.monthly_history enable row level security;

create policy "monthly_history: own data" on public.monthly_history
  for all using (auth.uid() = user_id);

create index if not exists idx_monthly_history_user
  on public.monthly_history(user_id, year desc, month desc);
