'use client'

import { useState, useTransition } from 'react'
import { Settings } from 'lucide-react'
import TriggerModal from './TriggerModal'
import RiskSettings from './RiskSettings'
import { respondToTrigger, saveEvolutiveTriggers } from '@/lib/actions/evolutive'
import { DEFAULT_EVOLUTIVE_TRIGGERS, type EvolutiveTrigger } from '@/lib/services/evolutive'

type Props = {
  goalId: string
  currentBankroll: number
  triggers: EvolutiveTrigger[]
  acknowledged: number[]
}

export default function EvolutiveTriggerWrapper({ goalId, currentBankroll, triggers, acknowledged }: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const [dismissedLocally, setDismissedLocally] = useState<number[]>([])
  const [isPending, startTransition] = useTransition()

  // Acha o menor gatilho já cruzado que ainda não foi respondido (nem salvo
  // no banco, nem descartado localmente nessa mesma sessão de tela)
  const pending = [...triggers]
    .filter((t) => currentBankroll >= t.threshold)
    .filter((t) => !acknowledged.includes(t.threshold) && !dismissedLocally.includes(t.threshold))
    .sort((a, b) => a.threshold - b.threshold)[0]

  function handleAccept() {
    if (!pending) return
    setDismissedLocally((prev) => [...prev, pending.threshold])
    startTransition(() => {
      respondToTrigger(goalId, pending.threshold, true, pending.percentage)
    })
  }

  function handleDismiss() {
    if (!pending) return
    setDismissedLocally((prev) => [...prev, pending.threshold])
    startTransition(() => {
      respondToTrigger(goalId, pending.threshold, false, pending.percentage)
    })
  }

  function handleSaveSettings(newTriggers: EvolutiveTrigger[]) {
    setShowSettings(false)
    startTransition(() => {
      saveEvolutiveTriggers(goalId, newTriggers)
    })
  }

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className="inline-flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-premium"
        disabled={isPending}
      >
        <Settings size={12} />
        Configurar gatilhos
      </button>

      {pending && (
        <TriggerModal
          trigger={pending}
          currentBankroll={currentBankroll}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
        />
      )}

      {showSettings && (
        <RiskSettings
          triggers={triggers.length > 0 ? triggers : DEFAULT_EVOLUTIVE_TRIGGERS}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}
