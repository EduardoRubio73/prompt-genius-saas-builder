

## Plan: Add Tooltips, Examples, and Dynamic Suggestions to BUILD Mode (and Review Other Modes)

### Problem
The BUILD mode wizard steps have bare fields with no tooltips, no examples, no suggestion chips, and no ability to add/remove dynamic items (features, roles). The SaaS and Prompt modes already have these patterns -- BUILD needs to match.

### Changes

#### 1. `src/pages/build/BuildMode.tsx` -- Enhance all 10 steps

**Step 1 (Nome e Problema):**
- Add InfoTooltips to both fields
- Add placeholder examples and character counter for problema
- Add "Usar exemplo" button like SaasStep1

**Step 2 (Publico-Alvo):**
- Add InfoTooltips to Segmento, Cargo, Dor
- Add suggestion chips that auto-populate based on `productName`/`problema` keywords (e.g., if "arquitetura" is in problema, suggest "Arquitetura", "Engenharia Civil" for segmento; "Arquiteto", "Engenheiro", "CEO" for cargo)
- Dynamic suggestion lists for each field

**Step 3 (Features):**
- Add InfoTooltip
- Add "+" button to add more features, "x" to remove
- Add suggestion chips based on `segmento`/`problema` (e.g., "Dashboard", "Relatórios", "Agenda", "Notificações", "Faturamento")
- Increase default from 3 to 3 with add button (max ~8)

**Step 4 (Modelo):**
- Add InfoTooltip
- Show modelo labels with descriptions (like SaasStep4 already does for SaaS mode)
- Add pricing placeholder example

**Step 5 (Stack):**
- Add InfoTooltips per field
- Convert to chip selectors with "IA decide" option (like SaasStep5)

**Step 6 (Infra):**
- Add InfoTooltips
- Add chip suggestions for hosting (Vercel, AWS, Supabase), CI/CD (GitHub Actions, GitLab CI), monitoring (Sentry, Datadog)

**Step 7 (Auth & Roles):**
- Add InfoTooltips
- Show auth method labels with descriptions
- Add "+" / "x" for dynamic roles
- Add role suggestion chips (admin, user, moderator, editor, viewer)

**Step 8 (Admin):**
- Add InfoTooltip
- Add descriptions for each admin feature chip

**Step 9 (Integrações):**
- Add InfoTooltip
- Expand integration options
- Add custom integrations field tooltip

**Step 10 (Branding):**
- Add InfoTooltips
- Add suggestion chips for color palettes (e.g., "Azul Corporativo", "Verde Natureza", "Roxo Tech")
- Add suggestion chips for tone (e.g., "Profissional", "Casual", "Técnico", "Amigável")
- Auto-fill appName from productName if empty

#### 2. Dynamic Context Propagation

Create a helper that extracts keywords from previous answers to generate contextual suggestions:
- `problema` keywords drive suggestions in Step 2 (segmento/cargo/dor) and Step 3 (features)
- `segmento` drives Step 3 feature suggestions
- `productName` auto-fills `appName` in Step 10

This is done with simple keyword matching arrays, no AI call needed.

#### 3. Review Other Modes (minor)

SaaS Steps 2-7 and Misto/Prompt already have tooltips. Quick audit confirms they are mostly covered. No major gaps.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/build/BuildMode.tsx` | Rewrite all 10 step components with tooltips, suggestions, dynamic add/remove, examples, and context propagation |

### Scope
This is a single large file change (~10 step functions rewritten). The InfoTooltip component and CSS classes already exist.

