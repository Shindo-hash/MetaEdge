'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import type { GoalAlert } from '@/lib/services/goals'

type Props = { alerts: GoalAlert[] }

export default function GoalAlerts({ alerts }: Props) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || alerts.length === 0) return
    fired.current = true

    alerts.forEach((alert) => {
      toast(alert.message, {
        duration: 7000,
        icon:
          alert.level === 'daily'   ? <CheckCircle2 size={16} className="text-accent-green" /> :
          alert.level === 'weekly'  ? <TrendingUp   size={16} className="text-accent-blue"  /> :
                                      <AlertTriangle size={16} className="text-yellow-400"   />,
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (alerts.length === 0) return null

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={[
            'flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-semibold',
            alert.level === 'daily'   ? 'bg-accent-green/8  border-accent-green/20 text-accent-green' : '',
            alert.level === 'weekly'  ? 'bg-accent-blue/8   border-accent-blue/20  text-accent-blue'  : '',
            alert.level === 'monthly' ? 'bg-yellow-400/8    border-yellow-400/20   text-yellow-400'   : '',
          ].join(' ')}
        >
          {alert.level === 'daily'   && <CheckCircle2 size={15} />}
          {alert.level === 'weekly'  && <TrendingUp   size={15} />}
          {alert.level === 'monthly' && <AlertTriangle size={15} />}
          {alert.message}
        </div>
      ))}
    </div>
  )
}
