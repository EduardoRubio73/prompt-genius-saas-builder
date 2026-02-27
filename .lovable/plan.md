

## Plan: Create UnifiedMemorySidebar and Replace AppShell + Dashboard

### New Files to Create

1. **`src/lib/prompt-builder.ts`** — Export the `PromptInputs` type (referenced by all uploaded components but doesn't exist yet). Fields: `especialidade`, `persona`, `tarefa`, `objetivo`, `contexto`, `formato`, `restricoes`, `referencias`, `destino`.

2. **`src/hooks/useUnifiedMemory.ts`** — Copy from uploaded file. Hook that fetches `prompt_memory` and `saas_specs` from Supabase, unifies them into `UnifiedMemoryEntry[]`, and supports filtering by mode/favorites/gold/search.

3. **`src/components/UnifiedMemoryDetailDialog.tsx`** — Copy from uploaded file. Dialog showing full details of a memory entry with copy, use-as-base, favorite toggle, and delete actions.

4. **`src/components/UnifiedMemorySidebar.tsx`** — Copy from uploaded file. Collapsible sidebar with mode tabs, filter tabs, search, and entry cards. Supports toggle favorite and delete via Supabase mutations.

### Files to Replace

5. **`src/components/layout/AppShell.tsx`** — Replace with uploaded version. Changes: removes `orgName` prop, adds `userEmail`/`avatarUrl` props, replaces `UsageBar` with a compact credits pill using `Zap` icon, adds `DropdownMenuSeparator` and settings placeholder.

6. **`src/pages/Dashboard.tsx`** — Replace with uploaded version. Changes: adds `StatCard` sub-component with icons, `formatNumber` helper, `CreditCard` sub-component, `QuickAction` section, and a more detailed stats grid with credit balance info. Updates `AppShell` usage to pass `userEmail` and `avatarUrl` instead of `orgName`.

### Technical Notes

- The `PromptInputs` type must be created since it's imported by both `UnifiedMemoryDetailDialog` and `UnifiedMemorySidebar` from `@/lib/prompt-builder`.
- The uploaded `Dashboard.tsx` references `useNavigate` and additional icons (`Zap`, `TrendingUp`, `Clock`, `Star`, `ArrowRight`, `BarChart3`, `Crown`).
- The uploaded `AppShell.tsx` has a different props interface (no `orgName`, adds `userEmail`/`avatarUrl`) — the Dashboard usage must match.

