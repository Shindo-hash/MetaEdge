import type { SupabaseClient } from '@supabase/supabase-js'
import type { Cycle, Goal, Session, MonthlyHistory } from '@/types'
import { calcCycleDailyGoal, countOpDays } from './goals'

// ── HELPERS ──────────────────────────────────────────────────

/** Último dia do mês (ex: 2026-04-30) */
function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0) // day 0 = último dia do mês anterior
  return `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Primeiro dia do mês (ex: 2026-04-01) */
function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

// ── API PÚBLICA ───────────────────────────────────────────────

/** Retorna o ciclo ativo do usuário, ou null. */
export async function getActiveCycle(
  supabase: SupabaseClient,
  userId: string,
): Promise<Cycle | null> {
  const { data } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  return data ?? null
}

/**
 * Fecha o ciclo atual: salva snapshot em monthly_history
 * e atualiza cycles.status = 'closed'. Retorna o snapshot salvo, pra quem
 * chamou poder mostrar uma tela de "parabéns" com os números certos.
 */
export async function closeCycle(
  supabase: SupabaseClient,
  cycle: Cycle,
  sessions: Session[],
  finalBankroll: number,
): Promise<MonthlyHistory> {
  const cycleSessions = sessions.filter(s => s.date >= cycle.start_date)
  const totalProfit   = cycleSessions.reduce((acc, s) => acc + s.profit, 0)
  const daysOperated  = cycleSessions.length
  const daysPositive  = cycleSessions.filter(s => s.result === 'win').length
  const daysNegative  = cycleSessions.filter(s => s.result === 'loss').length
  const returnPct     = cycle.initial_bankroll > 0
    ? (totalProfit / cycle.initial_bankroll) * 100
    : 0
  const endDate = lastDayOfMonth(cycle.year, cycle.month)

  const [{ data: historyRow }] = await Promise.all([
    supabase.from('monthly_history').insert({
      user_id:          cycle.user_id,
      cycle_id:         cycle.id,
      year:             cycle.year,
      month:            cycle.month,
      initial_bankroll: cycle.initial_bankroll,
      final_bankroll:   finalBankroll,
      total_profit:     totalProfit,
      return_pct:       returnPct,
      daily_goal_fixed: cycle.daily_goal_fixed,
      op_days_total:    cycle.op_days_total,
      days_operated:    daysOperated,
      days_positive:    daysPositive,
      days_negative:    daysNegative,
    }).select().single(),
    supabase.from('cycles').update({
      status:   'closed',
      end_date: endDate,
    }).eq('id', cycle.id),
  ])

  return historyRow as MonthlyHistory
}

/**
 * Cria um novo ciclo para o mês/ano informados baseado no goal ativo.
 * Usa goal.initial_bankroll como base de cálculo (nunca a banca atual).
 */
export async function openNewCycle(
  supabase: SupabaseClient,
  goal: Goal,
  userId: string,
  year: number,
  month: number,
): Promise<Cycle> {
  const startDate      = firstDayOfMonth(year, month)
  const endDate        = lastDayOfMonth(year, month)
  const opDays         = countOpDays(startDate, endDate, goal.play_weekends)
  const dailyGoalFixed = calcCycleDailyGoal(goal, opDays)

  const { data, error } = await supabase
    .from('cycles')
    .insert({
      user_id:          userId,
      goal_id:          goal.id,
      year,
      month,
      start_date:       startDate,
      initial_bankroll: goal.initial_bankroll,  // sempre a banca inicial da meta
      daily_goal_fixed: dailyGoalFixed,
      op_days_total:    opDays,
      status:           'active',
    })
    .select()
    .single()

  if (error) throw new Error('Erro ao criar ciclo: ' + error.message)
  return data as Cycle
}

/**
 * Garante que existe um ciclo ativo para o mês corrente.
 * - Se não há ciclo → cria um.
 * - Se o ciclo existe mas é de mês anterior → fecha e cria novo.
 * - Se o ciclo já é do mês corrente MAS pertence a uma meta diferente da
 *   ativa agora (usuário trocou de estratégia no meio do mês) → atualiza
 *   os números do ciclo pra bater com a meta nova, sem fechar o mês
 *   (não é fim de mês de verdade, é só troca de estratégia).
 * - Se o ciclo já é do mês corrente e da mesma meta → retorna ele.
 * A banca inicial do ciclo é sempre goal.initial_bankroll (nunca a banca atual).
 *
 * Retorna também `justClosed`: preenchido SÓ na chamada exata em que um
 * ciclo anterior acabou de ser fechado agora — dá pra usar isso pra mostrar
 * uma tela de "parabéns" com os números do mês que fechou.
 */
export async function ensureCycleForCurrentMonth(
  supabase: SupabaseClient,
  userId: string,
  goal: Goal,
  sessions: Session[],
  currentBankroll: number,
  preloadedCycle?: Cycle | null,
): Promise<{ cycle: Cycle; justClosed: MonthlyHistory | null }> {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  // Se a página já buscou o ciclo em paralelo com o resto dos dados
  // (profile/goal/sessions), usa esse valor — evita uma chamada sequencial
  // extra ao banco, que é uma das causas de navegação lenta entre páginas.
  const cycle = preloadedCycle !== undefined ? preloadedCycle : await getActiveCycle(supabase, userId)

  // Ciclo já existe e é do mês atual
  if (cycle && cycle.year === year && cycle.month === month) {
    // Meta trocou no meio do caminho (mesmo mês, meta diferente) — recalcula
    // os números do ciclo pra bater com a estratégia nova, sem fechar o mês.
    if (cycle.goal_id !== goal.id) {
      const opDays = countOpDays(cycle.start_date, lastDayOfMonth(year, month), goal.play_weekends)
      const dailyGoalFixed = calcCycleDailyGoal(goal, opDays)

      const { data: updatedCycle, error } = await supabase
        .from('cycles')
        .update({
          goal_id:           goal.id,
          initial_bankroll:  goal.initial_bankroll,
          daily_goal_fixed:  dailyGoalFixed,
          op_days_total:     opDays,
        })
        .eq('id', cycle.id)
        .select()
        .single()

      if (error) throw new Error('Erro ao atualizar ciclo pra nova meta: ' + error.message)
      return { cycle: updatedCycle as Cycle, justClosed: null }
    }
    return { cycle, justClosed: null }
  }

  // Ciclo existe mas é de mês anterior → fechar
  let justClosed: MonthlyHistory | null = null
  if (cycle) {
    justClosed = await closeCycle(supabase, cycle, sessions, currentBankroll)
  }

  // Criar ciclo para o mês atual (usa goal.initial_bankroll internamente)
  const newCycle = await openNewCycle(supabase, goal, userId, year, month)
  return { cycle: newCycle, justClosed }
}
