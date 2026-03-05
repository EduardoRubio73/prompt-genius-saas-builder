

## Plano: Corrigir faixa branca lateral na Landing Page

### Causa raiz
O `body` tem `bg-background` (cor clara do Tailwind: `hsl(40, 14%, 95%)`). A `.landing-page` tem `background: #05050F` e `max-width: 100vw`, mas o conteúdo não preenche 100% da largura, deixando o fundo claro do `body` visível na lateral direita.

### Solução
Duas correções complementares:

1. **`src/pages/landing/landing.css`**: Adicionar `width: 100%` e `min-height: 100vh` ao `.landing-page`, e garantir que o `overflow-x: hidden` esteja no container correto.

2. **`src/pages/landing/LandingPage.tsx`**: No componente, adicionar um `useEffect` que define `document.body.style.background = '#05050F'` ao montar e restaura ao desmontar. Isso garante que o body tenha a mesma cor escura enquanto a landing está visível.

### Arquivo

| Arquivo | Ação |
|---------|------|
| `src/pages/landing/LandingPage.tsx` | Editar — `useEffect` para forçar body background escuro |
| `src/pages/landing/landing.css` | Editar — `width: 100%` no `.landing-page` |

