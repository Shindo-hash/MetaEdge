'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Sessões', href: '/sessions' },
  { label: 'Metas', href: '/goals' },
  { label: 'Carteira', href: '/wallet' },
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
    <header className="md:hidden bg-[#0d1b2a] border-b border-[#00ff88]/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00b4d8] bg-clip-text text-transparent">
          MetaEdge
        </h1>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-gray-400 p-2 rounded-lg hover:bg-white/5"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      {menuOpen && (
        <nav className="mt-3 space-y-1 border-t border-[#00ff88]/10 pt-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'block px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                pathname === item.href
                  ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="px-3 py-2 text-xs text-gray-500">
            Logado como <span className="text-white">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/5 transition-all"
          >
            Sair
          </button>
        </nav>
      )}
    </header>
  )
}
