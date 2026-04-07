import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type Props = {
  title: string
  value: string
  subtitle?: string
  icon?: ReactNode
  highlight?: boolean
  colorClass?: string
  trend?: string
  trendType?: 'up' | 'down' | 'neutral'
}

export default function StatsCard({ title, value, subtitle, icon, highlight, colorClass, trend, trendType }: Props) {
  return (
    <div className={cn(
      'glass-card p-8 transition-premium group relative overflow-hidden hover:-translate-y-0.5',
      highlight ? 'border-accent-green/25 neon-glow-green' : 'border-white/[0.05] hover:border-white/10'
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent-green/[0.04] blur-2xl -mr-10 -mt-10 group-hover:bg-accent-green/[0.08] transition-premium" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className="text-xs uppercase tracking-[0.15em] text-white/35 font-bold mb-3 leading-snug">{title}</p>

          {/* Value */}
          <div className="flex items-baseline gap-2.5 flex-wrap mb-2">
            <h3 className={cn('text-3xl font-black tracking-tight leading-none', colorClass ?? 'text-white')}>
              {value}
            </h3>
            {trend && (
              <span className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-lg',
                trendType === 'up'   ? 'bg-accent-green/10 text-accent-green' :
                trendType === 'down' ? 'bg-red-400/10 text-red-400' :
                                       'bg-white/5 text-white/30'
              )}>
                {trend}
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-white/30 font-medium">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={cn(
            'p-3 rounded-xl flex-shrink-0 transition-premium',
            highlight
              ? 'bg-accent-green/12 text-accent-green'
              : 'bg-white/[0.05] text-white/25 group-hover:text-accent-green/70 group-hover:bg-accent-green/8'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
