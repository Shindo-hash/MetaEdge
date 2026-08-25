'use client'

import { PartyPopper } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { MonthlyHistory } from '@/types'

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export default function MonthClosedCelebration({ history }: { history: MonthlyHistory }) {
  const isProfit = history.total_profit >= 0
  const monthLabel = MONTH_NAMES[history.month - 1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card max-w-md w-full p-8 border-accent-green/30 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mx-auto mb-5 neon-glow-green">
          <PartyPopper className="text-accent-green" size={28} />
        </div>

        <h2 className="text-xl font-bold text-white mb-1 capitalize">
          {monthLabel} fechou!
        </h2>
        <p className="text-white/50 text-sm mb-6">
          Aqui está o resumo do seu mês.
        </p>

        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 uppercase tracking-widest">Resultado</span>
            <span className={`text-2xl font-black ${isProfit ? 'text-accent-green' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{formatCurrency(history.total_profit)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Retorno sobre a banca</span>
            <span className={isProfit ? 'text-accent-green' : 'text-red-400'}>
              {isProfit ? '+' : ''}{history.return_pct.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Dias operados</span>
            <span className="text-white/70">{history.days_operated}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Dias positivos / negativos</span>
            <span className="text-white/70">{history.days_positive} / {history.days_negative}</span>
          </div>
        </div>

        <p className="text-white/60 text-sm leading-relaxed mb-6">
          {isProfit
            ? 'Parabéns pelo resultado! Sua banca zerou de volta ao valor inicial da meta — hora de sacar o lucro e começar o novo ciclo.'
            : 'Esse mês não foi como esperado, mas o ciclo já reiniciou. Ajuste o que for preciso e siga em frente.'}
        </p>

        <a href="/wallet" className="btn-primary w-full inline-block text-center">
          Ver na Carteira
        </a>
      </div>
    </div>
  )
}
