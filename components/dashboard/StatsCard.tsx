import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type Props = {
  title: string
  value: string
  subtitle?: string
  icon?: ReactNode
  highlight?: boolean
  colorClass?: string
}

export default function StatsCard({ title, value, subtitle, icon, highlight, colorClass }: Props) {
  return (
    <div
      className={cn(
        'bg-[#0d1b2a] border rounded-xl p-5 transition-all',
        highlight
          ? 'border-[#00ff88]/40 shadow-[0_0_20px_rgba(0,255,136,0.1)]'
          : 'border-[#00ff88]/10 hover:border-[#00ff88]/20'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
          <p className={cn('text-2xl font-bold', colorClass ?? 'text-white')}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="text-[#00ff88]/60 ml-3 mt-1">{icon}</div>
        )}
      </div>
    </div>
  )
}
