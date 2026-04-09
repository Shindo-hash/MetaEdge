import { Goal, GoalCalc, Session } from '@/types'
import { getCurrentRiskLevel, calculateEvolutiveProjection, type EvolutiveTrigger } from './evolutive'

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
  dailyGoal:            number
  weeklyGoal:           number
  monthlyGoal:          number
  weeklyTargetFull:     number
  monthlyTargetFull:    number
  weeklyExpectedSoFar:  number
  currentWeekNumber:    number
  totalOpDays:          number
  todayOpIndex:         number
  weekFirstOpDay:       number
  weekLastOpDay:        number
  weekStartStr:         string
  weekEndStr:           string
  // Campos para estratégia evolutiva
  currentRiskLevel?:    {
    level: number
    label: string
    color: string
    percentage: number
  }
  evolutiveProjection?: Array<{
    date: string
    bankroll: number
    dailyGoal: number
    percentage: number
  }>
}

/**
 * Calcula meta diária, semanal e mensal com base no calendário real do mês.
 *
 * weeklyTargetFull = banca ao fim da semana = currentBankroll × (1+pct)^opDaysRemainingNaSemana
 * weeklyExpectedSoFar = lucro esperado até hoje na semana =
 *   bancaInicioSemana × (1+pct)^posicaoNaSemana - bancaInicioSemana
 */
