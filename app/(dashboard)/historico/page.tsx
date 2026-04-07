import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HistoricoCard from '@/components/historico/HistoricoCard'
import { BookOpen, Trophy } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: history } = await supabase
    .from('monthly_history')
    .select('*')
    .eq('user_id', user.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  const records = history ?? []

  const totalProfit    = records.reduce((acc, h) => acc + h.total_profit, 0)
  const bestMonth      = records.reduce<typeof records[0] | null>((best, h) => !best || h.total_profit > best.total_profit ? h : best, null)
  const avgReturn      = records.length > 0
    ? records.reduce((acc, h) => acc + h.return_pct, 0) / records.length
    : 0

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">

      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-4 animate-fade-in">
        <div className="p-3.5 bg-accent-blue/10 rounded-2xl border border-accent-blue/20">
          <BookOpen className="text-accent-blue" size={26} />
        </div>
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight leading-none">Histórico</h2>
          <p className="text-white/35 text-xs font-bold uppercase tracking-widest mt-2">
            Ciclos Mensais Fechados
          </p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed border-white/8 animate-fade-in">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-white/20" size={28} />
          </div>
          <p className="text-white/40 font-medium mb-1">Nenhum mês fechado ainda</p>
          <p className="text-white/20 text-sm">O histórico aparece aqui automaticamente ao virar o mês.</p>
        </div>
      ) : (
        <>
          {/* ── Resumo geral ── */}
          <div className="grid grid-cols-3 gap-5 animate-fade-in">
            {[
              {
                icon: Trophy,
                label: 'Lucro Total Acumulado',
                value: `${totalProfit >= 0 ? '+' : ''}${formatCurrency(totalProfit)}`,
                color: totalProfit >= 0 ? 'text-accent-green' : 'text-red-400',
                border: totalProfit >= 0 ? 'border-accent-green/20' : 'border-red-400/20',
              },
              {
                icon: BookOpen,
                label: 'Meses registrados',
                value: `${records.length}`,
                color: 'text-white',
                border: 'border-white/5',
              },
              {
                icon: Trophy,
                label: 'Retorno médio / mês',
                value: `${avgReturn.toFixed(1)}%`,
                color: avgReturn >= 0 ? 'text-accent-blue' : 'text-red-400',
                border: 'border-accent-blue/20',
              },
            ].map(({ icon: Icon, label, value, color, border }) => (
              <div key={label} className={cn('glass-card p-6 border', border)}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={13} className={color} />
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{label}</p>
                </div>
                <p className={cn('text-2xl font-black tracking-tight', color)}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Lista de meses ── */}
          <div className="space-y-4 animate-fade-in">
            {records.map((h) => (
              <HistoricoCard key={h.id} history={h} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
