

## Plan: 4 Fixes

### 1. Build Error — BuildMode.tsx not found
The file exists but Vite can't resolve it. Will re-save `src/pages/build/BuildMode.tsx` with a trivial whitespace change to force Vite to re-index.

### 2. Memory + History pages — Add back button and BUILD filter

**`src/pages/MemoryPage.tsx`**:
- Add `useNavigate` and an `ArrowLeft` back button linking to `/dashboard` before the "Memória" heading
- Add `build` to the `MODE_META` map and to the `activeMode` type
- Add a "Build" tab to `modeTabs` array using `counts.build`

**`src/pages/HistoryPage.tsx`**:
- Add an `ArrowLeft` back button linking to `/dashboard` before the "Histórico" heading
- Add `build` to `MODE_META`, `Session.mode` type, and the mode filter buttons array

### 3. AppShell Header — Replace credits pill with app name

**`src/components/layout/AppShell.tsx`**:
- Remove the entire credits/usage pill div (lines 65-80)
- Next to the logo, add text: `"Prompt Genius SaaS Builder Engineer - Assistant"`
- Remove `tokenConsumed`/`tokenTotal` props and related logic (usagePct, usageColor)

### 4. User name not showing in dropdown

The dropdown shows `userName` which comes from `profile?.full_name`. If `full_name` is null in the database, it falls back to "Usuário". The fix: in `AppShell`, derive a display name by falling back from `full_name` → first part of email → "Usuário". This ensures the name always shows something meaningful.

**`src/components/layout/AppShell.tsx`** line 37-39:
```tsx
const displayName = userName || (userEmail ? userEmail.split("@")[0] : "Usuário");
```
Use `displayName` everywhere `userName` was used (initials, dropdown header, trigger button).

### Files to change
1. `src/pages/build/BuildMode.tsx` — re-save (touch)
2. `src/components/layout/AppShell.tsx` — remove credits pill, add app name, fix user name fallback
3. `src/pages/MemoryPage.tsx` — add back button, add BUILD mode tab
4. `src/pages/HistoryPage.tsx` — add back button, add BUILD mode filter

