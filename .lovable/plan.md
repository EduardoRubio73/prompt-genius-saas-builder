

## Plano: Ajustar botão "Assinar Plano" nos cards de preço

### Mudanca

Uma unica alteracao em `src/pages/landing/LandingPage.tsx`:

**Linha 514** -- substituir `onClick={() => navigate("/login")}` pela logica de checkout correta:

1. Verificar sessao com `supabase.auth.getSession()`
2. Se nao logado, redirecionar para `/login`
3. Se logado, invocar `create-checkout-session` com `price_id: stripe_price_id`
4. Redirecionar para `data.url` retornado pelo Stripe

Para o plano Free (sem `stripe_price_id`), manter redirecionamento para `/login`.

### Codigo do handler

```tsx
const handleSubscribe = async (priceId: string | null) => {
  if (!priceId) {
    navigate("/login");
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    window.location.href = "/login";
    return;
  }

  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { price_id: priceId }
  });

  if (error) {
    console.error(error);
    return;
  }

  window.location.href = data.url;
};
```

**Botao atualizado:**
```tsx
<button onClick={() => handleSubscribe(p.stripe_price_id)}>{p.cta_label}</button>
```

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/landing/LandingPage.tsx` | Adicionar `handleSubscribe` e atualizar onClick do botao na linha 514 |

