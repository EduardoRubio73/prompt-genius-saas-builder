

# Add Skills & Agentes Card to PromptInput

## Overview
Add a new collapsible "Skills & Agentes" card below the LLMs platform accordion and above the "Gerar Prompt" button in `PromptInput.tsx`. The selected skills will be passed up to `PromptMode.tsx` and included in the edge function payload.

## Changes

### 1. `src/components/prompt/PromptInput.tsx`
- Add `SKILL_CATEGORIES` constant with 5 categories and their skills (matching the HTML reference)
- Add `selectedSkills: string[]` state with toggle logic
- Add props `selectedSkills` and `onSelectedSkillsChange` to the interface
- Render the Skills card between the platform groups and the generate button, using the existing `platform-group` pattern but with skill-specific styling
- Card starts **open** by default
- Badge "NOVO" in purple next to the header label

### 2. `src/pages/prompt/PromptMode.tsx`
- Add `selectedSkills` state (`string[]`)
- Pass `selectedSkills` and `onSelectedSkillsChange` to `PromptInput`
- Include `selectedSkills` in the `callEdgeFunction("refine-prompt", ...)` payload for both distribute and refine actions

### 3. `src/pages/misto/misto.css`
Add styles for the skills card:
- `.skills-card` — same border-radius/shadow as `.platform-group`
- `.skills-card.open .skills-header` — bottom border `#f0ebff` (light) / purple-tinted (dark)
- `.skills-badge` — purple background (`#7c3aed`), white text, 10px, rounded
- `.skills-category-label` — 11px, uppercase, bold, gray
- `.skill-pill` — `background: #f5f0ff`, `border: #e8e0ff`, `color: #5b21b6`, rounded-full
- `.skill-pill:hover` — `background: #ede9fe`, `border: #c4b5fd`
- `.skill-pill.active` — `background: #7c3aed`, `border: #7c3aed`, `color: white`
- Dark mode variants using CSS variables

### 4. Files Modified

| File | Change |
|------|--------|
| `src/components/prompt/PromptInput.tsx` | Add skills data, state, and UI rendering |
| `src/pages/prompt/PromptMode.tsx` | Add `selectedSkills` state, pass to PromptInput, include in API payload |
| `src/pages/misto/misto.css` | Add `.skills-*` and `.skill-pill` CSS classes |

