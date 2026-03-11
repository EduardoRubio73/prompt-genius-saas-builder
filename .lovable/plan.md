

# Adaptar Modo Prompt: largura do card + seletor de plataformas agrupado

## Mudanças

### 1. Card "Texto Livre" em largura total (`src/components/prompt/PromptInput.tsx`)
- Remover o `prompt-two-panel` grid wrapper — ambos os modos (free e manual) já são mutuamente exclusivos, não precisam de grid
- O card "Descreva o que precisa" passa a ocupar 100% da largura, igual ao "Campos Manuais"

### 2. Seletor de plataformas agrupado com collapsible
Substituir os pills planos por grupos colapsáveis baseados no código de referência do usuário:

```text
🏗️ Builders  → Lovable, Bolt.new, Replit, v0.dev
💻 IDEs       → Cursor, Windsurf, GitHub Copilot  
🤖 LLMs       → ChatGPT, Claude, Gemini, Grok, DeepSeek, Mistral, Perplexity
```

- Cada grupo é um `Collapsible` com header clicável e conteúdo com pills
- Mapeamento para o enum `destination_platform` do banco:
  - Plataformas existentes no enum: `lovable`, `chatgpt`, `claude`, `gemini`, `cursor`, `v0`
  - Novas (bolt, replit, windsurf, copilot, grok, deepseek, mistral, perplexity): mapeiam para `"outro"`
  - O valor selecionado real (string) será passado para exibição, mas o `destino` para o Supabase usa o enum válido

### 3. CSS para os grupos (`src/pages/misto/misto.css`)
- Adicionar estilos para `.platform-group`, `.platform-group-header`, `.platform-group-pills`
- Estilo consistente com o design existente (cores, border-radius, fontes do tema)

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/prompt/PromptInput.tsx` | Largura 100% para free text, seletor agrupado |
| `src/pages/misto/misto.css` | Estilos dos grupos de plataforma |

### Nota sobre enum do banco
As plataformas novas (Bolt, Replit, Windsurf, Copilot, Grok, DeepSeek, Mistral, Perplexity) não existem no enum `destination_platform`. Elas serão mapeadas para `"outro"` no Supabase, mas o nome real será mantido no campo `destino` dos fields manuais para contexto na geração do prompt.

