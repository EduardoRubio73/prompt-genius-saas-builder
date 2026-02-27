# PROMPT GENIUS — Modo Misto (Orquestrador)
## Prompt para Lovable

---

## CONTEXTO

Continuação do projeto Prompt Genius. Vou construir a página `/misto` — o orquestrador que combina Modo Prompt + SaaS Builder em uma única sessão. O backend Supabase já está configurado. O design segue o sistema visual já estabelecido no projeto (Plus Jakarta Sans, cores --c #00C8FF, --v #A855F7, --g #00E5B0, bg #05050F).

---

## O QUE É O MODO MISTO

O usuário escreve **uma única ideia em texto livre**. O sistema faz sequencialmente:

1. **Ação `distribute`** — Edge Function `refine-prompt` extrai campos estruturados do texto livre (especialidade, persona, tarefa, objetivo, contexto, destino)
2. **Ação `refine`** — Edge Function `refine-prompt` melhora cada campo extraído
3. **Geração da Spec SaaS** — Edge Function `refine-prompt` com ação `saas-spec` usa os campos refinados para gerar especificação técnica Markdown

Resultado final: **prompt otimizado estruturado** + **spec técnica completa** — tudo a partir de um único input.

---

## FLUXO DE UI — 4 ETAPAS (stepper visual)

```
[1. Ideia] → [2. Refinando Prompt] → [3. Gerando Spec] → [4. Resultados]
```

### ETAPA 1 — Input da Ideia
- Campo de texto grande (textarea), placeholder: *"Descreva seu projeto ou ideia... Ex: Quero criar um SaaS de gestão de contratos com IA para pequenas empresas"*
- Abaixo do textarea: seletor de **Plataforma de Destino** (dropdown ou pills):
  - Lovable | ChatGPT | Claude | Gemini | Cursor | v0.dev
- Contador de caracteres (mín 50, máx 800)
- Botão **"Gerar com IA ⚡"** (desabilitado se < 50 caracteres)
- Ao clicar: consumir 1 cota via `consume_credit()` e iniciar o fluxo

### ETAPA 2 — Refinando Prompt (loading animado)
Layout de dois painéis side-by-side que vão sendo preenchidos progressivamente:

**Painel Esquerdo — Campos Extraídos** (aparecem um a um com stagger):
- `especialidade` — ícone 🎓
- `persona` — ícone 👤
- `tarefa` — ícone ✅
- `objetivo` — ícone 🎯
- `contexto` — ícone 🌐
- `destino` — ícone 🚀

Cada campo tem:
- Label + ícone
- Skeleton loader → texto animado aparecendo
- Tooltip (ícone `HelpCircle` do Lucide) explicando o que é aquele campo

**Tooltips dos campos:**
- especialidade: *"Qual é a área de expertise que o prompt deve simular? Ex: Engenheiro de Software Sênior, Designer UX"*
- persona: *"Como a IA deve se comportar? Tom, estilo de resposta, personalidade"*
- tarefa: *"O que exatamente deve ser feito? A ação central do prompt"*
- objetivo: *"Qual o resultado esperado? O que o usuário quer alcançar"*
- contexto: *"Informações adicionais que a IA precisa saber para responder bem"*
- destino: *"Para qual plataforma este prompt será usado? Cada uma tem particularidades"*

**Painel Direito — Preview do Prompt** (vai sendo construído em tempo real):
- Área de texto com fonte monospace
- Texto aparece sendo "digitado" (efeito typewriter)
- Badge de status: `distribuindo...` → `refinando...` → `✓ Prompt pronto`

### ETAPA 3 — Gerando Spec SaaS (loading)
- Tela de transição com animação
- Mensagem: *"Usando o prompt gerado para criar sua especificação técnica..."*
- Progress bar animada (0% → 100% em ~3s, fictícia)
- Sub-texto: *"Detectando stack, arquitetura, features e requisitos de segurança"*

### ETAPA 4 — Resultados (layout dividido em abas)

**Header dos resultados:**
- Título: "Sessão Mista Concluída ⚡"
- Badge com tempo total: "Gerado em 4.2s"
- Badge de cotas: "1 cota consumida"
- Botões: `Nova Sessão` | `Salvar Tudo` | `Compartilhar`

**Abas:**
1. **Prompt Otimizado** — mostra os 6 campos em cards + prompt final completo com botão copiar
2. **Spec Técnica** — renderiza o Markdown com syntax highlight (use `react-markdown` ou similar)
3. **Comparação** — mostra side-by-side o input original vs. os dois outputs

**Dentro da aba "Prompt Otimizado":**
- Cards editáveis para cada campo (usuário pode ajustar e regenerar)
- Prompt final montado no rodapé com botão "Copiar Prompt"
- Rating de 1-5 estrelas para salvar no histórico

**Dentro da aba "Spec Técnica":**
- Markdown renderizado com estilo dark
- Seções: Visão Geral, Stack Técnica, Funcionalidades, Banco de Dados, Segurança, Deploy
- Botão "Copiar Markdown" e "Download .md"
- Rating de 1-5 estrelas

---

## EDGE FUNCTION — `refine-prompt`

A Edge Function já existe no projeto. Chame assim:

```typescript
// Ação 1: distribute (extrai campos do texto livre)
const distributeRes = await fetch(`${SUPABASE_URL}/functions/v1/refine-prompt`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    action: 'distribute',
    freeText: userInput,
    destino: selectedDestino
  })
})
// Retorna: { especialidade, persona, tarefa, objetivo, contexto, destino }

// Ação 2: refine (melhora cada campo)
const refineRes = await fetch(`${SUPABASE_URL}/functions/v1/refine-prompt`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    action: 'refine',
    fields: distributeResult,  // output da ação distribute
    destino: selectedDestino
  })
})
// Retorna: campos refinados + prompt_gerado (string completa)

// Ação 3: saas-spec (gera a especificação técnica)
const specRes = await fetch(`${SUPABASE_URL}/functions/v1/refine-prompt`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    action: 'saas-spec',
    promptFields: refineResult,   // output da ação refine
    originalInput: userInput,
    destino: selectedDestino
  })
})
// Retorna: { spec_md: string } — Markdown da especificação técnica
```

---

## SUPABASE — SALVAR SESSÃO

Após o usuário dar rating e clicar "Salvar Tudo":

```typescript
// 1. Criar sessão
const { data: session } = await supabase
  .from('sessions')
  .insert({
    org_id: orgId,
    user_id: userId,
    mode: 'misto',
    status: 'completed'
  })
  .select().single()

// 2. Salvar prompt no prompt_memory
const { data: promptRecord } = await supabase
  .from('prompt_memory')
  .insert({
    session_id: session.id,
    org_id: orgId,
    user_id: userId,
    especialidade: fields.especialidade,
    persona: fields.persona,
    tarefa: fields.tarefa,
    objetivo: fields.objetivo,
    contexto: fields.contexto,
    destino: selectedDestino,
    prompt_gerado: promptFinal,
    tokens_consumed: tokensUsed,
    rating: promptRating,  // 1-5
    categoria: 'misto'
  })
  .select().single()

// 3. Salvar spec no saas_specs
await supabase
  .from('saas_specs')
  .insert({
    session_id: session.id,
    org_id: orgId,
    user_id: userId,
    prompt_memory_id: promptRecord.id,  // LINK entre prompt e spec!
    spec_md: specMarkdown,
    rating: specRating,
    answers: {
      original_input: userInput,
      destino: selectedDestino
    }
  })
```

---

## CONTROLE DE COTAS

Antes de iniciar o fluxo, verificar saldo:

```typescript
// Checar saldo
const { data: balance } = await supabase.rpc('get_credit_balance', {
  p_org_id: orgId
})

if (balance.total_remaining <= 0) {
  // Mostrar modal de "Sem cotas"
  // Opções: Comprar pacote avulso | Fazer upgrade de plano
  return
}

if (balance.account_status === 'trial_expired') {
  // Mostrar modal de trial expirado
  return
}

// Consumir cota
const { data: result } = await supabase.rpc('consume_credit', {
  p_org_id: orgId,
  p_user_id: userId,
  p_session_id: sessionId  // pode ser um uuid temporário
})

if (result !== 'ok') {
  // Tratar erros: 'no_credits', 'trial_expired', 'suspended'
}
```

---

## COMPONENTES A CRIAR

```
src/components/misto/
├── MistoInput.tsx          # Etapa 1: textarea + destino selector
├── MistoProgress.tsx       # Etapas 2 e 3: loading com animações
├── FieldCard.tsx           # Card individual de campo (especialidade etc)
├── FieldTooltip.tsx        # Tooltip explicativo com HelpCircle
├── PromptPreview.tsx       # Preview typewriter do prompt sendo montado
├── ResultTabs.tsx          # Abas de resultado (Prompt | Spec | Comparação)
├── PromptResult.tsx        # Conteúdo da aba Prompt Otimizado
├── SpecResult.tsx          # Conteúdo da aba Spec Técnica (markdown)
├── ComparisonView.tsx      # Comparação input vs outputs
├── CreditModal.tsx         # Modal de sem cotas / trial expirado
└── RatingStars.tsx         # Componente de 1-5 estrelas

src/pages/
└── MistoMode.tsx           # Página principal /misto
```

---

## ESTADOS DA PÁGINA

```typescript
type MistoStep = 'input' | 'distributing' | 'refining' | 'generating-spec' | 'results'

interface MistoState {
  step: MistoStep
  userInput: string
  destino: string
  fields: {
    especialidade: string
    persona: string
    tarefa: string
    objetivo: string
    contexto: string
    destino: string
  } | null
  promptGerado: string | null
  specMarkdown: string | null
  tokensUsed: number
  timeElapsed: number
  promptRating: number
  specRating: number
  sessionId: string | null
  isSaved: boolean
  error: string | null
}
```

---

## DESIGN VISUAL DA PÁGINA

### Header da página
- Botão `← Dashboard` no canto superior esquerdo
- Badge `⚡ Modo Misto` com cor `--g` (#00E5B0) no centro
- Pill de cotas restantes no canto superior direito: `3 cotas restantes`

### Stepper visual (4 etapas)
- Linha horizontal no topo com 4 nós
- Nó ativo: círculo preenchido com gradiente cyan→violet
- Nó completo: ✓ verde
- Nó futuro: círculo vazio com borda sutil
- Labels abaixo: "Ideia" | "Prompt" | "Spec" | "Resultado"

### Paleta específica do Modo Misto
- Accent principal: gradiente de `#00E5B0` (verde) → `#00C8FF` (cyan)
- Cards de campo: border `rgba(0,229,176,0.15)` com hover `rgba(0,229,176,0.3)`
- Botão principal: gradiente cyan → violet (igual ao sistema)
- Loading spinner: verde-água pulsante

### Animações
- Etapa 2: cada FieldCard aparece com stagger de 150ms (delay 0, 150, 300, 450, 600, 750ms)
- Texto do preview: efeito typewriter (adiciona 2-3 caracteres por frame)
- Transição entre etapas: fade + slide suave (200ms)
- Progress bar da Etapa 3: animação CSS de 0 → 100% em 3s

---

## RESPONSIVIDADE

- Mobile: stepper em versão compacta (só ícones), painéis em coluna única
- Tablet: painéis side-by-side na etapa 2
- Desktop: layout completo com painéis largos

---

## TRATAMENTO DE ERROS

- Edge Function falhou: toast de erro + botão "Tentar novamente"
- Timeout (>15s): cancelar e mostrar mensagem
- Sem cotas: modal com opções de upgrade / compra avulsa
- Trial expirado: modal de upgrade
- Usuário não autenticado: redirect para `/login`

---

## NÃO FAZER

- ❌ Não criar novas tabelas no Supabase
- ❌ Não criar nova Edge Function — usar `refine-prompt` com as ações existentes
- ❌ Não simular os resultados da IA com dados hardcoded — chamar a Edge Function real
- ❌ Não usar localStorage para estado — usar React state (useState/useReducer)
- ❌ Não pular o controle de cotas — verificar ANTES de chamar a Edge Function
- ❌ Não usar Inter, Roboto ou fontes genéricas — manter Plus Jakarta Sans
