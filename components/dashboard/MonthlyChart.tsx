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
          v >= 0 ? 'rgba(0,255,136,0.7)' : 'rgba(248,113,113,0.7)'
        ),
        borderColor: data.map((v) => (v >= 0 ? '#00ff88' : '#f87171')),
        borderWidth: 1,
        borderRadius: 6,
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
        grid: { display: false },
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
        Nenhum dado mensal disponível
      </div>
    )
  }

  return (
    <div className="h-52">
      <Bar data={chartData} options={options as any} />
    </div>
  )
}
