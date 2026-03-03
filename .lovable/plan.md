
Objetivo
- Eliminar de vez o erro de ativação (“Cannot activate product without active price”) no Admin Billing ao atualizar plano.
- Manter a regra que você pediu: status controlado por Plano, com preços sincronizados.

Diagnóstico (confirmado no código + rede)
1) No fluxo de edição (modal “Salvar”), o sistema envia `is_active` direto em `billing_products` sem sincronizar preços antes.
2) No fluxo de toggle rápido, existe update em `billing_prices`, mas o erro desse update não é tratado (não verifica `error` retornado pelo Supabase).
3) No banco, há trigger `prevent_active_price_if_product_inactive` + `prevent_active_product_without_price`, combinação que trava reativação quando plano e preço estão ambos inativos.

Plano de correção

1) Unificar ativação/desativação em uma única rotina no front
- Arquivo: `src/pages/admin/AdminBilling.tsx`
- Criar uma função única (ex.: `applyProductActivation`) usada por:
  - botão de status da tabela (toggle)
  - botão “Salvar” do modal (quando `is_active` mudar)
- Comportamento:
  - Ativar: ativar preços vinculados -> ativar plano
  - Desativar: desativar plano -> desativar preços
- Sempre validar e lançar erro se qualquer update no Supabase retornar `error`.

2) Corrigir o fluxo do modal de edição
- Arquivo: `src/pages/admin/AdminBilling.tsx`
- No `saveEdit`, separar:
  - atualização de campos gerais (nome, labels, link, etc.)
  - mudança de status (`is_active`)
- Se `is_active` mudou, chamar a rotina unificada de ativação/desativação (não fazer update direto no produto).
- Mostrar mensagem clara quando não houver preço vinculado ao plano (caso real de borda).

3) Ajustar regra no banco para não criar bloqueio circular
- Novo migration em `supabase/migrations/`
- Remover (ou relaxar) trigger `prevent_active_price_if_product_inactive` para permitir ativar preço antes do produto durante sincronização administrativa.
- Manter trigger `prevent_active_product_without_price` para garantir que plano só fique ativo com pelo menos 1 preço ativo.
- Resultado: preserva integridade final sem deadlock de ativação.

4) Garantir refresh correto da UI
- Arquivo: `src/hooks/admin/useAdminData.ts`
- Em `useUpdateProduct`, invalidar também `["admin-prices"]` além de `["admin-products"]` para refletir status herdado imediatamente na aba Preços.

Detalhes técnicos (resumo)
- O erro atual não é só “dados ruins”; é combinação de:
  - fluxo de edição sem sincronização
  - tratamento incompleto de erro no update de preços
  - regra de trigger circular para reativação
- A correção precisa atuar em front + banco para ficar estável e não voltar em outros caminhos da tela.

Validação após implementação
1) Em `/admin/billing`, ativar `prod_free` e `prod_test_auto_01` via:
   - badge de status
   - modal “Editar -> Ativo -> Salvar”
2) Confirmar:
   - sem toast de erro
   - plano fica ativo
   - preço correspondente fica ativo no banco
   - aba Preços mostra status herdado correto
3) Testar desativação e reativação em sequência para confirmar que não há regressão.
