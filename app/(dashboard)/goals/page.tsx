import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateGoal } from '@/lib/goals'
import { formatCurrency, formatDate } from '@/lib/utils'
import GoalForm from '@/components/goals/GoalForm'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: goal }, { data: sessions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', true).single(),
    supabase.from('sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
  ])

  const currentBankroll = profile?.current_bankroll ?? 0
  const effectiveBankroll = currentBankroll > 0 ? currentBankroll : (goal?.initial_bankroll ?? 0)
  const goalCalc = goal ? calculateGoal(goal, effectiveBankroll, sessions ?? []) : null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white">Metas</h2>

      {goal && goalCalc && (
        <div className="bg-gradient-to-r from-[#00ff88]/5 to-[#00b4d8]/5 border border-[#00ff88]/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Meta Ativa</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 font-medium">
              {goal.strategy === 'fixed' ? 'Meta Fixa' : 'Juros Compostos'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* Meta Diária = lucro alvo de hoje */}
            <div className="bg-[#0a1628] rounded-xl p-4 border border-[#00ff88]/20">
              <p className="text-xs text-gray-500 mb-1">
                Meta Diária
                {goal.strategy === 'compound' && (
                  <span className="ml-1 text-gray-600">(lucro alvo)</span>
                )}
              </p>
              <p className="text-2xl font-bold text-[#00ff88]">{formatCurrency(goalCalc.dailyGoal)}</p>
              {goal.strategy === 'compound' && (
                <p className="text-xs text-gray-600 mt-1">{goal.daily_percentage}% de {formatCurrency(effectiveBankroll)}</p>
              )}
            </div>

            {/* Meta Semanal = alvo de banca ao fim da semana */}
            <div className="bg-[#0a1628] rounded-xl p-4 border border-[#00ff88]/10">
              <p className="text-xs text-gray-500 mb-1">
                Alvo da Semana
                {goal.strategy === 'compound' && (
                  <span className="ml-1 text-gray-600">({goal.play_weekends ? '7d' : '5d'})</span>
                )}
              </p>
              <p className="text-2xl font-bold text-white">{formatCurrency(goalCalc.weeklyGoal)}</p>
              {goal.strategy === 'compound' && (
                <p className="text-xs text-gray-600 mt-1">banca projetada</p>
              )}
            </div>

            {/* Meta Mensal = alvo de banca ao fim do mês */}
            <div className="bg-[#0a1628] rounded-xl p-4 border border-[#00b4d8]/10">
              <p className="text-xs text-gray-500 mb-1">
                Alvo do Mês
                {goal.strategy === 'compound' && (
                  <span className="ml-1 text-gray-600">({goal.play_weekends ? '31d' : '22d'})</span>
                )}
              </p>
              <p className="text-2xl font-bold text-[#00b4d8]">{formatCurrency(goalCalc.monthlyGoal)}</p>
              {goal.strategy === 'compound' && (
                <p className="text-xs text-gray-600 mt-1">banca projetada</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#00ff88]/10">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Banca Inicial</p>
              <p className="text-sm font-semibold text-gray-300">{formatCurrency(goal.initial_bankroll)}</p>
            </div>
            {goal.strategy === 'fixed' && goal.target_bankroll && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Meta Final</p>
                <p className="text-sm font-semibold text-gray-300">{formatCurrency(goal.target_bankroll)}</p>
              </div>
            )}
            {goal.strategy === 'compound' && goal.daily_percentage && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Crescimento/dia</p>
                <p className="text-sm font-semibold text-[#00ff88]">{goal.daily_percentage}%</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Início</p>
              <p className="text-sm font-semibold text-gray-300">{formatDate(goal.start_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Fins de semana</p>
              <p className="text-sm font-semibold text-gray-300">{goal.play_weekends ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-5">
          {goal ? 'Alterar Meta' : 'Configurar Meta'}
        </h3>
        <GoalForm userId={user.id} currentBankroll={effectiveBankroll} />
      </div>

      <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Como funciona</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex gap-3">
            <span className="text-[#00ff88] font-bold shrink-0">Meta Fixa:</span>
            <span>Você define banca inicial, meta final e número de semanas. A meta diária é distribuída igualmente.</span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00b4d8] font-bold shrink-0">Juros Compostos:</span>
            <span>
              Meta diária = banca atual × %. Cada dia a base cresce com o que você ganhou.
              O alvo semanal/mensal é calculado por exponencial da banca no início da semana.
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400 font-bold shrink-0">Resultado:</span>
            <span>Win ≥ 100% da meta diária • Parcial ≥ 70% • Loss abaixo de 70%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
