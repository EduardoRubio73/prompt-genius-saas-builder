

## Plan: Complete System Refactoring — New Pages, Routes, and Sidebar Integration

### Current State
- **AppShell**: Already has correct props (`userEmail`, `avatarUrl`), credits pill, user info in dropdown. Missing: `useNavigate` for "Meu perfil" and "Configurações" links.
- **Dashboard**: Already updated with StatCard, UsageDetailCard, QuickActionCard, links to `/memory` and `/history`.
- **useUnifiedMemory, UnifiedMemoryDetailDialog, UnifiedMemorySidebar**: Already created and working.

### Changes Required

#### 1. Fix AppShell navigation (src/components/layout/AppShell.tsx)
- Import `useNavigate` from react-router-dom
- Add `onClick={() => navigate("/profile")}` to "Meu perfil" menu item
- Add `onClick={() => navigate("/profile?tab=notifications")}` to "Configurações" menu item

#### 2. Create MemoryPage (src/pages/MemoryPage.tsx)
- Full-page memory library using `useUnifiedMemory` hook
- Mode tabs, filter pills, search bar, 3-column grid of cards
- Click opens `UnifiedMemoryDetailDialog`
- Content from uploaded `MemoryPage.tsx`

#### 3. Create HistoryPage (src/pages/HistoryPage.tsx)
- Fetches `sessions` table filtered by org_id
- Session cards with mode badges, status, tokens, duration
- Expandable raw_input, filter by mode/status
- Summary pills in header
- Content from uploaded `HistoryPage.tsx`

#### 4. Create ProfilePage (src/pages/ProfilePage.tsx)
- 4 tabs: Perfil, Segurança, Notificações, Plano & Cobrança
- Avatar upload, name editing, password change, notification toggles, plan display
- Reads `?tab=` from URL for initial tab
- Content from uploaded `ProfilePage.tsx`
- **Note**: Avatar upload requires a `avatars` storage bucket — will create via migration

#### 5. Add routes to App.tsx
- Add 3 new routes wrapped in `<AuthGuard>`: `/memory`, `/history`, `/profile`

#### 6. Add UnifiedMemorySidebar to mode pages
- **MistoMode.tsx**: Wrap content in flex layout, add sidebar with `defaultMode="mixed"`, add `memoryRefreshKey` state
- **PromptMode.tsx**: Same pattern with `defaultMode="prompt"`
- **SaasMode.tsx**: Same pattern with `defaultMode="saas"`

#### 7. Create avatars storage bucket (SQL migration)
- Create public `avatars` bucket for profile avatar uploads
- Add RLS policy allowing authenticated users to upload/read their own avatars

### Technical Notes
- ProfilePage notification toggles are UI-only (no `notification_preferences` column exists in `profiles`). Will store locally or note to user.
- All new pages use existing `AppShell`, `useAuth`, `useProfile`, `useTokenBudget` hooks without modification.
- The uploaded files reference `useTokenBudget` which already exists in `useOrgStats.ts`.

