import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateGoal } from '@/lib/goals'
import { formatCurrency, formatDate, resultBg } from '@/lib/utils'
import SessionForm from '@/components/sessions/SessionForm'
import GoalStatus from '@/components/dashboard/GoalStatus'
import { ClipboardList, History, PlusCircle, ArrowRightLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const effectiveBankroll = currentBankroll > 0 ? currentBankroll : (goal?.initial_bankroll ?? 0)
  const goalCalc = goal ? calculateGoal(goal, effectiveBankroll, sessions ?? []) : null
  const dailyGoal = goalCalc?.dailyGoal ?? 0

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 animate-fade-in text-left">
        <div className="p-3 bg-accent-green/10 rounded-2xl border border-accent-green/20 neon-glow-green">
          <ClipboardList className="text-accent-green" size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight text-left">Sessões</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1 text-left">Registro de Atividades</p>
        </div>
      </div>

      <div className="glass-card p-8 animate-fade-in border-accent-green/10">
        <div className="flex items-center gap-3 mb-6">
          <PlusCircle size={18} className="text-accent-green" />
          <h3 className="text-base font-bold text-white uppercase tracking-widest">Registrar Nova Sessão</h3>
        </div>
        <SessionForm
          dailyGoal={dailyGoal}
          currentBankroll={effectiveBankroll}
          userId={user.id}
        />
      </div>

      {sessions && sessions.length > 0 && (
        <div className="glass-card p-8 animate-fade-in border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <History size={18} className="text-accent-blue" />
              <h3 className="text-base font-bold text-white uppercase tracking-widest">Histórico detalhado</h3>
            </div>
            <span className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-white/40 font-bold uppercase tracking-widest">
              {sessions.length} registros
            </span>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="group grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-4 items-center py-4 px-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-premium"
              >
                <GoalStatus result={session.result} />
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <p className="text-sm font-bold text-white leading-none mb-1 text-left">{formatDate(session.date)}</p>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest text-left">
                      {session.start_time ?? '—'} <span className="mx-1 opacity-50">•</span> {session.end_time ?? '—'}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-xs font-medium text-white/60">{formatCurrency(session.initial_bankroll)}</span>
                    <ArrowRightLeft size={10} className="text-white/20" />
                    <span className="text-xs font-bold text-white">{formatCurrency(session.final_bankroll)}</span>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] uppercase text-white/30 font-bold tracking-widest mb-0.5">Profit</p>
                   <span className={cn(
                    "text-lg font-black tracking-tighter",
                    session.profit >= 0 ? "text-accent-green" : "text-red-400"
                  )}>
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
