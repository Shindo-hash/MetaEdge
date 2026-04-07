import Link from 'next/link'
import AuthForm from '@/components/auth/AuthForm'
import Image from 'next/image'
import AuthLeftPanel from '@/components/auth/AuthLeftPanel'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-[hsl(222,47%,6%)]">

      {/* ── Orbs de fundo ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute w-[700px] h-[700px] rounded-full bg-[#00ff88] opacity-[0.07] blur-[120px] animate-float-orb"
          style={{ top: '-15%', left: '-10%' }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-[#00b4d8] opacity-[0.07] blur-[120px] animate-float-orb"
          style={{ bottom: '-15%', right: '-10%', animationDelay: '4s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* ════════ PAINEL ESQUERDO (desktop) ════════ */}
      <AuthLeftPanel
        badge="Comece agora — é grátis"
        headline="Cresça sua"
        subheadline={"banca com\ninteligência."}
        description="Crie sua conta em segundos e tenha controle total sobre sua performance financeira."
      />

      {/* ════════ PAINEL DIREITO (formulário) ════════ */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">

        <div className="hidden lg:block absolute left-0 top-16 bottom-16 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

        <div className="w-full max-w-lg animate-fade-in-scale">

          {/* Logo mobile */}
          <div className="flex lg:hidden flex-col items-center mb-10">
            <div className="w-16 h-16 relative rounded-2xl bg-gradient-to-br from-accent-green/20 to-accent-blue/20 border border-white/10 neon-glow-green mb-4">
              <Image src="/favicon.png" alt="MetaEdge" fill className="object-contain p-3" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent tracking-tighter">
              MetaEdge
            </h1>
            <p className="text-white/40 text-sm mt-1">Gestão inteligente de banca</p>
          </div>

          <div className="glass-card p-10 border-white/8 shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/8 border border-accent-green/20 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-green">Cadastro Gratuito</span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Criar sua conta</h2>
            <p className="text-white/40 mb-8">Sem cartão de crédito. Sem compromisso.</p>

            <AuthForm mode="register" />

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <p className="text-sm text-white/35">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-accent-green font-semibold hover:underline underline-offset-4 transition-premium">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
