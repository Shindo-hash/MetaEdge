import { Goal, GoalCalc, Session } from '@/types'
import { getCurrentRiskLevel, calculateEvolutiveProjection, DEFAULT_EVOLUTIVE_TRIGGERS, type EvolutiveTrigger, type RiskLevel } from './evolutive'

/** Reconstrói o RiskLevel (label/cor) a partir de um % já decidido/aceito
 * pelo usuário — usado quando o risco NÃO deve mais ser recalculado
 * automaticamente da banca crua. */
function findRiskLevelByPct(pct: number, triggers?: EvolutiveTrigger[]): RiskLevel {
  const list = triggers ?? DEFAULT_EVOLUTIVE_TRIGGERS
  const match = list.find((t) => t.percentage === pct)
  if (match) {
    return { level: match.percentage, label: match.label, color: match.color, percentage: match.percentage }
  }
  return { level: 30, label: 'Alavancagem Máxima', color: 'red', percentage: 30 }
}

// ── UTILITÁRIOS DE DIAS ───────────────────────────────────────

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

export function getCompoundDailyGoalForOpDay(
  initialBankroll: number,
  pct: number,
  opDayIndex: number,
): number {
  if (opDayIndex <= 0) return initialBankroll * pct
  return initialBankroll * Math.pow(1 + pct, opDayIndex - 1) * pct
}

// ── CICLO: META DIÁRIA FIXA ───────────────────────────────────

/**
 * Para evolutive: salva a meta do dia 1 como referência (initial * 30%).
 * O valor real de cada dia é calculado dinamicamente em calcDynamicGoals.
 * Para fixed/compound: lógica original.
 */
export function calcCycleDailyGoal(goal: Goal, opDays: number): number {
  if (opDays <= 0) return 0

  if (goal.strategy === 'evolutive') {
    // Meta do dia 1: 30% da banca inicial (nível inicial sempre)
    return goal.initial_bankroll * 0.30
  }

  if (goal.strategy === 'compound') {
    const pct = (goal.daily_percentage ?? 0) / 100
    return goal.initial_bankroll * (Math.pow(1 + pct, opDays) - 1) / opDays
  }

  // fixed
  const totalPlanDays = (goal.weeks ?? 1) * (goal.play_weekends ? 7 : 5)
  if (totalPlanDays <= 0) return 0
  return ((goal.target_bankroll ?? 0) - goal.initial_bankroll) / totalPlanDays
}

// ── CÁLCULO GERAL DE META ─────────────────────────────────────

