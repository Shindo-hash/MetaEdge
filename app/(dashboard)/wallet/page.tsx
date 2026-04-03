import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import TransactionForm from '@/components/wallet/TransactionForm'
import WalletStatement from '@/components/wallet/WalletStatement'
import PrintButton from '@/components/wallet/PrintButton'
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Receipt, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
  ])

  const currentBankroll = profile?.current_bankroll ?? 0
  const userName = profile?.name ?? user.email ?? 'Usuário'
  const txList = transactions ?? []

  const totalDeposited = txList.filter((t) => t.type === 'deposit').reduce((a, t) => a + t.amount, 0)
  const totalWithdrawn = txList.filter((t) => t.type === 'withdrawal').reduce((a, t) => a + t.amount, 0)
  const netResult = totalWithdrawn + currentBankroll - totalDeposited
  const isProfit = netResult >= 0

  const byMonth: Record<string, typeof txList> = {}
  txList.forEach((t) => {
    const key = t.date.slice(0, 7)
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(t)
  })
  const monthKeys = Object.keys(byMonth).sort((a, b) => b.localeCompare(a))

  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const currentMonthTx = byMonth[currentMonthKey] ?? []
  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      {/* Print-only statement */}
      <WalletStatement
        transactions={currentMonthTx}
        currentBankroll={currentBankroll}
        userName={userName}
        month={monthLabel}
      />

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent-green/10 rounded-2xl border border-accent-green/20 neon-glow-green">
            <Wallet className="text-accent-green" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Carteira</h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Movimentações e Extrato</p>
          </div>
        </div>
        <PrintButton />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden animate-fade-in">
        {[
          {
            label: 'Total Depositado',
            value: formatCurrency(totalDeposited),
            icon: ArrowDownLeft,
            color: 'text-accent-green',
            bg: 'border-white/5',
          },
          {
            label: 'Total Sacado',
            value: formatCurrency(totalWithdrawn),
            icon: ArrowUpRight,
            color: 'text-red-400',
            bg: 'border-white/5',
          },
          {
            label: 'Banca Atual',
            value: formatCurrency(currentBankroll),
            icon: Wallet,
            color: 'text-accent-green',
            bg: 'border-accent-green/20 neon-glow-green',
          },
          {
            label: 'Resultado Líquido',
            value: `${isProfit ? '+' : ''}${formatCurrency(netResult)}`,
            icon: TrendingUp,
            color: isProfit ? 'text-accent-green' : 'text-red-400',
            bg: isProfit ? 'border-accent-green/20' : 'border-red-400/20',
            badge: isProfit ? 'LUCRO' : 'PREJUÍZO',
          },
        ].map(({ label, value, icon: Icon, color, bg, badge }) => (
          <div key={label} className={cn('glass-card p-5 relative overflow-hidden group transition-premium', bg)}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] blur-2xl -mr-8 -mt-8" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">{label}</p>
                <p className={cn('text-xl font-bold tracking-tight', color)}>{value}</p>
                {badge && (
                  <span className={cn('text-[9px] font-black uppercase tracking-widest mt-1 block', color + '/70')}>
                    {badge}
                  </span>
                )}
              </div>
              <div className={cn('p-2.5 rounded-xl', color === 'text-accent-green' ? 'bg-accent-green/10' : 'bg-red-400/10')}>
                <Icon size={16} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction form */}
      <div className="glass-card p-8 print:hidden animate-fade-in border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <Receipt size={18} className="text-accent-blue" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Registrar Movimentação</h3>
        </div>
        <TransactionForm userId={user.id} currentBankroll={currentBankroll} />
      </div>

      {/* History */}
      {monthKeys.length > 0 && (
        <div className="glass-card p-8 print:hidden animate-fade-in border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <Receipt size={18} className="text-white/30" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Histórico</h3>
          </div>

          <div className="space-y-8">
            {monthKeys.map((monthKey) => {
              const items = byMonth[monthKey]
              const [y, m] = monthKey.split('-')
              const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })
              const monthDep = items.filter((t) => t.type === 'deposit').reduce((a, t) => a + t.amount, 0)
              const monthWit = items.filter((t) => t.type === 'withdrawal').reduce((a, t) => a + t.amount, 0)

              return (
                <div key={monthKey}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest capitalize">{label}</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-accent-green">+{formatCurrency(monthDep)}</span>
                      <span className="text-red-400">-{formatCurrency(monthWit)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.map((t) => (
                      <div
                        key={t.id}
                        className="group flex items-center justify-between py-3.5 px-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-premium"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                            t.type === 'deposit' ? 'bg-accent-green/10' : 'bg-red-400/10'
                          )}>
                            {t.type === 'deposit'
                              ? <ArrowDown size={16} className="text-accent-green" />
                              : <ArrowUp size={16} className="text-red-400" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-none mb-0.5">
                              {t.type === 'deposit' ? 'Depósito' : 'Saque'}
                            </p>
                            {t.note
                              ? <p className="text-xs text-white/30">{t.note}</p>
                              : <p className="text-xs text-white/20">{formatDate(t.date)}</p>
                            }
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn('text-sm font-bold tracking-tight',
                            t.type === 'deposit' ? 'text-accent-green' : 'text-red-400'
                          )}>
                            {t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                          </p>
                          {t.note && <p className="text-[10px] text-white/25 mt-0.5">{formatDate(t.date)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {txList.length === 0 && (
        <div className="glass-card p-12 text-center print:hidden animate-fade-in border-dashed border-white/8">
          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="text-white/20" size={28} />
          </div>
          <p className="text-white/40 font-medium mb-1">Nenhuma movimentação ainda</p>
          <p className="text-white/20 text-sm">Use o formulário acima para registrar seu primeiro depósito.</p>
        </div>
      )}
    </div>
  )
}
