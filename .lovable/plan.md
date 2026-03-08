

## Plan: Add WhatsApp Settings Page to Admin Panel

Based on the uploaded instruction file, there are 4 changes to implement:

### 1. Create `src/pages/admin/WhatsAppSettings.tsx`
New admin page with the exact code from the uploaded file. Features:
- Form with 3 fields (URL, API Key, Instance) stored in `admin_settings` table with `category = "whatsapp"`
- Show/hide toggle for the secret API key field
- "Test connection" button that calls Evolution API's `fetchInstances` endpoint
- "Save" button that upserts all 3 keys to `admin_settings`
- Uses existing admin CSS classes (`adm-input`, `adm-btn`, etc.)

### 2. Update `AdminLayout.tsx`
- Add `MessageCircle` to the lucide-react import
- Add new nav item `{ to: "/admin/settings/whatsapp", icon: MessageCircle, label: "Config. WhatsApp" }` in the "Sistema" section, before "Logs e Auditoria"

### 3. Update `App.tsx`
- Import `WhatsAppSettings`
- Add route `<Route path="settings/whatsapp" element={<WhatsAppSettings />} />` inside the admin routes block

### 4. Update `Login.tsx`
- Remove the 3 `VITE_EVOLUTION_*` env constants
- Add `getEvolutionConfig()` function that fetches from `admin_settings` table (category = "whatsapp")
- Update `sendWhatsAppCode()` to call `getEvolutionConfig()` dynamically instead of using env vars

### No database changes needed
The `admin_settings` table already exists with `key`, `value`, `category`, `description`, `is_secret` columns. The upsert uses `onConflict: "key"`.

| File | Action |
|------|--------|
| `src/pages/admin/WhatsAppSettings.tsx` | Create (from uploaded file) |
| `src/pages/admin/AdminLayout.tsx` | Add sidebar item |
| `src/App.tsx` | Add route |
| `src/pages/Login.tsx` | Replace env vars with DB lookup |

