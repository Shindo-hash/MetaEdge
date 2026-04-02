import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import TransactionForm from '@/components/wallet/TransactionForm'
import WalletStatement from '@/components/wallet/WalletStatement'
import PrintButton from '@/components/wallet/PrintButton'

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

  // Agrupa transações por mês
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* PDF oculto, visível apenas ao imprimir */}
      <WalletStatement
        transactions={currentMonthTx}
        currentBankroll={currentBankroll}
        userName={userName}
        month={monthLabel}
      />

      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-2xl font-bold text-white">Carteira</h2>
        <PrintButton />
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Depositado</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalDeposited)}</p>
        </div>
        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Sacado</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalWithdrawn)}</p>
        </div>
        <div className="bg-[#0d1b2a] border border-[#00ff88]/20 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Banca Atual</p>
          <p className="text-xl font-bold text-[#00ff88]">{formatCurrency(currentBankroll)}</p>
        </div>
        <div className={`rounded-xl p-5 border-2 ${
          isProfit
            ? 'bg-[#00ff88]/5 border-[#00ff88]/30 shadow-[0_0_20px_rgba(0,255,136,0.08)]'
            : 'bg-red-400/5 border-red-400/30'
        }`}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Resultado Líquido</p>
          <p className={`text-xl font-bold ${isProfit ? 'text-[#00ff88]' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{formatCurrency(netResult)}
          </p>
          <p className={`text-xs font-bold mt-1 ${isProfit ? 'text-[#00ff88]/70' : 'text-red-400/70'}`}>
            {isProfit ? 'LUCRO' : 'PREJUÍZO'}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-6 print:hidden">
        <h3 className="text-base font-semibold text-white mb-5">Registrar Movimentação</h3>
        <TransactionForm userId={user.id} currentBankroll={currentBankroll} />
      </div>

      {/* Histórico */}
      {monthKeys.length > 0 && (
        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-6 print:hidden">
          <h3 className="text-base font-semibold text-white mb-5">Histórico</h3>
          <div className="space-y-6">
            {monthKeys.map((monthKey) => {
              const items = byMonth[monthKey]
              const [y, m] = monthKey.split('-')
              const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })
              const monthDeposited = items.filter((t) => t.type === 'deposit').reduce((a, t) => a + t.amount, 0)
              const monthWithdrawn = items.filter((t) => t.type === 'withdrawal').reduce((a, t) => a + t.amount, 0)

              return (
                <div key={monthKey}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-300 capitalize">{label}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="text-[#00ff88]">+{formatCurrency(monthDeposited)}</span>
                      <span className="text-red-400">-{formatCurrency(monthWithdrawn)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {items.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-3 px-4 rounded-lg bg-[#0a1628] border border-[#00ff88]/5 hover:border-[#00ff88]/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${t.type === 'deposit' ? 'text-[#00ff88]' : 'text-red-400'}`}>
                            {t.type === 'deposit' ? '↑' : '↓'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {t.type === 'deposit' ? 'Depósito' : 'Saque'}
                            </p>
                            {t.note && <p className="text-xs text-gray-500">{t.note}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${t.type === 'deposit' ? 'text-[#00ff88]' : 'text-red-400'}`}>
                            {t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
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
        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-8 text-center print:hidden">
          <p className="text-gray-400">Nenhuma movimentação registrada ainda.</p>
          <p className="text-gray-600 text-sm mt-1">Use o formulário acima para registrar seu primeiro depósito.</p>
        </div>
      )}
    </div>
  )
}
