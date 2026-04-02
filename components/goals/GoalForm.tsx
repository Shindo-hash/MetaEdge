'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = { userId: string; currentBankroll: number }

export default function GoalForm({ userId, currentBankroll }: Props) {
  const router = useRouter()
  const [strategy, setStrategy] = useState<'fixed' | 'compound'>('fixed')
  const [initialBankroll, setInitialBankroll] = useState(String(currentBankroll))
  const [targetBankroll, setTargetBankroll] = useState('')
  const [dailyPct, setDailyPct] = useState('')
  const [weeks, setWeeks] = useState('4')
  const [playWeekends, setPlayWeekends] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    const supabase = createClient()

    await supabase.from('goals').update({ is_active: false }).eq('user_id', userId)

    const { error: insertError } = await supabase.from('goals').insert({
      user_id: userId,
      strategy,
      initial_bankroll: Number(initialBankroll),
      target_bankroll: strategy === 'fixed' ? Number(targetBankroll) : null,
      daily_percentage: strategy === 'compound' ? Number(dailyPct) : null,
      weeks: strategy === 'fixed' ? Number(weeks) : null,
      play_weekends: playWeekends,
      start_date: startDate,
      is_active: true,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(true)
      router.refresh()
    }
    setLoading(false)
  }

  const inputClass = "w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]/60 transition-colors"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Estratégia</label>
        <div className="grid grid-cols-2 gap-2">
          {(['fixed', 'compound'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStrategy(s)}
              className={`py-2.5 px-4 rounded-lg text-sm font-medium border transition-all ${
                strategy === s
                  ? 'bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]'
                  : 'bg-[#0a1628] border-[#00ff88]/10 text-gray-400 hover:border-[#00ff88]/20'
              }`}
            >
              {s === 'fixed' ? 'Meta Fixa' : 'Juros Compostos'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Banca Inicial (R$)</label>
          <input type="number" value={initialBankroll} onChange={(e) => setInitialBankroll(e.target.value)} required min="0" step="0.01" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Data de Início</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={inputClass} />
        </div>
      </div>

      {strategy === 'fixed' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Meta Final (R$)</label>
            <input type="number" value={targetBankroll} onChange={(e) => setTargetBankroll(e.target.value)} required min="0" step="0.01" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Número de Semanas</label>
            <input type="number" value={weeks} onChange={(e) => setWeeks(e.target.value)} required min="1" step="1" className={inputClass} />
          </div>
        </div>
      )}

      {strategy === 'compound' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Crescimento Diário (%)</label>
          <input type="number" value={dailyPct} onChange={(e) => setDailyPct(e.target.value)} required min="0.1" max="100" step="0.1" placeholder="Ex: 5" className={inputClass} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlayWeekends(!playWeekends)}
          className={`w-10 h-6 rounded-full transition-all relative ${playWeekends ? 'bg-[#00ff88]' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${playWeekends ? 'left-5' : 'left-1'}`} />
        </button>
        <span className="text-sm text-gray-400">Jogo nos fins de semana</span>
      </div>

      {success && (
        <p className="text-[#00ff88] text-sm bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg px-4 py-2">
          Meta configurada com sucesso!
        </p>
      )}
      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg font-semibold text-[#0a0f1e] bg-gradient-to-r from-[#00ff88] to-[#00b4d8] shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Ativar Meta'}
      </button>
    </form>
  )
}
