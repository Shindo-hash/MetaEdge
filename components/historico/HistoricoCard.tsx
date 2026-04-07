'use client'

import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MonthlyHistory } from '@/types'

const MONTHS = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

type Props = { history: MonthlyHistory }

export default function HistoricoCard({ history: h }: Props) {
  const positive = h.total_profit >= 0
  const winRate  = h.days_operated > 0 ? Math.round((h.days_positive / h.days_operated) * 100) : 0

  function handlePrint() {
    const win  = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>MetaEdge — ${MONTHS[h.month]} ${h.year}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #fff; color: #111; padding: 40px; }
    h1  { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
    .sub { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .15em; margin-bottom: 28px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
    .card-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }
    .card-value { font-size: 20px; font-weight: 900; }
    .green { color: #16a34a; } .red { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb;
         font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: #888; }
    td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; }
    tr:last-child td { border-bottom: none; }
    .right { text-align: right; }
    footer { margin-top: 32px; font-size: 10px; color: #bbb; text-align: center; }
  </style>
</head>
<body>
  <h1>MetaEdge PRO — Relatório Mensal</h1>
  <p class="sub">${MONTHS[h.month]} ${h.year} · Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>

  <div class="grid">
    <div class="card">
      <div class="card-label">Banca Inicial</div>
      <div class="card-value">${formatCurrency(h.initial_bankroll)}</div>
    </div>
    <div class="card">
      <div class="card-label">Banca Final</div>
      <div class="card-value">${formatCurrency(h.final_bankroll)}</div>
    </div>
    <div class="card">
      <div class="card-label">Lucro Total</div>
      <div class="card-value ${h.total_profit >= 0 ? 'green' : 'red'}">${h.total_profit >= 0 ? '+' : ''}${formatCurrency(h.total_profit)}</div>
    </div>
    <div class="card">
      <div class="card-label">Retorno</div>
      <div class="card-value ${h.return_pct >= 0 ? 'green' : 'red'}">${h.return_pct.toFixed(2)}%</div>
    </div>
    <div class="card">
      <div class="card-label">Meta Diária</div>
      <div class="card-value">${formatCurrency(h.daily_goal_fixed)}</div>
    </div>
    <div class="card">
      <div class="card-label">Dias Operados / Total</div>
      <div class="card-value">${h.days_operated} / ${h.op_days_total}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Métrica</th>
        <th class="right">Valor</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Dias positivos</td><td class="right green">${h.days_positive}</td></tr>
      <tr><td>Dias negativos</td><td class="right red">${h.days_negative}</td></tr>
      <tr><td>Taxa de acerto</td><td class="right">${winRate}%</td></tr>
      <tr><td>Lucro total</td><td class="right ${h.total_profit >= 0 ? 'green' : 'red'}">${h.total_profit >= 0 ? '+' : ''}${formatCurrency(h.total_profit)}</td></tr>
      <tr><td>Retorno sobre banca</td><td class="right">${h.return_pct.toFixed(2)}%</td></tr>
    </tbody>
  </table>

  <footer>MetaEdge PRO · metaedge.app · © ${new Date().getFullYear()}</footer>
</body>
</html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  return (
    <div className="glass-card p-7 border-white/5 hover:border-white/10 transition-premium">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-black text-white tracking-tight capitalize">
            {MONTHS[h.month]} {h.year}
          </h3>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-0.5">
            {h.days_operated}/{h.op_days_total} dias · {winRate}% acerto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs px-3 py-1.5 rounded-full font-black uppercase tracking-widest border',
            positive
              ? 'text-accent-green border-accent-green/30 bg-accent-green/8'
              : 'text-red-400 border-red-400/30 bg-red-400/8'
          )}>
            {h.return_pct.toFixed(1)}%
          </span>
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
            title="Imprimir / Salvar PDF"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Banca Inicial', value: formatCurrency(h.initial_bankroll), color: 'text-white/70' },
          { label: 'Banca Final',   value: formatCurrency(h.final_bankroll),   color: 'text-white' },
          { label: 'Meta Diária',   value: formatCurrency(h.daily_goal_fixed), color: 'text-accent-blue' },
          {
            label: 'Lucro Total',
            value: `${positive ? '+' : ''}${formatCurrency(h.total_profit)}`,
            color: positive ? 'text-accent-green' : 'text-red-400',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card bg-white/[0.02] px-4 py-3 border-white/5">
            <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">{label}</p>
            <p className={cn('text-sm font-black tracking-tight', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Win/Loss bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-green to-accent-blue transition-all"
            style={{ width: `${winRate}%` }}
          />
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="text-accent-green flex items-center gap-1">
            <TrendingUp size={12} />{h.days_positive}
          </span>
          <span className="text-red-400 flex items-center gap-1">
            <TrendingDown size={12} />{h.days_negative}
          </span>
        </div>
      </div>
    </div>
  )
}
