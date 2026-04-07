import { Goal, GoalCalc, Session } from '@/types'

// ── UTILITÁRIOS DE DIAS ───────────────────────────────────────

/**
 * Conta dias operacionais num intervalo de datas (inclusive em ambos os lados).
 * Se play_weekends = false, exclui sábado (6) e domingo (0).
 */
export function countOpDays(startDate: string, endDate: string, playWeekends: boolean): number {
  const start  = new Date(startDate + 'T00:00:00')
  const end    = new Date(endDate   + 'T00:00:00')
  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    const dow = cursor.getDay()
    if (playWeekends || (dow !== 0 && dow !== 6)) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

// ── COMPOUND: UTILITÁRIOS ─────────────────────────────────────

/**
 * Meta diária de compound para o dia operacional N (1-based).
 *
 *   metaDiaN = initial × (1 + pct)^(N-1) × pct
 *
 * Exemplos (base=100, pct=0.30):
 *   Dia 1 → 100 × 1.30^0 × 0.30 = R$ 30,00
 *   Dia 5 → 100 × 1.30^4 × 0.30 = R$ 85,68
 */
export function getCompoundDailyGoalForOpDay(
  initialBankroll: number,
  pct: number,        // decimal (ex: 0.30)
  opDayIndex: number, // 1-based
): number {
  if (opDayIndex <= 0) return initialBankroll * pct
  return initialBankroll * Math.pow(1 + pct, opDayIndex - 1) * pct
}

// ── CICLO: META DIÁRIA FIXA (para estratégia fixed) ──────────

/**
 * Calcula a metaDiariaFixa para um ciclo de estratégia fixed.
 * Compound NÃO usa este valor para exibição — usa getCompoundDailyGoalForOpDay.
 */
export function calcCycleDailyGoal(goal: Goal, opDays: number): number {
  if (opDays <= 0) return 0
  if (goal.strategy === 'compound') {
    // Guardado no ciclo só para referência / fechamento
    const pct = (goal.daily_percentage ?? 0) / 100
    return goal.initial_bankroll * (Math.pow(1 + pct, opDays) - 1) / opDays
  }
  const totalPlanDays = (goal.weeks ?? 1) * (goal.play_weekends ? 7 : 5)
  if (totalPlanDays <= 0) return 0
  return ((goal.target_bankroll ?? 0) - goal.initial_bankroll) / totalPlanDays
}

// ── CÁLCULO GERAL DE META ─────────────────────────────────────

export function calculateGoal(goal: Goal, _currentBankroll?: number, _sessions?: Session[]): GoalCalc {
  if (goal.strategy === 'fixed') return calculateFixed(goal)
  return calculateCompound(goal)
}

// ── ESTRATÉGIA FIXA ──────────────────────────────────────────

function calculateFixed(goal: Goal): GoalCalc {
  const target       = goal.target_bankroll ?? 0
  const weeks        = goal.weeks ?? 1
  const daysPerWeek  = goal.play_weekends ? 7 : 5
  const daysPerMonth = goal.play_weekends ? 31 : 22

  const weeklyGoal  = (target - goal.initial_bankroll) / weeks
  const dailyGoal   = weeklyGoal / daysPerWeek
  const monthlyGoal = dailyGoal * daysPerMonth

  return { dailyGoal, weeklyGoal, monthlyGoal }
}

// ── ESTRATÉGIA JUROS COMPOSTOS ────────────────────────────────
// Usa SEMPRE initial_bankroll como base.
// dailyGoal = meta do dia 1 (referência). Para exibir "meta de hoje", usar
// getCompoundDailyGoalForOpDay(initial, pct, opDayIndex).

function calculateCompound(goal: Goal): GoalCalc {
  const pct          = (goal.daily_percentage ?? 0) / 100
  const daysPerWeek  = goal.play_weekends ? 7 : 5
  const daysPerMonth = goal.play_weekends ? 31 : 22

  const base         = goal.initial_bankroll        // SEMPRE a base inicial
  const dailyGoal    = base * pct                   // meta do dia 1 (referência)
  const weeklyGoal   = base * Math.pow(1 + pct, daysPerWeek)  - base
  const monthlyGoal  = base * Math.pow(1 + pct, daysPerMonth) - base

  return { dailyGoal, weeklyGoal, monthlyGoal }
}

// ── RESULTADO DA SESSÃO ───────────────────────────────────────

export function calcSessionResult(
  finalBankroll: number,
  initialBankroll: number,
  dailyGoal: number,
): 'win' | 'partial' | 'loss' {
  const profit = finalBankroll - initialBankroll
  if (profit >= dailyGoal)         return 'win'
  if (profit >= dailyGoal * 0.7)   return 'partial'
  return 'loss'
}

// ── METAS DINÂMICAS (semanal/mensal baseadas no calendário real) ──

export type DynamicGoals = {
  dailyGoal:         number
  weeklyGoal:        number
  monthlyGoal:       number
  currentWeekNumber: number
  totalOpDays:       number
  todayOpIndex:      number
  weekStartStr:      string  // segunda-feira da semana atual (YYYY-MM-DD)
  weekEndStr:        string  // domingo da semana atual (YYYY-MM-DD)
}

/**
 * Calcula meta diária, semanal e mensal com base no calendário real do mês.
 *
 * Compound:
 *   dailyGoal  = initial × (1+pct)^(todayOpIndex-1) × pct
 *   weeklyGoal = initial × (1+pct)^(s-1) × ((1+pct)^n - 1)
 *                onde s = 1º opDay da semana atual, n = opDays na semana
 *   monthlyGoal = initial × ((1+pct)^totalOpDays - 1)
 *
 * Fixed:
 *   dailyGoal   = dailyGoalFixed
 *   weeklyGoal  = dailyGoalFixed × opDaysInWeek
 *   monthlyGoal = dailyGoalFixed × totalOpDays
 */
export function calcDynamicGoals(
  goal: Goal,
  cycleStartDate: string,
  todayStr: string,
  dailyGoalFixed = 0,
): DynamicGoals {
  const pct      = (goal.daily_percentage ?? 0) / 100
  const initial  = goal.initial_bankroll
  const strategy = goal.strategy as 'compound' | 'fixed'

  const [todayY, todayM] = todayStr.split('-').map(Number)
  const lastDay = new Date(todayY, todayM, 0).getDate()

  // Dia de início efetivo: o maior entre início do ciclo e dia 1 do mês atual
  const cycleStart  = new Date(cycleStartDate + 'T00:00:00')
  const monthStart  = new Date(todayY, todayM - 1, 1)
  const effectiveStart = cycleStart > monthStart ? cycleStart : monthStart

  // Semana ISO da data fornecida: segunda-feira como início
  const todayDate   = new Date(todayStr + 'T00:00:00')
  const dowToday    = todayDate.getDay()                     // 0=dom..6=sáb
  const mondayOffset = (dowToday + 6) % 7                   // dias desde segunda
  const weekMonday  = new Date(todayDate)
  weekMonday.setDate(todayDate.getDate() - mondayOffset)
  const weekSunday  = new Date(weekMonday)
  weekSunday.setDate(weekMonday.getDate() + 6)

  let totalOpDays    = 0
  let todayOpIndex   = 0
  let weekFirstOpDay = 0   // 1-based, primeiro opDay da semana atual
  let weekOpDays     = 0   // quantos opDays na semana atual

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(todayY, todayM - 1, d)
    if (date < effectiveStart) continue

    const dow       = date.getDay()
    const isWeekend = dow === 0 || dow === 6
    if (!goal.play_weekends && isWeekend) continue

    totalOpDays++

    const dateStr = `${todayY}-${String(todayM).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (dateStr <= todayStr) todayOpIndex = totalOpDays

    // Pertence à semana atual (seg a dom, clamped ao mês)?
    if (date >= weekMonday && date <= weekSunday) {
      if (weekFirstOpDay === 0) weekFirstOpDay = totalOpDays
      weekOpDays++
    }
  }

  // Fallbacks
  if (weekFirstOpDay === 0) weekFirstOpDay = 1
  if (weekOpDays === 0)     weekOpDays     = 1
  if (todayOpIndex === 0)   todayOpIndex   = 1

  // Número da semana atual dentro do mês (1-based, ISO: semana começa na segunda)
  // Acha a segunda-feira da primeira semana que contém o dia 1 do mês
  const firstOfMonth  = new Date(todayY, todayM - 1, 1)
  const firstDow      = firstOfMonth.getDay()                  // 0=dom..6=sáb
  const firstMonOffset = (firstDow + 6) % 7                   // dias desde segunda
  const firstWeekMonday = new Date(firstOfMonth)
  firstWeekMonday.setDate(firstOfMonth.getDate() - firstMonOffset)
  const currentWeekNumber = Math.floor(
    (weekMonday.getTime() - firstWeekMonday.getTime()) / (7 * 24 * 3600 * 1000)
  ) + 1

  // Datas string da semana atual (para filtrar sessões)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const weekStartStr = fmt(weekMonday)
  const weekEndStr   = fmt(weekSunday)

  // Cálculo por estratégia
  let dailyGoal:  number
  let weeklyGoal: number
  let monthlyGoal: number

  if (strategy === 'compound') {
    dailyGoal   = getCompoundDailyGoalForOpDay(initial, pct, todayOpIndex)
    // closed-form: soma das metas da semana = initial × (1+pct)^(s-1) × ((1+pct)^n - 1)
    weeklyGoal  = initial * Math.pow(1 + pct, weekFirstOpDay - 1) * (Math.pow(1 + pct, weekOpDays) - 1)
    monthlyGoal = initial * (Math.pow(1 + pct, totalOpDays) - 1)
  } else {
    const dg    = dailyGoalFixed || (goalCalcFixed(goal)?.dailyGoal ?? 0)
    dailyGoal   = dg
    weeklyGoal  = dg * weekOpDays
    monthlyGoal = dg * totalOpDays
  }

  return { dailyGoal, weeklyGoal, monthlyGoal, currentWeekNumber, totalOpDays, todayOpIndex, weekStartStr, weekEndStr }
}

// Helper interno para fixed sem ciclo
function goalCalcFixed(goal: Goal): { dailyGoal: number } | null {
  const target      = goal.target_bankroll ?? 0
  const weeks       = goal.weeks ?? 1
  const daysPerWeek = goal.play_weekends ? 7 : 5
  const weeklyGoal  = (target - goal.initial_bankroll) / weeks
  return { dailyGoal: weeklyGoal / daysPerWeek }
}

// ── ALERTAS DE META ───────────────────────────────────────────

export type AlertLevel = 'daily' | 'weekly' | 'monthly'
export type GoalAlert  = { level: AlertLevel; message: string }

/**
 * Calcula alertas ativos.
 * todayProfit = lucro da sessão de hoje (não banca acumulada).
 * accumulatedProfit = lucro total do ciclo.
 */
export function calcAlerts(
  todayProfit: number | null,
  accumulatedProfit: number,
  todayDailyGoal: number,
  weeklyGoal: number,
  monthlyGoal: number,
): GoalAlert[] {
  const alerts: GoalAlert[] = []

  if (todayProfit !== null && todayDailyGoal > 0 && todayProfit >= todayDailyGoal) {
    alerts.push({ level: 'daily', message: 'Meta do dia atingida. Pare por hoje.' })
  }

  if (weeklyGoal > 0 && accumulatedProfit >= weeklyGoal) {
    alerts.push({ level: 'weekly', message: 'Meta semanal atingida.' })
  }

  if (monthlyGoal > 0 && accumulatedProfit >= monthlyGoal) {
    alerts.push({ level: 'monthly', message: 'Meta mensal atingida. Considere encerrar e sacar.' })
  }

  return alerts
}
