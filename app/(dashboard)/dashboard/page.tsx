import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateGoal } from '@/lib/goals'
import { formatCurrency, formatDate, resultBg } from '@/lib/utils'
import StatsCard from '@/components/dashboard/StatsCard'
import GoalStatus from '@/components/dashboard/GoalStatus'
import DailyChart from '@/components/dashboard/DailyChart'
import MonthlyChart from '@/components/dashboard/MonthlyChart'

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
  // Se ainda não há sessões, usa banca inicial da meta para exibir metas corretamente
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-0.5">{formatDate(todayStr)}</p>
        </div>
        {todaySession && <GoalStatus result={todaySession.result} />}
      </div>

      {/* Meta do Dia */}
      {goal && goalCalc ? (
        <div className="bg-gradient-to-r from-[#00ff88]/5 to-[#00b4d8]/5 border border-[#00ff88]/20 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,255,136,0.05)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Meta do Dia</p>
              <p className="text-3xl font-bold text-[#00ff88]">{formatCurrency(dailyGoal)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {goal.strategy === 'fixed' ? 'Estratégia Fixa' : 'Juros Compostos'} •{' '}
                {goal.play_weekends ? '7 dias/semana' : '5 dias/semana'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:text-right">
              <div>
                <p className="text-xs text-gray-500">Meta Semanal</p>
                <p className="font-semibold text-white">{formatCurrency(goalCalc.weeklyGoal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Meta Mensal</p>
                <p className="font-semibold text-white">{formatCurrency(goalCalc.monthlyGoal)}</p>
              </div>
            </div>
          </div>

          {todaySession && (
            <div className={`mt-4 rounded-lg px-4 py-3 border flex items-center justify-between ${resultBg(todaySession.result)}`}>
              <span className="text-sm font-medium">Sessão de hoje</span>
              <div className="flex items-center gap-3">
                <span className="font-bold">
                  {todaySession.profit >= 0 ? '+' : ''}{formatCurrency(todaySession.profit)}
                </span>
                <GoalStatus result={todaySession.result} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-5 text-center">
          <p className="text-gray-400 mb-2">Nenhuma meta configurada</p>
          <a href="/goals" className="text-[#00ff88] text-sm hover:underline">Configurar meta →</a>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Banca Atual"
          value={formatCurrency(effectiveBankroll)}
          highlight
          colorClass="text-[#00ff88]"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Lucro Total"
          value={formatCurrency(totalProfit)}
          colorClass={totalProfit >= 0 ? 'text-[#00ff88]' : 'text-red-400'}
          subtitle={`${totalSessions} sessões`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatsCard
          title="Win Rate"
          value={`${winRate}%`}
          colorClass={winRate >= 50 ? 'text-[#00ff88]' : 'text-yellow-400'}
          subtitle={`${winCount} wins`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <StatsCard
          title="Sessões"
          value={String(totalSessions)}
          subtitle="total registradas"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Evolução Diária
          </h3>
          <DailyChart sessions={sessions ?? []} />
        </div>
        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Lucro Mensal
          </h3>
          <MonthlyChart sessions={sessions ?? []} />
        </div>
      </div>

      {/* Últimas Sessões */}
      {sessions && sessions.length > 0 && (
        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Últimas Sessões
          </h3>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#0a1628] border border-[#00ff88]/5"
              >
                <div className="flex items-center gap-3">
                  <GoalStatus result={session.result} />
                  <span className="text-sm text-gray-400">{formatDate(session.date)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 hidden sm:block">
                    {formatCurrency(session.final_bankroll)}
                  </span>
                  <span className={`text-sm font-semibold ${session.profit >= 0 ? 'text-[#00ff88]' : 'text-red-400'}`}>
                    {session.profit >= 0 ? '+' : ''}{formatCurrency(session.profit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
