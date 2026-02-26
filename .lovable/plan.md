

# Prompt Genius — Dashboard Hub

Build the main dashboard screen that users see after login, where they choose between 3 AI modes.

## 1. Theme & Typography Setup
- Import **Syne** (titles) and **DM Sans** (body) from Google Fonts
- Configure dark/light mode using `next-themes` with custom CSS variables:
  - Dark: `#0A0A0F` background with noise texture overlay
  - Light: `#F4F3EF` off-white warm background
  - Accent: `#7C5CFC` (purple), secondary: `#00E5B0` (green-aqua neon)

## 2. Layout Components
- **AppShell** (`src/components/layout/AppShell.tsx`): Fixed header with:
  - "PG" logo badge + org name
  - Token usage pill (consumed/total)
  - Dark/Light theme toggle
  - User avatar dropdown
- Responsive wrapper for page content

## 3. Dashboard Hub Page
- **Greeting section**: Time-based greeting ("Bom dia/Boa tarde/Boa noite, {name}") + subtitle "O que vamos construir hoje?"
- **3 Mode Cards** in a responsive grid (3 columns → stacked on mobile):
  - **Modo Prompt** — purple accent, Sparkles icon, "Gerar e refinar prompts com IA"
  - **Modo SaaS Spec** — blue `#3B82F6` accent, FileCode icon, "Especificação técnica completa"
  - **Modo Misto** — green `#00E5B0` accent, Layers icon, "Prompt → Spec em um fluxo"
- Each card: icon, title, description, feature tags, "Iniciar" button with hover glow effect
- **Footer stats bar**: total prompts, specs, and sessions counts

## 4. Reusable Components
- **ModeCard** (`src/components/dashboard/ModeCard.tsx`): Glassmorphism card with gradient border on hover, icon, title, description, tags, and CTA button
- **UsageBar** (`src/components/dashboard/UsageBar.tsx`): Animated token consumption progress bar with gradient fill

## 5. Data Integration
- **useOrgStats hook** (`src/hooks/useOrgStats.ts`): Calls the existing `get_org_stats()` Supabase RPC to fetch token usage, prompt count, spec count, session count
- Fetch current user profile and org info from Supabase on mount
- Loading skeletons while data loads

## 6. Routing & Auth Guard
- Dashboard page at `/dashboard` route
- Redirect unauthenticated users to login (auth guard wrapper)
- Mode card clicks navigate to `/prompt`, `/saas-spec`, `/mixed` (placeholder pages for now)

## 7. Visual Polish
- Noise texture overlay on background
- Glassmorphism effects on cards (backdrop-filter blur)
- Gradient glow on hover states
- Smooth transitions for theme switching
- Fully responsive (mobile-first)

