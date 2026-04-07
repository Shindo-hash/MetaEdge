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

    // MELHORIA 4 — confirmar substituição de meta ativa
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (existingGoal) {
      const confirmed = confirm('Você já tem uma meta ativa. Deseja substituí-la pela nova configuração?')
      if (!confirmed) {
        setLoading(false)
        return
      }
    }

    // BUG 4 — capturar erro ao desativar e abortar antes do insert
    const { error: deactivateError } = await supabase
      .from('goals')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (deactivateError) {
      setError('Erro ao desativar meta anterior: ' + deactivateError.message)
      setLoading(false)
      return
    }

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
      // BUG 4 — rollback: reativar a última meta se o insert falhar
      await supabase
        .from('goals')
        .update({ is_active: true })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Strategy */}
      <div>
        <label className="field-label">Estratégia</label>
        <div className="grid grid-cols-2 gap-2">
          {(['fixed', 'compound'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStrategy(s)}
              className={`strategy-pill ${strategy === s ? 'strategy-pill-active' : 'strategy-pill-inactive'}`}
            >
              {s === 'fixed' ? 'Meta Fixa' : 'Juros Compostos'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Banca Inicial (R$)</label>
          <input type="number" value={initialBankroll} onChange={(e) => setInitialBankroll(e.target.value)}
            required min="0" step="0.01" className="field-input" />
        </div>
        <div>
          <label className="field-label">Data de Início</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            required className="field-input" />
        </div>
      </div>

      {strategy === 'fixed' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Meta Final (R$)</label>
            <input type="number" value={targetBankroll} onChange={(e) => setTargetBankroll(e.target.value)}
              required min="0" step="0.01" className="field-input" />
          </div>
          <div>
            <label className="field-label">Nº de Semanas</label>
            <input type="number" value={weeks} onChange={(e) => setWeeks(e.target.value)}
              required min="1" step="1" className="field-input" />
          </div>
        </div>
      )}

      {strategy === 'compound' && (
        <div>
          <label className="field-label">Crescimento Diário (%)</label>
          <input type="number" value={dailyPct} onChange={(e) => setDailyPct(e.target.value)}
            required min="0.1" max="100" step="0.1" placeholder="Ex: 5" className="field-input" />
        </div>
      )}

      {/* Weekend toggle */}
      <div className="flex items-center gap-4 py-1">
        <button
          type="button"
          onClick={() => setPlayWeekends(!playWeekends)}
          className="toggle-track"
          data-on={String(playWeekends)}
        >
          <span className="toggle-thumb" />
        </button>
        <div>
          <p className="text-sm font-medium text-white/80">Jogo nos fins de semana</p>
          <p className="text-xs text-white/30">Inclui sábado e domingo no cálculo</p>
        </div>
      </div>

      {success && (
        <div className="text-accent-green text-sm bg-accent-green/8 border border-accent-green/20 rounded-xl px-4 py-3">
          Meta configurada com sucesso!
        </div>
      )}
      {error && (
        <div className="text-red-400 text-sm bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-3">{error}</div>
      )}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading
          ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Salvando...</span>
          : 'Ativar Meta'
        }
      </button>
    </form>
  )
}
