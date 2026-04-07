import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateGoal } from '@/lib/goals'
import { formatCurrency, formatDate } from '@/lib/utils'
import GoalForm from '@/components/goals/GoalForm'
import { Target, TrendingUp, ShieldCheck, Calculator, CalendarDays, ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── helpers ──────────────────────────────────────────────── */

function buildCalendarRows(
  strategy: 'fixed' | 'compound',
  base: number,
  pct: number,         // decimal  (ex: 0.05)
  fixedDailyGoal: number,
) {
  return Array.from({ length: 30 }, (_, i) => {
    if (strategy === 'compound') {
      const bankroll = base * Math.pow(1 + pct, i)
      const meta     = bankroll * pct
      return { day: i + 1, bankroll, meta }
    }
    // fixed: banca cresce linearmente, meta constante
    const bankroll = base + fixedDailyGoal * i
    return { day: i + 1, bankroll, meta: fixedDailyGoal }
  })
}

/** Quantos dias úteis (respeitando play_weekends) de start_date até hoje */
function todayRowIndex(startDate: string, playWeekends: boolean): number {
  const start = new Date(startDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (today < start) return -1

  let count = 0
  const cursor = new Date(start)
  while (cursor <= today) {
    const dow = cursor.getDay() // 0=Dom 6=Sáb
    if (playWeekends || (dow !== 0 && dow !== 6)) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count // 1-based row que representa "hoje"
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

  const currentBankroll  = profile?.current_bankroll ?? 0
  const effectiveBankroll = currentBankroll > 0 ? currentBankroll : (goal?.initial_bankroll ?? 0)
  const goalCalc = goal ? calculateGoal(goal, effectiveBankroll, sessions ?? []) : null

  /* calendário */
  const pct = goal?.strategy === 'compound' ? (goal.daily_percentage ?? 0) / 100 : 0
  const calendarRows = goal && goalCalc
    ? buildCalendarRows(goal.strategy, effectiveBankroll, pct, goalCalc.dailyGoal)
    : []
  const totalMeta   = calendarRows.reduce((s, r) => s + r.meta, 0)
  const todayRow    = goal ? todayRowIndex(goal.start_date, goal.play_weekends) : -1

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">

      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-4 animate-fade-in">
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
              { icon: Target, label: 'Meta Diária', value: formatCurrency(goalCalc.dailyGoal), color: 'text-accent-green', border: 'border-accent-green/20' },
              { icon: TrendingUp, label: 'Alvo Semanal', value: formatCurrency(goalCalc.weeklyGoal), color: 'text-white', border: 'border-white/5' },
              { icon: TrendingUp, label: 'Alvo Mensal', value: formatCurrency(goalCalc.monthlyGoal), color: 'text-accent-blue', border: 'border-accent-blue/20' },
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

      {/* ── Calendário de Projeção ── */}
      {goal && goalCalc && calendarRows.length > 0 && (
        <div className="glass-card animate-fade-in border-white/5 overflow-hidden">
          {/* header */}
          <div className="px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
                <CalendarDays size={17} className="text-accent-green" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Calendário de Projeção · 30 Dias</h3>
                <p className="text-xs text-white/30 mt-0.5">
                  Base: {formatCurrency(effectiveBankroll)}
                  {goal.strategy === 'compound' && ` · Taxa: ${goal.daily_percentage}% ao dia`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Lucro projetado</p>
                <p className="text-lg font-black text-accent-green">{formatCurrency(totalMeta)}</p>
              </div>
            </div>
          </div>

          {/* tabela */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 w-16">Dia</th>
                  <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Valor da Banca</th>
                  <th className="text-right px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Meta do Dia</th>
                </tr>
              </thead>
              <tbody>
                {calendarRows.map((row) => {
                  const isToday = row.day === todayRow
                  const isPast  = row.day < todayRow

                  return (
                    <tr
                      key={row.day}
                      className={cn(
                        'border-b border-white/[0.03] transition-colors',
                        isToday
                          ? 'bg-accent-green/8 border-accent-green/15'
                          : isPast
                          ? 'opacity-40'
                          : 'hover:bg-white/[0.02]'
                      )}
                    >
                      <td className="px-8 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0',
                            isToday
                              ? 'bg-accent-green text-[#020d08]'
                              : isPast
                              ? 'bg-white/5 text-white/30'
                              : 'bg-white/5 text-white/50'
                          )}>
                            {row.day}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent-green">hoje</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={cn(
                          'text-sm font-semibold',
                          isToday ? 'text-white' : 'text-white/60'
                        )}>
                          {formatCurrency(row.bankroll)}
                        </span>
                      </td>
                      <td className="px-8 py-3.5 text-right">
                        <span className={cn(
                          'text-sm font-black',
                          isToday ? 'text-accent-green' : isPast ? 'text-white/30' : 'text-white/70'
                        )}>
                          {formatCurrency(row.meta)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/10 bg-white/[0.02]">
                  <td colSpan={2} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/40">
                    Total projetado em 30 dias
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

      {/* ── Alterar Planejamento (colapsável) ── */}
      <details className="group animate-fade-in">
        <summary className="glass-card px-8 py-5 border-white/5 flex items-center justify-between cursor-pointer list-none select-none hover:border-white/10 transition-premium rounded-2xl">
          <div className="flex items-center gap-3">
            <Calculator size={18} className="text-accent-blue" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">
              {goal ? 'Alterar Planejamento' : 'Novo Planejamento'}
            </span>
          </div>
          <ChevronDown
            size={18}
            className="text-white/30 group-open:rotate-180 transition-transform duration-300"
          />
        </summary>

        <div className="mt-3 glass-card p-8 border-white/5">
          <GoalForm userId={user.id} currentBankroll={effectiveBankroll} />
        </div>
      </details>

      {/* ── Guia Estratégico ── */}
      <details className="group animate-fade-in">
        <summary className="glass-card px-8 py-5 border-accent-blue/10 bg-accent-blue/[0.02] flex items-center justify-between cursor-pointer list-none select-none hover:border-accent-blue/20 transition-premium rounded-2xl">
          <div className="flex items-center gap-3">
            <Info size={18} className="text-accent-blue" />
            <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Guia Estratégico</span>
          </div>
          <ChevronDown
            size={18}
            className="text-white/30 group-open:rotate-180 transition-transform duration-300"
          />
        </summary>

        <div className="mt-3 glass-card p-8 border-accent-blue/10 bg-accent-blue/[0.02]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                dot: 'bg-accent-green',
                label: 'Meta Fixa',
                desc: 'Divisão linear do lucro projetado pelo tempo total. Ideal para quem já tem um teto de ganhos estabelecido.',
              },
              {
                dot: 'bg-accent-blue',
                label: 'Juros Compostos',
                desc: 'Crescimento exponencial onde o lucro vira base para a próxima operação. Acelera o crescimento da banca.',
              },
              {
                dot: 'bg-yellow-400',
                label: 'Performance',
                desc: '',
                items: ['WIN ≥ 100% da meta', 'PARCIAL ≥ 70% da meta', 'LOSS abaixo de 70%'],
              },
            ].map(({ dot, label, desc, items }) => (
              <div key={label} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', dot)} />
                  <p className="text-xs font-black text-white uppercase tracking-widest">{label}</p>
                </div>
                {desc && <p className="text-xs text-white/40 leading-relaxed">{desc}</p>}
                {items && (
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-white/30 font-bold uppercase tracking-widest">
                        <div className={cn('w-1.5 h-1.5 rounded-full', dot)} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </details>

    </div>
  )
}
