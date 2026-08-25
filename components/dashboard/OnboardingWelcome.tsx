'use client'

import { useState } from 'react'
import { Wallet, TrendingUp, Zap, Target, ChevronRight, ChevronDown } from 'lucide-react'

export default function OnboardingWelcome() {
  const [expanded, setExpanded] = useState<'fixed' | 'compound' | 'evolutive' | null>(null)

  const strategies = [
    {
      key: 'evolutive' as const,
      icon: <Zap size={18} />,
      title: 'Gestão Evolutiva',
      badge: 'Recomendada',
      short: 'Risco que se ajusta sozinho conforme sua banca cresce.',
      long: 'Começa arriscando 30% da banca por dia. Conforme sua banca cresce e passa de certos valores (R$1.000, R$5.000, R$10.000), o risco diminui automaticamente (15%, 5%, 2%) — protegendo o que você já ganhou sem precisar mexer em nada manualmente.',
    },
    {
      key: 'fixed' as const,
      icon: <Target size={18} />,
      title: 'Meta Fixa',
      badge: null,
      short: 'Você define um valor final e um prazo, o app calcula quanto precisa ganhar por dia.',
      long: 'Ideal se você já sabe exatamente aonde quer chegar (ex: "quero sair de R$500 e chegar a R$2.000 em 4 semanas"). O app divide essa diferença pelos dias úteis do período e te mostra a meta diária fixa pra bater.',
    },
    {
      key: 'compound' as const,
      icon: <TrendingUp size={18} />,
      title: 'Juros Compostos',
      badge: null,
      short: 'Você define uma % de crescimento diário, a banca cresce sobre o valor do dia anterior.',
      long: 'Cada dia a meta é calculada em cima do saldo atualizado (não do valor inicial) — então a meta em reais vai aumentando aos poucos conforme sua banca cresce. Bom pra quem gosta de acompanhar crescimento percentual constante.',
    },
  ]

  return (
    <div className="glass-card p-8 md:p-10 animate-fade-in border-white/8">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center flex-shrink-0">
          <Wallet className="text-accent-green" size={26} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Bem-vindo ao MetaEdge 👋</h2>
          <p className="text-white/50 text-sm">
            Antes de começar, um resumo rápido de como o app funciona.
          </p>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 mb-6">
        <p className="text-sm text-white/70 leading-relaxed">
          <strong className="text-white">Banca</strong> é o valor total que você tem disponível pra operar hoje.
          Você informa esse valor ao criar sua meta — o app usa ele como ponto de partida pra calcular
          quanto você precisa ganhar por dia, semana e mês, dependendo da estratégia escolhida.
        </p>
      </div>

      <p className="text-xs uppercase tracking-widest text-white/35 font-bold mb-3">
        Escolha uma estratégia de meta
      </p>

      <div className="space-y-2 mb-8">
        {strategies.map((s) => (
          <div
            key={s.key}
            className="border border-white/8 rounded-xl overflow-hidden bg-white/[0.02]"
          >
            <button
              type="button"
              onClick={() => setExpanded(expanded === s.key ? null : s.key)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-premium"
            >
              <div className="flex items-center gap-3">
                <span className="text-accent-green">{s.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{s.title}</span>
                    {s.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{s.short}</p>
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-white/30 transition-transform flex-shrink-0 ${expanded === s.key ? 'rotate-180' : ''}`}
              />
            </button>
            {expanded === s.key && (
              <div className="px-4 pb-4 pt-0">
                <p className="text-xs text-white/50 leading-relaxed border-t border-white/5 pt-3">
                  {s.long}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <a
        href="/goals"
        className="inline-flex items-center gap-2 text-accent-green text-sm font-bold uppercase tracking-widest hover:gap-3 transition-premium"
      >
        Configurar minha primeira meta <ChevronRight size={16} />
      </a>
    </div>
  )
}
