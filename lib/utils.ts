export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR')
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function resultColor(result: 'win' | 'loss' | 'partial' | null): string {
  if (result === 'win') return 'text-[#00ff88]'
  if (result === 'partial') return 'text-yellow-400'
  if (result === 'loss') return 'text-red-400'
  return 'text-gray-400'
}

export function resultBg(result: 'win' | 'loss' | 'partial' | null): string {
  if (result === 'win') return 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]'
  if (result === 'partial') return 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
  if (result === 'loss') return 'bg-red-400/10 border-red-400/30 text-red-400'
  return 'bg-gray-400/10 border-gray-400/30 text-gray-400'
}
