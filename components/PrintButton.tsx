'use client'

import { Printer } from 'lucide-react'

export default function PrintButton({ label = 'Imprimir' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 px-4 py-2 rounded-xl bg-white/6 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
    >
      <Printer size={14} />
      {label}
    </button>
  )
}
