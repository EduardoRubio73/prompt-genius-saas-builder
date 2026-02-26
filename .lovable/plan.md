

# Rename to "Prompt Genius SaaS Builder" + Add Logo

## Changes

### 1. Copy logo to project
- Copy `user-uploads://Logo_Prompt_Genius_SaaS_Builder.png` to `src/assets/logo.png`

### 2. `index.html` — Update meta tags
- Title: "Prompt Genius SaaS Builder — Dashboard"
- Author, og:title: "Prompt Genius SaaS Builder"

### 3. `src/pages/Login.tsx` — Replace "PG" box + text with logo image
- Remove the `div` with "PG" initials
- Add `<img>` with the logo (imported from `@/assets/logo.png`), sized ~80px height
- Change `<h1>` text to "Prompt Genius SaaS Builder"

### 4. `src/components/layout/AppShell.tsx` — Replace "PG" badge with logo
- Import logo from `@/assets/logo.png`
- Replace the 8x8 "PG" div with an `<img>` of the logo (~32px height) in the header

### 5. `src/pages/admin/AdminLayout.tsx` — Update brand name
- Change "Prompt Genius" text to "Prompt Genius SaaS Builder"

