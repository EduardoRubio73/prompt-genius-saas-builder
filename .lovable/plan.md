

## Problem

The Edge Function returns a valid Stripe checkout URL (status 200), but `window.location.href = data.url` fails to redirect in the sandboxed preview iframe. The subscription checkout likely has the same issue.

## Fix

**File: `src/pages/ProfilePage.tsx`**

Change both checkout redirects (subscription + topup) from `window.location.href` to `window.open(url, "_blank")`, which works in sandboxed iframes by opening a new tab.

1. Line ~370 (subscription checkout): `window.location.href = data.url` → `window.open(data.url, "_blank")`
2. Line ~392 (topup checkout): `window.location.href = data.url` → `window.open(data.url, "_blank")`

This is a 2-line change in a single file.

