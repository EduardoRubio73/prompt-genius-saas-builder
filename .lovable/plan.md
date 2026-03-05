

## Plano: Corrigir badge "Contato/Suporte" para abrir modal

### Problema
A função `abrirModalContato()` em `index.html` (linha 209) ainda usa `alert()` em vez de disparar o `CustomEvent` que o React escuta.

### Correção
**Arquivo:** `index.html` (linha 209)

Substituir:
```js
alert("Abrir modal: Contato com a equipe zragency");
```
Por:
```js
document.dispatchEvent(new CustomEvent("open-contact-modal"));
```

Isso dispara o evento que o `useEffect` em `LandingPage.tsx` já escuta para abrir o modal de contato.

| Arquivo | Ação |
|---------|------|
| `index.html` | Editar linha 209 — trocar `alert()` por `CustomEvent` |

