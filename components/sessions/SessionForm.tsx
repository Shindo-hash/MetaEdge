'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcSessionResult } from '@/lib/goals'
import { formatCurrency } from '@/lib/utils'

type Props = { dailyGoal: number; currentBankroll: number; userId: string }

export default function SessionForm({ dailyGoal, currentBankroll, userId }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toTimeString().slice(0, 5)

  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState(now)
  const [endTime, setEndTime] = useState(now)
  const [initialBankroll, setInitialBankroll] = useState(String(currentBankroll))
  const [finalBankroll, setFinalBankroll] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profit = finalBankroll ? Number(finalBankroll) - Number(initialBankroll) : null
  const result = profit !== null && dailyGoal > 0
    ? calcSessionResult(Number(finalBankroll), Number(initialBankroll), dailyGoal)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const initial = Number(initialBankroll)
    const final = Number(finalBankroll)
    const calculatedProfit = final - initial
    const calculatedResult = calcSessionResult(final, initial, dailyGoal)

    const { error: insertError } = await supabase.from('sessions').insert({
      user_id: userId,
      date,
      start_time: startTime,
      end_time: endTime,
      initial_bankroll: initial,
      final_bankroll: final,
      result: calculatedResult,
      profit: calculatedProfit,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    await supabase
      .from('profiles')
      .update({ current_bankroll: final })
      .eq('id', userId)

    router.refresh()
    setFinalBankroll('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Meta Diária</label>
          <div className="w-full bg-[#0a1628] border border-[#00ff88]/10 rounded-lg px-4 py-2.5 text-[#00ff88] font-semibold">
            {dailyGoal > 0 ? formatCurrency(dailyGoal) : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Início</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fim</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]/60 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Banca Inicial (R$)</label>
          <input
            type="number"
            value={initialBankroll}
            onChange={(e) => setInitialBankroll(e.target.value)}
            required
            min="0"
            step="0.01"
            className="w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Banca Final (R$)</label>
          <input
            type="number"
            value={finalBankroll}
            onChange={(e) => setFinalBankroll(e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88]/60 transition-colors"
          />
        </div>
      </div>

      {result && profit !== null && (
        <div className={`rounded-lg px-4 py-3 border flex items-center justify-between ${
          result === 'win' ? 'bg-[#00ff88]/5 border-[#00ff88]/30' :
          result === 'partial' ? 'bg-yellow-400/5 border-yellow-400/30' :
          'bg-red-400/5 border-red-400/30'
        }`}>
          <span className="text-sm text-gray-400">Resultado previsto</span>
          <div className="flex items-center gap-3">
            <span className={`font-bold ${profit >= 0 ? 'text-[#00ff88]' : 'text-red-400'}`}>
              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
              result === 'win' ? 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10' :
              result === 'partial' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
              'text-red-400 border-red-400/30 bg-red-400/10'
            }`}>
              {result === 'win' ? 'WIN' : result === 'partial' ? 'PARCIAL' : 'LOSS'}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !finalBankroll}
        className="w-full py-3 rounded-lg font-semibold text-[#0a0f1e] bg-gradient-to-r from-[#00ff88] to-[#00b4d8] shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Salvando...' : 'Registrar Sessão'}
      </button>
    </form>
  )
}
