import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/supabase/admin'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import ToasterProvider from '@/components/ToasterProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const userName = profile?.name ?? user.email ?? 'Usuário'
  const loginEmail = (user.email ?? '').trim().toLowerCase()
  const isAdmin = !!ADMIN_EMAIL && loginEmail === ADMIN_EMAIL

  // Log temporário de diagnóstico — não expõe a chave real, só confirma se
  // bateu ou não e o tamanho de cada string (ajuda a achar espaço/caractere
  // invisível sem mostrar o valor sensível nos logs do Vercel).
  console.log(`[admin-check] login="${loginEmail}" (${loginEmail.length} chars) | ADMIN_EMAIL configurado=${!!ADMIN_EMAIL} (${ADMIN_EMAIL.length} chars) | bateu=${isAdmin}`)

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      <Sidebar userName={userName} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userName={userName} />
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          {children}
        </main>
        <ToasterProvider />
      </div>
    </div>
  )
}
