import { resultBg } from '@/lib/utils'

type Props = {
  result: 'win' | 'loss' | 'partial' | null
  label?: string
}

const labels = {
  win: 'WIN',
  loss: 'LOSS',
  partial: 'PARCIAL',
}

export default function GoalStatus({ result, label }: Props) {
  if (!result) return null
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${resultBg(result)}`}
    >
      {label ?? labels[result]}
    </span>
  )
}
