import { cn } from '@/lib/utils'

type Props = {
  result: 'win' | 'loss' | 'partial' | null
  label?: string
}

const config = {
  win:     { text: 'WIN',     cls: 'text-accent-green border-accent-green/30 bg-accent-green/10' },
  loss:    { text: 'LOSS',    cls: 'text-red-400 border-red-400/25 bg-red-400/8' },
  partial: { text: 'PARCIAL', cls: 'text-yellow-400 border-yellow-400/25 bg-yellow-400/8' },
}

export default function GoalStatus({ result, label }: Props) {
  if (!result) return null
  const { text, cls } = config[result]
  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black border uppercase tracking-widest',
      cls
    )}>
      {label ?? text}
    </span>
  )
}
