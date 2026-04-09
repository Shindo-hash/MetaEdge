'use client'

import { Shield, AlertTriangle, TrendingDown, Lock } from 'lucide-react'
import type { RiskLevel } from '@/lib/services/evolutive'

interface RiskLevelBadgeProps {
  riskLevel?: RiskLevel
  size?: 'sm' | 'md' | 'lg'
}

const riskConfig: Record<number, { icon: any; bgColor: string; borderColor: string; textColor: string; label: string }> = {
  30: {
    icon: AlertTriangle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    label: 'Alavancagem Máxima',
  },
  15: {
    icon: TrendingDown,
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    label: 'Risco Moderado',
  },
  5: {
    icon: Shield,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    label: 'Preservação de Capital',
  },
  2: {
    icon: Lock,
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    label: 'Capital Seguro',
  },
}

export default function RiskLevelBadge({ riskLevel, size = 'md' }: RiskLevelBadgeProps) {
  if (!riskLevel) {
    const config = riskConfig[30]
    const Icon = config.icon
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <Icon className={config.textColor} size={16} />
        <span className={`${config.textColor} font-bold text-xs`}>{config.label} (30%)</span>
      </div>
    )
  }

  const config = riskConfig[riskLevel.percentage] || {
    icon: Shield,
    bgColor: `bg-${riskLevel.color}-500/10`,
    borderColor: `border-${riskLevel.color}-500/30`,
    textColor: `text-${riskLevel.color}-400`,
    label: riskLevel.label,
  }
  
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-[10px] gap-1',
    md: 'px-3 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2',
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  }

  return (
    <div className={`inline-flex items-center rounded-lg border ${config.bgColor} ${config.borderColor} ${sizeClasses[size]}`}>
      <Icon className={config.textColor} size={iconSizes[size]} />
      <span className={`${config.textColor} font-bold`}>{config.label} ({riskLevel.percentage}%)</span>
    </div>
  )
}
