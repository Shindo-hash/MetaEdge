'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  ClipboardList, 
  Target, 
  Wallet, 
  LogOut,
  ChevronRight,
  TrendingUp
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Sessões',
    href: '/sessions',
    icon: ClipboardList,
  },
  {
    label: 'Metas',
    href: '/goals',
    icon: Target,
  },
  {
    label: 'Carteira',
    href: '/wallet',
    icon: Wallet,
  },
]

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#0a0f1e] border-r border-white/5 px-4 py-8 sticky top-0">
      <div className="mb-12 px-2 flex items-center gap-3">
        <div className="w-10 h-10 relative bg-gradient-to-br from-accent-green/20 to-accent-blue/20 rounded-xl p-2 border border-white/10 neon-glow-green">
           <Image src="/favicon.png" alt="MetaEdge" fill className="p-1.5 object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent tracking-tighter leading-none">
            MetaEdge
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">Gestão de Banca PRO</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
           const Icon = item.icon
           const isActive = pathname === item.href
           
           return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-premium border',
                isActive
                  ? 'bg-accent-green/5 text-accent-green border-accent-green/20 shadow-[0_4px_20px_-10px_rgba(0,255,136,0.3)] neon-glow-green'
                  : 'text-white/40 border-transparent hover:text-white/90 hover:bg-white/5'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform group-hover:scale-110", isActive ? "text-accent-green" : "text-white/30")} />
                {item.label}
              </div>
              {isActive && <ChevronRight size={14} className="text-accent-green/50" />}
            </Link>
           )
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-green/20 to-accent-blue/20 flex items-center justify-center border border-white/10">
               <span className="text-lg font-bold text-accent-green">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex flex-col min-w-0">
               <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Logado em</span>
               <span className="text-sm font-bold text-white truncate leading-tight">{userName}</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-premium border border-transparent hover:border-red-400/20"
          >
            <LogOut size={14} />
            Encerrar Sessão
          </button>
        </div>
      </div>
    </aside>
  )
}
