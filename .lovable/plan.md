

## Diagnosis: "Falha ao enviar WhatsApp"

### Root Cause

The Evolution API instance **"Genius"** is **disconnected or not initialized**. The API returns:

```
HTTP 400: {"response":{"message":["TypeError: Cannot read properties of undefined (reading 'sendMessage')"]}}
```

This means the WhatsApp session expired and the QR code needs to be re-scanned on the Evolution API dashboard.

**This is NOT a code bug** -- it's an infrastructure issue. However, the code has two problems worth fixing:

### Problem 1: Poor error parsing

In `sendWhatsAppCode` (Login.tsx line 101-103), the error response structure is `{status, error, response: {message: [...]}}`, but the code reads `err?.message` which is `undefined` at the top level, so it always falls back to the generic "Falha ao enviar WhatsApp" instead of showing the actual error reason.

### Problem 2: No pre-flight validation

The code calls `sendText` without first checking if the instance is connected, leading to cryptic errors.

### Plan

#### 1. Fix error parsing in `sendWhatsAppCode` (Login.tsx)

Parse the Evolution API error response correctly to extract the real message:
```typescript
const body = await response.json().catch(() => ({}));
const detail = body?.response?.message?.[0] ?? body?.message ?? body?.error;
```

Map known errors to user-friendly Portuguese messages:
- `sendMessage` undefined -> "Instancia WhatsApp desconectada. Contate o suporte."
- HTTP 401 -> "Token da Evolution API invalido."
- Generic -> Show the raw detail

#### 2. Add instance status check before sending (Login.tsx)

Before calling `sendText`, call `GET /instance/connectionState/{instance}` to verify the instance is connected. If not, throw a clear error immediately: "WhatsApp desconectado. O administrador precisa reconectar a instancia."

#### 3. Improve Admin WhatsApp test (WhatsAppSettings.tsx)

When the "Testar conexao" button is clicked, also check `connectionState` for the specific instance and show a simple status: "Conectado" or "Desconectado - escaneie o QR Code".

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Login.tsx` | Fix error parsing in `sendWhatsAppCode`, add instance connection check before send |
| `src/pages/admin/WhatsAppSettings.tsx` | Show instance connection status in test results |

### Immediate Action Required (External)

You must reconnect the WhatsApp instance on the Evolution API dashboard:
1. Go to `https://zragency-evolution-api.cchxwl.easypanel.host`
2. Find instance **"Genius"**
3. Re-scan the QR Code to reconnect WhatsApp

Without this step, no code change will fix the sending failure.

