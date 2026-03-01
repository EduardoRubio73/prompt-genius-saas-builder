

## Plan: Fix Build Error + Global Tooltip System

### 1. Fix Build Error
The `BuildMode` file and all its dependencies exist but the build fails resolving the import. The fix is to ensure all 13 build component files and the `BuildMode.tsx` page are properly written/exist. Since the files show in the directory listing, this is likely a stale build artifact — we just need to re-save `src/App.tsx` with the correct import path or verify the files are on disk. If the files are missing from the actual build, we recreate them.

### 2. Enhanced Tooltip Component (`src/components/ui/tooltip.tsx`)
Upgrade the existing shadcn tooltip with:
- Dark semi-transparent background with backdrop blur (`bg-gray-900/95 backdrop-blur-sm`)
- Arrow indicator via Radix `TooltipPrimitive.Arrow`
- `collisionPadding` for auto-flip (viewport-aware positioning)
- Configurable `delayDuration` (default 300ms to avoid accidental triggers)
- Fade-in + scale-up micro-animation (already exists, refine timing)

### 3. `InfoTooltip` Helper Component (`src/components/ui/info-tooltip.tsx`)
A new reusable wrapper that renders a small `HelpCircle` icon next to any label with a tooltip:
```tsx
<InfoTooltip content="Dica sobre o campo" />
```
Props: `content: string`, optional `side`, `delayDuration`.

### 4. Apply Tooltips Across All Forms

**Login Page** (`Login.tsx`):
- Email: "Use o e-mail cadastrado. Formato: nome@dominio.com"
- Senha: "Mínimo 6 caracteres. Use letras, números e símbolos"

**Profile Page** (`ProfilePage.tsx`):
- Nome completo: "Como será exibido no app. Ex: João Silva"
- E-mail: "Não editável. Vinculado à autenticação"
- Nova senha / Confirmar: validation tips
- Notification switches: explain each toggle

**Prompt Mode** (`PromptInput.tsx`):
- Free text textarea: "Descreva em linguagem natural. A IA extrai os campos. Mín. 30 caracteres"
- Each manual field (Especialidade, Persona, Tarefa, Objetivo, Contexto, Destino): specific tips
- Platform pills: "Escolha onde o prompt será usado. Cada plataforma tem otimizações"
- Generate button: "Consome 1 cota do seu plano"

**Misto Mode** (`MistoInput.tsx`):
- Textarea: "Descreva seu projeto com detalhes. Mín. 50 caracteres, máx. 800"
- Platform pills + Generate button: same as Prompt

**SaaS Steps** (SaasStep1-7):
- Step 1 textarea: "Inclua quem sofre, como resolve hoje, por que sua solução é melhor"
- Step 2 fields: Segmento, Cargo, Dor — contextual tips
- Step 3: Feature list tips
- Steps 4-7: model, pricing, integrations, timeline tips

**BUILD Steps** (BuildStep1-10):
- Step 1: Product name, Problem, Target user, Platform type, Features — all with tips
- Step 2: Infrastructure options — explain tradeoffs
- Step 3: Auth methods, Roles, RLS — explain each
- Step 4-8: Admin, Multi-tenant, Payments, Branding, PWA — contextual tips

**Dashboard** (`Dashboard.tsx`):
- Stat cards: tooltip on hover explaining each metric
- Mode cards: tooltip on tags explaining abbreviations

### 5. Global TooltipProvider Config
Already in `App.tsx` wrapping everything. Update `delayDuration={300}` and `skipDelayDuration={100}` on the provider for consistent timing.

### Files Changed
- `src/components/ui/tooltip.tsx` — Enhanced styling + arrow
- `src/components/ui/info-tooltip.tsx` — **New** reusable helper
- `src/App.tsx` — Fix build import + TooltipProvider config
- `src/pages/Login.tsx` — Add field tooltips
- `src/pages/ProfilePage.tsx` — Add field tooltips
- `src/components/prompt/PromptInput.tsx` — Add field tooltips
- `src/components/misto/MistoInput.tsx` — Add field tooltips
- `src/components/saas/SaasStep1.tsx` through `SaasStep7.tsx` — Add field tooltips
- `src/components/build/BuildStep1.tsx` through `BuildStep8.tsx` — Add field tooltips
- `src/pages/Dashboard.tsx` — Add stat/mode tooltips

