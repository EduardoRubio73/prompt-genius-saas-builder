

# Plano: Refazer página de Indicações + Webhook Config no Stripe Settings

## Tarefa 1: Refazer página de Indicações

Reescrever `src/pages/ReferralPage.tsx` seguindo o layout/design do arquivo `indicacoes.jsx` enviado, mas mantendo:
- Dados reais do Supabase (não mock)
- `AppShell` + `AccountSidebar` existentes
- Dialog de celebração da primeira indicação

**Estrutura da nova página:**
1. **Stats Row** (3 cards em grid): Indicações confirmadas, Próximo bônus (restantes), Créditos ganhos
2. **Progress Card**: Barra de progresso X/10 com gradiente roxo
3. **"Como funciona"** Card: 2 regras (primeira indicação + a cada 10), com estado `done`/`active`
4. **"Convite e ganhe"** Card: Link de convite + botão copiar + seção de bônus disponível
5. **"Suas indicações"** Card: Histórico com datas e badges de status

**Estilização**: Usar CSS inline/classes consistentes com o design do JSX (bordas arredondadas, cores roxas, badges verdes). Adaptar para usar Tailwind classes onde possível mantendo a identidade visual do mockup.

**Arquivos**: `src/pages/ReferralPage.tsx` (reescrita completa)

## Tarefa 2: Webhook Config no AdminStripeSettings

Adicionar ao `src/pages/admin/AdminStripeSettings.tsx`:

1. **Seção informativa "Configuração do Webhook"** abaixo dos campos existentes:
   - URL fixa: `https://pcaebfncvuvdguyjmyxm.supabase.co/functions/v1/stripe-sync` (com botão copiar)
   - Lista de eventos obrigatórios com badges

2. **CRUD de eventos de webhook** (armazenados em `admin_settings` com key `stripe_webhook_events`):
   - Lista editável com os 4 eventos padrão pré-populados
   - Input + botão "Adicionar" para novos eventos
   - Botão remover (X) em cada evento
   - Salvar junto com as outras configs

**Arquivos**: `src/pages/admin/AdminStripeSettings.tsx`

