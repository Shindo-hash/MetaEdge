import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateGoal, countOpDays, getCompoundDailyGoalForOpDay, calcDynamicGoals } from '@/lib/services/goals'
import { ensureCycleForCurrentMonth } from '@/lib/services/cycles'
import { formatCurrency, formatDate } from '@/lib/utils'
import GoalForm from '@/components/goals/GoalForm'
import PrintButton from '@/components/PrintButton'
import { Target, TrendingUp, ShieldCheck, Calculator, CalendarDays, ChevronDown, Info, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Cycle } from '@/types'

/* ── Helpers ────────────────────────────────────────────────── */

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

interface CalendarDay {
  dateStr: string
  dayNum: number
  label: string          // ex: "Ter, 01"
  isToday: boolean
  isWeekendDay: boolean
  isOpDay: boolean       // tem meta?
  opDayIndex: number     // quantos dias operacionais até este (inclusive), ou 0
  bankroll: number | null
  meta: number | null
}

function buildRealCalendar(
  year: number,
  month: number,
  cycle: Cycle,
  goalInitialBankroll: number,
  strategy: 'fixed' | 'compound',
  pct: number,
): CalendarDay[] {
  const days = getDaysInMonth(year, month)
  const todayStr = new Date().toISOString().split('T')[0]
  const rows: CalendarDay[] = []
  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  let opDayIndex = 0

  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dateObj = new Date(dateStr + 'T00:00:00')
    const dow = dateObj.getDay()
    const weekend = dow === 0 || dow === 6

    // Se play_weekends: todo dia é op. Senão: apenas dias úteis.
    const isPlayWeekends = cycle.op_days_total === days
    const isOp = isPlayWeekends || !weekend

    if (isOp) opDayIndex++

    let bankroll: number | null = null
    let meta: number | null = null

    if (isOp) {
      if (strategy === 'compound') {
        // Compound: banca cresce exponencialmente a cada dia operacional
        // bancaDia = inicial × (1 + pct)^opDayIndex
        // metaDia  = bancaDia × pct (sobre a banca do DIA, não do dia anterior)
        const bancaHoje = goalInitialBankroll * Math.pow(1 + pct, opDayIndex)
        bankroll = bancaHoje
        meta = bancaHoje * pct  // Meta calculada sobre a banca do DIA atual
      } else {
        // Fixed: meta constante, banca cresce linearmente
        meta = cycle.daily_goal_fixed
        bankroll = goalInitialBankroll + cycle.daily_goal_fixed * opDayIndex
      }
    }

    rows.push({
      dateStr,
      dayNum: d,
      label: `${weekdayNames[dow]}, ${String(d).padStart(2, '0')}`,
      isToday: dateStr === todayStr,
      isWeekendDay: weekend,
      isOpDay: isOp,
      opDayIndex: isOp ? opDayIndex : 0,
      bankroll,
      meta,
    })
  }
  return rows
}

