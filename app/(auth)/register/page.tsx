import Link from 'next/link'
import AuthForm from '@/components/auth/AuthForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00b4d8] bg-clip-text text-transparent mb-2">
            MetaEdge
          </h1>
          <p className="text-gray-400">Gestão inteligente de banca</p>
        </div>

        <div className="bg-[#0d1b2a] border border-[#00ff88]/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,255,136,0.05)]">
          <h2 className="text-xl font-semibold text-white mb-6">Criar sua conta</h2>
          <AuthForm mode="register" />
          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#00ff88] hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
