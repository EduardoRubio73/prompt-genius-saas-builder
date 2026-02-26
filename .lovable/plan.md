# Update Hero Logo Size & Effects

Update the hero logo in `src/pages/landing/landing.css` (lines 117-127) to use the larger dimensions and enhanced styling from the user's snippet:

- **Size**: Change `clamp(90px,12vw,140px)` → `clamp(180px,22vw,280px)` for a much more prominent logo
- **Shadows and hover** remain the same (already matching)
- **Float animation** already matches

Only 1 line change needed in `landing.css` line 119.

&nbsp;

# Instrução: Trocar fonte global para Plus Jakarta Sans

## O que fazer

Substituir a fonte atual do projeto pela **Plus Jakarta Sans**, garantindo que ela seja carregada corretamente via Google Fonts e aplicada globalmente em todo o app.

---

## Passo 1 — Carregar a fonte via Google Fonts

No arquivo `index.html` (ou equivalente, ex: `app/layout.tsx` em Next.js), adicionar o link do Google Fonts dentro do `<head>`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
  rel="stylesheet"
/>

```

---

## Passo 2 — Aplicar a fonte globalmente no CSS

No arquivo de estilos globais (ex: `globals.css`, `index.css`, ou `app/globals.css`), definir a fonte no `body` e no seletor universal:

```css
body {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

```

---

## Passo 3 — Configurar no Tailwind (se o projeto usar Tailwind CSS)

No arquivo `tailwind.config.js` ou `tailwind.config.ts`, adicionar a fonte na seção `extend.fontFamily`:

```js
import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', ...fontFamily.sans],
      },
    },
  },
};

```

Isso faz com que `font-sans` (classe padrão do Tailwind) use a Plus Jakarta Sans automaticamente em todo o projeto.

---

## Resumo


| Arquivo                      | O que adicionar                                          |
| ---------------------------- | -------------------------------------------------------- |
| `index.html` ou `layout.tsx` | Tag `<link>` do Google Fonts no `<head>`                 |
| `globals.css`                | `font-family: 'Plus Jakarta Sans', sans-serif` no `body` |
| `tailwind.config.js`         | `fontFamily.sans` apontando para `Plus Jakarta Sans`     |


---

## Observação

A fonte deve estar carregada **antes** de qualquer outro estilo para evitar flash de fonte incorreta (FOUT). Certifique-se de que o `<link>` do Google Fonts está no topo do `<head>`, preferencialmente com `rel="preconnect"` também:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
  rel="stylesheet"
/>

```