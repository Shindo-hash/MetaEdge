'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RotateCcw, XCircle, Search, RefreshCcw, ChevronRight, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { adminResetBankroll, adminDeactivateGoal, adminResetCurrentMonth, type AdminUserRow } from '@/lib/actions/admin'

const STRATEGY_LABEL: Record<string, string> = {
  fixed: 'Meta Fixa',
  compound: 'Juros Compostos',
  evolutive: 'Gestão Evolutiva',
}

export default function AdminUsersList({ users }: { users: AdminUserRow[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')
  const [resettingUser, setResettingUser] = useState<AdminUserRow | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = users.filter((u) =>
    (u.name ?? '').toLowerCase().includes(query.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(query.toLowerCase())
  )

  function handleStartReset(user: AdminUserRow) {
    setEditingId(user.id)
    setNewValue(String(user.current_bankroll))
  }

  function handleConfirmReset(userId: string) {
    const value = Number(newValue)
    if (isNaN(value) || value < 0) return
    startTransition(async () => {
      await adminResetBankroll(userId, value)
      router.refresh()
    })
    setEditingId(null)
  }

  function handleDeactivate(goalId: string) {
    if (!confirm('Desativar a meta desse usuário? Ele vai ver a tela de criar meta nova no próximo acesso.')) return
    startTransition(async () => {
      await adminDeactivateGoal(goalId)
      router.refresh()
    })
  }

  function handleConfirmResetMonth() {
    if (!resettingUser || confirmText !== 'RESETAR') return
    const targetId = resettingUser.id
    setResettingUser(null)
    setConfirmText('')
    startTransition(async () => {
      try {
        await adminResetCurrentMonth(targetId)
        // Recarrega a página inteira (não só o cache do Next.js) — garante
        // que não sobra nenhum dado antigo em memória em lugar nenhum.
        window.location.reload()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro ao resetar o mês.')
      }
    })
  }

  return (
    <div className="glass-card p-8 md:p-10 border-white/5 animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h3 className="text-base font-bold text-white uppercase tracking-widest">Usuários</h3>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou email"
            className="bg-white/[0.03] border border-white/8 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-accent-green/40 w-72"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-premium">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <Link href={`/admin/${u.id}`} className="group flex items-center gap-3 min-w-[220px]">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-green/20 to-accent-blue/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-black text-accent-green">
                    {(u.name || u.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold text-white group-hover:text-accent-green transition-premium flex items-center gap-1.5">
                    {u.name || '—'}
                    <ChevronRight size={15} className="opacity-0 group-hover:opacity-100 transition-premium" />
                  </p>
                  <p className="text-sm text-white/35">{u.email}</p>
                </div>
              </Link>

              <div className="text-sm">
                <p className="text-[11px] text-white/30 uppercase tracking-wider font-bold mb-0.5">Banca</p>
                <p className="text-white font-bold text-base">{formatCurrency(u.current_bankroll)}</p>
              </div>

              <div className="text-sm">
                <p className="text-[11px] text-white/30 uppercase tracking-wider font-bold mb-1">Estratégia</p>
                {u.goal_is_active ? (
                  <span className="px-3 py-1 rounded-full bg-accent-green/8 border border-accent-green/20 text-accent-green font-bold uppercase tracking-wider text-xs">
                    {STRATEGY_LABEL[u.goal_strategy ?? ''] ?? u.goal_strategy}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/30 font-bold uppercase tracking-wider text-xs">
                    Sem meta ativa
                  </span>
                )}
              </div>

              <div className="text-sm">
                <p className="text-[11px] text-white/30 uppercase tracking-wider font-bold mb-0.5">Sessões</p>
                <p className="text-white/70 font-semibold">{u.sessions_count}</p>
              </div>

              <div className="flex items-center gap-1 ml-auto">
                {editingId === u.id ? (
                  <>
                    <input
                      type="number"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      autoFocus
                      className="w-32 bg-white/[0.03] border border-accent-green/30 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    />
                    <button
                      onClick={() => handleConfirmReset(u.id)}
                      disabled={isPending}
                      className="text-sm font-bold text-accent-green hover:text-accent-green/70 px-3"
                    >
                      Salvar
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-sm text-white/30 hover:text-white/60 px-2">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/admin/${u.id}`}
                      title="Ver evolução"
                      className="p-2.5 text-white/30 hover:text-accent-blue transition-colors"
                    >
                      <TrendingUp size={17} />
                    </Link>
                    <button
                      onClick={() => handleStartReset(u)}
                      title="Corrigir banca"
                      disabled={isPending}
                      className="p-2.5 text-white/30 hover:text-accent-green transition-colors"
                    >
                      <RotateCcw size={17} />
                    </button>
                    {u.goal_is_active && u.goal_id && (
                      <button
                        onClick={() => handleDeactivate(u.goal_id!)}
                        title="Desativar meta"
                        disabled={isPending}
                        className="p-2.5 text-white/30 hover:text-red-400 transition-colors"
                      >
                        <XCircle size={17} />
                      </button>
                    )}
                    <button
                      onClick={() => setResettingUser(u)}
                      title="Reiniciar mês atual (mantém histórico)"
                      disabled={isPending}
                      className="p-2.5 text-white/30 hover:text-orange-400 transition-colors"
                    >
                      <RefreshCcw size={17} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-white/30 text-center py-10">Nenhum usuário encontrado.</p>
        )}
      </div>

      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-8 border-orange-400/30">
            <h3 className="text-lg font-bold text-white mb-2">Reiniciar mês atual</h3>
            <p className="text-sm text-white/60 mb-1">
              Usuário: <strong className="text-white">{resettingUser.name || resettingUser.email}</strong>
            </p>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              Isso apaga as sessões do mês/ciclo atual, volta a banca pro valor inicial, e{' '}
              <strong className="text-white">desativa a meta atual</strong> — a pessoa vai precisar configurar
              um plano novo (podendo escolher outra estratégia) no próximo acesso.
              Meses já fechados no Histórico <strong className="text-white">não são afetados</strong>.
            </p>
            <p className="text-xs text-white/40 mb-2">
              Digita <strong className="text-orange-400">RESETAR</strong> pra confirmar:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
              className="w-full bg-white/[0.03] border border-orange-400/25 rounded-xl px-4 py-2.5 text-sm text-white outline-none mb-5"
              placeholder="RESETAR"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setResettingUser(null); setConfirmText('') }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResetMonth}
                disabled={confirmText !== 'RESETAR' || isPending}
                className="flex-1 py-2.5 rounded-xl bg-orange-400/15 border border-orange-400/30 text-orange-400 text-sm font-bold disabled:opacity-30"
              >
                Confirmar reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
