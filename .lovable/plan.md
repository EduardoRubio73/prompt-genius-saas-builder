

## Diagnóstico do teste

### O que funciona
- **Planos na tabela**: 3 planos (Free, Starter, Pro) aparecem corretamente via `v_active_stripe_plans`
- **Formulário de edição**: Já tem o campo "Preço (BRL)" e todos os campos necessários
- **Botões**: "Conferir Stripe" e "Criar novo plano" existem e chamam as funções corretas

### Problemas encontrados

1. **`stripe-sync-products` crashando**: O log mostra `No such product: 'prod_U58VVYaLevEyB5'` para o `prod_enterprise`. Os `stripe_product_id` armazenados no banco são IDs inválidos no Stripe — provavelmente foram criados em outro ambiente/conta. Quando a função tenta `stripe.products.update()` com um ID inexistente, dá 404. Depois o Deno crasheia com `runMicrotasks()`.

2. **Tratamento de erro insuficiente**: A função atual faz `try/catch` e apenas loga o erro, mas o crash do Deno depois da resposta causa o erro `event loop error` que mata o response.

3. **IDs inválidos no Stripe**: Os 4 `stripe_product_id` no banco (`prod_U58Vo19Ozb67fo`, etc.) não existem na conta Stripe conectada. A função precisa detectar `resource_missing` (404) e **recriar** o produto em vez de apenas logar o erro.

### Correção

#### `stripe-sync-products/index.ts`
- Quando `stripe.products.update()` retornar erro 404 (`resource_missing`):
  - Criar um novo produto no Stripe
  - Atualizar o `stripe_product_id` no banco com o novo ID
- Para preços com `stripe_price_id` inválido: mesma lógica — verificar se existe, recriar se necessário
- Garantir que o `prod_enterprise` também ganhe preço e fique ativo

#### Resumo de mudanças

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/stripe-sync-products/index.ts` | Tratar erro 404 recriando produto/preço no Stripe |

Sem essa correção, o botão "Conferir Stripe" vai continuar falhando silenciosamente por causa dos IDs inválidos.

