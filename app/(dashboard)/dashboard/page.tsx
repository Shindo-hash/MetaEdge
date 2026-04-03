import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateGoal } from '@/lib/goals'
import Link from 'next/link'
import { cn, formatCurrency, formatDate, resultBg } from '@/lib/utils'
import StatsCard from '@/components/dashboard/StatsCard'
import GoalStatus from '@/components/dashboard/GoalStatus'
import DailyChart from '@/components/dashboard/DailyChart'
import MonthlyChart from '@/components/dashboard/MonthlyChart'
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  History,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: sessions }, { data: goal }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', true).single(),
  ])

  const currentBankroll = profile?.current_bankroll ?? 0
  const effectiveBankroll = currentBankroll > 0 ? currentBankroll : (goal?.initial_bankroll ?? 0)
  const todayStr = new Date().toISOString().split('T')[0]
  const todaySession = sessions?.find((s) => s.date === todayStr) ?? null

  const goalCalc = goal ? calculateGoal(goal, effectiveBankroll, sessions ?? []) : null
  const dailyGoal = goalCalc?.dailyGoal ?? 0

  const totalProfit = sessions?.reduce((acc, s) => acc + s.profit, 0) ?? 0
  const winCount = sessions?.filter((s) => s.result === 'win').length ?? 0
  const totalSessions = sessions?.length ?? 0
  const winRate = totalSessions > 0 ? Math.round((winCount / totalSessions) * 100) : 0

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">

      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between animate-fade-in pt-2">
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-accent-green/10 rounded-2xl border border-accent-green/20 neon-glow-green">
            <LayoutDashboard className="text-accent-green" size={26} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight leading-none">Dashboard</h2>
            <div className="flex items-center gap-2 text-white/35 text-xs font-bold uppercase tracking-widest mt-2">
              <Calendar size={12} className="text-accent-green" />
              {formatDate(todayStr)}
            </div>
          </div>
        </div>
        {todaySession && <GoalStatus result={todaySession.result} />}
      </div>

      {/* ── Card de Meta Diária ── */}
      {goal && goalCalc ? (
        <div className="glass-card relative overflow-hidden group border-accent-green/20 animate-fade-in shadow-[0_8px_60px_-10px_rgba(0,255,136,0.12)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-green/5 blur-3xl -mr-40 -mt-40 group-hover:bg-accent-green/8 transition-premium pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 w-64 h-32 bg-accent-blue/4 blur-3xl -mb-16 pointer-events-none" />

          {/* Linha de topo verde */}
          <div className="h-px bg-gradient-to-r from-accent-green/60 via-accent-blue/40 to-transparent" />

          <div className="p-8 md:p-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">

              {/* Esquerda — valor principal */}
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-green/20 to-accent-blue/15 items-center justify-center border border-accent-green/25 neon-glow-green flex-shrink-0">
                  <Target className="text-accent-green" size={38} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/40 font-black mb-3">
                    Objetivo Diário
                  </p>
                  <div className="flex items-end gap-4">
                    <p className="text-4xl font-black text-accent-green tracking-tighter leading-none">
                      {formatCurrency(dailyGoal)}
                    </p>
                    <div className="mb-1 flex flex-col items-start">
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold leading-none mb-1">parar com</span>
                      <span className="text-base font-bold text-white/60 leading-none">
                        {formatCurrency(effectiveBankroll + dailyGoal)}
                      </span>
                    </div>
                    <ArrowUpRight className="text-accent-green/40 mb-1" size={20} />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-white/6 border border-white/10 text-white/55 font-bold uppercase tracking-wider">
                      {goal.strategy === 'fixed' ? 'Estratégia Fixa' : 'Juros Compostos'}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-white/6 border border-white/10 text-white/55 font-bold uppercase tracking-wider">
                      {goal.play_weekends ? '7 dias/semana' : 'Seg a Sex'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direita — metas semanal/mensal */}
              <div className="grid grid-cols-2 gap-10 md:text-right flex-shrink-0">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/30 font-bold mb-2">Meta Semanal</p>
                  <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(goalCalc.weeklyGoal)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/30 font-bold mb-2">Meta Mensal</p>
                  <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(goalCalc.monthlyGoal)}</p>
                </div>
              </div>
            </div>

            {/* Banner sessão de hoje */}
            {todaySession && (
              <div className={cn(
                'mt-8 rounded-2xl px-6 py-5 border flex flex-col sm:flex-row items-center justify-between transition-premium',
                todaySession.result === 'win'
                  ? 'bg-accent-green/8 border-accent-green/20'
                  : todaySession.result === 'loss'
                  ? 'bg-red-400/8 border-red-400/15'
                  : 'bg-white/4 border-white/8'
              )}>
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className={cn(
                    'p-2.5 rounded-xl',
                    todaySession.result === 'win' ? 'bg-accent-green/20 text-accent-green' : 'bg-white/10 text-white/40'
                  )}>
                    <ShieldCheck size={22} />
                  </div>
                  <span className="text-sm font-bold text-white uppercase tracking-widest">
                    Sessão de hoje encerrada
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs uppercase text-white/35 font-bold tracking-widest mb-1">Resultado</p>
                    <span className={cn(
                      'text-2xl font-black tracking-tight',
                      todaySession.profit >= 0 ? 'text-accent-green' : 'text-red-400'
                    )}>
                      {todaySession.profit >= 0 ? '+' : ''}{formatCurrency(todaySession.profit)}
                    </span>
                  </div>
                  <GoalStatus result={todaySession.result} />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center animate-fade-in border-dashed border-white/8">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5">
            <Target className="text-white/20" size={36} />
          </div>
          <p className="text-white/40 font-medium text-lg mb-5">Nenhuma meta ativa configurada</p>
          <a href="/goals" className="inline-flex items-center gap-2 text-accent-green text-sm font-bold uppercase tracking-widest hover:gap-3 transition-premium">
            Configurar nova meta <ChevronRight size={16} />
          </a>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
        <StatsCard
          title="Banca Atual"
          value={formatCurrency(effectiveBankroll)}
          highlight
          colorClass="text-accent-green"
          icon={<Wallet size={24} />}
        />
        <StatsCard
          title="Lucro Total"
          value={formatCurrency(totalProfit)}
          colorClass={totalProfit >= 0 ? 'text-accent-green' : 'text-red-400'}
          subtitle={`${totalSessions} sessões realizadas`}
          trend={`${totalProfit >= 0 ? '+' : ''}${((totalProfit / (goal?.initial_bankroll || 1)) * 100).toFixed(1)}%`}
          trendType={totalProfit >= 0 ? 'up' : 'down'}
          icon={<TrendingUp size={24} />}
        />
        <StatsCard
          title="Taxa de Assertividade"
          value={`${winRate}%`}
          colorClass={winRate >= 50 ? 'text-accent-green' : 'text-yellow-400'}
          subtitle={`${winCount} metas batidas`}
          icon={<CheckCircle2 size={24} />}
        />
        <StatsCard
          title="Sessões Totais"
          value={String(totalSessions)}
          subtitle="Histórico completo"
          icon={<History size={24} />}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        <div className="glass-card p-10 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-white">Evolução Diária</h3>
              <p className="text-xs text-white/30 mt-0.5">Últimas 14 sessões</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent-green/8 border border-accent-green/15 flex items-center justify-center">
              <TrendingUp size={16} className="text-accent-green" />
            </div>
          </div>
          <DailyChart sessions={sessions ?? []} />
        </div>
        <div className="glass-card p-10 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-white">Lucro por Mês</h3>
              <p className="text-xs text-white/30 mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent-blue/8 border border-accent-blue/15 flex items-center justify-center">
              <ArrowUpRight size={16} className="text-accent-blue" />
            </div>
          </div>
          <MonthlyChart sessions={sessions ?? []} />
        </div>
      </div>

      {/* ── Últimas Sessões ── */}
      {sessions && sessions.length > 0 && (
        <div className="glass-card p-10 border-white/5 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-white">Últimas Atividades</h3>
              <p className="text-xs text-white/30 mt-0.5">Histórico recente de sessões</p>
            </div>
            <Link
              href="/sessions"
              className="text-xs font-bold text-accent-green uppercase tracking-widest hover:underline underline-offset-4 flex items-center gap-1"
            >
              Ver tudo <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between py-5 px-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-premium"
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-premium">
                    <Target size={20} className={cn(session.profit >= 0 ? 'text-accent-green' : 'text-red-400')} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white leading-none mb-2">{formatDate(session.date)}</p>
                    <GoalStatus result={session.result} />
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-10">
                  <div className="text-right">
                    <p className="text-xs uppercase text-white/30 font-bold tracking-widest mb-1">Saldo Final</p>
                    <span className="text-sm text-white/70 font-semibold">
                      {formatCurrency(session.final_bankroll)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase text-white/30 font-bold tracking-widest mb-1">Profit</p>
                    <span className={cn(
                      'text-xl font-black tracking-tight',
                      session.profit >= 0 ? 'text-accent-green' : 'text-red-400'
                    )}>
                      {session.profit >= 0 ? '+' : ''}{formatCurrency(session.profit)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
