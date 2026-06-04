# Environment Variables Configuration Guide

## 🔐 Required Environment Variables

### For Production Deployment

Set these environment variables in your hosting platform (Azure, AWS, Docker, etc.):

#### JWT Configuration
```bash
JWT_SIGNING_KEY=your-very-long-random-secret-key-at-least-32-characters
JWT_ISSUER=https://tijarahjo.online
JWT_AUDIENCE=https://tijarahjo.online
FRONTEND_URL=https://tijarahjo.online
CORS_ALLOWED_ORIGINS=https://tijarahjo.online,https://www.tijarahjo.online
ALLOWED_HOSTS=tijarahjo.online;www.tijarahjo.online
# Semicolon-separated — ASP.NET does not accept comma-separated host lists.
# Optional but recommended: separate pepper for password hashing
PASSWORD_PEPPER=another-long-random-secret-at-least-32-characters
```

#### Google OAuth Configuration (Optional)
```bash
GOOGLE_AUTH_ENABLED=true
GOOGLE_AUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_AUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_AUTH_REDIRECT_URI=https://tijarahjo.online/api/v1/auth/google/callback
GOOGLE_AUTH_FRONTEND_SUCCESS_URL=https://tijarahjo.online/
GOOGLE_AUTH_FRONTEND_FAILURE_URL=https://tijarahjo.online/login
# Optional overrides:
# GOOGLE_AUTH_ALLOWED_AUDIENCES=client-id-1.apps.googleusercontent.com,client-id-2.apps.googleusercontent.com
# GOOGLE_AUTH_ALLOWED_ISSUERS=https://accounts.google.com,accounts.google.com
```

#### Password Reset & Email Verification Configuration (Optional but Recommended)
```bash
# Password reset behavior
PasswordReset__Enabled=true
PasswordReset__CodeLength=6
PasswordReset__CodeLifetimeMinutes=15
PasswordReset__MaxAttempts=5
PasswordReset__RequestCooldownSeconds=60

# Resend transport for reset codes
PasswordResetEmail__Enabled=true
PasswordResetEmail__ResendApiKey=your-resend-api-key
PasswordResetEmail__FromAddress=no-reply@tijarahjo.online
PasswordResetEmail__FromName=TijarahJo Security
PasswordResetEmail__LogCodesWhenEmailDisabled=false

# Resend transport for two-factor codes
EmailTwoFactor__Enabled=true
EmailTwoFactor__ResendApiKey=your-resend-api-key
EmailTwoFactor__FromAddress=no-reply@tijarahjo.online
EmailTwoFactor__FromName=TijarahJo Security
EmailTwoFactor__LogCodesWhenEmailDisabled=false
```

#### Two-Factor Authentication Configuration
```bash
TwoFactor__Issuer=TijarahJo
TwoFactor__TimeStepSeconds=30
TwoFactor__AllowedTimeDriftSteps=1
TwoFactor__Digits=6
TwoFactor__LoginChallengeLifetimeSeconds=300
# Required outside development. In Development only, these may fall back to
# values derived from JWT_SIGNING_KEY for local convenience.
TwoFactor__SecretEncryptionKey=your-random-secret-for-at-rest-totp-encryption
TwoFactor__ChallengeSigningKey=your-random-secret-for-2fa-login-challenges
```

#### Database Configuration

**Option 1: Full Connection String (Recommended)**
```bash
DATABASE_CONNECTION_STRING=Data Source=your-server;Database=TijarahJoDB;User Id=tijarahjo_app;Password=YourSecurePassword;TrustServerCertificate=True;
```

**Option 2: Individual Components**
```bash
DB_HOST=your-database-server
DB_NAME=TijarahJoDB
DB_USER=tijarahjo_app
DB_PASSWORD=YourSecurePassword
```

Provision the runtime app login before starting production API instances. Use the existing bootstrap/provisioning scripts with `DB_RUNTIME_PRINCIPAL=app`, `DB_APP_LOGIN`, and `DB_APP_PASSWORD`; reserve the SQL Server `sa` login for bootstrap and administration only.

#### CORS Configuration (Optional - defaults to FrontendUrl)
```bash
CORS__AllowedOrigins=https://tijarahjo.online,https://www.tijarahjo.online
FrontendUrl=https://tijarahjo.online
```

#### Runtime Feature Flags (Recommended for explicit behavior)
```bash
# API runtime controls
FeatureFlags__EnableRateLimiting=true
FeatureFlags__EnableHttpLogging=true
FeatureFlags__EnableHealthChecks=true
FeatureFlags__EnableInMemoryCaching=true
FeatureFlags__EnableAiComparison=true

# Redis behavior controls
FeatureFlags__EnableRedisPresence=true
FeatureFlags__EnableRedisBackplane=true
FeatureFlags__RequireRedis=false
```

#### Redis Connection (when Redis features are enabled)
```bash
ConnectionStrings__Redis=localhost:6379
```

#### Gemini AI Configuration (Required for Post Comparison)
```bash
Gemini__ApiKey=your-gemini-secure-api-key
# Set FeatureFlags__EnableAiComparison=false to disable outbound AI comparison calls.
# When enabled, comparison sends listing name, price, category, description, city,
# and view metadata to Gemini.
# Defaults (usually fine to omit):
# Gemini__ModelName=gemini-2.5-flash
# Gemini__FallbackModelName=gemini-3-flash-preview
```

#### YouTube Recommendations Configuration (Optional)
```bash
YouTube__ApiKey=your-youtube-data-api-key
# Optional absolute URL used as the outbound Referer header when your YouTube key
# is restricted by HTTP referrer.
YouTube__Referer=https://tijarahjo.online/
```

