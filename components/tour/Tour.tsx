'use client'

import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

export type TourStep = {
  target: string       // seletor CSS do elemento a destacar (ex: '#banca-inicial')
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

type Props = {
  steps: TourStep[]
  storageKey: string   // chave no localStorage pra não mostrar de novo depois de visto/pulado
  onFinish?: () => void
}

type Rect = { top: number; left: number; width: number; height: number }

export default function Tour({ steps, storageKey, onFinish }: Props) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    const seen = localStorage.getItem(storageKey)
    if (!seen) setActive(true)
  }, [storageKey])

  const measureTarget = useCallback(() => {
    const step = steps[stepIndex]
    if (!step) return
    const el = document.querySelector(step.target)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [steps, stepIndex])

  useLayoutEffect(() => {
    if (!active) return
    measureTarget()
    window.addEventListener('resize', measureTarget)
    return () => window.removeEventListener('resize', measureTarget)
  }, [active, measureTarget])

  function finish() {
    localStorage.setItem(storageKey, 'true')
    setActive(false)
    onFinish?.()
  }

  function next() {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1)
    else finish()
  }

  function back() {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  if (!active || steps.length === 0) return null

  const step = steps[stepIndex]
  const placement = step.placement ?? 'bottom'
  const pad = 8 // respiro ao redor do elemento destacado

  // Posição da caixa de explicação, relativa ao elemento destacado
  let boxStyle: React.CSSProperties = { position: 'fixed', zIndex: 10001, maxWidth: 320 }
  if (rect) {
    if (placement === 'bottom') {
      boxStyle.top = rect.top + rect.height + pad + 12
      boxStyle.left = Math.max(16, Math.min(rect.left, window.innerWidth - 336))
    } else if (placement === 'top') {
      boxStyle.bottom = window.innerHeight - rect.top + pad + 12
      boxStyle.left = Math.max(16, Math.min(rect.left, window.innerWidth - 336))
    } else if (placement === 'right') {
      boxStyle.top = rect.top
      boxStyle.left = rect.left + rect.width + pad + 12
    } else {
      boxStyle.top = rect.top
      boxStyle.right = window.innerWidth - rect.left + pad + 12
    }
  } else {
    // Sem elemento encontrado — centraliza na tela
    boxStyle.top = '50%'
    boxStyle.left = '50%'
    boxStyle.transform = 'translate(-50%, -50%)'
  }

  return (
    <>
      {/* Overlay escuro — 4 retângulos ao redor do elemento (em vez de um
          círculo), pra se ajustar certinho no formato de qualquer campo,
          por mais largo ou estreito que seja. */}
      {rect ? (
        <>
          {/* Acima */}
          <div className="fixed z-[10000]" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - pad), background: 'rgba(0,0,0,0.75)' }} onClick={finish} />
          {/* Abaixo */}
          <div className="fixed z-[10000]" style={{ top: rect.top + rect.height + pad, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)' }} onClick={finish} />
          {/* Esquerda */}
          <div className="fixed z-[10000]" style={{ top: rect.top - pad, left: 0, width: Math.max(0, rect.left - pad), height: rect.height + pad * 2, background: 'rgba(0,0,0,0.75)' }} onClick={finish} />
          {/* Direita */}
          <div className="fixed z-[10000]" style={{ top: rect.top - pad, left: rect.left + rect.width + pad, right: 0, height: rect.height + pad * 2, background: 'rgba(0,0,0,0.75)' }} onClick={finish} />
        </>
      ) : (
        <div className="fixed inset-0 z-[10000]" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={finish} />
      )}
      {rect && (
        <div
          className="fixed z-[10000] pointer-events-none rounded-xl ring-2 ring-accent-green/70 transition-all duration-300"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      )}

      {/* Caixa de explicação */}
      <div
        style={boxStyle}
        className="glass-card p-5 border-accent-green/25 animate-fade-in"
      >
        <button onClick={finish} className="absolute top-3 right-3 text-white/30 hover:text-white/60" aria-label="Fechar tour">
          <X size={16} />
        </button>
        <p className="text-[10px] uppercase tracking-widest text-accent-green font-bold mb-2">
          Passo {stepIndex + 1} de {steps.length}
        </p>
        <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
        <p className="text-xs text-white/60 leading-relaxed mb-4">{step.content}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={back}
            disabled={stepIndex === 0}
            className="text-xs text-white/40 hover:text-white/70 disabled:opacity-0 flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Voltar
          </button>
          <button onClick={next} className="btn-primary text-xs px-4 py-2 flex items-center gap-1">
            {stepIndex < steps.length - 1 ? 'Próximo' : 'Concluir'}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
