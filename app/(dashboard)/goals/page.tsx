import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateGoal } from '@/lib/goals'
import { formatCurrency, formatDate } from '@/lib/utils'
import GoalForm from '@/components/goals/GoalForm'
import { Target, TrendingUp, Calendar, Info, ShieldCheck, ChevronRight, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="space-y-8 max-w-4xl mx-auto pb-10 px-4 sm:px-0">
      <div className="flex items-center gap-4 animate-fade-in text-left">
        <div className="p-3 bg-accent-green/10 rounded-2xl border border-accent-green/20 neon-glow-green">
          <Target className="text-accent-green" size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight text-left">Configurações de Metas</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1 text-left">Planejamento Estratégico de Banca</p>
        </div>
      </div>

      {goal && goalCalc && (
        <div className="glass-card p-8 animate-fade-in border-accent-green/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/5 blur-3xl -mr-32 -mt-32 group-hover:bg-accent-green/10 transition-premium" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-accent-green" />
              <h3 className="text-base font-bold text-white uppercase tracking-[0.15em]">Meta Ativa</h3>
            </div>
            <span className="text-[10px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-accent-green font-black uppercase tracking-widest">
              {goal.strategy === 'fixed' ? 'Estratégia Fixa' : 'Juros Compostos'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 relative z-10">
            <div className="glass-card bg-white/[0.02] p-6 border-accent-green/20">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-accent-green" />
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Meta Diária</p>
              </div>
              <p className="text-2xl font-black text-accent-green tracking-tighter">{formatCurrency(goalCalc.dailyGoal)}</p>
              {goal.strategy === 'compound' && (
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Growth: {goal.daily_percentage}%</p>
              )}
            </div>

            <div className="glass-card bg-white/[0.02] p-6 border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-white/40" />
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Alvo Semanal</p>
              </div>
              <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(goalCalc.weeklyGoal)}</p>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Banca projetada</p>
            </div>

            <div className="glass-card bg-white/[0.02] p-6 border-accent-blue/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-accent-blue" />
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Alvo Mensal</p>
              </div>
              <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(goalCalc.monthlyGoal)}</p>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1 text-accent-blue/60">Banca projetada</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/5 relative z-10">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Banca Inicial</p>
              <p className="text-sm font-black text-white/80">{formatCurrency(goal.initial_bankroll)}</p>
            </div>
            {goal.strategy === 'compound' && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Tx. Crescimento</p>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                   <p className="text-sm font-black text-accent-green">{goal.daily_percentage}%</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Data de Início</p>
              <p className="text-sm font-black text-white/80">{formatDate(goal.start_date)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Operação FDS</p>
              <p className={cn("text-sm font-black", goal.play_weekends ? "text-accent-green" : "text-red-400/60")}>
                {goal.play_weekends ? 'ATIVADO' : 'DESATIVADO'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-8 animate-fade-in border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <Calculator size={18} className="text-accent-blue" />
          <h3 className="text-base font-bold text-white uppercase tracking-widest">
            {goal ? 'Alterar Planejamento' : 'Novo Planejamento'}
          </h3>
        </div>
        <GoalForm userId={user.id} currentBankroll={effectiveBankroll} />
      </div>

      <div className="glass-card p-8 animate-fade-in border-accent-blue/10 bg-accent-blue/[0.02]">
        <div className="flex items-center gap-3 mb-6">
          <Info size={18} className="text-accent-blue" />
          <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">Guia Estratégico</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-3">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-green" />
                <p className="text-xs font-black text-white uppercase tracking-widest">Meta Fixa</p>
             </div>
             <p className="text-xs text-white/40 leading-relaxed">Divisão linear do lucro projetado pelo tempo total. Ideal para quem já tem um teto de ganhos estabelecido.</p>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-blue" />
                <p className="text-xs font-black text-white uppercase tracking-widest">Juros Compostos</p>
             </div>
             <p className="text-xs text-white/40 leading-relaxed">Crescimento exponencial onde o lucro vira base para a próxima operação. Acelera o crescimento da banca.</p>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-yellow-400">
                <ShieldCheck size={14} />
                <p className="text-xs font-black uppercase tracking-widest">Performance</p>
             </div>
             <ul className="text-[10px] text-white/30 space-y-1 font-bold uppercase tracking-widest">
                <li className="flex items-center gap-2 animate-pulse"><div className="w-1 h-1 rounded-full bg-accent-green" /> Win ≥ 100% meta</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-yellow-400" /> Parcial ≥ 70% meta</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-400" /> Loss abaixo de 70%</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
