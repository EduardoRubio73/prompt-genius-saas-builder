

# Fix Mobile Header + Contact Modal

## Problems
1. **Mobile header**: Nav text "Prompt Genius SaaS Builder Engineer" overflows, "Começar Grátis" button gets cramped
2. **Contact modal**: On mobile (390px), the modal content causes scroll issues — textarea, categories, buttons, share section all crammed with poor spacing

## Changes

### `src/pages/landing/landing.css`

**Nav mobile fix** (add to existing `@media(max-width:768px)`):
- Hide `.nav-name` on screens ≤ 640px (already hidden via `.nav-link` but name still shows)
- Reduce `.nav-btn` padding on mobile
- Add `@media(max-width:480px)` to hide `.nav-name` and shrink nav button

**Contact modal mobile fix**:
- Reduce `.landing-modal` padding to `20px` on mobile
- Reduce `max-height` to `85vh` for better fit
- Make `.contact-categories` gap smaller, font smaller on mobile  
- Reduce `.contact-textarea` min-height to `70px` on mobile
- Make `.contact-btn` full-width stack vertically on small screens
- Reduce `.contact-logo img` height on mobile
- Reduce heading font-size in modal on mobile
- Reduce `.contact-share` padding on mobile

Add a single `@media(max-width:480px)` block for all these contact modal + nav fixes.

### Files
- `src/pages/landing/landing.css` — add mobile responsive rules

