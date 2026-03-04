

## Plano: Filtrar Topups dos Planos + Substituir botões por info nos cards de cotas

### Problema 1: Topup cards aparecem na seção de Planos
A view `v_active_stripe_plans` retorna todos os produtos (incluindo Topups). O frontend não filtra, então cards como "Topup 5 Credits" aparecem junto com Free, Starter, Pro, Enterprise.

**Solução:** No `fetchPricing` em `LandingPage.tsx`, filtrar os produtos cujo `name` começa com "Topup" na query ou no `.filter()` do JavaScript.

```tsx
// Filtrar topups após fetch
setPricingProducts(data
  .filter((p: any) => !p.name?.startsWith("Topup"))
  .map((p: any) => ({ ... }))
);
```

### Problema 2: Botões "Comprar" nos cards de Cotas Adicionais
Os 3 cards na seção "Cotas Adicionais" têm botões `<button className="cc-btn">Comprar</button>`. O user quer substituí-los por informações descritivas vindas de `billing_products.description`.

**Solução:** Tornar os credit cards dinâmicos — buscar `credit_packs` (já possui `display_name`, `credits`, `price_brl`, `is_featured`) e `billing_products` (para pegar `description`). Alternativamente, como os dados de description estão em `billing_products` e os topups têm nomes como "Topup 5 Credits", buscar esses registros e usar a `description`.

Na prática, os cards já são hardcoded. Vou:
1. Remover os botões "Comprar" dos 3 cards
2. Substituí-los por texto descritivo das `billing_products` (fetch dinâmico) ou hardcoded baseado nos descriptions encontrados:
   - 5 credits: "Pacote de 5 créditos adicionais. Créditos não expiram."
   - 15 credits: "Pacote de 15 créditos adicionais com melhor custo por crédito."
   - 40 credits: "Pacote de 40 créditos adicionais para uso intensivo."

Melhor: buscar dinamicamente da tabela `credit_packs` e cruzar com `billing_products` por nome para pegar a description.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/landing/LandingPage.tsx` | Editar — filtrar topups na seção Planos; remover botões "Comprar" dos credit cards e adicionar descriptions |

