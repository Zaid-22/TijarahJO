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

## 🛠️ Development Setup

For local development, you can still use `appsettings.Development.json` or set these environment variables:

```bash
# Development environment variables (optional)
JWT_SIGNING_KEY=your-local-dev-signing-key
PASSWORD_PEPPER=your-local-dev-password-pepper
DATABASE_CONNECTION_STRING=Data Source=localhost;Database=TijarahJoDB;User Id=sa;Password=your-local-dev-db-password;TrustServerCertificate=True;
```

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