export function calculateGoal(goal: Goal, _currentBankroll?: number, _sessions?: Session[]): GoalCalc {
  if (goal.strategy === 'fixed')     return calculateFixed(goal)
  if (goal.strategy === 'evolutive') return calculateEvolutive(goal)
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

function calculateCompound(goal: Goal): GoalCalc {
  const pct          = (goal.daily_percentage ?? 0) / 100
  const daysPerWeek  = goal.play_weekends ? 7 : 5
  const daysPerMonth = goal.play_weekends ? 31 : 22

  const base         = goal.initial_bankroll
  const dailyGoal    = base * pct
  const weeklyGoal   = base * Math.pow(1 + pct, daysPerWeek)  - base
  const monthlyGoal  = base * Math.pow(1 + pct, daysPerMonth) - base

  return { dailyGoal, weeklyGoal, monthlyGoal }
}

// ── ESTRATÉGIA EVOLUTIVA ──────────────────────────────────────

/**
 * Usa apenas initial_bankroll e daily_percentage (30% inicial).
 * Nunca usa target_bankroll nem weeks.
 * dailyGoal  = meta do dia 1 (banca × 30%)
 * weeklyGoal = projeção de 5 dias operacionais com gatilhos
 * monthlyGoal = projeção de 22 dias operacionais com gatilhos
 */
function calculateEvolutive(goal: Goal): GoalCalc {
  const initial      = goal.initial_bankroll
  const daysPerWeek  = goal.play_weekends ? 7 : 5
  const daysPerMonth = goal.play_weekends ? 31 : 22

  // Meta do dia 1 sempre começa em 30%
  const dailyGoal = initial * 0.30

  // Projeção semanal respeitando gatilhos
  let bankWeek = initial
  for (let i = 0; i < daysPerWeek; i++) {
    const riskLevel = getCurrentRiskLevel(bankWeek)
    bankWeek += bankWeek * (riskLevel.percentage / 100)
  }
  const weeklyGoal = bankWeek - initial

  // Projeção mensal respeitando gatilhos
  let bankMonth = initial
  for (let i = 0; i < daysPerMonth; i++) {
    const riskLevel = getCurrentRiskLevel(bankMonth)
    bankMonth += bankMonth * (riskLevel.percentage / 100)
  }
  const monthlyGoal = bankMonth - initial

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

// ── METAS DINÂMICAS ───────────────────────────────────────────

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

  // Semana contada a partir de quando a META começou (não do calendário do
  // mês) — assim o primeiro dia da meta sempre mostra "Semana 1", mesmo se
  // a meta começar no meio do mês.
  const cycleStartDow = cycleStart.getDay()
  const cycleStartMonOffset = (cycleStartDow + 6) % 7
  const cycleStartWeekMonday = new Date(cycleStart)
  cycleStartWeekMonday.setDate(cycleStart.getDate() - cycleStartMonOffset)
  const currentWeekNumber = Math.floor(
    (weekMonday.getTime() - cycleStartWeekMonday.getTime()) / (7 * 24 * 3600 * 1000)
  ) + 1

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const weekStartStr = fmt(weekMonday)
  const weekEndStr = fmt(weekSunday)

  // ── ESTRATÉGIA EVOLUTIVA ──────────────────────────────────
  if (strategy === 'evolutive') {
    const bankroll = currentBankroll && currentBankroll > 0 ? currentBankroll : initial
    const effectiveTriggers = evolutiveTriggers ?? goal.evolutive_triggers ?? undefined

    // Se o usuário já ACEITOU algum gatilho antes, usa esse % (persistido) —
    // não muda sozinho de novo até ele aceitar o próximo. Só no início
    // (nunca decidiu nada ainda) que calcula automático em cima da banca
    // inicial, como ponto de partida.
    const riskLevel = goal.evolutive_current_pct != null
      ? findRiskLevelByPct(goal.evolutive_current_pct, effectiveTriggers)
      : getCurrentRiskLevel(initial, effectiveTriggers)
    const evolPct = riskLevel.percentage / 100

    const projection = calculateEvolutiveProjection(
      initial,
      cycleStartDate,
      totalOpDays,
      effectiveTriggers,
      goal.play_weekends
    )

    // Meta de HOJE (ação real) usa a banca real + o % efetivo (aceito pelo
    // usuário ou o inicial) — não o valor teórico da projeção, que é só a
    // referência estável do plano completo.
    const dailyGoal = bankroll * evolPct

    const weekStartProjection = projection.find(p => p.date === weekStartStr)
    const weekEndProjection   = projection.find(p => p.date === weekEndStr)
    const monthlyEndProjection = projection[projection.length - 1]

    const weekStartBank = weekStartProjection?.bankroll ?? bankroll
    const weeklyTargetFull   = weekEndProjection?.bankroll   ?? bankroll * Math.pow(1 + evolPct, weekOpDays)
    const monthlyTargetFull  = monthlyEndProjection?.bankroll ?? bankroll * Math.pow(1 + evolPct, totalOpDays - todayOpIndex + 1)

    return {
      dailyGoal,
      weeklyGoal:          weeklyTargetFull - weekStartBank,
      monthlyGoal:         monthlyTargetFull - initial,
      weeklyTargetFull,
      monthlyTargetFull,
      weeklyExpectedSoFar: bankroll - weekStartBank,
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

  // ── FIXED / COMPOUND ─────────────────────────────────────
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

export function calcAlerts(
  todayProfit: number | null,
  todayDailyGoal: number,
  currentBankroll: number,
  weeklyTargetFull: number,
  monthlyTargetFull: number,
): GoalAlert[] {
  const alerts: GoalAlert[] = []

  if (todayProfit !== null && todayDailyGoal > 0 && todayProfit >= todayDailyGoal) {
    alerts.push({ level: 'daily', message: 'Meta do dia atingida. Pare por hoje.' })
  }

  if (weeklyTargetFull > 0 && currentBankroll >= weeklyTargetFull) {
    alerts.push({ level: 'weekly', message: 'Meta semanal atingida.' })
  }

  if (monthlyTargetFull > 0 && currentBankroll >= monthlyTargetFull) {
    alerts.push({ level: 'monthly', message: 'Meta mensal atingida. Considere encerrar e sacar.' })
  }

  return alerts
}