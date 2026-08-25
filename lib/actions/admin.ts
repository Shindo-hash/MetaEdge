'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin'

async function assertIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = (user?.email ?? '').trim().toLowerCase()
  if (!ADMIN_EMAIL || email !== ADMIN_EMAIL) {
    throw new Error('Acesso restrito ao administrador.')
  }
}

export type AdminUserRow = {
  id: string
  name: string | null
  email: string | null
  current_bankroll: number
  goal_id: string | null
  goal_strategy: string | null
  goal_initial_bankroll: number | null
  goal_is_active: boolean | null
  sessions_count: number
}

export type AdminStats = {
  total_users: number
  users_with_active_goal: number
  total_sessions: number
}

/**
 * Lista todos os usuários com meta ativa (se tiver) e contagem de sessões —
 * pra dar suporte sem precisar abrir o Supabase direto.
 */
export async function listAllUsers(): Promise<{ users: AdminUserRow[]; stats: AdminStats; error?: string }> {
  await assertIsAdmin()
  const admin = createAdminClient()

  const [profilesRes, goalsRes, sessionsRes] = await Promise.all([
    admin.from('profiles').select('id, name, email, current_bankroll'),
    admin.from('goals').select('id, user_id, strategy, initial_bankroll, is_active').eq('is_active', true),
    admin.from('sessions').select('user_id'),
  ])

  // Se a service_role key estiver errada/faltando, o Supabase retorna um
  // erro em vez de dar exceção — sem checar isso, a tela mostraria "0
  // usuários" silenciosamente, parecendo que não tem ninguém cadastrado.
  const firstError = profilesRes.error || goalsRes.error || sessionsRes.error
  if (firstError) {
    return {
      users: [],
      stats: { total_users: 0, users_with_active_goal: 0, total_sessions: 0 },
      error: `Erro ao buscar dados: ${firstError.message}. Confere se o SUPABASE_SERVICE_ROLE_KEY está certo no .env.local (e se reiniciou o servidor depois de mudar).`,
    }
  }

  const profiles = profilesRes.data
  const goals = goalsRes.data
  const sessions = sessionsRes.data

  const goalByUser = new Map((goals ?? []).map((g) => [g.user_id, g]))
  const sessionCountByUser = new Map<string, number>()
  ;(sessions ?? []).forEach((s) => {
    sessionCountByUser.set(s.user_id, (sessionCountByUser.get(s.user_id) ?? 0) + 1)
  })

  const users: AdminUserRow[] = (profiles ?? []).map((p) => {
    const goal = goalByUser.get(p.id)
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      current_bankroll: p.current_bankroll ?? 0,
      goal_id: goal?.id ?? null,
      goal_strategy: goal?.strategy ?? null,
      goal_initial_bankroll: goal?.initial_bankroll ?? null,
      goal_is_active: goal ? true : false,
      sessions_count: sessionCountByUser.get(p.id) ?? 0,
    }
  })

  const stats: AdminStats = {
    total_users: users.length,
    users_with_active_goal: users.filter((u) => u.goal_is_active).length,
    total_sessions: sessions?.length ?? 0,
  }

  return { users, stats }
}

/** Corrige a banca de um usuário direto (sem precisar abrir o Supabase). */
export async function adminResetBankroll(userId: string, newBankroll: number) {
  await assertIsAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ current_bankroll: newBankroll }).eq('id', userId)
  revalidatePath('/admin')
}

/** Desativa a meta ativa de um usuário — ele passa a ver a tela de "criar nova meta". */
export async function adminDeactivateGoal(goalId: string) {
  await assertIsAdmin()
  const admin = createAdminClient()
  await admin.from('goals').update({ is_active: false }).eq('id', goalId)
  revalidatePath('/admin')
}

/**
 * Reinicia o mês/ciclo ATUAL de um usuário — apaga só as sessões desse
 * ciclo em aberto, volta a banca pro valor inicial da meta, DESATIVA a meta
 * atual (a pessoa cai na tela de configurar um plano novo do zero, podendo
 * escolher outra estratégia), e reinicia o nível de risco (se era
 * Evolutiva). NÃO mexe em meses já fechados no histórico — a pessoa
 * continua vendo a evolução dela ao longo do tempo.
 */
