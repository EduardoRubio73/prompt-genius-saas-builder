

## Plano: Redesign completo da página /indicacoes + ajuste no Login

### Alterações

#### 1. `src/pages/ReferralPage.tsx` -- Reescrever completamente

**Dados carregados:**
- `organizations`: `plan_tier`, `bonus_credits_total`, `bonus_credits_used`, `referral_rewards_paid`, `referral_first_bonus_paid`
- `generate_referral_code` RPC (retorna code ou `plan_required`)
- `referrals` table: filtrar por `referrer_user_id`, contar `status = 'rewarded'` para métricas

**Layout (plano pago):**

1. **Header card** -- "Programa de Indicações"
   - Descrição: "Convide outras empresas para usar a plataforma Genius."
   - Info sobre primeira indicação: +5 créditos para ambos
   - Info sobre a cada 10 confirmadas: +10 créditos extras

2. **Métricas** -- 3 mini cards lado a lado
   - Indicações confirmadas (count de `status === 'rewarded'`)
   - Próximo bônus (10 - (confirmed % 10) restantes)
   - Créditos ganhos (`bonus_credits_total`)

3. **Barra de progresso**
   - `progress = confirmed % 10`
   - Visual: `X / 10 indicações` com Progress component
   - Mensagem: "Faltam Y indicações para ganhar +10 créditos."

4. **Link de convite** -- card com code + botão Copiar link

5. **Lista de indicações** -- tabela com data e status (manter existente)

**Layout (free):**
- Mensagem + botão "Compartilhar plataforma" (já existe, manter)

**Toast de primeira indicação:**
- Ao carregar, se `referral_first_bonus_paid === true` e existir pelo menos 1 referral `rewarded`, verificar via `localStorage` se já mostrou o toast (`genius_first_referral_shown`). Se não, mostrar dialog/toast especial com mensagem de parabéns e marcar no localStorage.

#### 2. `src/pages/Login.tsx` -- Adicionar `limit_reached`

Adicionar tratamento para `limit_reached`:
```tsx
} else if (result === "limit_reached") {
  toast({ title: "Este código atingiu o limite de utilizações.", variant: "destructive" });
}
```

| Arquivo | Ação |
|---------|------|
| `src/pages/ReferralPage.tsx` | Reescrever com métricas, barra de progresso, card explicativo |
| `src/pages/Login.tsx` | Adicionar tratamento `limit_reached` |

