# Prompt Genius — SaaS Builder

**Plataforma SaaS de geração e refinamento de prompts com IA**, construída com React + Supabase. Oferece três modos de operação (Prompt, SaaS Spec, Misto), painel administrativo completo, sistema de créditos/billing e memória de prompts.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tech Stack](#tech-stack)
- [Arquitetura](#arquitetura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Banco de Dados (Supabase)](#banco-de-dados-supabase)
- [Edge Functions](#edge-functions)
- [Rotas da Aplicação](#rotas-da-aplicação)
- [Painel Administrativo](#painel-administrativo)
- [Sistema de Créditos e Billing](#sistema-de-créditos-e-billing)
- [Design System](#design-system)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Deploy](#deploy)

---

## Visão Geral

O **Prompt Genius** é uma plataforma que ajuda usuários a criar prompts otimizados para diversas plataformas de IA (Lovable, ChatGPT, Claude, Gemini, Cursor, V0). Possui três modos:

| Modo | Descrição |
|------|-----------|
| **Prompt** (`/prompt`) | Geração rápida de prompts a partir de campos estruturados |
| **SaaS Spec** (`/saas-spec`) | Wizard de 7 etapas para gerar especificações completas de SaaS |
| **Misto** (`/misto`) | Combina prompt + spec com refinamento iterativo via IA |

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5 |
| **Estilização** | Tailwind CSS 3 + shadcn/ui |
| **Componentes UI** | Radix UI primitives |
| **State/Data** | TanStack React Query v5 |
| **Formulários** | React Hook Form + Zod |
| **Roteamento** | React Router DOM v6 |
| **Gráficos** | Recharts |
| **Backend** | Supabase (Auth, Database, Edge Functions, RLS) |
| **Ícones** | Lucide React |
| **Animações** | tailwindcss-animate |
| **Testes** | Vitest + Testing Library |

---

## Arquitetura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │────▶│   React SPA      │────▶│   Supabase      │
│   (Client)   │     │   (Vite + TS)    │     │   (PostgreSQL)  │
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │                        │
                           │                        ├── Auth (JWT)
                           │                        ├── RLS Policies
                           ▼                        ├── Views (admin_*)
                    ┌──────────────┐                ├── Functions (RPC)
                    │ Edge Function│                └── Edge Functions
                    │ refine-prompt│
                    └──────────────┘
```

### Fluxo de autenticação
1. Usuário acessa `/login` → Supabase Auth (email/password)
2. `AuthGuard` protege rotas autenticadas
3. `SuperAdminGuard` protege rotas `/admin/*` (via `is_super_admin()` RPC)
4. Perfil criado automaticamente na tabela `profiles` via trigger

---

## Estrutura de Pastas

```
src/
├── assets/                  # Imagens (logo, landing)
├── components/
│   ├── admin/               # Badges, componentes admin compartilhados
│   ├── auth/                # AuthGuard
│   ├── dashboard/           # ModeCard, UsageBar
│   ├── guards/              # SuperAdminGuard
│   ├── layout/              # AppShell (sidebar principal)
│   ├── misto/               # CreditModal, MistoInput, Results, Stepper...
│   ├── prompt/              # PromptInput
│   ├── saas/                # SaasStep1–7, SaasStepper
│   └── ui/                  # shadcn/ui components (50+)
├── hooks/
│   ├── admin/               # useAdminData, useAdminOverview
│   ├── useAuth.ts           # Autenticação
│   ├── useProfile.ts        # Perfil do usuário
│   ├── useOrgStats.ts       # Estatísticas da organização
│   ├── useUnifiedMemory.ts  # Memória unificada (prompts + specs)
│   └── useTheme.ts          # Tema claro/escuro
├── integrations/supabase/
│   ├── client.ts            # Instância do Supabase client
│   └── types.ts             # Tipos gerados automaticamente (read-only)
├── lib/
│   ├── prompt-builder.ts    # Construtor de prompts
│   └── utils.ts             # cn() e utilitários
├── pages/
│   ├── admin/               # AdminLayout, Overview, Users, Prompts, Billing, AIConfig, AuditLogs, Flags
│   ├── landing/             # LandingPage + landing.css
│   ├── misto/               # MistoMode + misto.css
│   ├── prompt/              # PromptMode
│   ├── saas/                # SaasMode
│   ├── Dashboard.tsx        # Dashboard principal
│   ├── Login.tsx            # Página de login
│   ├── HistoryPage.tsx      # Histórico de sessões
│   ├── MemoryPage.tsx       # Memória de prompts
│   └── ProfilePage.tsx      # Perfil do usuário
├── test/                    # Setup e testes
└── main.tsx                 # Entry point

supabase/
├── config.toml              # project_id + config de functions
├── functions/
│   └── refine-prompt/       # Edge function para refinamento de prompts
└── migrations/              # Migrações SQL (read-only)

docs/
└── ADMIN_ANALISE_MELHORIAS.md  # Documento de melhorias do admin
```

---

## Configuração do Ambiente

### Pré-requisitos
- Node.js 18+ (recomendado: usar [nvm](https://github.com/nvm-sh/nvm))
- Conta Supabase configurada

### Instalação

```bash
# 1. Clonar o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais
```

### Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon/pública do Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase |

---

## Banco de Dados (Supabase)

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário (vinculados ao auth.users) |
| `organizations` | Organizações com plano, créditos e configurações |
| `org_members` | Membros da organização (roles: owner, admin, member, viewer) |
| `sessions` | Sessões de uso (mode: prompt, saas, misto) |
| `prompt_memory` | Prompts gerados com metadados (rating, tags, destino) |
| `saas_specs` | Especificações SaaS geradas |
| `billing_subscriptions` | Assinaturas Stripe |
| `billing_invoices` | Faturas |
| `billing_token_usage` | Uso de tokens por período |
| `credit_packs` | Pacotes de créditos disponíveis |
| `credit_purchases` | Compras de créditos |
| `credit_transactions` | Transações de créditos (compra, referral, bonus) |
| `referral_codes` | Códigos de indicação |
| `referrals` | Indicações realizadas |
| `audit_logs` | Logs de auditoria |

### Tabelas Admin

| Tabela | Descrição |
|--------|-----------|
| `admin_api_credentials` | Chaves de API (OpenAI, etc.) |
| `admin_feature_flags` | Feature flags com rollout percentual |
| `admin_model_configs` | Configurações de modelos de IA |
| `admin_settings` | Configurações gerais (key/value) |
| `platform_configs` | Configurações por plataforma destino |

### Views (Admin)

| View | Descrição |
|------|-----------|
| `admin_users_overview` | Visão consolidada de usuários + org + uso |
| `admin_billing_overview` | Visão consolidada de billing |
| `admin_prompts_overview` | Visão consolidada de prompts |
| `admin_saas_specs_overview` | Visão consolidada de specs |

### RPCs (Funções do Banco)

| Função | Descrição |
|--------|-----------|
| `is_super_admin()` | Verifica se o usuário é super admin |
| `is_org_admin(p_org_id)` | Verifica se é admin da org |
| `get_user_org_ids()` | Retorna IDs das orgs do usuário |
| `get_credit_balance(p_org_id)` | Saldo de créditos da org |
| `consume_credit(...)` | Consome 1 crédito |
| `get_org_stats(p_org_id)` | Estatísticas da org |
| `get_token_budget(p_org_id)` | Budget de tokens |
| `admin_get_kpis()` | KPIs do admin |
| `admin_get_user_growth(p_days)` | Crescimento de usuários |
| `admin_get_token_usage_series(p_days)` | Série de uso de tokens |
| `generate_referral_code(...)` | Gera código de indicação |
| `process_referral(...)` | Processa indicação |
| `process_credit_purchase(...)` | Processa compra de créditos |
| `reset_monthly_credits(p_org_id)` | Reset mensal de créditos |

### Enums

| Enum | Valores |
|------|---------|
| `plan_tier` | free, starter, pro, enterprise |
| `account_status` | active, trial, trial_expired, suspended, churned |
| `session_mode` | prompt, saas, misto |
| `member_role` | owner, admin, member, viewer |
| `destination_platform` | lovable, chatgpt, claude, gemini, cursor, v0, outro |
| `subscription_status` | trialing, active, incomplete, incomplete_expired, past_due, canceled, unpaid, paused |
| `credit_origin` | purchase, referral_gave, referral_got, bonus, plan_reset |
| `credit_pack_size` | pack_5, pack_15, pack_40 |
| `referral_status` | pending, completed, rewarded, expired |

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado:
- **Dados do usuário**: `profiles` → somente o próprio usuário
- **Dados da org**: `sessions`, `prompt_memory`, `saas_specs` → membros da org (`get_user_org_ids()`)
- **Dados admin**: `admin_*` → somente super admins (`is_super_admin()`)
- **Dados públicos**: `billing_products`, `billing_prices`, `platform_configs`, `credit_packs` → leitura pública

---

## Edge Functions

### `refine-prompt`
- **Localização**: `supabase/functions/refine-prompt/index.ts`
- **JWT**: Desabilitado (`verify_jwt = false`)
- **Função**: Refinamento iterativo de prompts via IA

---

## Rotas da Aplicação

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/` | LandingPage | Público |
| `/login` | Login | Público |
| `/dashboard` | Dashboard | Autenticado |
| `/prompt` | PromptMode | Autenticado |
| `/saas-spec` | SaasMode | Autenticado |
| `/misto` | MistoMode | Autenticado |
| `/mixed` | MistoMode (alias) | Autenticado |
| `/memory` | MemoryPage | Autenticado |
| `/history` | HistoryPage | Autenticado |
| `/profile` | ProfilePage | Autenticado |
| `/admin` | AdminOverview | Super Admin |
| `/admin/users` | AdminUsers | Super Admin |
| `/admin/prompts` | AdminPrompts | Super Admin |
| `/admin/billing` | AdminBilling | Super Admin |
| `/admin/ai-config` | AdminAIConfig | Super Admin |
| `/admin/logs` | AdminAuditLogs | Super Admin |
| `/admin/flags` | AdminFlags | Super Admin |

---

## Painel Administrativo

O painel admin (`/admin/*`) é protegido por `SuperAdminGuard` e inclui:

- **Overview**: KPIs (MRR, usuários, tokens), gráfico de sessões 7 dias, crescimento
- **Usuários**: Lista com busca, filtros por plano, paginação, badges de status
- **Prompts**: Lista com busca, exportação CSV, filtros por especialidade
- **Billing**: Tabs para assinaturas e faturas, badges de status
- **AI Config**: Configuração de modelos, credenciais de API, settings
- **Audit Logs**: Logs de auditoria com filtros e paginação
- **Feature Flags**: Toggles com rollout percentual

### Funcionalidades Admin
- Sidebar colapsável
- Busca global (⌘K / Ctrl+K)
- Breadcrumbs de navegação
- Exportação CSV de prompts

---

## Sistema de Créditos e Billing

### Fluxo de Créditos
1. Organização recebe créditos do plano (`plan_credits_total`)
2. Créditos de bônus via referral ou promoção (`bonus_credits_total`)
3. Cada uso consome 1 crédito via `consume_credit()` RPC
4. Reset mensal automático dos créditos do plano

### Planos

| Plano | Créditos/mês | Membros | Token Limit |
|-------|-------------|---------|-------------|
| Free | 5 | 1 | 10.000 |
| Starter | Configurável | Configurável | Configurável |
| Pro | Configurável | Configurável | Configurável |
| Enterprise | Configurável | Configurável | Configurável |

### Pacotes de Créditos Avulsos
- `pack_5`: 5 créditos
- `pack_15`: 15 créditos
- `pack_40`: 40 créditos

### Programa de Indicação
- Gera código via `generate_referral_code()`
- Processa via `process_referral()`
- Créditos para quem indica e para o convidado (padrão: 5 cada)
- Expiração: 30 dias

---

## Design System

### Tokens CSS (HSL)

| Token | Light | Dark |
|-------|-------|------|
| `--background` | `40 14% 95%` | `240 15% 8%` |
| `--primary` | `254 96% 67%` | `254 96% 67%` |
| `--secondary` | `160 100% 45%` | `160 100% 45%` |
| `--accent` | `220 80% 56%` | `220 80% 56%` |
| `--destructive` | `0 84% 60%` | `0 84% 60%` |

### Fontes
- Heading: **Plus Jakarta Sans**
- Body: **Plus Jakarta Sans**

### Componentes shadcn/ui
50+ componentes instalados: Accordion, Alert, Avatar, Badge, Button, Card, Carousel, Checkbox, Command, Dialog, Drawer, Dropdown, Form, Input, Label, Popover, Progress, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Switch, Table, Tabs, Textarea, Toast, Toggle, Tooltip, etc.

---

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento (Vite)

# Build
npm run build        # Build de produção
npm run build:dev    # Build de desenvolvimento

# Qualidade
npm run lint         # ESLint
npm run test         # Testes (Vitest)
npm run test:watch   # Testes em watch mode

# Preview
npm run preview      # Preview do build
```

---

## Deploy

### Via Lovable
1. Acesse o [projeto no Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)
2. Clique em **Share → Publish**

### URL de produção
- **Preview**: https://id-preview--a349e170-2ef1-486c-bc2e-d28d993a9d0d.lovable.app
- **Publicado**: https://prompt-genius-saas-builder.lovable.app

### Domínio Customizado
Navegue para **Project > Settings > Domains > Connect Domain**

---

## Licença

Projeto privado. Todos os direitos reservados.
