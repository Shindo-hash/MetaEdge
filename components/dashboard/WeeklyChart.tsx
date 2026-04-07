'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts'

type Point = { week: string; target: number; actual: number }

function fmtMoney(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

const TooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const target = payload.find((p: any) => p.dataKey === 'target')?.value
  const actual = payload.find((p: any) => p.dataKey === 'actual')?.value
  const pct = target > 0 ? Math.round((actual / target) * 100) : 0
  return (
    <div className="bg-[#0d1224] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl min-w-[150px]">
      <p className="text-white/40 font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="text-white/50 mb-0.5">Meta: {fmtMoney(target)}</p>
      <p className={`font-bold mb-0.5 ${actual >= target ? 'text-accent-green' : actual >= target * 0.8 ? 'text-yellow-400' : 'text-white'}`}>
        Real: {fmtMoney(actual)}
      </p>
      <p className="text-white/30">{pct}% da meta</p>
    </div>
  )
}

export default function WeeklyChart({ points }: { points: Point[] }) {
  if (!points.length) return (
    <div className="h-56 flex items-center justify-center text-white/20 text-sm">Sem dados ainda</div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          axisLine={false} tickLine={false} width={38}
        />
        <Tooltip content={<TooltipContent />} />
        <Legend
          formatter={(v) => v === 'target' ? 'Meta' : 'Realizado'}
          wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 8 }}
        />
        {/* Barra de meta: tracejada/suave */}
        <Bar dataKey="target" name="target" radius={[4, 4, 0, 0]} maxBarSize={28} fill="rgba(255,255,255,0.12)" />
        {/* Barra realizado: verde ou vermelho */}
        <Bar dataKey="actual" name="actual" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {points.map((p, i) => (
            <Cell
              key={`cell-${i}`}
              fill={
                p.actual >= p.target          ? '#00ff88' :
                p.actual >= p.target * 0.8    ? '#facc15' :
                p.actual >= 0                 ? 'rgba(255,255,255,0.25)' :
                '#f87171'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
