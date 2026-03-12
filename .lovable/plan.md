

# Correção de Alertas Duplicados + Tipografia Global Inter

## Problemas Identificados

1. **Alerta duplicado**: `SubscriptionAlert` é renderizado tanto no `AppShell` (linha 149) quanto dentro do `Dashboard` (linha 214). O `ProfilePage` tem o do AppShell + o próprio do BillingTab (linha 608). Resultado: 2 alertas visíveis.
2. **Texto do resumo no card colapsado** precisa ficar azul (já está parcialmente no ProfilePage, falta no Dashboard).
3. **Card de assinatura vencida**: quando vencida, Resumo deve recolher e Assinatura expandir com estilo amarelo pastel + botão colorido destaque.

## Mudanças Planejadas

### 1. Remover alerta duplicado
- **`src/pages/Dashboard.tsx`**: Remover o `<SubscriptionAlert>` interno (linhas 213-215). O do `AppShell` já cobre.
- **`src/pages/ProfilePage.tsx` (BillingTab)**: Remover o `<SubscriptionAlert>` interno (linha 608). O do `AppShell` já cobre.

### 2. Texto azul no resumo colapsado do Dashboard
- **`src/pages/Dashboard.tsx`**: Mudar a classe do `<span>` do resumo colapsado (linha 257-259) para usar `text-blue-600 dark:text-blue-400` em vez de `text-muted-foreground`.
- Adicionar badge de alerta (⚠️) na frente do texto do resumo quando assinatura vencida.

### 3. Comportamento inteligente de cards na BillingTab quando vencida
- **`src/pages/ProfilePage.tsx`**: Alterar estados iniciais dos collapsibles:
  - `resumoOpen`: `!subExpired` (recolhe quando vencida)
  - `assinaturaOpen`: `subExpired` (expande quando vencida)
  - Problema: `subExpired` depende de `subscription` que vem de um hook. Usar `useEffect` para ajustar quando os dados carregarem.
- Card de Assinatura (`Gerenciar Assinatura`): quando vencida, aplicar estilo amarelo pastel (`border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/30`) e botão com destaque colorido (`bg-yellow-500 text-white` ou `bg-primary`).

### 4. Tipografia Global — Inter + Design Tokens
- **`index.html`**: Trocar Google Fonts de `DM Sans` para `Inter` com pesos 400-800.
- **`tailwind.config.ts`**: Trocar `Plus Jakarta Sans` por `Inter` no fontFamily.
- **`src/index.css`**: 
  - Trocar `--font-heading` e `--font-body` para `Inter`.
  - Adicionar tokens tipográficos no `:root` (--text-xs a --text-3xl, --font-regular a --font-extrabold, --leading-*, --tracking-*).
  - Adicionar `font-feature-settings`, `font-variant-numeric: tabular-nums`, antialiasing no body.
- **`src/pages/admin/admin.css`**: Trocar referência de `Plus Jakarta Sans` para `Inter` no `--adm-font`.

### 5. Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `index.html` | Google Fonts: DM Sans → Inter |
| `tailwind.config.ts` | fontFamily: Inter |
| `src/index.css` | Tokens tipográficos + Inter + antialiasing |
| `src/pages/admin/admin.css` | --adm-font → Inter |
| `src/pages/Dashboard.tsx` | Remover alerta duplicado, texto azul no resumo, badge vencida |
| `src/pages/ProfilePage.tsx` | Remover alerta duplicado, auto-expand assinatura quando vencida, card amarelo pastel |

