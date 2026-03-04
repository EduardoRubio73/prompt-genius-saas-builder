

## Plano: Redesign visual do Dashboard

### Análise

O Dashboard atual (`src/pages/Dashboard.tsx`) já possui toda a estrutura funcional solicitada: cards de resumo, barra de progresso, cards de modo e tooltips. As mudanças são puramente visuais para atingir o padrão Stripe/Vercel/Linear.

### Alterações em `src/pages/Dashboard.tsx`

#### 1. SummaryCard — elevar visual
- Trocar `border-border/60 bg-card/50` por `border bg-card shadow-md hover:shadow-xl`
- Aumentar padding de `p-4` para `p-5`
- Adicionar `duration-300` na transição

#### 2. ModeActionCard — destaque maior
- Aplicar `shadow-md hover:shadow-xl hover:scale-[1.02]` consistentemente
- Trocar `bg-card/50` por `bg-card`
- Bordas sólidas `border` em vez de `border-border/60`

#### 3. UsageProgressBar — gradientes semânticos
- Atualizar cores: `<50% green`, `<75% yellow`, `<90% orange`, `>=90% red`
- Já implementado parcialmente, ajustar thresholds para combinar com spec

#### 4. Seção de Stats — remover para simplificar
- A spec não inclui a seção de stats (prompts gerados, specs criadas, etc.)
- Mover para baixo ou remover para manter layout limpo de 3 blocos

#### 5. Cards de acesso rápido + referral — elevar visual
- Mesmos padrões de sombra e borda

#### 6. Greeting — refinamento
- Badge de plano com `shadow-sm`

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Refinar classes CSS dos cards, progress bar e layout geral |

### Resultado
Dashboard com visual Stripe/Vercel: cards com sombras, hover elevado, bordas limpas, transições suaves, 100% compatível dark/light via tokens semânticos existentes.

