'use client'

import { useEffect, useRef } from 'react'
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
        backgroundColor: 'rgba(0,255,136,0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#00ff88',
        pointBorderColor: '#0d1b2a',
        pointRadius: 4,
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
        backgroundColor: '#0d1b2a',
        borderColor: '#00ff88',
        borderWidth: 1,
        titleColor: '#00ff88',
        bodyColor: '#fff',
        callbacks: {
          label: (ctx: any) => ` ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#6b7280',
          font: { size: 11 },
          callback: (v: any) => formatCurrency(Number(v)),
        },
      },
    },
  }

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        Nenhuma sessão registrada ainda
      </div>
    )
  }

  return (
    <div className="h-52">
      <Line data={chartData} options={options as any} />
    </div>
  )
}
