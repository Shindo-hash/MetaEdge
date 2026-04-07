import { Goal, GoalCalc, Session } from '@/types'

export function calculateGoal(
  goal: Goal,
  currentBankroll: number,
  sessions?: Session[]
): GoalCalc {
  if (goal.strategy === 'fixed') return calculateFixed(goal)
  return calculateCompound(goal, currentBankroll, sessions)
}

// ── ESTRATÉGIA FIXA ─────────────────────────────────────────
function calculateFixed(goal: Goal): GoalCalc {
  const target = goal.target_bankroll ?? 0
  const weeks = goal.weeks ?? 1
  const daysPerWeek = goal.play_weekends ? 7 : 5

  const weeklyGoal = (target - goal.initial_bankroll) / weeks
  const dailyGoal = weeklyGoal / daysPerWeek
  const monthlyGoal = weeklyGoal * 4

  return { dailyGoal, weeklyGoal, monthlyGoal }
}

// ── ESTRATÉGIA JUROS COMPOSTOS ───────────────────────────────
// Regras:
//   - meta_diária  = banca_atual × %          (muda cada dia com o saldo real)
//   - meta_semanal = banca_início_semana × (1+%)^n  (alvo de banca ao fim da semana)
//   - meta_mensal  = banca_início_semana × (1+%)^m  (alvo de banca ao fim do mês)
//   - banca_início_semana = final da última sessão da semana anterior
//     (ou banca_inicial da meta se não houver sessões anteriores)
function calculateCompound(
  goal: Goal,
  currentBankroll: number,
  sessions?: Session[]
): GoalCalc {
  const pct = (goal.daily_percentage ?? 0) / 100
  const daysPerWeek = goal.play_weekends ? 7 : 5
  const daysPerMonth = goal.play_weekends ? 31 : 22

  // Base diária: usa banca atual real (ou inicial se ainda sem saldo)
  const dailyBase = currentBankroll > 0 ? currentBankroll : goal.initial_bankroll
  const dailyGoal = dailyBase * pct

  // Base semanal/mensal: banca no início da semana atual
  const weekBase = getWeekStartBankroll(goal, sessions)
  // Alvo de banca ao fim da semana (ex: 150 × 1.10^7 = 292,31)
  const weeklyGoal = weekBase * Math.pow(1 + pct, daysPerWeek)
  // Alvo de banca ao fim do mês (ex: 150 × 1.10^31 = 2.879,15)
  const monthlyGoal = weekBase * Math.pow(1 + pct, daysPerMonth)

  return { dailyGoal, weeklyGoal, monthlyGoal }
}

// Retorna a banca no início da semana atual (segunda-feira 00:00)
// → busca a última sessão ANTES desta semana; se não existir, usa initial_bankroll
function getWeekStartBankroll(goal: Goal, sessions?: Session[]): number {
  if (!sessions || sessions.length === 0) return goal.initial_bankroll

  // Segunda-feira da semana atual
  const now = new Date()
  const day = now.getDay() // 0=Dom … 6=Sáb
  const daysFromMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysFromMonday)
  monday.setHours(0, 0, 0, 0)
  const weekStartStr = monday.toISOString().split('T')[0]

  // Última sessão anterior à semana atual
  const prevSessions = sessions
    .filter((s) => s.date < weekStartStr)
    .sort((a, b) => b.date.localeCompare(a.date))

  return prevSessions.length > 0
    ? prevSessions[0].final_bankroll
    : goal.initial_bankroll
}

// ── RESULTADO DA SESSÃO ──────────────────────────────────────
// Compara lucro real com a meta diária (lucro alvo)
export function calcSessionResult(
  finalBankroll: number,
  initialBankroll: number,
  dailyGoal: number
): 'win' | 'partial' | 'loss' {
  const profit = finalBankroll - initialBankroll
  if (profit >= dailyGoal) return 'win'
  if (profit >= dailyGoal * 0.7) return 'partial'
  return 'loss'
}
