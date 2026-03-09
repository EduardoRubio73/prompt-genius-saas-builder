
# Plano: Progress Bar Separado para Bônus + Botão de Atualizar

## Resumo

Adicionar uma barra de progresso separada para créditos bônus/extras e um botão de atualização manual no Dashboard, já que a atualização automática não está funcionando após compras ou mudanças de plano.

## Mudanças

### 1. Dashboard.tsx - Adicionar seção de bônus separada

Na seção "Uso do período" dentro do card "Resumo da Conta":
- Manter a barra atual para **cotas do plano** (plan_used / plan_total)
- Adicionar nova barra para **bônus + extras** (bonus_remaining + extra_credits)
- Mostrar labels claros para cada barra

### 2. Dashboard.tsx - Adicionar botão de atualizar

No cabeçalho do card "Resumo da Conta":
- Adicionar ícone `RefreshCw` ao lado do título
- Ao clicar, invalida o query `quota-balance` forçando refetch
- Mostrar animação de rotação durante o loading

## Componentes visuais

```text
┌─────────────────────────────────────────────────────┐
│ Resumo da Conta                    [↻ Atualizar]   │
├─────────────────────────────────────────────────────┤
│ Uso do período                                      │
│                                                     │
│ Cotas do Plano                                      │
│ ████████████░░░░░░░░░░░░░░░░░░  3 / 10 usadas      │
│                                                     │
│ Bônus + Extras                                      │
│ █████████████████████████████  15 disponíveis       │
└─────────────────────────────────────────────────────┘
```

## Implementação técnica

- Usar `useQueryClient().invalidateQueries(["quota-balance", orgId])` para forçar refresh
- Criar componente `BonusProgressBar` similar ao `UsageProgressBar`
- A barra de bônus não tem "limite" fixo, então mostrar apenas o total disponível
