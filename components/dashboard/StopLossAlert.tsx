'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Props = {
  lossPct: number
  stopLossPct: number
  initialBankroll: number
  currentBankroll: number
}

export default function StopLossAlert({ lossPct, stopLossPct, initialBankroll, currentBankroll }: Props) {
  const [dismissed, setDismissed] = useState(true) // começa fechado até checar sessionStorage

  const shouldShow = lossPct >= stopLossPct

  useEffect(() => {
    if (!shouldShow) return
    // Não mostra de novo se a pessoa já fechou esse aviso NESSA sessão do
    // navegador (sessionStorage some quando fecha a aba de verdade, então
    // volta a avisar na próxima vez que abrir).
    const key = 'metaedge_stoploss_dismissed'
    const already = sessionStorage.getItem(key)
    setDismissed(already === 'true')
  }, [shouldShow])

  function handleDismiss() {
    sessionStorage.setItem('metaedge_stoploss_dismissed', 'true')
    setDismissed(true)
  }

  if (!shouldShow || dismissed) return null

  const perdido = initialBankroll - currentBankroll

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card max-w-md w-full p-8 border-red-400/30 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-premium"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="text-red-400" size={28} />
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">
          Atenção — perda de {lossPct.toFixed(0)}%
        </h2>

        <p className="text-white/60 text-sm text-center leading-relaxed mb-6">
          Sua banca caiu de <strong className="text-white">{formatCurrency(initialBankroll)}</strong> para{' '}
          <strong className="text-red-400">{formatCurrency(currentBankroll)}</strong> — uma perda de{' '}
          <strong className="text-red-400">{formatCurrency(perdido)}</strong>. Ultrapassou o limite de{' '}
          {stopLossPct}% que você configurou.
        </p>

        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 mb-6">
          <p className="text-sm text-white/70 leading-relaxed">
            Recomendamos <strong className="text-white">sacar o que resta</strong> e voltar na próxima
            sessão com a banca renovada. Perseguir prejuízo tende a piorar o resultado.
          </p>
        </div>

        <button onClick={handleDismiss} className="btn-primary w-full">
          Entendi
        </button>
      </div>
    </div>
  )
}
