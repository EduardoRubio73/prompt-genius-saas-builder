

## Plan: Full Admin CRUD Overhaul

This is a large-scope upgrade to transform the admin panel from read-only dashboards into a full CRUD management system.

### Database Changes

**1. Add `stripe_payment_link` column to `billing_products`**
```sql
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS stripe_payment_link text;
```

**2. Add admin RLS policies for write access**
Currently `billing_products` and `billing_prices` only allow SELECT. Need INSERT/UPDATE/DELETE policies for super_admin on both tables. Also need admin write policies on `organizations` and `profiles` for user management.

```sql
-- billing_products: admin full CRUD
CREATE POLICY "admin_products_all" ON public.billing_products FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- billing_prices: admin full CRUD  
CREATE POLICY "admin_prices_all" ON public.billing_prices FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- profiles: admin can update any profile
CREATE POLICY "admin_profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (is_super_admin());

-- profiles: admin can select all
CREATE POLICY "admin_profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (is_super_admin());

-- organizations: admin can update any org
CREATE POLICY "admin_orgs_update" ON public.organizations FOR UPDATE TO authenticated
  USING (is_super_admin());

-- organizations: admin can select all
CREATE POLICY "admin_orgs_select" ON public.organizations FOR SELECT TO authenticated
  USING (is_super_admin());
```

### Frontend Changes

**1. AdminBilling.tsx — Full rewrite with 3 tabs**
- **Planos (Products)**: List all `billing_products` with toggle active/inactive, edit dialog (display_name, features, labels, stripe_payment_link, cta_label, etc.), create new product
- **Preços (Prices)**: List `billing_prices`, edit unit_amount, toggle active, link to product
- **Assinaturas**: Keep existing subscriptions + invoices view

**2. AdminUsers.tsx — CRUD upgrade**
- Click row → open detail dialog showing all user info (profile, org, plan, credits, prompts count, specs count, sessions)
- Edit button: update full_name, email, plan_tier, account_status, is_active, credits (plan_credits_total, bonus_credits_total)
- Deactivate/reactivate org toggle
- View credit transactions history for that user/org

**3. AdminPrompts.tsx — Detail dialog on row click**
- Click any prompt row → open a detail dialog showing ALL fields: especialidade, persona, tarefa, objetivo, contexto, formato, restricoes, referencias, prompt_gerado (full text), rating, rating_comment, tags, tokens_consumed, destino, session_mode, created_at
- Add tab or toggle to also show SaaS Specs (from `admin_saas_specs_overview`) with: project_name, stack_frontend, stack_backend, stack_database, revenue_model, answers, spec_md, rating
- Delete prompt/spec action

**4. AdminAIConfig.tsx — Add Model Configs CRUD**
- Currently only manages `admin_settings` key-value pairs
- Add a section for `admin_model_configs` table: list all models, toggle active/default, edit temperature/max_tokens/cost fields, create new model config

**5. AdminFlags.tsx — Full CRUD**
- Currently can only toggle existing flags
- Add: create new flag (flag key, label, description, rollout_pct)
- Edit existing flag details
- Delete flag

**6. New page: AdminOrganizations.tsx (optional, embedded in users)**
- Manage orgs: view all orgs, edit plan_tier, credits, account_status, max_members

### Files to Create/Edit

| File | Action |
|------|--------|
| Migration SQL | Add `stripe_payment_link` + admin RLS policies |
| `src/pages/admin/AdminBilling.tsx` | Full rewrite: 3-tab CRUD for products, prices, subscriptions |
| `src/pages/admin/AdminUsers.tsx` | Add detail/edit dialog, CRUD actions |
| `src/pages/admin/AdminPrompts.tsx` | Add detail dialog with all fields, SaaS specs tab, delete |
| `src/pages/admin/AdminAIConfig.tsx` | Add model configs CRUD section |
| `src/pages/admin/AdminFlags.tsx` | Add create/edit/delete flag dialogs |
| `src/hooks/admin/useAdminData.ts` | Add mutations for products, prices, users, prompts, model configs, flags CRUD |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

### Implementation Order
1. Migration (schema + RLS policies)
2. `useAdminData.ts` — add all missing mutations
3. `AdminBilling.tsx` — products/prices CRUD with stripe_payment_link
4. `AdminUsers.tsx` — detail dialog + edit
5. `AdminPrompts.tsx` — detail dialog with all prompt/spec fields
6. `AdminAIConfig.tsx` — model configs CRUD
7. `AdminFlags.tsx` — create/edit/delete

