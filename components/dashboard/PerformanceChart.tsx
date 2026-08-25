'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'

type Point = { date: string; real: number; expected: number; delta: number }

function fmtDate(d: string) {
  const [, , dd] = d.split('-')
  return dd
}

function fmtMoney(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

const TooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const delta = payload[0]?.value
  return (
    <div className="bg-[#0d1224] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl min-w-[140px]">
      <p className="text-white/40 font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className={delta >= 0 ? 'text-accent-green font-bold' : 'text-red-400 font-bold'}>
        {delta >= 0 ? '+' : ''}{fmtMoney(delta)}
      </p>
      <p className="text-white/30 mt-1">{delta >= 0 ? 'Acima do esperado' : 'Abaixo do esperado'}</p>
    </div>
  )
}

export default function PerformanceChart({ points }: { points: Point[] }) {
  if (!points.length) return (
    <div className="h-56 flex items-center justify-center text-white/20 text-sm">Sem dados ainda</div>
  )

  const data = points.map((p) => ({ ...p, label: fmtDate(p.date) }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          axisLine={false} tickLine={false} width={38}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
        <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="delta" radius={[4, 4, 4, 4]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.delta >= 0 ? '#00ff88' : '#f87171'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
