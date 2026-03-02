# Environment Variables Configuration Guide

## 🔐 Required Environment Variables

### For Production Deployment

Set these environment variables in your hosting platform (Azure, AWS, Docker, etc.):

#### JWT Configuration
```bash
JWT_SIGNING_KEY=your-very-long-random-secret-key-at-least-32-characters
JWT_ISSUER=https://your-production-domain.com
JWT_AUDIENCE=https://your-production-domain.com
# Optional but recommended: separate pepper for password hashing
PASSWORD_PEPPER=another-long-random-secret-at-least-32-characters
```

#### Google OAuth Configuration (Optional)
```bash
GOOGLE_AUTH_ENABLED=true
GOOGLE_AUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_AUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_AUTH_REDIRECT_URI=https://your-api-domain.com/api/v1/auth/google/callback
GOOGLE_AUTH_FRONTEND_SUCCESS_URL=https://your-frontend-domain.com/
GOOGLE_AUTH_FRONTEND_FAILURE_URL=https://your-frontend-domain.com/login
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

# SMTP transport for reset codes
PasswordResetEmail__Enabled=true
PasswordResetEmail__Host=smtp.your-provider.com
PasswordResetEmail__Port=587
PasswordResetEmail__EnableSsl=true
PasswordResetEmail__Username=your-smtp-username
PasswordResetEmail__Password=your-smtp-password
PasswordResetEmail__FromAddress=no-reply@your-domain.com
PasswordResetEmail__FromName=TijarahJo Security
PasswordResetEmail__LogCodesWhenEmailDisabled=false
```

#### Two-Factor Authentication Configuration (Optional)
```bash
TwoFactor__Issuer=TijarahJo
TwoFactor__TimeStepSeconds=30
TwoFactor__AllowedTimeDriftSteps=1
TwoFactor__Digits=6
TwoFactor__LoginChallengeLifetimeSeconds=300
# Optional key overrides (defaults derive from JWT_SIGNING_KEY when omitted)
TwoFactor__SecretEncryptionKey=your-random-secret-for-at-rest-totp-encryption
TwoFactor__ChallengeSigningKey=your-random-secret-for-2fa-login-challenges
```

#### Database Configuration

**Option 1: Full Connection String (Recommended)**
```bash
DATABASE_CONNECTION_STRING=Data Source=your-server;Database=TijarahJoDB;User Id=sa;Password=YourSecurePassword;TrustServerCertificate=True;
```

**Option 2: Individual Components**
```bash
DB_HOST=your-database-server
DB_NAME=TijarahJoDB
DB_USER=sa
DB_PASSWORD=YourSecurePassword
```

#### CORS Configuration (Optional - defaults to FrontendUrl)
```bash
CORS__AllowedOrigins=https://your-frontend-domain.com,https://www.your-frontend-domain.com
FrontendUrl=https://your-frontend-domain.com
```

#### Runtime Feature Flags (Recommended for explicit behavior)
```bash
# API runtime controls
FeatureFlags__EnableRateLimiting=true
FeatureFlags__EnableHttpLogging=true
FeatureFlags__EnableHealthChecks=true
FeatureFlags__EnableInMemoryCaching=true

# Redis behavior controls
FeatureFlags__EnableRedisPresence=true
FeatureFlags__EnableRedisBackplane=true
FeatureFlags__RequireRedis=false
```

#### Redis Connection (when Redis features are enabled)
```bash
ConnectionStrings__Redis=localhost:6379
```

#### File Storage (post image uploads)
```bash
# Absolute or relative path for persisted uploads
FileStorage__RootPath=/var/lib/tijarahjo/uploads
# Public URL prefix served by API static files middleware
FileStorage__PublicBasePath=/uploads
# Optional overrides
FileStorage__PostImagesPath=post-images
FileStorage__MaxPostImageBytes=5242880
```

## 🛠️ Development Setup

For local development, you can still use `appsettings.Development.json` or set these environment variables:

```bash
# Development environment variables (optional)
JWT_SIGNING_KEY=your-local-dev-signing-key
PASSWORD_PEPPER=your-local-dev-password-pepper
DATABASE_CONNECTION_STRING=Data Source=localhost;Database=TijarahJoDB;User Id=sa;Password=your-local-dev-db-password;TrustServerCertificate=True;
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

### IIS
Set in `web.config` or use IIS Environment Variables feature.

## ✅ Verification

After setting environment variables, verify they're being read:
1. Check application startup logs
2. The app should fail fast if required variables are missing
3. Test JWT token generation to ensure signing key is working
