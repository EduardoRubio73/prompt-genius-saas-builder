

# Plano: Mostrar Saldo Total no Header Colapsado

## Mudança

Atualizar a linha 359 do `Dashboard.tsx` para mostrar o saldo total (plano + bônus + extras) no header colapsado do card "Resumo da Conta".

**De:**
```
0/5 cotas · Renova —
```

**Para:**
```
Saldo: 15 (5 plano + 10 bônus) · Renova 01/04
```

## Implementação

Alterar o texto no `CollapsibleTrigger` (linha 358-360) para usar `totalRemaining` como valor principal, com breakdown entre cotas do plano e bônus/extras.

A barra de progresso continuará mostrando o uso do plano (percentUsed), pois é a métrica mais relevante para ciclo de renovação.

