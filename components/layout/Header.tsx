'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Menu, X, LogOut, LayoutDashboard, ClipboardList, Target, Wallet } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Sessões',   href: '/sessions',  icon: ClipboardList },
  { label: 'Metas',     href: '/goals',     icon: Target },
  { label: 'Carteira',  href: '/wallet',    icon: Wallet },
]

export default function Header({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="md:hidden sticky top-0 z-50 border-b border-white/5 bg-[hsl(222,47%,6%)/90] backdrop-blur-xl px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 relative">
            <Image src="/favicon.png" alt="MetaEdge" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent tracking-tighter">
            MetaEdge
          </h1>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-premium active:scale-95"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mt-4 animate-fade-in pb-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-premium',
                    isActive
                      ? 'bg-accent-green/8 text-accent-green'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-green/20 to-accent-blue/20 border border-white/10 flex items-center justify-center">
                <span className="text-xs font-bold text-accent-green">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-white">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-premium"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
