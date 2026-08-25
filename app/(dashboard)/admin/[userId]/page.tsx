import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/supabase/admin'
import { getUserDetail } from '@/lib/actions/admin'
import UserEvolutionChart from '@/components/admin/UserEvolutionChart'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Target, ClipboardList } from 'lucide-react'

const STRATEGY_LABEL: Record<string, string> = {
  fixed: 'Meta Fixa',
  compound: 'Juros Compostos',
  evolutive: 'Gestão Evolutiva',
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (user.email ?? '').trim().toLowerCase()
  if (!ADMIN_EMAIL || email !== ADMIN_EMAIL) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p className="text-red-400 font-semibold mb-2">Acesso restrito</p>
      </div>
    )
  }

  const { profile, goal, sessions, history, transactions } = await getUserDetail(userId)
  if (!profile) notFound()

  const firstBankroll = sessions[0]?.final_bankroll ?? goal?.initial_bankroll ?? profile.current_bankroll
  const totalProfit = sessions.reduce((acc, s) => acc + s.profit, 0)
  const wins = sessions.filter((s) => s.result === 'win').length
  const losses = sessions.filter((s) => s.result === 'loss').length
  const winRate = sessions.length > 0 ? Math.round((wins / sessions.length) * 100) : 0
  const isEvolving = profile.current_bankroll >= firstBankroll

  const totalDeposited = transactions.filter((t) => t.type === 'deposit').reduce((a, t) => a + t.amount, 0)
  const totalWithdrawn = transactions.filter((t) => t.type === 'withdrawal').reduce((a, t) => a + t.amount, 0)

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-premium">
        <ArrowLeft size={16} /> Voltar pra lista
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">{profile.name || 'Usuário'}</h2>
          <p className="text-white/40 text-sm mt-1">{profile.email}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${
          isEvolving ? 'bg-accent-green/8 border-accent-green/25 text-accent-green' : 'bg-red-400/8 border-red-400/25 text-red-400'
        }`}>
          {isEvolving ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {isEvolving ? 'Evoluindo' : 'Em queda'}
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 animate-fade-in">
        <div className="glass-card p-6 border-white/5">
          <p className="text-xs uppercase tracking-widest text-white/30 font-bold mb-2">Banca Atual</p>
          <p className="text-xl font-black text-white">{formatCurrency(profile.current_bankroll)}</p>
        </div>
        <div className="glass-card p-6 border-white/5">
          <p className="text-xs uppercase tracking-widest text-white/30 font-bold mb-2">Lucro Total</p>
          <p className={`text-xl font-black ${totalProfit >= 0 ? 'text-accent-green' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </p>
        </div>
        <div className="glass-card p-6 border-white/5">
          <p className="text-xs uppercase tracking-widest text-white/30 font-bold mb-2">Taxa de Acerto</p>
          <p className="text-xl font-black text-white">{winRate}%</p>
        </div>
        <div className="glass-card p-6 border-white/5">
          <p className="text-xs uppercase tracking-widest text-white/30 font-bold mb-2">Sessões</p>
          <p className="text-xl font-black text-white">{sessions.length}</p>
        </div>
      </div>

      {/* Meta ativa */}
      {goal && (
        <div className="glass-card p-6 border-white/5 animate-fade-in flex items-center gap-4 flex-wrap">
          <div className="p-2.5 bg-accent-blue/10 rounded-xl border border-accent-blue/20">
            <Target size={18} className="text-accent-blue" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/30 font-bold">Estratégia Ativa</p>
            <p className="text-sm font-bold text-white">{STRATEGY_LABEL[goal.strategy] ?? goal.strategy}</p>
          </div>
          <div className="ml-auto text-xs text-white/40">
            Início: {formatDate(goal.start_date)} · Banca inicial: {formatCurrency(goal.initial_bankroll)}
          </div>
        </div>
      )}

      {/* Gráfico de evolução */}
      <div className="glass-card p-8 border-white/5 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-white">Evolução da Banca</h3>
            <p className="text-xs text-white/30 mt-0.5">{wins} ganhos · {losses} perdas</p>
          </div>
          <ClipboardList size={16} className="text-white/20" />
        </div>
        <UserEvolutionChart sessions={sessions} initialBankroll={goal?.initial_bankroll ?? firstBankroll} />
      </div>

      {/* Carteira resumo */}
      <div className="glass-card p-6 border-white/5 animate-fade-in flex items-center gap-6 flex-wrap">
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
          <Wallet size={18} className="text-white/50" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-white/30 font-bold">Total Depositado</p>
          <p className="text-sm font-bold text-white">{formatCurrency(totalDeposited)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-white/30 font-bold">Total Sacado</p>
          <p className="text-sm font-bold text-white">{formatCurrency(totalWithdrawn)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-white/30 font-bold">Meses Fechados</p>
          <p className="text-sm font-bold text-white">{history.length}</p>
        </div>
      </div>
    </div>
  )
}
