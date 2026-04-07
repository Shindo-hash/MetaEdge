'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp } from 'lucide-react'

type Props = { userId: string; currentBankroll: number }

export default function TransactionForm({ userId, currentBankroll }: Props) {
  const router = useRouter()
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = Number(amount)
  const newBankroll = type === 'deposit' ? currentBankroll + parsedAmount : currentBankroll - parsedAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (type === 'withdrawal' && parsedAmount > currentBankroll) {
      setError(`Saque maior que a banca atual (${formatCurrency(currentBankroll)})`)
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: userId, type, amount: parsedAmount,
      note: note.trim() || null, date,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    await supabase.from('profiles').update({ current_bankroll: newBankroll }).eq('id', userId)

    setAmount('')
    setNote('')
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selector */}
      <div className="grid grid-cols-2 gap-2">
        {(['deposit', 'withdrawal'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              'strategy-pill flex items-center justify-center gap-2',
              type === t
                ? t === 'deposit'
                  ? 'strategy-pill-active'
                  : 'bg-red-400/8 border-red-400/30 text-red-400'
                : 'strategy-pill-inactive'
            )}
          >
            {t === 'deposit' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
            {t === 'deposit' ? 'Depósito' : 'Saque'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Valor (R$)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            required min="0.01" step="0.01" placeholder="0,00" className="field-input" />
        </div>
        <div>
          <label className="field-label">Data</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            required className="field-input" />
        </div>
      </div>

      <div>
        <label className="field-label">Observação (opcional)</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: bônus de boas-vindas" maxLength={120} className="field-input" />
      </div>

      {/* Preview */}
      {amount && parsedAmount > 0 && (
        <div className={cn(
          'rounded-2xl px-5 py-4 border flex items-center justify-between',
          type === 'deposit'
            ? 'bg-accent-green/5 border-accent-green/20'
            : newBankroll < 0
              ? 'bg-red-500/8 border-red-500/25'
              : 'bg-red-400/5 border-red-400/15'
        )}>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-0.5">
              Banca após {type === 'deposit' ? 'depósito' : 'saque'}
            </p>
            <p className={cn(
              'text-xl font-black tracking-tighter',
              newBankroll < 0 ? 'text-red-500' : type === 'deposit' ? 'text-accent-green' : 'text-red-400'
            )}>
              {formatCurrency(Math.max(0, newBankroll))}
            </p>
          </div>
          <span className={cn(
            'text-xs font-bold uppercase tracking-widest',
            type === 'deposit' ? 'text-accent-green/60' : 'text-red-400/60'
          )}>
            {type === 'deposit' ? `+${formatCurrency(parsedAmount)}` : `-${formatCurrency(parsedAmount)}`}
          </span>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-3">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading || !amount || parsedAmount <= 0}
        className={type === 'deposit' ? 'btn-primary' : 'btn-danger'}
      >
        {loading
          ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Salvando...</span>
          : type === 'deposit' ? 'Registrar Depósito' : 'Registrar Saque'
        }
      </button>
    </form>
  )
}
