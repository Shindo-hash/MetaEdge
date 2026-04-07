'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

type Point = { date: string; real: number; expected: number; delta: number }

function fmtDate(d: string) {
  const [, , dd] = d.split('-')
  return `${dd}`
}

function fmtMoney(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

const TooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const real = payload.find((p: any) => p.dataKey === 'real')?.value
  const exp  = payload.find((p: any) => p.dataKey === 'expected')?.value
  const delta = real != null && exp != null ? real - exp : null
  return (
    <div className="bg-[#0d1224] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl min-w-[160px]">
      <p className="text-white/40 font-bold uppercase tracking-widest mb-2">{label}</p>
      {real     != null && <p className="text-accent-green font-bold mb-0.5">Real: {fmtMoney(real)}</p>}
      {exp      != null && <p className="text-white/50 mb-0.5">Meta: {fmtMoney(exp)}</p>}
      {delta    != null && (
        <p className={delta >= 0 ? 'text-accent-green' : 'text-red-400'}>
          {delta >= 0 ? '+' : ''}{fmtMoney(delta)}
        </p>
      )}
    </div>
  )
}

export default function BankrollChart({ points }: { points: Point[] }) {
  if (!points.length) return (
    <div className="h-56 flex items-center justify-center text-white/20 text-sm">Sem dados ainda</div>
  )

  const data = points.map(p => ({ ...p, label: fmtDate(p.date) }))

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
        <Legend
          formatter={(v) => v === 'real' ? 'Banca Real' : 'Meta Projetada'}
          wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 8 }}
        />
        {/* Meta: tracejada, suave */}
        <Line
          type="monotone" dataKey="expected"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1.5} strokeDasharray="5 4"
          dot={false} name="expected"
        />
        {/* Real: destaque verde */}
        <Line
          type="monotone" dataKey="real"
          stroke="#00ff88"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#00ff88', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#00ff88' }}
          name="real"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
