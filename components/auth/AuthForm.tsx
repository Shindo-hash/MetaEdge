'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'register'

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    if (mode === 'register') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name,
          email,
          current_bankroll: 0,
        })
      }
      router.push('/dashboard')
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {mode === 'register' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Seu nome"
            className="w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/60 transition-colors"
          />
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="seu@email.com"
          className="w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/60 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          minLength={6}
          className="w-full bg-[#0a1628] border border-[#00ff88]/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/60 transition-colors"
        />
      </div>
      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg font-semibold text-[#0a0f1e] bg-gradient-to-r from-[#00ff88] to-[#00b4d8] shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
      </button>
    </form>
  )
}
