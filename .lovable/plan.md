

## Analysis

After reviewing the codebase, here's what I found:

1. **`created_at` already exists** in both DB tables (`prompt_memory`, `saas_specs`) with `DEFAULT now()` -- it's always populated server-side.
2. **`UnifiedMemoryEntry` interface** already has `created_at: string | null` (line 16 of `useUnifiedMemory.ts`).
3. **The save flow in MistoMode** (lines 145-159) does NOT explicitly set `created_at` -- it relies on the DB default, which is correct, but the interface type allows `null`.

The real work is in **sorting logic** and **type tightening**.

## Plan

### 1. Tighten the `created_at` type in `UnifiedMemoryEntry`

Change `created_at: string | null` to `created_at: string` in the interface. In the normalization code, fallback to `new Date().toISOString()` if somehow null.

### 2. Refactor sorting in `useUnifiedMemory.ts`

Current sort (line 142-147): favorites first → rating desc → date desc.

New sort: favorites first → `created_at` desc (primary) → `title` asc (secondary, for same timestamp).

```typescript
let combined = [...promptEntries, ...saasEntries].sort((a, b) => {
  if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
  const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  if (dateCompare !== 0) return dateCompare;
  return (a.title ?? "").localeCompare(b.title ?? "", "pt-BR");
});
```

### 3. Update DB query ordering in `useUnifiedMemory.ts`

Change `.order("rating", { ascending: false })` to `.order("created_at", { ascending: false })` as primary, keeping consistency with the client-side sort.

### 4. Ensure `created_at` is explicitly set on save in `MistoMode.tsx`

Add `created_at: new Date().toISOString()` to both `prompt_memory` and `saas_specs` insert calls for explicit timestamp capture (not relying solely on DB default).

### 5. Apply same sorting in `MemoryPage.tsx`

The Memory page grid currently delegates to `useUnifiedMemory`, so changes there will automatically propagate -- no separate change needed.

### Files to modify
| File | Change |
|------|--------|
| `src/hooks/useUnifiedMemory.ts` | Tighten type, update sort logic, update query ordering |
| `src/pages/misto/MistoMode.tsx` | Add explicit `created_at` on both inserts |