export function calcDynamicGoals(
  goal: Goal,
  cycleStartDate: string,
  todayStr: string,
  dailyGoalFixed = 0,
  currentBankroll?: number,
  evolutiveTriggers?: EvolutiveTrigger[],
): DynamicGoals {
  const pct = (goal.daily_percentage ?? 0) / 100
  const initial = goal.initial_bankroll
  const strategy = goal.strategy as 'compound' | 'fixed' | 'evolutive'

  const [todayY, todayM] = todayStr.split('-').map(Number)
  const lastDay = new Date(todayY, todayM, 0).getDate()

  const cycleStart = new Date(cycleStartDate + 'T00:00:00')
  const monthStart = new Date(todayY, todayM - 1, 1)
  const effectiveStart = cycleStart > monthStart ? cycleStart : monthStart

  const todayDate = new Date(todayStr + 'T00:00:00')
  const dowToday = todayDate.getDay()
  const mondayOffset = (dowToday + 6) % 7
  const weekMonday = new Date(todayDate)
  weekMonday.setDate(todayDate.getDate() - mondayOffset)
  const weekSunday = new Date(weekMonday)
  weekSunday.setDate(weekMonday.getDate() + 6)

  let totalOpDays = 0
  let todayOpIndex = 0
  let weekFirstOpDay = 0
  let weekLastOpDay = 0
  let weekOpDays = 0
  let opDaysBeforeThisWeek = 0

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(todayY, todayM - 1, d)
    if (date < effectiveStart) continue

    const dow = date.getDay()
    const isWeekend = dow === 0 || dow === 6
    if (!goal.play_weekends && isWeekend) continue

    totalOpDays++

    const dateStr = `${todayY}-${String(todayM).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (dateStr <= todayStr) todayOpIndex = totalOpDays

    if (date >= weekMonday && date <= weekSunday) {
      if (weekFirstOpDay === 0) {
        weekFirstOpDay = totalOpDays
        opDaysBeforeThisWeek = totalOpDays - 1
      }
      weekLastOpDay = totalOpDays
      weekOpDays++
    }
  }

  if (weekFirstOpDay === 0) weekFirstOpDay = 1
  if (weekLastOpDay === 0) weekLastOpDay = 1
  if (todayOpIndex === 0) todayOpIndex = 1

  const firstOfMonth = new Date(todayY, todayM - 1, 1)
  const firstDow = firstOfMonth.getDay()
  const firstMonOffset = (firstDow + 6) % 7
  const firstWeekMonday = new Date(firstOfMonth)
  firstWeekMonday.setDate(firstOfMonth.getDate() - firstMonOffset)
  const currentWeekNumber = Math.floor(
    (weekMonday.getTime() - firstWeekMonday.getTime()) / (7 * 24 * 3600 * 1000)
  ) + 1

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const weekStartStr = fmt(weekMonday)
  const weekEndStr = fmt(weekSunday)

  // ESTRATÉGIA EVOLUTIVA (Modo Safe)
  if (strategy === 'evolutive' && currentBankroll && currentBankroll > 0) {
    const riskLevel = getCurrentRiskLevel(currentBankroll, evolutiveTriggers)
    const evolPct = riskLevel.percentage / 100

    // Para evolutivo, calculamos projeção dinâmica
    const projection = calculateEvolutiveProjection(
      initial,
      cycleStartDate,
      totalOpDays,
      evolutiveTriggers,
      goal.play_weekends
    )

    // Encontrar dados do dia atual na projeção
    const todayProjection = projection.find(p => p.date === todayStr)
    const dailyGoal = todayProjection?.dailyGoal ?? currentBankroll * evolPct

    // Calcular metas semanal e mensal baseadas na projeção
    const weekEndProjection = projection.find(p => p.date === weekEndStr)
    const monthlyEndProjection = projection[projection.length - 1]

    const weeklyTargetFull = weekEndProjection?.bankroll ?? currentBankroll * Math.pow(1 + evolPct, weekOpDays)
    const monthlyTargetFull = monthlyEndProjection?.bankroll ?? currentBankroll * Math.pow(1 + evolPct, totalOpDays - todayOpIndex + 1)

    return {
      dailyGoal,
      weeklyGoal: weeklyTargetFull - (projection.find(p => p.date === weekStartStr)?.bankroll ?? currentBankroll),
      monthlyGoal: monthlyTargetFull - initial,
      weeklyTargetFull,
      monthlyTargetFull,
      weeklyExpectedSoFar: currentBankroll - (projection.find(p => p.date === weekStartStr)?.bankroll ?? currentBankroll),
      currentWeekNumber,
      totalOpDays,
      todayOpIndex,
      weekFirstOpDay,
      weekLastOpDay,
      weekStartStr,
      weekEndStr,
      currentRiskLevel: riskLevel,
      evolutiveProjection: projection,
    }
  }

  // Banca de início da semana (usar currentBankroll se for semana atual, senão calcular)
  const weekStartBankroll = currentBankroll && currentBankroll > 0
    ? currentBankroll / Math.pow(1 + pct, todayOpIndex - opDaysBeforeThisWeek - 1)
    : initial * Math.pow(1 + pct, weekFirstOpDay - 1)

  let dailyGoal: number
  let weeklyGoal: number
  let monthlyGoal: number
  let weeklyTargetFull: number
  let monthlyTargetFull: number
  let weeklyExpectedSoFar: number

  if (strategy === 'compound') {
    dailyGoal = getCompoundDailyGoalForOpDay(initial, pct, todayOpIndex)
    weeklyGoal = initial * Math.pow(1 + pct, weekFirstOpDay - 1) * (Math.pow(1 + pct, weekOpDays) - 1)
    monthlyGoal = initial * (Math.pow(1 + pct, totalOpDays) - 1)

    weeklyTargetFull = weekStartBankroll * Math.pow(1 + pct, weekOpDays)
    monthlyTargetFull = initial * Math.pow(1 + pct, totalOpDays)

    const bankAtToday = weekStartBankroll * Math.pow(1 + pct, todayOpIndex - opDaysBeforeThisWeek)
    weeklyExpectedSoFar = bankAtToday - weekStartBankroll
  } else {
    const dg = dailyGoalFixed || (goalCalcFixed(goal)?.dailyGoal ?? 0)
    dailyGoal = dg
    weeklyGoal = dg * weekOpDays
    monthlyGoal = dg * totalOpDays

    weeklyTargetFull = weekStartBankroll + (dg * weekOpDays)
    monthlyTargetFull = initial + (dg * totalOpDays)
    weeklyExpectedSoFar = dg * (todayOpIndex - opDaysBeforeThisWeek)
  }

  return {
    dailyGoal,
    weeklyGoal,
    monthlyGoal,
    weeklyTargetFull,
    monthlyTargetFull,
    weeklyExpectedSoFar,
    currentWeekNumber,
    totalOpDays,
    todayOpIndex,
    weekFirstOpDay,
    weekLastOpDay,
    weekStartStr,
    weekEndStr,
  }
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
 * todayProfit = lucro da sessão de hoje.
 * currentBankroll = banca atual.
 * weeklyTargetFull = banca-alvo ao fim da semana.
 * monthlyTargetFull = banca-alvo ao fim do mês.
 */
export function calcAlerts(
  todayProfit: number | null,
  todayDailyGoal: number,
  currentBankroll: number,
  weeklyTargetFull: number,   // banca-alvo ao fim da semana
  monthlyTargetFull: number,  // banca-alvo ao fim do mês
): GoalAlert[] {
  const alerts: GoalAlert[] = []

  // Alerta diário — usa lucro do dia
  if (todayProfit !== null && todayDailyGoal > 0 && todayProfit >= todayDailyGoal) {
    alerts.push({ level: 'daily', message: 'Meta do dia atingida. Pare por hoje.' })
  }

  // Alerta semanal — usa banca atual vs banca-alvo da semana
  if (weeklyTargetFull > 0 && currentBankroll >= weeklyTargetFull) {
    alerts.push({ level: 'weekly', message: 'Meta semanal atingida.' })
  }

  // Alerta mensal — usa banca atual vs banca-alvo do mês
  if (monthlyTargetFull > 0 && currentBankroll >= monthlyTargetFull) {
    alerts.push({ level: 'monthly', message: 'Meta mensal atingida. Considere encerrar e sacar.' })
  }

  return alerts
}
