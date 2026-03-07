

## Issues Identified

After analyzing the codebase and screenshots, here are the interconnected problems:

### 1. Sessions always "Incompleta"
In `MistoMode.tsx`, the session is created at line 88-90 but **never updated to `completed: true`** after the flow finishes. The `HistoryPage` checks `session.completed` to show the badge and the "Ver" button.

### 2. History cards not clickable
The "Ver" button (line 70-77 of HistoryPage) only renders when `session.completed === true`. Since sessions are never marked complete, the button never appears.

### 3. Misto missing from Memory page tabs
`MemoryPage.tsx` line 122-127 defines `modeTabs` but omits `mixed`. Only has: all, prompt, saas, build.

### 4. Misto entries classified as "prompt" instead of "mixed"
In `useUnifiedMemory.ts` line 91, ALL `prompt_memory` entries get `type: "prompt"`. But Misto saves with `categoria: "misto"` -- these should get `type: "mixed"` so filtering works.

### 5. Mixed count always 0
`useUnifiedMemory.ts` line 201: `mixed: 0` is hardcoded. Should count entries with `type === "mixed"`.

### 6. Cards missing actual date/time
Memory cards only show relative time ("há 6 minutos"). User wants actual date + time displayed.

---

## Plan

### File 1: `src/pages/misto/MistoMode.tsx`
- After `setStep("results")` (line 133), update the session: `supabase.from("sessions").update({ completed: true, raw_input: userInput }).eq("id", currentSessionId)`
- This fixes the "Incompleta" badge and makes sessions clickable in History.

### File 2: `src/hooks/useUnifiedMemory.ts`
- **Line 91**: Change type assignment to check `e.categoria === "misto"` → set `type: "mixed"`, otherwise `type: "prompt"`.
- **Line 201**: Replace `mixed: 0` with actual count: `promptEntries.filter(e => e.type === "mixed").length` and adjust `prompt` count to exclude mixed.

### File 3: `src/pages/MemoryPage.tsx`
- **Line 122-127**: Add `{ key: "mixed", label: "Misto", icon: "⚡", count: counts.mixed }` to modeTabs.

### File 4: `src/components/UnifiedMemorySidebar.tsx`
- **Line 115**: Add "Build" to the label switch so it doesn't show as "Misto" for build entries.

### File 5: Memory cards date/time display
- In `MemoryPage.tsx` `MemoryCard`: add formatted date+time (e.g., "07/03 14:32") alongside the relative time.
- In `UnifiedMemorySidebar.tsx` `EntryCard`: show formatted date+time instead of just "6m".

### File 6: `src/pages/HistoryPage.tsx`
- Make all session cards clickable (not just completed ones). Click navigates to the mode route or opens details.