#### Image moderation (Google Cloud Vision — optional)

Chat, post, and profile image uploads can call Vision **Safe Search** before storage. Set `ImageModeration__Enabled=false` to skip moderation (default in production Docker compose until Vision is configured). When enabled, missing or failing Vision returns HTTP 503 in Production.

```bash
ImageModeration__Enabled=false
# When true — path to service account JSON (Docker: GCP_VISION_CREDENTIALS_FILE in .env)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-vision-service-account.json
```

Setup (when enabling moderation):

1. Enable **Cloud Vision API** in Google Cloud Console.
2. Create a service account with **Cloud Vision API User** (or equivalent).
3. Download the JSON key and set `GOOGLE_APPLICATION_CREDENTIALS` to its path (local) or `GCP_VISION_CREDENTIALS_FILE` (production Docker compose).
4. Set `ImageModeration__Enabled=true` and redeploy the API.

#### File Storage (post image uploads)
```bash
# Absolute or relative path for persisted uploads
FileStorage__RootPath=/var/lib/tijarahjo/uploads
# Public URL prefix served by API static files middleware
FileStorage__PublicBasePath=/uploads
# Optional overrides
FileStorage__PostImagesPath=post-images
FileStorage__MaxPostImageBytes=10485760
FileStorage__OptimizeImages=true
FileStorage__ConvertImagesToWebp=true
FileStorage__MaxImageWidth=2048
FileStorage__MaxImageHeight=2048
FileStorage__WebpQuality=75
FileStorage__ThumbnailMaxImageWidth=640
FileStorage__ThumbnailMaxImageHeight=640
FileStorage__ThumbnailWebpQuality=60
```

#### Frontend Build-Time Configuration
```bash
VITE_API_BASE_URL=https://tijarahjo.online/api/v1
VITE_GOOGLE_AUTH_ENABLED=true
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-browser-key
VITE_GOOGLE_MAPS_MAP_ID=your-google-cloud-map-id
VITE_REQUEST_TIMEOUT_MS=10000
VITE_DEFAULT_CITY=Amman
VITE_DEFAULT_PHONE_PREFIX=+962
VITE_HOME_SEARCH_LIMIT=200
VITE_ALL_POSTS_SEARCH_LIMIT=200
VITE_SEARCH_RESULTS_LIMIT=100
# Optional additional connect-src origins. In production these are ignored
# unless VITE_CSP_ALLOW_PROD_CONNECT_SRC_EXTRA=1.
VITE_CSP_CONNECT_SRC_EXTRA=
VITE_CSP_ALLOW_PROD_CONNECT_SRC_EXTRA=0
```

## 🛠️ Development Setup

For local development, you can still use `appsettings.Development.json` or set these environment variables:

```bash
# Development environment variables (optional)
JWT_SIGNING_KEY=your-local-dev-signing-key
PASSWORD_PEPPER=your-local-dev-password-pepper
DATABASE_CONNECTION_STRING=Data Source=localhost;Database=TijarahJoDB;User Id=sa;Password=your-local-dev-db-password;TrustServerCertificate=True;
TwoFactor__SecretEncryptionKey=your-local-dev-2fa-secret-encryption-key
TwoFactor__ChallengeSigningKey=your-local-dev-2fa-challenge-signing-key
```

## Runtime Semantics

### Startup mode behavior

- If `FeatureFlags__RequireRedis=true` and Redis is unavailable: app startup fails.
- If `FeatureFlags__RequireRedis=false` and Redis is unavailable: app starts in degraded mode.

### Health probes

- `GET /health/live` checks process liveness.
- `GET /health/ready` checks dependency readiness (database connectivity).

### API versioning contract

- Canonical route prefix is `/api/v1`.
- Unversioned `/api/...` routes are not part of the supported contract; use `docs/reports/API_ENDPOINTS_STATUS.md` when you need the current endpoint inventory.
- Query/header API version overrides are not part of the supported contract.

## ⚠️ Security Notes

1. **Never commit environment variables to version control**
2. **Use strong, randomly generated keys for production**
3. **Rotate secrets regularly**
4. **Use secret management services** (Azure Key Vault, AWS Secrets Manager, etc.)

## 🔑 Generating a Secure JWT Signing Key

To generate a secure random key:

**Using OpenSSL:**
```bash
openssl rand -base64 64
```

**Using PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Using C# (one-liner):**
```csharp
Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64))
```

## 📝 Platform-Specific Instructions

### Azure App Service
1. Go to Configuration → Application settings
2. Add each environment variable
3. Save and restart the app

### AWS Elastic Beanstalk
1. Go to Configuration → Software → Environment properties
2. Add each environment variable
3. Apply changes

### Docker
Add to `infra/docker-compose.yml` or use `--env-file`:
```yaml
environment:
  - JWT_SIGNING_KEY=${JWT_SIGNING_KEY}
  - PASSWORD_PEPPER=${PASSWORD_PEPPER}
  - DATABASE_CONNECTION_STRING=${DATABASE_CONNECTION_STRING}
```

For the production compose stack, use `infra/docker-compose.production.yml`.
It reads shell variables such as `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`,
`ALLOWED_HOSTS`, `JWT_ISSUER`, `JWT_AUDIENCE`, `DB_APP_LOGIN`, and
`DB_APP_PASSWORD`, then maps them to the ASP.NET configuration keys used by the
API container.

### IIS
Set in `web.config` or use IIS Environment Variables feature.

## ✅ Verification

After setting environment variables, verify they're being read:
1. Check application startup logs
2. The app should fail fast if required variables are missing
3. Test JWT token generation to ensure signing key is working

Last Updated: 2026-05-22
