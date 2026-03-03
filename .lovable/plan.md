

## Correção do layout dos cards de preços na Landing Page

**Problema**: Os nomes dos planos e valores estão sobrepostos nos cards de preço. A `pc-name` tem fonte pequena (11px) com margens mínimas, e a `pc-price` tem `line-height: 1` sem espaçamento adequado entre nome → preço → período.

**Correções em `src/pages/landing/landing.css`**:

1. **`.pc-name`**: Aumentar font-size para ~13px, adicionar `margin-bottom: 10px` para separar do preço
2. **`.pc-price`**: Adicionar `margin-bottom: 4px` e `line-height: 1.1` para não colar no período
3. **`.pc-price sup`**: Ajustar `display: inline-block` e `margin-right: 2px` para o "R$" não sobrepor o número
4. **`.pc-period`**: Adicionar `margin-top: 2px` e `margin-bottom: 8px` para espaçar do trial badge

Referência visual (imagem do usuário): nomes em destaque, "R$" como `<sup>` separado do número grande, "por mês" com espaço abaixo.