/* ── Page ─────────────────────────────────────────────────── */

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: goal }, { data: sessions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', true).single(),
    supabase.from('sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
  ])

  const currentBankroll   = profile?.current_bankroll ?? 0
  const effectiveBankroll = currentBankroll > 0 ? currentBankroll : (goal?.initial_bankroll ?? 0)
  const goalCalc = goal ? calculateGoal(goal) : null

  /* ── Ciclo ──────────────────────────────────────────────── */
  let cycle: Cycle | null = null
  if (goal) {
    try {
      cycle = await ensureCycleForCurrentMonth(
        supabase, user.id, goal, sessions ?? [], currentBankroll
      )
    } catch (_) { /* sem ciclo ativo — pode ser primeiro acesso */ }
  }

  /* ── Metas dinâmicas ─────────────────────────────────────── */
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  const pct   = goal?.strategy === 'compound' ? (goal.daily_percentage ?? 0) / 100 : 0

  const todayStr     = now.toISOString().split('T')[0]
  const todayOpIndex = (cycle && goal)
    ? countOpDays(cycle.start_date, todayStr, goal.play_weekends)
    : 0
  const todayDailyGoal = (goal?.strategy === 'compound' && cycle && todayOpIndex > 0)
    ? getCompoundDailyGoalForOpDay(goal.initial_bankroll, pct, todayOpIndex)
    : (goal?.strategy === 'fixed' && cycle ? cycle.daily_goal_fixed : (goalCalc?.dailyGoal ?? 0))

  const dynamicGoals = (goal && cycle)
    ? calcDynamicGoals(goal, cycle.start_date, todayStr, cycle.daily_goal_fixed ?? 0, currentBankroll)
    : null

  const calendarRows = (goal && cycle)
    ? buildRealCalendar(year, month, cycle, goal.initial_bankroll, goal.strategy, pct)
    : []

  /* ── Progresso do ciclo ─────────────────────────────────── */
  const cycleSessions     = (sessions ?? []).filter(s => cycle && s.date >= cycle.start_date)
  const accumulatedProfit = cycleSessions.reduce((acc, s) => acc + s.profit, 0)
  // opDaysElapsed: dias operacionais corridos desde início do ciclo até hoje
  const opDaysElapsed = (cycle && goal)
    ? countOpDays(cycle.start_date, todayStr, goal.play_weekends)
    : 0
  // Lucro esperado até hoje: compound usa fórmula exponencial, fixed é linear
  const expectedProfit = (goal && cycle)
    ? goal.strategy === 'compound'
      ? goal.initial_bankroll * (Math.pow(1 + pct, opDaysElapsed) - 1)
      : cycle.daily_goal_fixed * opDaysElapsed
    : 0
  const progressDiff = accumulatedProfit - expectedProfit
  const isAhead      = progressDiff >= 0
  const totalMeta    = calendarRows.reduce((s, r) => s + (r.meta ?? 0), 0)

  /* ── Dados para impressão ───────────────────────────────── */
  const sessionMap = Object.fromEntries((sessions ?? []).map(s => [s.date, s]))
  const printRows = calendarRows.map(row => ({
    ...row,
    actual:   row.isOpDay ? (sessionMap[row.dateStr]?.profit ?? null) : null,
    isFuture: row.dateStr > todayStr,
  }))
  const printTotalMeta   = printRows.reduce((s, r) => s + (r.meta ?? 0), 0)
  const printTotalActual = printRows.filter(r => !r.isFuture && r.actual !== null)
    .reduce((s, r) => s + (r.actual ?? 0), 0)
  const printDelta       = printTotalActual - printTotalMeta

  const monthName = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">

      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-accent-green/10 rounded-2xl border border-accent-green/20 neon-glow-green">
            <Target className="text-accent-green" size={26} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight leading-none">Metas</h2>
            <p className="text-white/35 text-xs font-bold uppercase tracking-widest mt-2">
              Planejamento Estratégico de Banca
            </p>
          </div>
        </div>
        {goal && <PrintButton label="Imprimir Plano" />}
      </div>

      {/* ── Meta ativa ── */}
      {goal && goalCalc ? (
        <div className="glass-card p-8 animate-fade-in border-accent-green/20 relative overflow-hidden group">
          <div className="h-px bg-gradient-to-r from-accent-green/60 via-accent-blue/30 to-transparent absolute top-0 left-0 right-0" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/5 blur-3xl -mr-32 -mt-32 pointer-events-none" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-accent-green" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Meta Ativa</h3>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-accent-green/8 border border-accent-green/20 text-accent-green font-black uppercase tracking-widest">
              {goal.strategy === 'fixed' ? 'Estratégia Fixa' : 'Juros Compostos'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 relative z-10">
            {[
              {
                icon: Target,
                label: goal?.strategy === 'compound' ? 'Meta de Hoje' : 'Meta Diária (Fixa)',
                value: formatCurrency(todayDailyGoal),
                color: 'text-accent-green',
                border: 'border-accent-green/20',
              },
              {
                icon: TrendingUp,
                label: dynamicGoals ? `Semana ${dynamicGoals.currentWeekNumber}` : 'Alvo Semanal',
                value: formatCurrency(dynamicGoals?.weeklyGoal ?? goalCalc.weeklyGoal),
                color: 'text-white',
                border: 'border-white/5',
              },
              {
                icon: TrendingUp,
                label: 'Alvo Mensal',
                value: formatCurrency(dynamicGoals?.monthlyGoal ?? goalCalc.monthlyGoal),
                color: 'text-accent-blue',
                border: 'border-accent-blue/20',
              },
            ].map(({ icon: Icon, label, value, color, border }) => (
              <div key={label} className={cn('glass-card bg-white/[0.02] p-6', border)}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={13} className={color} />
                  <p className="text-xs uppercase tracking-widest text-white/40 font-bold">{label}</p>
                </div>
                <p className={cn('text-2xl font-black tracking-tight', color)}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-7 border-t border-white/5 relative z-10">
            {[
              { label: 'Banca Inicial', value: formatCurrency(goal.initial_bankroll), color: 'text-white/80' },
              { label: 'Taxa Diária', value: goal.strategy === 'compound' ? `${goal.daily_percentage}%` : '—', color: 'text-accent-green' },
              { label: 'Data de Início', value: formatDate(goal.start_date), color: 'text-white/80' },
              { label: 'FDS', value: goal.play_weekends ? 'ATIVADO' : 'DESATIVADO', color: goal.play_weekends ? 'text-accent-green' : 'text-red-400/70' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold mb-1.5">{label}</p>
                <p className={cn('text-sm font-black', color)}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center animate-fade-in border-dashed border-white/8">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="text-white/20" size={28} />
          </div>
          <p className="text-white/40 font-medium mb-1">Nenhuma meta ativa</p>
          <p className="text-white/20 text-sm">Configure sua primeira meta abaixo.</p>
        </div>
      )}

      {/* ── Progresso do Ciclo ── */}
      {cycle && (
        <div className="glass-card p-7 animate-fade-in border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
              <TrendingUp size={17} className="text-accent-blue" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Progresso do Ciclo</h3>
              <p className="text-xs text-white/30 mt-0.5 capitalize">{monthName}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card bg-white/[0.02] p-5 border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Lucro Acumulado</p>
              <p className={cn('text-xl font-black tracking-tight', accumulatedProfit >= 0 ? 'text-accent-green' : 'text-red-400')}>
                {accumulatedProfit >= 0 ? '+' : ''}{formatCurrency(accumulatedProfit)}
              </p>
              <p className="text-xs text-white/20 mt-1">{cycleSessions.length} sessões</p>
            </div>

            <div className="glass-card bg-white/[0.02] p-5 border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Esperado Até Hoje</p>
              <p className="text-xl font-black tracking-tight text-white/70">
                {formatCurrency(expectedProfit)}
              </p>
              <p className="text-xs text-white/20 mt-1">{opDaysElapsed} dias operacionais</p>
            </div>

            <div className={cn(
              'glass-card p-5 border',
              isAhead ? 'bg-accent-green/5 border-accent-green/20' : 'bg-red-400/5 border-red-400/20'
            )}>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Diferença</p>
              <p className={cn('text-xl font-black tracking-tight flex items-center gap-1',
                isAhead ? 'text-accent-green' : 'text-red-400'
              )}>
                {isAhead
                  ? <TrendingUp size={16} />
                  : <TrendingDown size={16} />
                }
                {isAhead ? '+' : ''}{formatCurrency(progressDiff)}
              </p>
              <p className={cn('text-xs mt-1', isAhead ? 'text-accent-green/50' : 'text-red-400/50')}>
                {isAhead ? 'acima do esperado' : 'abaixo do esperado'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendário Real do Mês ── */}
      {goal && cycle && calendarRows.length > 0 && (
        <div className="glass-card animate-fade-in border-white/5 overflow-hidden no-print">
          <div className="px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
                <CalendarDays size={17} className="text-accent-green" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white capitalize">
                  Calendário — {monthName}
                </h3>
                <p className="text-xs text-white/30 mt-0.5">
                  Base: {formatCurrency(goal.initial_bankroll)}
                  {' '}· Meta/dia: {formatCurrency(cycle.daily_goal_fixed)}
                  {' '}· {cycle.op_days_total} dias operacionais
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Lucro projetado</p>
              <p className="text-lg font-black text-accent-green">{formatCurrency(totalMeta)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Data</th>
                  <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Banca Projetada</th>
                  <th className="text-right px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Meta do Dia</th>
                </tr>
              </thead>
              <tbody>
                {calendarRows.map((row) => {
                  const isPast = row.dateStr < todayStr
                  return (
                    <tr
                      key={row.dateStr}
                      className={cn(
                        'border-b border-white/[0.03] transition-colors',
                        row.isToday
                          ? 'bg-accent-green/8 border-accent-green/15'
                          : row.isWeekendDay && !row.isOpDay
                          ? 'bg-white/[0.01] opacity-50'
                          : isPast
                          ? 'opacity-40'
                          : 'hover:bg-white/[0.02]'
                      )}
                    >
                      <td className="px-8 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0',
                            row.isToday
                              ? 'bg-accent-green text-[#020d08]'
                              : row.isWeekendDay && !row.isOpDay
                              ? 'bg-white/5 text-white/20'
                              : isPast
                              ? 'bg-white/5 text-white/30'
                              : 'bg-white/5 text-white/50'
                          )}>
                            {row.dayNum}
                          </span>
                          <span className={cn(
                            'text-xs font-semibold',
                            row.isToday ? 'text-accent-green' : 'text-white/30'
                          )}>
                            {row.label}
                            {row.isToday && <span className="ml-2 text-[9px] font-black uppercase tracking-widest">hoje</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={cn('text-sm font-semibold', row.isToday ? 'text-white' : 'text-white/50')}>
                          {row.bankroll !== null ? formatCurrency(row.bankroll) : '—'}
                        </span>
                      </td>
                      <td className="px-8 py-3.5 text-right">
                        {row.meta !== null ? (
                          <span className={cn(
                            'text-sm font-black',
                            row.isToday ? 'text-accent-green' : isPast ? 'text-white/30' : 'text-white/70'
                          )}>
                            {formatCurrency(row.meta)}
                          </span>
                        ) : (
                          <span className="text-xs text-white/20 font-bold uppercase tracking-widest">FDS</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/10 bg-white/[0.02]">
                  <td colSpan={2} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/40">
                    Total projetado ({cycle.op_days_total} dias operacionais)
                  </td>
                  <td className="px-8 py-4 text-right text-base font-black text-accent-green">
                    {formatCurrency(totalMeta)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Alterar Planejamento ── */}
      <details className="group animate-fade-in no-print">
        <summary className="glass-card px-8 py-5 border-white/5 flex items-center justify-between cursor-pointer list-none select-none hover:border-white/10 transition-premium rounded-2xl">
          <div className="flex items-center gap-3">
            <Calculator size={18} className="text-accent-blue" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">
              {goal ? 'Alterar Planejamento' : 'Novo Planejamento'}
            </span>
          </div>
          <ChevronDown size={18} className="text-white/30 group-open:rotate-180 transition-transform duration-300" />
        </summary>
        <div className="mt-3 glass-card p-8 border-white/5">
          <GoalForm userId={user.id} currentBankroll={effectiveBankroll} />
        </div>
      </details>

      {/* ── IMPRESSÃO: Plano do Mês (visível apenas ao imprimir) ── */}
      {goal && cycle && (
        <div className="print-only">
          <details className="group">
            <summary className="print-header cursor-pointer list-none">
              <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                MetaEdge PRO — Plano do Mês · {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
              </h1>
              <p style={{ fontSize: 9, color: '#6b7280', margin: '2px 0 0' }}>
                {goal.strategy === 'compound' ? 'Juros Compostos' : 'Meta Fixa'} ·
                Banca inicial: {formatCurrency(goal.initial_bankroll)} ·
                {goal.daily_percentage}% ao dia ·
                {goal.play_weekends ? '7 dias/semana' : 'Seg–Sex'}
              </p>
            </summary>

            <table className="print-table">
              <thead>
                <tr>
                  <th>Dia</th>
                  <th className="right">Meta do Dia</th>
                  <th className="right">Banca Alvo</th>
                  <th className="right">Realizado</th>
                  <th className="right">Δ Diferença</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {printRows.map((row) => {
                  const delta = (!row.isFuture && row.actual !== null && row.meta !== null)
                    ? row.actual - row.meta : null
                  const statusLabel = row.isFuture || !row.isOpDay ? ''
                    : row.actual === null ? '—'
                    : delta !== null && delta >= 0 ? '✓ Win'
                    : delta !== null && delta >= (row.meta ?? 0) * -0.3 ? '~ Parcial'
                    : '✗ Loss'
                  return (
                    <tr
                      key={row.dateStr}
                      className={row.isWeekendDay ? 'weekend' : row.isToday ? 'today-row' : ''}
                    >
                      <td>{row.label}{row.isToday ? ' ◀' : ''}</td>
                      <td className="right">
                        {row.isOpDay ? formatCurrency(row.meta ?? 0) : <span className="print-muted">FDS</span>}
                      </td>
                      <td className="right print-muted">
                        {row.isOpDay ? formatCurrency(row.bankroll ?? 0) : '—'}
                      </td>
                      <td className="right">
                        {!row.isFuture && row.actual !== null
                          ? formatCurrency(row.actual)
                          : <span className="print-muted">—</span>}
                      </td>
                      <td className={`right ${delta === null ? 'print-muted' : delta >= 0 ? 'print-positive' : 'print-negative'}`}>
                        {delta !== null
                          ? `${delta >= 0 ? '+' : ''}${formatCurrency(delta)}`
                          : '—'}
                      </td>
                      <td className={statusLabel.startsWith('✓') ? 'print-positive' : statusLabel.startsWith('✗') ? 'print-negative' : 'print-muted'}>
                        {statusLabel}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>TOTAL</td>
                  <td className="right">{formatCurrency(printTotalMeta)}</td>
                  <td />
                  <td className="right">{formatCurrency(printTotalActual)}</td>
                  <td className={`right ${printDelta >= 0 ? 'print-positive' : 'print-negative'}`}>
                    {printDelta >= 0 ? '+' : ''}{formatCurrency(printDelta)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>

            <p className="print-footer">
              Impresso em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} via MetaEdge PRO
            </p>
          </details>
        </div>
      )}

    </div>
  )
}
