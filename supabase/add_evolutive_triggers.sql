-- Gestão Evolutiva — permite personalizar os gatilhos de risco e guarda o
-- nível de risco realmente ACEITO pelo usuário (em vez de sempre calcular
-- automático em cima da banca crua).

alter table public.goals
  add column if not exists evolutive_triggers jsonb,           -- null = usa os padrões (R$1000/15%, R$5000/5%, R$10000/2%)
  add column if not exists evolutive_current_pct numeric(5,2), -- null = ainda não decidiu nenhum gatilho, usa o nível da banca inicial
  add column if not exists evolutive_ack jsonb not null default '[]'::jsonb; -- thresholds já respondidos (aceitos ou recusados)
