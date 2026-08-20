'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

type Mode = 'login' | 'register'

// Login aceita usuário simples (criado pelo painel do AlphaSignal) OU e-mail
// de verdade. Se não tiver "@", vira um e-mail disfarçado por trás — mesma
// lógica usada no AlphaSignal, pra login funcionar igual nos dois apps.
function toSupabaseIdentifier(input: string): string {
  const trimmed = input.trim()
  if (trimmed.includes('@')) return trimmed
  return `${trimmed.toLowerCase()}@alphasignal.local`
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    if (mode === 'register') {
      // Cadastro novo continua exigindo e-mail de verdade (não aceita
      // usuário disfarçado aqui — essa conversão é só pra LOGIN de contas
      // já criadas pelo painel do AlphaSignal).
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, name, email, current_bankroll: 0 })
      }
      router.push('/dashboard')
    } else {
      const identifier = toSupabaseIdentifier(email)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: identifier, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === 'register' && (
        <div>
          <label className="field-label">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Seu nome"
            className="field-input"
          />
        </div>
      )}

      <div>
        <label className="field-label">{mode === 'login' ? 'Email ou usuário' : 'Email'}</label>
        <input
          type={mode === 'login' ? 'text' : 'email'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={mode === 'login' ? 'seu@email.com ou seu usuário' : 'seu@email.com'}
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label">Senha</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            minLength={6}
            className="field-input pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-premium"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 text-red-400 text-sm bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-3">
          <span className="flex-shrink-0 mt-0.5">⚠</span>
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-2">
        {loading
          ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Aguarde...</span>
          : mode === 'login' ? 'Entrar na conta' : 'Criar conta'
        }
      </button>
    </form>
  )
}
