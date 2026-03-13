

# Mudar cor do BUILD Engine para laranja pastel

## Mudança

**`src/pages/Dashboard.tsx`**

1. Adicionar nova entrada `orange` no `COLOR_MAP` com tons pastel de laranja:
   - card: gradiente `from-orange-50 to-orange-100` (light) / `from-orange-950/40 to-orange-900/20` (dark)
   - iconWrap, text, badge: `orange-500/600` tons
2. Mudar `colorScheme` do BUILD Engine de `"amber"` para `"orange"`

Isso separa visualmente BUILD (laranja pastel) de Skill (amber), mantendo consistência com a imagem de referência.

