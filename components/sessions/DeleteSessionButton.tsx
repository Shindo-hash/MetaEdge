'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

type Props = { sessionId: string; userId: string }

export default function DeleteSessionButton({ sessionId, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Excluir esta sessão? A banca não será recalculada automaticamente.')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('sessions').delete().eq('id', sessionId).eq('user_id', userId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
      title="Excluir sessão"
    >
      <Trash2 size={14} />
    </button>
  )
}
