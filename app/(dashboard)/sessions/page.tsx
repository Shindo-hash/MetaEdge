import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateGoal } from '@/lib/goals'
import { formatCurrency, formatDate, resultBg } from '@/lib/utils'
import SessionForm from '@/components/sessions/SessionForm'
import GoalStatus from '@/components/dashboard/GoalStatus'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: sessions }, { data: goal }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', true).single(),
  ])

  const currentBankroll = profile?.current_bankroll ?? 0
  // Se ainda não registrou nenhuma sessão, usa a banca inicial da meta como ponto de partida
  const effectiveBankroll = currentBankroll > 0 ? currentBankroll : (goal?.initial_bankroll ?? 0)
  const goalCalc = goal ? calculateGoal(goal, effectiveBankroll, sessions ?? []) : null
  const dailyGoal = goalCalc?.dailyGoal ?? 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white">Sessões</h2>

      <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-5">Registrar Nova Sessão</h3>
        <SessionForm
          dailyGoal={dailyGoal}
          currentBankroll={effectiveBankroll}
          userId={user.id}
        />
      </div>

      {sessions && sessions.length > 0 && (
        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-5">Histórico de Sessões</h3>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="grid grid-cols-[auto_1fr_auto] gap-3 items-center py-3 px-4 rounded-lg bg-[#0a1628] border border-[#00ff88]/5 hover:border-[#00ff88]/10 transition-colors"
              >
                <GoalStatus result={session.result} />
                <div>
                  <p className="text-sm font-medium text-white">{formatDate(session.date)}</p>
                  <p className="text-xs text-gray-500">
                    {session.start_time ?? '—'} → {session.end_time ?? '—'} •{' '}
                    {formatCurrency(session.initial_bankroll)} → {formatCurrency(session.final_bankroll)}
                  </p>
                </div>
                <span className={`text-sm font-bold ${session.profit >= 0 ? 'text-[#00ff88]' : 'text-red-400'}`}>
                  {session.profit >= 0 ? '+' : ''}{formatCurrency(session.profit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
