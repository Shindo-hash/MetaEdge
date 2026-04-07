import { Transaction } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

type Props = {
  transactions: Transaction[]
  currentBankroll: number
  userName: string
  month: string
}

export default function WalletStatement({ transactions, currentBankroll, userName, month }: Props) {
  const totalDeposited = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((a, t) => a + t.amount, 0)

  const totalWithdrawn = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((a, t) => a + t.amount, 0)

  const netResult = totalWithdrawn + currentBankroll - totalDeposited
  const isProfit = netResult >= 0

  return (
    <div className="hidden print:block bg-white text-black p-8 font-sans">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MetaEdge</h1>
          <p className="text-sm text-gray-500">Extrato de Carteira</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">{userName}</p>
          <p className="text-sm text-gray-500">{month}</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border rounded p-3">
          <p className="text-xs text-gray-500 uppercase">Total Depositado</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalDeposited)}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-gray-500 uppercase">Total Sacado</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalWithdrawn)}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-gray-500 uppercase">Banca Atual</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(currentBankroll)}</p>
        </div>
        <div className={`border-2 rounded p-3 ${isProfit ? 'border-green-600' : 'border-red-600'}`}>
          <p className="text-xs text-gray-500 uppercase">Resultado</p>
          <p className={`text-lg font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
            {isProfit ? '+' : ''}{formatCurrency(netResult)}
          </p>
          <p className={`text-xs font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {isProfit ? 'LUCRO' : 'PREJUÍZO'}
          </p>
        </div>
      </div>

      {/* Tabela de transações */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border border-gray-300">Data</th>
            <th className="text-left p-2 border border-gray-300">Tipo</th>
            <th className="text-right p-2 border border-gray-300">Valor</th>
            <th className="text-left p-2 border border-gray-300">Observação</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-400">Nenhuma transação no período</td>
            </tr>
          ) : (
            transactions.map((t) => (
              <tr key={t.id} className="border-b border-gray-200">
                <td className="p-2 border border-gray-200">{formatDate(t.date)}</td>
                <td className="p-2 border border-gray-200">
                  <span className={`font-semibold ${t.type === 'deposit' ? 'text-green-700' : 'text-red-700'}`}>
                    {t.type === 'deposit' ? '↑ Depósito' : '↓ Saque'}
                  </span>
                </td>
                <td className={`p-2 border border-gray-200 text-right font-semibold ${t.type === 'deposit' ? 'text-green-700' : 'text-red-700'}`}>
                  {t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
                <td className="p-2 border border-gray-200 text-gray-600">{t.note ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Documento gerado pelo MetaEdge • Resultado = Total Sacado + Banca Atual − Total Depositado
      </p>
    </div>
  )
}
