'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { 
  Menu, 
  X, 
  LogOut, 
  LayoutDashboard, 
  ClipboardList, 
  Target, 
  Wallet,
  Settings
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Sessões', href: '/sessions', icon: ClipboardList },
  { label: 'Metas', href: '/goals', icon: Target },
  { label: 'Carteira', href: '/wallet', icon: Wallet },
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
    <header className="md:hidden sticky top-0 z-50 glass-card rounded-none border-t-0 border-x-0 border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 relative">
             <Image src="/favicon.png" alt="MetaEdge" fill className="object-contain" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent tracking-tighter">
            MetaEdge
          </h1>
        </div>
        
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white/70 p-2 rounded-xl hover:bg-white/5 transition-premium active:scale-95"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mt-4 space-y-2 animate-fade-in pb-4">
          <div className="grid grid-cols-1 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-premium border',
                    isActive
                      ? 'bg-accent-green/10 text-accent-green border-accent-green/20 neon-glow-green'
                      : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
             <div className="flex items-center gap-3 px-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-green/20 to-accent-blue/20 flex items-center justify-center border border-white/10">
                   <span className="text-xs font-bold text-accent-green">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Logado como</span>
                  <span className="text-sm font-medium text-white">{userName}</span>
                </div>
             </div>

             <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-400/5 transition-premium"
            >
              <LogOut size={18} />
              Sair da Conta
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
