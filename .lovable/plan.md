

# Fix: Google OAuth `redirect_uri_mismatch` (Error 400)

This is a **Google Cloud Console configuration issue**, not a code issue. The redirect URI registered in your Google OAuth credentials doesn't match what Supabase sends.

## What you need to do

Go to **Google Cloud Console** > **APIs & Credentials** > your OAuth 2.0 Client ID, and add this exact URL under **Authorized redirect URIs**:

```
https://pcaebfncvuvdguyjmyxm.supabase.co/auth/v1/callback
```

Also add under **Authorized JavaScript origins**:
```
https://genius-engineer.lovable.app
```

## Steps

1. Open [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add: `https://pcaebfncvuvdguyjmyxm.supabase.co/auth/v1/callback`
4. Under **Authorized JavaScript origins**, add: `https://genius-engineer.lovable.app`
5. Save

No code changes needed. After updating the Google credentials, Google Sign-In should work.

