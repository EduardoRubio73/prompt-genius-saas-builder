

## Problem

The `useEffect` on line 163-165 watches the `user` state and auto-navigates to `/dashboard` as soon as a session exists. Since `signInWithPassword` immediately creates a session, the `useAuth` hook fires `setUser`, and the redirect happens before the verification modal can be used.

```typescript
// This fires immediately after successful signInWithPassword
useEffect(() => {
  if (user) navigate("/dashboard", { replace: true });
}, [user, navigate]);
```

## Fix

**File: `src/pages/Login.tsx`**

1. Add a `verificationPending` ref (not state, to avoid re-render race) that is set to `true` when WhatsApp verification is needed.
2. Guard the auto-redirect `useEffect` to skip navigation when `verificationPending` is `true`.
3. On successful verification (`handleVerifyCode`), set `verificationPending` to `false` and then navigate.
4. If the user closes the modal without verifying, sign them out (block access).

Key changes:

| Area | Change |
|------|--------|
| New ref | `const verificationPending = useRef(false)` |
| Auto-redirect guard | `if (user && !verificationPending.current) navigate(...)` |
| Before opening modal | `verificationPending.current = true` |
| After successful verify | `verificationPending.current = false; navigate("/dashboard")` |
| Modal `onOpenChange(false)` | Sign out + reset state (user cannot bypass) |

