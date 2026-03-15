

# Fix Page Loading + Add Modo Skill Everywhere + Update README

## 1. Fix Page Not Loading

The app uses `basename="/genius"` and `base: "/genius/"` in Vite config, so accessing `/` shows a blank page. The simplest fix is to remove the `/genius` base path entirely — the published URL at `genius-engineer.lovable.app` doesn't need a subpath.

**Files:**
- `vite.config.ts` — remove `base: "/genius/"`, update PWA paths
- `src/App.tsx` — remove `basename="/genius"` from BrowserRouter
- `index.html` — update links that reference `/genius/` paths

## 2. Add "Modo Skill" to Landing Page

The landing page references only 4 modes. Skill mode (60 agents, 8 categories, 2 credits) is missing from:

**`src/pages/landing/LandingPage.tsx`:**
- **Stats bar** (line 459): Change `3` → `5 Modos de IA`
- **Hero subtitle** (line 427): "Quatro modos" → "Cinco modos"
- **Hero mockup** (lines 446-448): Add Skill card between Prompt and Misto
- **Features grid** (lines 472-477): Add Skill card to the 4-column grid (make it 5 or reorganize)
- **Modes section** (lines 490-496): Change "Quatro modos" → "Cinco modos", add Skill card with badge, pill "2 cotas por geração"
- **Pricing rows** (lines 612-615): Add `⚡ Skills (2 cotas)` row with `skills_limit` or calculated value
- **Terms** (line 41): Add "Modo Skill" to the list of modes
- **FAQ** (line 667): Update cost description to include Skill = 2 cotas

## 3. Update README for Marketing

**`README.md`:** Complete rewrite with:
- Marketing-oriented intro with benefits and value proposition
- Updated mode table (5 modes including Skill)
- Key features highlights (60 agents, 8 categories, cache semântico, mini-app generation)
- Updated routes table
- Brief technical stack summary
- Keep essential technical docs but add a "Why Prompt Genius" section at the top

### Key content additions for README:
- **5 modes** table with Skill mode (`/prompt?mode=skill`, 2 credits, 60 agents in 8 categories)
- **Benefits**: Economy (BUILD = R$4.35 vs R$25-60 manual), speed (<3s), referral program, semantic cache
- **Google Sign-In** mention in auth flow
- Published URL update to `genius-engineer.lovable.app`