export async function adminResetCurrentMonth(userId: string) {
  await assertIsAdmin()
  const admin = createAdminClient()

  const [{ data: cycle, error: cycleErr }, { data: goal, error: goalErr }] = await Promise.all([
    admin.from('cycles').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle(),
    admin.from('goals').select('*').eq('user_id', userId).eq('is_active', true).maybeSingle(),
  ])

  console.log(`[adminResetCurrentMonth] user=${userId} cycle=${cycle ? cycle.id : 'NENHUM'} goal=${goal ? `${goal.id} (initial_bankroll=${goal.initial_bankroll})` : 'NENHUMA META ATIVA'}`)

  if (cycleErr || goalErr) {
    throw new Error(`Erro ao buscar dados do usuário: ${cycleErr?.message || goalErr?.message}`)
  }

  if (cycle) {
    // Apaga só as sessões desse ciclo em aberto — meses anteriores (já
    // fechados, salvos em monthly_history) não são tocados.
    const { error: delSessionsErr, count: deletedSessions } = await admin.from('sessions').delete({ count: 'exact' }).eq('user_id', userId).gte('date', cycle.start_date)
    if (delSessionsErr) throw new Error(`Erro ao apagar sessões: ${delSessionsErr.message}`)
    console.log(`[adminResetCurrentMonth] sessões apagadas: ${deletedSessions}`)

    // Remove o ciclo atual — na próxima visita, um novo é criado do zero
    // automaticamente (ensureCycleForCurrentMonth), quando a pessoa
    // configurar uma meta nova.
    const { error: delCycleErr } = await admin.from('cycles').delete().eq('id', cycle.id)
    if (delCycleErr) throw new Error(`Erro ao apagar ciclo: ${delCycleErr.message}`)
  } else {
    console.log('[adminResetCurrentMonth] sem ciclo ativo — pulando limpeza de sessões')
  }

  if (goal) {
    const [{ error: profErr, data: profData }, { error: goalUpdErr }] = await Promise.all([
      admin.from('profiles').update({ current_bankroll: goal.initial_bankroll }).eq('id', userId).select(),
      // Desativa a meta — força a pessoa a configurar um plano novo do
      // zero (podendo escolher outra estratégia) no próximo acesso.
      admin.from('goals').update({
        is_active: false,
        evolutive_current_pct: null,
        evolutive_ack: [],
      }).eq('id', goal.id),
    ])
    if (profErr) throw new Error(`Erro ao resetar banca: ${profErr.message}`)
    if (goalUpdErr) throw new Error(`Erro ao desativar meta: ${goalUpdErr.message}`)
    console.log(`[adminResetCurrentMonth] banca atualizada pra: ${profData?.[0]?.current_bankroll}`)
  } else {
    console.log('[adminResetCurrentMonth] ⚠️ SEM META ATIVA — a banca NÃO foi resetada (não há initial_bankroll de referência)')
  }

  // Revalida TODAS as telas que a pessoa (ou você, testando na sua própria
  // conta) pode estar olhando — sem isso, elas continuavam mostrando o
  // valor antigo em cache até uma navegação forçar a atualização.
  revalidatePath('/admin')
  revalidatePath('/admin/[userId]', 'page')
  revalidatePath('/dashboard')
  revalidatePath('/goals')
  revalidatePath('/sessions')
  revalidatePath('/wallet')
}

/**
 * Busca tudo de um usuário específico — pra tela de evolução individual
 * (mentoria). Sessões do ciclo atual + meses já fechados, juntos numa
 * linha do tempo pra ver a evolução completa.
 */
export async function getUserDetail(userId: string) {
  await assertIsAdmin()
  const admin = createAdminClient()

  const [{ data: profile }, { data: goal }, { data: sessions }, { data: history }, { data: transactions }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).single(),
    admin.from('goals').select('*').eq('user_id', userId).eq('is_active', true).maybeSingle(),
    admin.from('sessions').select('*').eq('user_id', userId).order('date', { ascending: true }),
    admin.from('monthly_history').select('*').eq('user_id', userId).order('year', { ascending: true }).order('month', { ascending: true }),
    admin.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: true }),
  ])

  return { profile, goal, sessions: sessions ?? [], history: history ?? [], transactions: transactions ?? [] }
}
