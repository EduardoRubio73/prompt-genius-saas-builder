

## Evolution API Webhook

You're right — for a robust WhatsApp integration, a webhook endpoint is needed. The Evolution API sends events (delivery status, connection changes, incoming messages) to a configured URL. Currently, your integration is **one-directional only** (send OTP), with no way to know if the message was actually delivered or if the instance disconnected.

### What the webhook would handle

| Event | Purpose |
|-------|---------|
| `messages.upsert` | Detect incoming replies (future: conversational flows) |
| `connection.update` | Know when instance connects/disconnects — update a status flag in `admin_settings` |
| `messages.update` | Delivery receipts (sent, delivered, read) |

### Architecture

```text
Evolution API Instance
        │
        ▼  POST /functions/v1/evolution-webhook
┌──────────────────────┐
│  evolution-webhook    │
│  (Edge Function)     │
│                      │
│  1. Validate apikey  │
│  2. Parse event type │
│  3. Update DB status │
└──────────────────────┘
```

### Plan

#### 1. Create Edge Function `evolution-webhook`

**File:** `supabase/functions/evolution-webhook/index.ts`

- Accept POST from Evolution API
- Validate the request using the `apikey` header (same Evolution API key stored in `admin_settings`)
- Parse event type from the body
- For `connection.update`: upsert `admin_settings` key `evolution_connection_status` with value `open`/`close`
- For `messages.update`: optionally log delivery status
- Return 200 OK

#### 2. Add to `supabase/config.toml`

```toml
[functions.evolution-webhook]
verify_jwt = false
```

JWT disabled because Evolution API sends raw HTTP — authentication via apikey header matching the stored secret.

#### 3. Update Admin WhatsApp Settings

- Display the webhook URL for easy copy: `https://pcaebfncvuvdguyjmyxm.supabase.co/functions/v1/evolution-webhook`
- Show real-time connection status from `evolution_connection_status` setting
- Add instructions for configuring the webhook in Evolution API dashboard

### Configuration Required (on Evolution API side)

After deploying, you configure the webhook URL in your Evolution API instance:
```
https://pcaebfncvuvdguyjmyxm.supabase.co/functions/v1/evolution-webhook
```

With events: `CONNECTION_UPDATE`, `MESSAGES_UPDATE`, `MESSAGES_UPSERT`

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/evolution-webhook/index.ts` | New edge function to receive Evolution API events |
| `supabase/config.toml` | Add `evolution-webhook` with `verify_jwt = false` |
| `src/pages/admin/WhatsAppSettings.tsx` | Show webhook URL + connection status indicator |

