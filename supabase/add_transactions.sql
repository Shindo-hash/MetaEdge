-- ============================================================
-- MetaEdge — Adicionar tabela de transações (depósitos/saques)
-- Execute no SQL Editor: https://supabase.com/dashboard/project/poyqihswguqprelxftgl/sql
-- ============================================================

create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('deposit', 'withdrawal')),
  amount     numeric(12,2) not null check (amount > 0),
  note       text,
  date       date not null,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions: own data" on public.transactions
  for all using (auth.uid() = user_id);

create index if not exists idx_transactions_user_date
  on public.transactions(user_id, date desc);
