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
    <div
      className={cn(
        'glass-card p-6 transition-premium group relative overflow-hidden',
        highlight
          ? 'border-accent-green/30 neon-glow-green'
          : 'hover:border-accent-green/20'
      )}
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/5 blur-3xl -mr-16 -mt-16 group-hover:bg-accent-green/10 transition-premium" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={cn('text-2xl font-bold tracking-tight', colorClass ?? 'text-white')}>{value}</h3>
            {trend && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded',
                trendType === 'up' ? 'bg-accent-green/10 text-accent-green' : 
                trendType === 'down' ? 'bg-red-400/10 text-red-400' : 'bg-white/10 text-white/40'
              )}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-white/30 font-medium mt-1.5">{subtitle}</p>}
        </div>
        
        {icon && (
          <div className={cn(
            "p-3 rounded-xl transition-premium",
            highlight ? "bg-accent-green/10 text-accent-green" : "bg-white/5 text-white/30 group-hover:text-accent-green group-hover:bg-accent-green/5"
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
