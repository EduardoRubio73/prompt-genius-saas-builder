

## Fix: Admin Credits Not Saving

### Root Causes

1. **Missing data**: `admin_users_overview` view doesn't include `plan_credits_total`, `bonus_credits_total`, etc. The form defaults to `0` instead of the real values.
2. **JS falsy bug**: Line 88 uses `form.plan_credits_total || undefined` — when the value is `0`, `0 || undefined` evaluates to `undefined`, so the field is omitted from the update.

### Solution

**1. Fetch actual org data when dialog opens**
- In `UserDetailDialog`, add a query to fetch the organization record directly from `organizations` table using `user.org_id`
- Initialize `plan_credits_total` and `bonus_credits_total` from the real org data

**2. Fix the save logic**
- Remove `|| undefined` guards — always send `plan_credits_total` and `bonus_credits_total` to the update call
- This ensures `0` is a valid value that gets saved

### Files to Edit

| File | Change |
|------|--------|
| `src/pages/admin/AdminUsers.tsx` | Add org data fetch, fix form init + save logic |

### Details

```tsx
// Add useEffect to load real org data
const [orgData, setOrgData] = useState<any>(null);
useEffect(() => {
  if (user.org_id) {
    supabase.from("organizations").select("plan_credits_total, bonus_credits_total, plan_credits_used, bonus_credits_used").eq("id", user.org_id).single()
      .then(({ data }) => {
        if (data) {
          setForm(f => ({ ...f, plan_credits_total: data.plan_credits_total, bonus_credits_total: data.bonus_credits_total }));
        }
      });
  }
}, [user.org_id]);

// Fix save — no more || undefined
updates: { plan_tier: form.plan_tier, is_active: form.is_active, plan_credits_total: form.plan_credits_total, bonus_credits_total: form.bonus_credits_total }
```

