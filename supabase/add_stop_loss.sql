-- Adiciona o limite de perda (%) que dispara o aviso de "considere sacar".
-- Cada meta pode ter o próprio valor, ajustável a qualquer momento.
-- Padrão: 50% (perdeu metade da banca inicial).
alter table public.goals
  add column if not exists stop_loss_pct numeric(5,2) not null default 50;
