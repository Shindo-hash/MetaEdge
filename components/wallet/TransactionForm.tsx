'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

type Props = {
  userId: string
  currentBankroll: number
}

export default function TransactionForm({ userId, currentBankroll }: Props) {
  const router = useRouter()
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = Number(amount)
  const newBankroll = type === 'deposit'
    ? currentBankroll + parsedAmount
    : currentBankroll - parsedAmount

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
      user_id: userId,
      type,
      amount: parsedAmount,
      note: note.trim() || null,
      date,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    await supabase
      .from('profiles')
      .update({ current_bankroll: newBankroll })
      .eq('id', userId)

    setAmount('')
    setNote('')
    router.refresh()
    setLoading(false)
  }

  const inputClass =
    'w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88]/60 transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        {(['deposit', 'withdrawal'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`py-2.5 px-4 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
              type === t
                ? t === 'deposit'
                  ? 'bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]'
                  : 'bg-red-400/10 border-red-400/40 text-red-400'
                : 'bg-[#0a1628] border-[#00ff88]/10 text-gray-400 hover:border-[#00ff88]/20'
            }`}
          >
            <span>{t === 'deposit' ? '↑' : '↓'}</span>
            {t === 'deposit' ? 'Depósito' : 'Saque'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Valor (R$)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0.01"
            step="0.01"
            placeholder="0,00"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Observação (opcional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: bônus de boas-vindas"
          maxLength={120}
          className={inputClass}
        />
      </div>

      {/* Preview */}
      {amount && parsedAmount > 0 && (
        <div className={`rounded-lg px-4 py-3 border flex items-center justify-between text-sm ${
          type === 'deposit'
            ? 'bg-[#00ff88]/5 border-[#00ff88]/20'
            : newBankroll < 0
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-red-400/5 border-red-400/20'
        }`}>
          <span className="text-gray-400">
            Banca após {type === 'deposit' ? 'depósito' : 'saque'}
          </span>
          <span className={`font-bold ${newBankroll < 0 ? 'text-red-500' : type === 'deposit' ? 'text-[#00ff88]' : 'text-red-400'}`}>
            {formatCurrency(Math.max(0, newBankroll))}
          </span>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !amount || parsedAmount <= 0}
        className={`w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          type === 'deposit'
            ? 'text-[#0a0f1e] bg-gradient-to-r from-[#00ff88] to-[#00b4d8] shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]'
            : 'text-white bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]'
        }`}
      >
        {loading ? 'Salvando...' : type === 'deposit' ? 'Registrar Depósito' : 'Registrar Saque'}
      </button>
    </form>
  )
}
