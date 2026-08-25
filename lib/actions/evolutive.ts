'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { EvolutiveTrigger } from '@/lib/services/evolutive'

/**
 * Responde a um gatilho de risco (aceitar ou recusar a redução sugerida).
 * Aceitar: passa a valer o novo % a partir de agora.
 * Recusar: mantém o % atual, mas não pergunta de novo sobre ESSE gatilho
 * específico (só volta a perguntar quando cruzar um gatilho mais alto).
 */
export async function respondToTrigger(
  goalId: string,
  threshold: number,
  accept: boolean,
  newPct: number,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: goal } = await supabase
    .from('goals')
    .select('evolutive_ack, evolutive_current_pct')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  const ack: number[] = goal?.evolutive_ack ?? []
  const updatedAck = ack.includes(threshold) ? ack : [...ack, threshold]

  const update: { evolutive_ack: number[]; evolutive_current_pct?: number } = {
    evolutive_ack: updatedAck,
  }
  if (accept) update.evolutive_current_pct = newPct

  await supabase.from('goals').update(update).eq('id', goalId).eq('user_id', user.id)

  revalidatePath('/dashboard')
}

/**
 * Salva os gatilhos personalizados (Configurações de Risco). Passar `null`
 * volta a usar os valores padrão do sistema.
 */
export async function saveEvolutiveTriggers(goalId: string, triggers: EvolutiveTrigger[] | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  await supabase
    .from('goals')
    .update({ evolutive_triggers: triggers })
    .eq('id', goalId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}
