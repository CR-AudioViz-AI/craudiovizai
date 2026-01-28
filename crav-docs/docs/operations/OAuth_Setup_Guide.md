# CR AUDIOVIZ AI - OAUTH PROVIDER SETUP GUIDE
## Complete Instructions for All Providers

**Last Updated:** December 14, 2025  
**Supabase Callback URL:** `https://kteobfyferrukqeolofj.supabase.co/auth/v1/callback`

---

## ✅ ALREADY CONFIGURED

### Google OAuth
- **Status:** ✅ LIVE
- **Client ID:** `150636382388-rg1cfeqpll698gp7boil0ki5fpghv51v.apps.googleusercontent.com`

### GitHub OAuth  
- **Status:** ✅ LIVE
- **Client ID:** `Ov23li3ySRmrhd5yXBli`

---

## 🔧 PROVIDERS TO SET UP

### 1. APPLE (Sign in with Apple)
**Priority:** HIGH - Required for iOS users

**Setup Steps:**
1. Go to [Apple Developer](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click **+** to create a new identifier
4. Select **Services IDs** and click Continue
5. Enter:
   - Description: `CR AudioViz AI`
   - Identifier: `com.craudiovizai.auth`
6. Click **Register**, then click on the created Service ID
7. Enable **Sign in with Apple**
8. Click **Configure** and add:
   - Primary App ID: Your main App ID
   - Domains: `craudiovizai.com`
   - Return URLs: `https://kteobfyferrukqeolofj.supabase.co/auth/v1/callback`
9. Create a **Private Key**:
   - Go to **Keys** → **+**
   - Name: `CR AudioViz Auth Key`
   - Enable **Sign in with Apple**
   - Download the `.p8` file
10. Note your **Team ID** (top right of developer portal)

**Credentials Needed:**
- Services ID (e.g., `com.craudiovizai.auth`)
- Private Key (.p8 file contents, base64 encoded)
- Team ID
- Key ID

---

### 2. MICROSOFT (Azure AD)
**Priority:** HIGH - For enterprise/business users

**Setup Steps:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Enter:
   - Name: `CR AudioViz AI`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: `https://kteobfyferrukqeolofj.supabase.co/auth/v1/callback`
5. Click **Register**
6. Copy the **Application (client) ID**
7. Go to **Certificates & secrets** → **New client secret**
   - Description: `Supabase Auth`
   - Expires: 24 months
8. Copy the **Value** (client secret) immediately
9. Go to **API permissions** → **Add a permission**
   - Microsoft Graph → Delegated permissions
   - Add: `email`, `openid`, `profile`

**Credentials Needed:**
- Client ID (Application ID)
- Client Secret (Value)
- Azure URL: `https://login.microsoftonline.com/common`

---

### 3. LINKEDIN
**Priority:** MEDIUM - For professional/B2B users

**Setup Steps:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Enter:
   - App name: `CR AudioViz AI`
   - LinkedIn Page: Your company page
   - App logo: Upload logo
4. Click **Create app**
5. Go to **Auth** tab
6. Add OAuth 2.0 Redirect URL:
   - `https://kteobfyferrukqeolofj.supabase.co/auth/v1/callback`
7. Go to **Products** tab
8. Request access to **Sign In with LinkedIn using OpenID Connect**
9. Copy **Client ID** and **Client Secret** from Auth tab

**Credentials Needed:**
- Client ID
- Client Secret

---

### 4. DISCORD
**Priority:** MEDIUM - For gaming/community users (CRAIverse)

**Setup Steps:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Name: `CR AudioViz AI`
4. Go to **OAuth2** → **General**
5. Add Redirect:
   - `https://kteobfyferrukqeolofj.supabase.co/auth/v1/callback`
6. Copy **Client ID** and **Client Secret**
7. Under **OAuth2** → **URL Generator**:
   - Scopes: `identify`, `email`

**Credentials Needed:**
- Client ID (Application ID)
- Client Secret

---

### 5. FACEBOOK (Meta)
**Priority:** LOW - Declining usage, but still popular

**Setup Steps:**
1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Click **Create App**
3. Select **Consumer** or **Business**
4. Enter app name: `CR AudioViz AI`
5. Go to **Settings** → **Basic**
6. Add Platform → Website: `https://craudiovizai.com`
7. Go to **Facebook Login** → **Settings**
8. Add Valid OAuth Redirect URIs:
   - `https://kteobfyferrukqeolofj.supabase.co/auth/v1/callback`
9. Copy **App ID** and **App Secret**

**Credentials Needed:**
- App ID (Client ID)
- App Secret (Client Secret)

---

### 6. TWITTER/X
**Priority:** LOW - API access has become restricted/expensive

**Setup Steps:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a Project and App
3. Go to **App Settings** → **User authentication settings**
4. Enable OAuth 2.0
5. Add Callback URL:
   - `https://kteobfyferrukqeolofj.supabase.co/auth/v1/callback`
6. Request permissions: `Read users`, `Read email`
7. Copy **Client ID** and **Client Secret**

**Note:** Twitter API now requires paid access for certain features.

**Credentials Needed:**
- Client ID
- Client Secret

---

## 🚀 QUICK ENABLE COMMAND

Once you have credentials, run this to enable a provider:

```bash
# Example: Enable Discord
curl -X PATCH \
  -H "Authorization: Bearer sbp_55d684d663942eb86670a65e0eb54b6f90966d13" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/kteobfyferrukqeolofj/config/auth" \
  -d '{
    "external_discord_enabled": true,
    "external_discord_client_id": "YOUR_CLIENT_ID",
    "external_discord_secret": "YOUR_CLIENT_SECRET"
  }'
```

---

## 📋 PROVIDER PRIORITY RECOMMENDATION

| Provider | Priority | Reason |
|----------|----------|--------|
| Apple | 🔴 HIGH | Required for iOS App Store compliance |
| Microsoft | 🔴 HIGH | Enterprise/B2B customers expect it |
| LinkedIn | 🟡 MEDIUM | Professional users, agencies |
| Discord | 🟡 MEDIUM | Gaming community, CRAIverse |
| Facebook | 🟢 LOW | Declining, privacy concerns |
| Twitter/X | 🟢 LOW | Expensive API, limited value |

---

## 📞 SUPPORT

Need help? Contact:
- **Email:** support@craudiovizai.com
- **Docs:** https://supabase.com/docs/guides/auth/social-login
