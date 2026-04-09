'use client'

import { useState } from 'react'
import { Settings, Plus, Trash2, Save, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DEFAULT_EVOLUTIVE_TRIGGERS, type EvolutiveTrigger } from '@/lib/services/evolutive'

interface RiskSettingsProps {
  triggers: EvolutiveTrigger[]
  onSave: (triggers: EvolutiveTrigger[]) => void
  onClose: () => void
}

export default function RiskSettings({ triggers, onSave, onClose }: RiskSettingsProps) {
  const [localTriggers, setLocalTriggers] = useState<EvolutiveTrigger[]>(
    [...triggers].sort((a, b) => a.threshold - b.threshold)
  )

  const addTrigger = () => {
    const newTrigger: EvolutiveTrigger = {
      threshold: 1000,
      percentage: 10,
      label: 'Novo Nível',
      color: 'blue',
    }
    setLocalTriggers([...localTriggers, newTrigger].sort((a, b) => a.threshold - b.threshold))
  }

  const removeTrigger = (index: number) => {
    setLocalTriggers(localTriggers.filter((_, i) => i !== index))
  }

  const updateTrigger = (index: number, field: keyof EvolutiveTrigger, value: string | number) => {
    const updated = [...localTriggers]
    updated[index] = { ...updated[index], [field]: value }
    setLocalTriggers(updated)
  }

  const handleSave = () => {
    onSave(localTriggers)
  }

  const colorOptions = [
    { value: 'red', label: 'Vermelho' },
    { value: 'yellow', label: 'Amarelo' },
    { value: 'blue', label: 'Azul' },
    { value: 'green', label: 'Verde' },
    { value: 'purple', label: 'Roxo' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#0a0f1e] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-blue/10 rounded-lg border border-accent-blue/20">
              <Settings className="text-accent-blue" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Configurações de Risco</h2>
              <p className="text-white/40 text-sm">Personalize os gatilhos do Modo Safe</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white/60 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Lista de gatilhos */}
        <div className="space-y-3 mb-6">
          {localTriggers.map((trigger, index) => (
            <div 
              key={index}
              className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="flex-1 grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-white/40 text-xs mb-1">Saldo Mínimo</label>
                  <input
                    type="number"
                    value={trigger.threshold}
                    onChange={(e) => updateTrigger(index, 'threshold', Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">Porcentagem %</label>
                  <input
                    type="number"
                    value={trigger.percentage}
                    onChange={(e) => updateTrigger(index, 'percentage', Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                    placeholder="15"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">Nome do Nível</label>
                  <input
                    type="text"
                    value={trigger.label}
                    onChange={(e) => updateTrigger(index, 'label', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                    placeholder="Risco Moderado"
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">Cor</label>
                  <select
                    value={trigger.color}
                    onChange={(e) => updateTrigger(index, 'color', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                  >
                    {colorOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={() => removeTrigger(index)}
                className="p-2 text-white/30 hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Botão adicionar */}
        <button
          onClick={addTrigger}
          className="w-full py-3 border border-dashed border-white/20 rounded-xl text-white/50 font-bold text-sm hover:bg-white/5 hover:text-white/70 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <Plus size={18} />
          Adicionar Novo Gatilho
        </button>

        {/* Preview */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6">
          <h3 className="text-white/60 text-sm font-bold mb-3">Pré-visualização</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Até {formatCurrency(localTriggers[0]?.threshold || 1000)}</span>
              <span className="text-red-400 font-bold">Alavancagem Máxima (30%)</span>
            </div>
            {localTriggers.map((trigger, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-white/40">A partir de {formatCurrency(trigger.threshold)}</span>
                <span className={`text-${trigger.color}-400 font-bold`}>
                  {trigger.label} ({trigger.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={() => setLocalTriggers([...DEFAULT_EVOLUTIVE_TRIGGERS])}
            className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 transition-colors"
          >
            Restaurar Padrão
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-accent-blue/20 border border-accent-blue/30 text-accent-blue font-bold text-sm hover:bg-accent-blue/30 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}
