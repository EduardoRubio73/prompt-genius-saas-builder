

# Badge "Genius" — somente ícone no mobile

## Problema
O badge flutuante "Genius" (canto inferior direito, `index.html`) exibe ícone + texto em todas as telas. No mobile, ele sobrepõe os botões do Dock.

## Solução
Na media query `@media (max-width: 480px)` existente (linha 148), esconder o `<span>` de texto e reduzir o padding do badge para exibir apenas o ícone.

### Arquivo: `index.html` (linhas 148-152)

Substituir a media query atual:
```css
@media (max-width: 480px) {
  #genius-badge {
    padding: 0.5rem;
    gap: 0;
  }
  #genius-badge span {
    display: none;
  }
  #genius-menu {
    right: 10px;
    bottom: 70px;
    min-width: 200px;
  }
}
```

Isso faz o badge exibir apenas o ícone circular no mobile, sem sobrepor o Dock. O menu dropup também é ajustado para não ficar cortado.

