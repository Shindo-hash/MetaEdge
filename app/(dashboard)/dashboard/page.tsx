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
  ChevronRight
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
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-accent-green/10 rounded-2xl border border-accent-green/20 neon-glow-green">
              <LayoutDashboard className="text-accent-green" size={24} />
           </div>
           <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
              <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                 <Calendar size={12} className="text-accent-green" />
                 {formatDate(todayStr)}
              </div>
           </div>
        </div>
        {todaySession && <GoalStatus result={todaySession.result} />}
      </div>

      {/* Meta do Dia */}
      {goal && goalCalc ? (
        <div className="glass-card p-8 relative overflow-hidden group border-accent-green/20 animate-fade-in shadow-[0_8px_40px_-10px_rgba(0,255,136,0.1)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/5 blur-3xl -mr-32 -mt-32 group-hover:bg-accent-green/10 transition-premium" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
               <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-green/20 to-accent-blue/20 items-center justify-center border border-accent-green/20 neon-glow-green">
                  <Target className="text-accent-green" size={32} />
               </div>
               <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black mb-2">Objetivo Diário</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-accent-green tracking-tighter">{formatCurrency(dailyGoal)}</p>
                    <ArrowUpRight className="text-accent-green/50" size={24} />
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-bold uppercase tracking-wider">
                      {goal.strategy === 'fixed' ? 'Estratégia Fixa' : 'Juros Compostos'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-bold uppercase tracking-wider">
                      {goal.play_weekends ? '7 dias/semana' : 'Segunda a Sexta'}
                    </span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-8 md:text-right">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Meta Semanal</p>
                <p className="text-xl font-bold text-white tracking-tight">{formatCurrency(goalCalc.weeklyGoal)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Meta Mensal</p>
                <p className="text-xl font-bold text-white tracking-tight">{formatCurrency(goalCalc.monthlyGoal)}</p>
              </div>
            </div>
          </div>

          {todaySession && (
            <div className={cn(
              "mt-8 rounded-2xl p-5 border flex flex-col sm:flex-row items-center justify-between relative z-10 transition-premium",
              todaySession.result === 'win' ? 'bg-accent-green/10 border-accent-green/20 shadow-[0_0_20px_rgba(0,255,136,0.05)]' : 
              todaySession.result === 'loss' ? 'bg-red-400/10 border-red-400/20' : 'bg-white/5 border-white/10'
            )}>
              <div className="flex items-center gap-3 mb-4 sm:mb-0">
                <div className={cn(
                  "p-2 rounded-lg",
                  todaySession.result === 'win' ? 'bg-accent-green/20 text-accent-green' : 'bg-white/10 text-white/40'
                )}>
                  <ShieldCheck size={20} />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Sessão de hoje encerrada</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-widest leading-none mb-1">Resultado</p>
                  <span className={cn(
                    "text-lg font-black tracking-tighter",
                    todaySession.profit >= 0 ? "text-accent-green" : "text-red-400"
                  )}>
                    {todaySession.profit >= 0 ? '+' : ''}{formatCurrency(todaySession.profit)}
                  </span>
                </div>
                <GoalStatus result={todaySession.result} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-10 text-center animate-fade-in border-dashed">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
             <Target className="text-white/20" size={32} />
          </div>
          <p className="text-white/40 font-medium mb-4">Nenhuma meta ativa configurada no momento</p>
          <a href="/goals" className="inline-flex items-center gap-2 text-accent-green text-sm font-bold uppercase tracking-widest hover:gap-3 transition-premium">
            Configurar nova meta <ChevronRight size={16} />
          </a>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        <div className="glass-card p-6 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.25em]">
              Evolução Diária
            </h3>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
               <TrendingUp size={14} className="text-accent-green" />
            </div>
          </div>
          <DailyChart sessions={sessions ?? []} />
        </div>
        <div className="glass-card p-6 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.25em]">
              Lucro por Mês
            </h3>
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
               <ArrowUpRight size={14} className="text-accent-blue" />
            </div>
          </div>
          <MonthlyChart sessions={sessions ?? []} />
        </div>
      </div>

      {/* Últimas Sessões */}
      {sessions && sessions.length > 0 && (
        <div className="glass-card p-6 border-white/5 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.25em]">
              Últimas Atividades
            </h3>
            <Link href="/sessions" className="text-[10px] font-bold text-accent-green uppercase tracking-widest hover:underline">
              Ver tudo
            </Link>
          </div>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between py-4 px-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-premium"
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-premium">
                     <Target size={18} className={cn(session.profit >= 0 ? "text-accent-green" : "text-red-400")} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none mb-1">{formatDate(session.date)}</p>
                    <GoalStatus result={session.result} />
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-8 bg-black/20 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                  <div className="text-right sm:text-right">
                    <p className="text-[10px] uppercase text-white/30 font-bold tracking-widest mb-0.5">Saldo Final</p>
                    <span className="text-sm text-white/80 font-medium">
                      {formatCurrency(session.final_bankroll)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-white/30 font-bold tracking-widest mb-0.5">Profit</p>
                    <span className={cn(
                      "text-base font-black tracking-tight",
                      session.profit >= 0 ? "text-accent-green" : "text-red-400"
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
