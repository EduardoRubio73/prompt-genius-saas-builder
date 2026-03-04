

## Plano: Compra de Créditos Extras

### Visão geral

Criar a Edge Function `create-topup-checkout` e adicionar uma seção de compra de créditos extras na aba Billing do ProfilePage. Os packs serão buscados da tabela `credit_packs` (já existente). Também criar uma página de sucesso `/billing/success`.

### 1. Edge Function `create-topup-checkout`

Criar `supabase/functions/create-topup-checkout/index.ts`:
- Baseada na `create-checkout-session` existente, mas com `mode: "payment"` (não subscription)
- Recebe `{ price_id, org_id }` onde `price_id` = `credit_packs.stripe_price_id` mapeado via `billing_prices.id`
- Autentica usuário, valida membership na org
- Cria/reutiliza Stripe customer
- Cria Checkout Session com `mode: "payment"`
- Metadata: `{ org_id, user_id, pack_id, type: "topup" }`
- Retorna `{ url }`

Porém, o user pediu para usar `billing_prices.id` no frontend. Os packs estão na tabela `credit_packs` com `stripe_price_id`. A Edge Function precisa:
1. Receber `pack_id` (uuid da tabela `credit_packs`)
2. Buscar o pack para obter `stripe_price_id`, `credits`, `price_brl`
3. Criar checkout session com `mode: "payment"`

Alternativamente, seguir o modelo do user que usa `price_id` genérico. Vou usar `pack_id` da tabela `credit_packs` para simplicidade.

### 2. Seção na BillingTab (`src/pages/ProfilePage.tsx`)

Adicionar abaixo da seção "Planos disponíveis":
- Título: "Comprar Créditos Extras"
- Subtítulo explicativo
- Query para buscar `credit_packs` ativos, ordenados por `credits`
- 3 cards com: créditos, preço, botão "Comprar"
- Botão chama `callEdgeFunction("create-topup-checkout", { pack_id, org_id })` e redireciona para `data.url`

### 3. Página `/billing/success`

Criar `src/pages/BillingSuccess.tsx`:
- Mensagem simples de sucesso
- Link para voltar ao dashboard
- Registrar rota em `App.tsx` (protegida por AuthGuard)

### 4. Rota em `App.tsx`

Adicionar `<Route path="/billing/success" element={<AuthGuard><BillingSuccess /></AuthGuard>} />`

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/create-topup-checkout/index.ts` | Criar — Edge Function para checkout de créditos extras |
| `src/pages/ProfilePage.tsx` | Editar — Adicionar seção de créditos extras na BillingTab |
| `src/pages/BillingSuccess.tsx` | Criar — Página de sucesso pós-pagamento |
| `src/App.tsx` | Editar — Adicionar rota `/billing/success` |

