

## Diagnóstico

1. **Dashboard sem CTA de upgrade**: Quando cotas esgotam, os cards ficam desabilitados com "Sem cotas disponíveis" mas sem nenhum botão ou link para comprar mais cotas ou fazer upgrade.

2. **Dropdown sem link para Planos**: O menu do avatar no header (AppShell) não tem opção "Planos" ou "Plano & Cobrança".

3. **Botões de plano desabilitados na aba Billing**: Todos os produtos (`prod_starter`, `prod_pro`, `prod_enterprise`) têm `stripe_payment_link = NULL` no banco. O código atual renderiza botão disabled quando não há link. Mesmo sem Stripe configurado, os botões devem levar o usuário a algum lugar (ex: contato ou página de planos).

## Plano de Correção

### 1. Banner de upgrade no Dashboard quando cotas esgotam
**Arquivo:** `src/pages/Dashboard.tsx`

- Quando `noQuota === true`, renderizar um banner/card acima dos mode cards com:
  - Mensagem: "Suas cotas acabaram! Faça upgrade ou adquira cotas avulsas para continuar."
  - Botão "Ver planos" → navega para `/profile?tab=billing`
  - Botão secundário "Comprar cotas avulsas" (se aplicável)
- Nos mode cards desabilitados, mudar o texto de "Sem cotas disponíveis" para um link clicável "Adquirir cotas →" que navega para `/profile?tab=billing`

### 2. Link "Planos" no Dropdown do perfil
**Arquivo:** `src/components/layout/AppShell.tsx`

- Adicionar item "Plano & Cobrança" no dropdown, com ícone `CreditCard`, navegando para `/profile?tab=billing`
- Posicionar entre "Configurações" e "Sair"

### 3. Corrigir botões de plano na aba Billing
**Arquivo:** `src/pages/ProfilePage.tsx`

- Quando `stripe_payment_link` é null mas o plano NÃO é o atual, renderizar botão ativo (não disabled) que:
  - Abre link de contato (WhatsApp/email) ou
  - Mostra toast informando que o link de pagamento será configurado em breve
- Melhor abordagem: renderizar como botão ativo com o `cta_label` e ao clicar navegar para contato ou mostrar mensagem
- Texto do botão disabled muda de genérico para "Em breve" ou abre modal de contato

### 4. QuotaCard com CTA quando esgotado
**Arquivo:** `src/components/dashboard/QuotaCard.tsx`

- Quando `totalRemaining <= 0`, adicionar botão "Fazer upgrade" abaixo das informações de cotas, navegando para `/profile?tab=billing`

### Detalhes técnicos

- Nenhuma mudança no banco necessária neste momento
- Quando os `stripe_payment_link` forem preenchidos no admin, os botões passarão a redirecionar automaticamente para o Stripe
- Enquanto não há link, o CTA leva para contato/WhatsApp como fallback funcional

