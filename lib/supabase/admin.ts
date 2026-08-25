import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente admin — usa a service_role key, que ignora as regras de acesso
 * normais (RLS) e enxerga TODOS os usuários, não só o logado.
 *
 * NUNCA importa isso num arquivo 'use client'. O `import 'server-only'`
 * acima faz o build FALHAR se isso acontecer por engano, como proteção
 * extra além de nunca expor a chave via NEXT_PUBLIC_.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurado no servidor.')
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
