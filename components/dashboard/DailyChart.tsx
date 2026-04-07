'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Session } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

type Props = { sessions: Session[] }

export default function DailyChart({ sessions }: Props) {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)

  const labels = sorted.map((s) => {
    const d = new Date(s.date + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  })
  const data = sorted.map((s) => s.final_bankroll)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Banca',
        data,
        borderColor: '#00ff88',
        backgroundColor: (ctx: any) => {
          const canvas = ctx.chart.ctx
          const gradient = canvas.createLinearGradient(0, 0, 0, 240)
          gradient.addColorStop(0, 'rgba(0,255,136,0.18)')
          gradient.addColorStop(1, 'rgba(0,255,136,0)')
          return gradient
        },
        borderWidth: 2,
        pointBackgroundColor: '#00ff88',
        pointBorderColor: '#0a1220',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
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
        grid: { color: 'rgba(255,255,255,0.03)' },
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
          <TrendingUp size={18} className="text-white/15" />
        </div>
        <p className="text-white/25 text-sm">Nenhuma sessão registrada</p>
      </div>
    )
  }

  return (
    <div className="h-56">
      <Line data={chartData} options={options as any} />
    </div>
  )
}
