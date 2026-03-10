

# Diagnóstico: Pagamento `pi_3T9QaeBmEyQZSY7V` não creditado

## Causa Raiz

Os logs da Edge Function `stripe-sync` mostram um erro claro:

```
No signatures found matching the expected signature for payload.
```

O webhook do Stripe **está chegando** (diferente do problema anterior), mas a **verificação de assinatura falha**. Isso significa que o valor do secret `STRIPE_WEBHOOK_SECRET` configurado nas variáveis de ambiente da Edge Function **não corresponde** ao Webhook Signing Secret configurado no Stripe Dashboard.

O segredo armazenado em `admin_settings` é `whsec_H00x4RG9GiujgRQ2zWXPwnxj3xEJhjEg`, mas o secret usado pela Edge Function vem de `Deno.env.get("STRIPE_WEBHOOK_SECRET")` -- são fontes diferentes e provavelmente estão desincronizados.

## Ação Necessária (sem alteração de código)

1. **Verificar no Stripe Dashboard** (Developers > Webhooks) qual é o Signing Secret do webhook que aponta para `https://pcaebfncvuvdguyjmyxm.supabase.co/functions/v1/stripe-sync`
2. **Atualizar o secret** no Supabase Dashboard (Settings > Edge Functions > Secrets) para que `STRIPE_WEBHOOK_SECRET` contenha exatamente o valor do Stripe
3. **Reenviar o evento** no Stripe Dashboard para o pagamento `pi_3T9QaeBmEyQZSY7V`

## Dados do pagamento

- O `pi_3T9QaeBmEyQZSY7V` **não existe** em nenhuma tabela do banco (nem `credit_purchases` nem `billing_subscriptions`)
- O webhook foi recebido mas rejeitado com erro 400 antes de processar qualquer dado
- Após corrigir o secret, o reenvio do evento pelo Stripe processará o pagamento automaticamente

## Nenhuma alteração de código é necessária

A lógica do `stripe-sync` está correta (já usa `constructEventAsync`). O problema é exclusivamente de configuração do secret.

