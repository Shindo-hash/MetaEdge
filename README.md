# MetaEdge PRO

Plataforma de gestão de banca para traders e apostadores esportivos. Registre sessões, configure metas com estratégia fixa ou juros compostos, acompanhe sua evolução em gráficos e controle depósitos e saques na carteira.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Backend / Auth | Supabase (Postgres + Row Level Security) |
| Gráficos | Chart.js + react-chartjs-2 |
| Ícones | Lucide React |
| Linguagem | TypeScript |

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **npm** 9+ (ou pnpm / yarn)
- Conta no [Supabase](https://supabase.com) (plano free suficiente)

---

## 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd MetaEdger-PRO
```

---

## 2. Instalar dependências

```bash
npm install
```

---

## 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na **raiz do projeto** (mesmo nível do `package.json`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Onde encontrar esses valores

1. Acesse [supabase.com](https://supabase.com) e abra seu projeto
2. Vá em **Project Settings → API**
3. Copie a **Project URL** → cole em `NEXT_PUBLIC_SUPABASE_URL`
4. Copie a chave **anon / public** → cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> O arquivo `.env.local` já está no `.gitignore` — nunca suba suas chaves para o repositório.

---

## 4. Configurar o banco de dados (Supabase)

Execute os SQLs abaixo **na ordem** no SQL Editor do Supabase:  
`Dashboard → SQL Editor → New query`

### 4.1 Schema principal

Cole o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e execute.

Esse script cria:
- `profiles` — dados do usuário + banca atual
- `goals` — metas ativas (estratégia fixa ou juros compostos)
- `sessions` — histórico de sessões de trading
- `daily_progress` — cache de progresso diário
- Trigger automático que cria o perfil ao registrar um novo usuário
- Row Level Security em todas as tabelas

### 4.2 Tabela de transações

Cole o conteúdo de [`supabase/add_transactions.sql`](./supabase/add_transactions.sql) e execute.

Esse script cria:
- `transactions` — depósitos e saques da carteira

---

## 5. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Servir o build de produção |

---

## Estrutura do projeto

```
MetaEdger-PRO/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx       # Página de login
│   │   └── register/page.tsx    # Página de cadastro
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Layout com Sidebar + Header
│   │   ├── dashboard/page.tsx   # Visão geral (banca, metas, gráficos)
│   │   ├── sessions/page.tsx    # Registro e histórico de sessões
│   │   ├── goals/page.tsx       # Configuração de metas
│   │   └── wallet/page.tsx      # Carteira (depósitos, saques, extrato)
│   ├── globals.css              # Design system (tokens, utilitários)
│   └── layout.tsx               # Root layout
├── components/
│   ├── auth/AuthForm.tsx
│   ├── dashboard/
│   │   ├── DailyChart.tsx
│   │   ├── MonthlyChart.tsx
│   │   ├── StatsCard.tsx
│   │   └── GoalStatus.tsx
│   ├── goals/GoalForm.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── sessions/SessionForm.tsx
│   └── wallet/
│       ├── TransactionForm.tsx
│       ├── WalletStatement.tsx  # Extrato para impressão
│       └── PrintButton.tsx
├── lib/
│   ├── goals.ts                 # Lógica de cálculo de metas
│   ├── utils.ts                 # Formatação de moeda, data, cn()
│   └── supabase/
│       ├── client.ts            # Client-side Supabase
│       └── server.ts            # Server-side Supabase
├── supabase/
│   ├── schema.sql               # Schema principal
│   └── add_transactions.sql     # Tabela de transações
├── types/index.ts               # Tipos TypeScript globais
├── .env.local                   # ← VOCÊ CRIA ESTE ARQUIVO (não sobe no git)
└── package.json
```

---

## Funcionalidades

### Dashboard
- Banca atual, lucro total, taxa de assertividade e total de sessões
- Meta diária/semanal/mensal calculada automaticamente
- Gráfico de evolução da banca (últimos 14 dias)
- Gráfico de lucro mensal (últimos 6 meses)
- Últimas 5 sessões com resultado (WIN / LOSS / PARCIAL)

### Sessões
- Registro de sessão com data, horário de início/fim, banca inicial e final
- Cálculo automático do resultado (profit e classificação)
- Histórico completo de todas as sessões

### Metas
- **Estratégia Fixa** — divide o lucro alvo pelo número de semanas
- **Juros Compostos** — crescimento exponencial com percentual diário sobre a banca atual
- Opção de incluir ou excluir fins de semana no cálculo
- Exibição da meta ativa com projeções diária, semanal e mensal

### Carteira
- Registro de depósitos e saques
- Preview do novo saldo antes de confirmar
- Histórico agrupado por mês
- Extrato imprimível (PDF via impressão do navegador)

---

## Deploy (Vercel)

1. Faça push do projeto para um repositório GitHub
2. Importe no [Vercel](https://vercel.com/new)
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Observações de segurança

- A chave `anon` do Supabase é pública por design — a segurança real é garantida pelo **Row Level Security** habilitado em todas as tabelas
- Cada usuário só acessa seus próprios dados (`auth.uid() = user_id`)
- Nunca use a chave `service_role` no frontend

---

## Licença

Projeto privado. Todos os direitos reservados.
