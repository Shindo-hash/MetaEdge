import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/supabase/admin'
import { listAllUsers } from '@/lib/actions/admin'
import AdminUsersList from '@/components/admin/AdminUsersList'
import { ShieldCheck, Users, Target, ClipboardList } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (user.email ?? '').trim().toLowerCase()
  if (!ADMIN_EMAIL || email !== ADMIN_EMAIL) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p className="text-red-400 font-semibold mb-2">Acesso restrito</p>
        <p className="text-sm text-white/40">Essa área é só para o administrador.</p>
      </div>
    )
  }

  const { users, stats, error } = await listAllUsers()

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 animate-fade-in">
        <div className="p-4 bg-accent-green/10 rounded-2xl border border-accent-green/20 neon-glow-green">
          <ShieldCheck className="text-accent-green" size={30} />
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight">Painel de Administração</h2>
          <p className="text-white/40 text-base mt-1.5">Suporte e visão geral de todos os usuários</p>
        </div>
      </div>

      {error && (
        <div className="glass-card p-5 border-red-400/30 bg-red-400/5">
          <p className="text-sm text-red-400 font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in">
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <Users size={16} className="text-accent-green" />
            <p className="text-sm uppercase tracking-widest text-white/40 font-bold">Total de Usuários</p>
          </div>
          <p className="text-4xl font-black text-white">{stats.total_users}</p>
        </div>
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <Target size={16} className="text-accent-blue" />
            <p className="text-sm uppercase tracking-widest text-white/40 font-bold">Com Meta Ativa</p>
          </div>
          <p className="text-4xl font-black text-white">{stats.users_with_active_goal}</p>
        </div>
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <ClipboardList size={16} className="text-white/50" />
            <p className="text-sm uppercase tracking-widest text-white/40 font-bold">Sessões Registradas</p>
          </div>
          <p className="text-4xl font-black text-white">{stats.total_sessions}</p>
        </div>
      </div>

      <AdminUsersList users={users} />
    </div>
  )
}
