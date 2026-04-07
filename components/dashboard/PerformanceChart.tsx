'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
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
  const delta = payload[0]?.value ?? 0
  return (
    <div className="bg-[#0d1224] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-white/40 font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-bold ${delta >= 0 ? 'text-accent-green' : 'text-red-400'}`}>
        {delta >= 0 ? '+' : ''}{fmtMoney(delta)}
      </p>
    </div>
  )
}

export default function PerformanceChart({ points }: { points: Point[] }) {
  if (!points.length) return (
    <div className="h-56 flex items-center justify-center text-white/20 text-sm">Sem dados ainda</div>
  )

  const data = points.map(p => ({ label: fmtDate(p.date), delta: p.delta }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          axisLine={false} tickLine={false} width={38}
        />
        <Tooltip content={<TooltipContent />} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3" />
        <Line
          type="monotone" dataKey="delta"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={(props: any) => {
            const { cx, cy, payload } = props
            const color = payload.delta >= 0 ? '#00ff88' : '#f87171'
            return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={color} stroke="none" />
          }}
          activeDot={{ r: 5 }}
          name="delta"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
