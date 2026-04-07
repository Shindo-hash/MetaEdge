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
  BookOpen,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',  href: '/dashboard', icon: LayoutDashboard },
  { label: 'Sessões',    href: '/sessions',  icon: ClipboardList },
  { label: 'Metas',      href: '/goals',     icon: Target },
  { label: 'Carteira',   href: '/wallet',    icon: Wallet },
  { label: 'Histórico',  href: '/historico', icon: BookOpen },
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
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-white/[0.06] px-5 py-8 sticky top-0 bg-[hsl(222,47%,6%)] flex-shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-4 px-2 mb-12">
        <div className="w-12 h-12 relative rounded-2xl bg-gradient-to-br from-accent-green/25 to-accent-blue/25 border border-white/12 neon-glow-green flex-shrink-0">
          <Image src="/favicon.png" alt="MetaEdge" fill className="object-contain p-2" />
        </div>
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent tracking-tighter leading-none">
            MetaEdge
          </h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-bold mt-1">PRO</p>
        </div>
      </div>

      {/* Nav label */}
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/20 font-bold px-4 mb-3">Menu</p>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-premium',
                isActive
                  ? 'bg-accent-green/10 text-accent-green'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-premium',
                  isActive ? 'bg-accent-green/15' : 'bg-white/5 group-hover:bg-white/8'
                )}>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-accent-green' : 'text-white/35 group-hover:text-white/60'}
                  />
                </div>
                <span className="text-[15px]">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-accent-green/50" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="mt-6 pt-6 border-t border-white/6">
        <div className="flex items-center gap-3.5 px-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-green/25 to-accent-blue/25 border border-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-black text-accent-green">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-white/30 font-bold leading-none mb-1">Conta</p>
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 hover:bg-red-400/6 transition-premium border border-transparent hover:border-red-400/15"
        >
          <LogOut size={14} />
          Encerrar Sessão
        </button>
      </div>
    </aside>
  )
}
