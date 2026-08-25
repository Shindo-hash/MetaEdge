'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatCurrency } from '@/lib/utils'

type Session = { date: string; final_bankroll: number; profit: number }

export default function UserEvolutionChart({ sessions, initialBankroll }: { sessions: Session[]; initialBankroll: number }) {
  const data = sessions.map((s) => ({
    date: new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    banca: s.final_bankroll,
    lucro: s.profit,
  }))

  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-white/25 text-sm">Nenhuma sessão registrada ainda.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} width={90} />
        <ReferenceLine y={initialBankroll} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" label={{ value: 'Início', position: 'insideTopLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
          formatter={(value: any, name: any) => [formatCurrency(Number(value)), name === 'banca' ? 'Banca' : 'Lucro do dia']}
        />
        <Line type="monotone" dataKey="banca" stroke="#00ff88" strokeWidth={2.5} dot={{ r: 3, fill: '#00ff88' }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
