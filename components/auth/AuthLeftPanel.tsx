import Image from 'next/image'
import { TrendingUp, ShieldCheck, Target } from 'lucide-react'

type Props = {
  badge: string
  headline: string
  subheadline: string
  description: string
}

const features = [
  {
    icon: Target,
    label: 'Metas inteligentes',
    desc: 'Estratégia fixa ou juros compostos com projeções automáticas',
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
  },
  {
    icon: TrendingUp,
    label: 'Acompanhe sua curva',
    desc: 'Gráficos diários e mensais atualizados a cada sessão',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  {
    icon: ShieldCheck,
    label: 'Dados seguros',
    desc: 'Criptografia de ponta com Row Level Security no Supabase',
    color: 'text-white/50',
    bg: 'bg-white/5',
  },
]

export default function AuthLeftPanel({ badge, headline, subheadline, description }: Props) {
  return (
    <div className="hidden lg:flex flex-col w-[52%] min-h-screen relative z-10 px-20 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 relative rounded-xl bg-gradient-to-br from-accent-green/20 to-accent-blue/20 border border-white/10 neon-glow-green flex-shrink-0">
          <Image src="/favicon.png" alt="MetaEdge" fill className="object-contain p-2" />
        </div>
        <div>
          <span className="text-xl font-bold bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent tracking-tighter">
            MetaEdge
          </span>
          <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-white/25">PRO</span>
        </div>
      </div>

      {/* Conteúdo central */}
      <div className="flex-1 flex flex-col justify-center gap-14">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-accent-green/70 mb-5">{badge}</p>
          <h2 className="text-6xl font-black text-white leading-[1.05] tracking-tighter mb-6">
            {headline}<br />
            <span className="bg-gradient-to-r from-accent-green via-[#00e8a0] to-accent-blue bg-clip-text text-transparent">
              {subheadline}
            </span>
          </h2>
          <p className="text-white/40 text-lg leading-relaxed max-w-md">{description}</p>
        </div>

        <div className="space-y-6">
          {features.map(({ icon: Icon, label, desc, color, bg }) => (
            <div key={label} className="flex items-start gap-5">
              <div className={`w-11 h-11 rounded-xl ${bg} border border-white/6 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-base font-semibold text-white mb-1">{label}</p>
                <p className="text-sm text-white/35 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
        © {new Date().getFullYear()} MetaEdge PRO — Todos os direitos reservados
      </p>
    </div>
  )
}
