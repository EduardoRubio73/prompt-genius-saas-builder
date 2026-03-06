

## Plano: Página /indicacoes com lógica de referral

### Resumo
Criar uma página dedicada `/indicacoes` que verifica o plano da org e exibe o fluxo de referral adequado. Também interceptar `?ref=CODE` no login para processar o convite.

### 1. Nova página `src/pages/ReferralPage.tsx`

- Usar `AppShell` como wrapper (mesmo padrão das outras páginas)
- Buscar `profile` e `org` do usuário logado (via `profiles.personal_org_id` → `organizations.plan_tier`)
- **Se plano = free:**
  - Mensagem: "Convites com bônus são liberados após ativação de um plano."
  - Botão "Compartilhar plataforma" (copia URL base sem código)
- **Se plano pago:**
  - Chamar `supabase.rpc("generate_referral_code", { p_org_id, p_user_id })` 
  - Exibir o código retornado e link `https://genius-engineer.lovable.app/?ref=CODE`
  - Botão "Copiar link"
  - Exibir lista de indicações do usuário (`referrals` table)
  - Exibir bônus acumulado (`organizations.bonus_credits_total - bonus_credits_used`)

### 2. Rota em `src/App.tsx`

Adicionar:
```tsx
<Route path="/indicacoes" element={<AuthGuard><ReferralPage /></AuthGuard>} />
```

### 3. Processar `?ref=CODE` no Login (`src/pages/Login.tsx`)

Após login bem-sucedido (e conta ativa), verificar `URLSearchParams` para `ref`:
- Se presente, chamar `supabase.rpc("process_referral", { p_code, p_invitee_org, p_invitee_user })`
- Tratar retornos: `invalid_code`, `own_code`, `already_used` (toast de erro), `ok_trial` (toast de sucesso com mensagem "Convite registrado. O bônus será liberado após ativação de plano pago.")
- Limpar o param `ref` da URL após processamento

### 4. Link no menu/AppShell

Adicionar item "Indicações" no dropdown do usuário no `AppShell` com ícone `Gift`.

| Arquivo | Ação |
|---------|------|
| `src/pages/ReferralPage.tsx` | Criar página completa |
| `src/App.tsx` | Adicionar rota `/indicacoes` |
| `src/pages/Login.tsx` | Processar `?ref=CODE` após login |
| `src/components/layout/AppShell.tsx` | Adicionar link "Indicações" no dropdown |

