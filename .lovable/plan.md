

# Fix: Prompt Mode not saving and session stuck as "Em andamento"

## Root Causes

Two bugs in `src/pages/prompt/PromptMode.tsx`:

1. **Session never marked completed** — after generation finishes, there's no `UPDATE sessions SET completed = true`. The MistoMode does this but PromptMode doesn't.

2. **Auto-save uses stale state** — the code reads `fields` and `promptGerado` from React state (closure), but those values were just set via `setFields()` / `setPromptGerado()` and haven't re-rendered yet. So `fields` is `null` (for free mode) and `promptGerado` is `""`. This means:
   - In free mode: `finalFields` is `null` → entire save block is skipped
   - Even if it ran: `prompt_gerado` would be empty string

## Fix

In `handleGenerate`, after the refine calls:

1. Use **local variables** (`refined`, `r.prompt_gerado`) for the auto-save instead of reading from state
2. Add `await supabase.from("sessions").update({ completed: true }).eq("id", currentSessionId)` before auto-save
3. Pass the correct `prompt_gerado` value from the local `r.prompt_gerado` variable

### Concrete change (lines ~137-157)

Replace the auto-save block to:
- Use the local `refined` variable (already available in both branches) instead of `fields`
- Use the local prompt text from `r.prompt_gerado` instead of stale `promptGerado`
- Mark session as completed

```typescript
setTimeElapsed((Date.now() - startTime.current) / 1000);
setStep("results");
fetchBalance();

// Mark session completed
await supabase.from("sessions").update({ completed: true }).eq("id", currentSessionId);

// Auto-save using local variables (state hasn't updated yet)
const finalPrompt = /* r.prompt_gerado from whichever branch ran */;
const finalFields = refined; // local var from the branch above
try {
  await supabase.from("prompt_memory").insert({
    session_id: currentSessionId, org_id: orgId, user_id: user.id,
    especialidade: finalFields.especialidade, persona: finalFields.persona,
    tarefa: finalFields.tarefa, objetivo: finalFields.objetivo,
    contexto: finalFields.contexto,
    destino, prompt_gerado: finalPrompt, rating: null, categoria: "prompt",
  });
  setIsSaved(true);
  setMemoryRefreshKey(k => k + 1);
  toast.success("✅ Salvo automaticamente");
} catch (e) {
  console.warn("Auto-save falhou:", e);
}
```

To make the local variables accessible across branches, hoist `let localRefined` and `let localPrompt` before the `if/else`, then assign in each branch.

### File modified

| File | Change |
|------|--------|
| `src/pages/prompt/PromptMode.tsx` | Fix stale state in auto-save, mark session completed |

