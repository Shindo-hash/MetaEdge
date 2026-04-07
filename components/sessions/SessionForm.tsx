'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcSessionResult } from '@/lib/services/goals'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

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

    // SUGESTÃO 4 — validar horários
    if (startTime && endTime && startTime >= endTime) {
      setError('A hora de início deve ser anterior à hora de fim.')
      setLoading(false)
      return
    }

    // BUG 5 — bloquear sessão duplicada na mesma data
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (existing) {
      setError('Já existe uma sessão registrada para esta data. Edite ou exclua a sessão existente.')
      setLoading(false)
      return
    }

    const initial = Number(initialBankroll)
    const final = Number(finalBankroll)
    const calculatedProfit = final - initial

    // BUG 3 — evitar resultado errado quando não há meta
    const calculatedResult = dailyGoal > 0
      ? calcSessionResult(final, initial, dailyGoal)
      : calculatedProfit >= 0 ? 'win' : 'loss'

    const { error: insertError } = await supabase.from('sessions').insert({
      user_id: userId, date, start_time: startTime, end_time: endTime,
      initial_bankroll: initial, final_bankroll: final,
      result: calculatedResult, profit: calculatedProfit,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    await supabase.from('profiles').update({ current_bankroll: final }).eq('id', userId)

    router.refresh()
    setFinalBankroll('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Data</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="field-input" />
        </div>
        <div>
          <label className="field-label">Meta Diária</label>
          <div className="field-display">
            {dailyGoal > 0 ? formatCurrency(dailyGoal) : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Início</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="field-input" />
        </div>
        <div>
          <label className="field-label">Fim</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="field-input" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Banca Inicial (R$)</label>
          <input type="number" value={initialBankroll} onChange={(e) => setInitialBankroll(e.target.value)}
            required min="0" step="0.01" className="field-input" />
        </div>
        <div>
          <label className="field-label">Banca Final (R$)</label>
          <input type="number" value={finalBankroll} onChange={(e) => setFinalBankroll(e.target.value)}
            required min="0" step="0.01" placeholder="0.00" className="field-input" />
        </div>
      </div>

      {result && profit !== null && (
        <div className={cn(
          'rounded-2xl px-5 py-4 border flex items-center justify-between',
          result === 'win'     ? 'bg-accent-green/5 border-accent-green/20' :
          result === 'partial' ? 'bg-yellow-400/5 border-yellow-400/20' :
                                 'bg-red-400/5 border-red-400/20'
        )}>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-1">Resultado previsto</p>
            <span className={cn(
              'text-xl font-black tracking-tighter',
              profit >= 0 ? 'text-accent-green' : 'text-red-400'
            )}>
              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
            </span>
            {/* MELHORIA 3 — mostrar banca-alvo e alvo parcial */}
            {dailyGoal > 0 && (
              <p className="text-xs text-white/30 mt-1">
                Meta: <span className="text-white/60 font-bold">{formatCurrency(Number(initialBankroll) + dailyGoal)}</span>
                {' '}· Parcial: <span className="text-white/60 font-bold">{formatCurrency(Number(initialBankroll) + dailyGoal * 0.7)}</span>
              </p>
            )}
          </div>
          <span className={cn(
            'text-xs font-black px-3 py-1.5 rounded-full border uppercase tracking-widest',
            result === 'win'     ? 'text-accent-green border-accent-green/30 bg-accent-green/10' :
            result === 'partial' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                                   'text-red-400 border-red-400/30 bg-red-400/10'
          )}>
            {result === 'win' ? 'WIN' : result === 'partial' ? 'PARCIAL' : 'LOSS'}
          </span>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-3">{error}</div>
      )}

      <button type="submit" disabled={loading || !finalBankroll} className="btn-primary">
        {loading
          ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Salvando...</span>
          : 'Registrar Sessão'
        }
      </button>
    </form>
  )
}
