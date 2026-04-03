'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Session } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { BarChart2 } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Props = { sessions: Session[] }

export default function MonthlyChart({ sessions }: Props) {
  const monthMap: Record<string, number> = {}

  sessions.forEach((s) => {
    const key = s.date.slice(0, 7)
    monthMap[key] = (monthMap[key] ?? 0) + s.profit
  })

  const sorted = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)

  const labels = sorted.map(([k]) => {
    const [y, m] = k.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  })
  const data = sorted.map(([, v]) => v)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Lucro',
        data,
        backgroundColor: data.map((v) =>
          v >= 0 ? 'rgba(0,255,136,0.65)' : 'rgba(248,113,113,0.65)'
        ),
        borderColor: data.map((v) => (v >= 0 ? '#00ff88' : '#f87171')),
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10,18,35,0.95)',
        borderColor: 'rgba(0,255,136,0.25)',
        borderWidth: 1,
        titleColor: '#00ff88',
        bodyColor: 'rgba(255,255,255,0.7)',
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: (ctx: any) => ` ${formatCurrency(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10, family: 'Inter' } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        border: { display: false },
        ticks: {
          color: 'rgba(255,255,255,0.25)',
          font: { size: 10, family: 'Inter' },
          callback: (v: any) => formatCurrency(Number(v)),
        },
      },
    },
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-56 gap-3">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <BarChart2 size={18} className="text-white/15" />
        </div>
        <p className="text-white/25 text-sm">Nenhum dado mensal disponível</p>
      </div>
    )
  }

  return (
    <div className="h-56">
      <Bar data={chartData} options={options as any} />
    </div>
  )
}
