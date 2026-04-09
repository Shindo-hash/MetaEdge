'use client'

import { useState, useEffect } from 'react'
import { X, TrendingDown, Shield, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { EvolutiveTrigger } from '@/lib/services/evolutive'

interface TriggerModalProps {
  trigger: EvolutiveTrigger
  currentBankroll: number
  onAccept: () => void
  onDismiss: () => void
}

export default function TriggerModal({ trigger, currentBankroll, onAccept, onDismiss }: TriggerModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animação de entrada
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleAccept = () => {
    setIsVisible(false)
    setTimeout(onAccept, 300)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={`
          relative w-full max-w-md bg-[#0a0f1e] border border-white/10 rounded-2xl p-6
          shadow-2xl transition-all duration-300 transform
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
      >
        {/* Botão fechar */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/60 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Ícone e título */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-green/10 border border-accent-green/20 mb-4">
            <Shield className="text-accent-green" size={32} />
          </div>
          <h2 className="text-xl font-black text-white mb-2">
            🎉 Parabéns! Marco Atingido
          </h2>
          <p className="text-white/50 text-sm">
            Sua banca cresceu e você atingiu um novo patamar
          </p>
        </div>

        {/* Info do saldo */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/40 text-sm">Banca Atual</span>
            <span className="text-white font-bold">{formatCurrency(currentBankroll)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-sm">Gatilho Desbloqueado</span>
            <span className="text-accent-green font-bold">{formatCurrency(trigger.threshold)}</span>
          </div>
        </div>

        {/* Proposta de redução de risco */}
        <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingDown className="text-accent-green" size={20} />
            <span className="text-white font-bold">Redução de Risco Recomendada</span>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Para proteger seus ganhos, sugerimos reduzir a porcentagem de risco de 
            <span className="text-white font-bold">30%</span> para 
            <span className="text-accent-green font-bold">{trigger.percentage}%</span>.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="text-accent-green" size={16} />
            <span className="text-white/70">Nível: {trigger.label}</span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 transition-colors"
          >
            Manter 30%
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-3 px-4 rounded-xl bg-accent-green/20 border border-accent-green/30 text-accent-green font-bold text-sm hover:bg-accent-green/30 transition-colors"
          >
            Aceitar {trigger.percentage}%
          </button>
        </div>

        <p className="text-center text-white/30 text-xs mt-4">
          Você pode alterar isso depois nas Configurações de Risco
        </p>
      </div>
    </div>
  )
}
