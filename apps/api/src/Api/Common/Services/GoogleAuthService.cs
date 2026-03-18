using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Common.Services;

public sealed record GoogleIdentityToken(
    string Subject,
    string Email,
    string GivenName,
    string FamilyName,
    string FullName,
    string? PictureUrl
);

public sealed record GoogleIdentityResult(
    bool Success,
    GoogleIdentityToken? Identity,
    string? Error
);

public sealed class GoogleAuthService
{
    private const string GoogleAuthorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private const string GoogleTokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string GoogleJwksEndpoint = "https://www.googleapis.com/oauth2/v3/certs";
    private const string GoogleJwksCacheKey = "google-auth-jwks";

    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _memoryCache;
    private readonly GoogleAuthOptions _configuredOptions;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(
        HttpClient httpClient,
        IMemoryCache memoryCache,
        IOptions<GoogleAuthOptions> configuredOptions,
        ILogger<GoogleAuthService> logger)
    {
        _httpClient = httpClient;
        _memoryCache = memoryCache;
        _configuredOptions = configuredOptions.Value;
        _logger = logger;
    }

    public bool IsConfigured
    {
        get
        {
            ResolvedGoogleAuthOptions options = ResolveOptions();
            return options.Enabled &&
                   !string.IsNullOrWhiteSpace(options.ClientId) &&
                   !string.IsNullOrWhiteSpace(options.ClientSecret) &&
                   Uri.TryCreate(options.RedirectUri, UriKind.Absolute, out _);
        }
    }

    public string GetDebugConfiguredError()
    {
        ResolvedGoogleAuthOptions options = ResolveOptions();
        return $"Enabled:{options.Enabled},ClientId:{!string.IsNullOrWhiteSpace(options.ClientId)},Secret:{!string.IsNullOrWhiteSpace(options.ClientSecret)},Uri:{Uri.TryCreate(options.RedirectUri, UriKind.Absolute, out _)}({options.RedirectUri})";
    }

    public string BuildAuthorizationUrl(string state, string nonce)
    {
        ResolvedGoogleAuthOptions options = ResolveOptions();
        var parameters = new Dictionary<string, string?>
        {
            ["client_id"] = options.ClientId,
            ["redirect_uri"] = options.RedirectUri,
            ["response_type"] = "code",
            ["scope"] = "openid email profile",
            ["state"] = state,
            ["nonce"] = nonce,
            ["access_type"] = "online",
            ["include_granted_scopes"] = "true"
        };

        if (!string.IsNullOrWhiteSpace(options.Prompt))
        {
            parameters["prompt"] = options.Prompt;
        }

        return QueryHelpers.AddQueryString(GoogleAuthorizationEndpoint, parameters);
    }

    public string GetFrontendSuccessUrl()
    {
        return ResolveOptions().FrontendSuccessUrl;
    }

    public string GetFrontendFailureUrl()
    {
        return ResolveOptions().FrontendFailureUrl;
    }

    public async Task<GoogleIdentityResult> ExchangeCodeForIdentityAsync(
        string code,
        string expectedNonce,
        CancellationToken cancellationToken = default)
    {
        ResolvedGoogleAuthOptions options = ResolveOptions();
        if (!options.Enabled)
        {
            return new GoogleIdentityResult(false, null, "Google sign-in is currently disabled.");
        }

        if (string.IsNullOrWhiteSpace(options.ClientId) ||
            string.IsNullOrWhiteSpace(options.ClientSecret))
        {
            return new GoogleIdentityResult(false, null, "Google sign-in is not configured.");
        }

        if (!Uri.TryCreate(options.RedirectUri, UriKind.Absolute, out _))
        {
            return new GoogleIdentityResult(false, null, "Google redirect URI is invalid.");
        }

        TokenExchangeResult exchangeResult = await ExchangeAuthorizationCodeAsync(
            options,
            code,
            cancellationToken
        );

        if (!exchangeResult.Success || string.IsNullOrWhiteSpace(exchangeResult.IdToken))
        {
            return new GoogleIdentityResult(
                false,
                null,
                exchangeResult.Error ?? "Failed to complete Google sign-in."
            );
        }

        return await ValidateIdentityTokenAsync(
            options,
            exchangeResult.IdToken,
            expectedNonce,
            cancellationToken
        );
    }

    private async Task<TokenExchangeResult> ExchangeAuthorizationCodeAsync(
        ResolvedGoogleAuthOptions options,
        string code,
        CancellationToken cancellationToken)
    {
        using var payload = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = options.ClientId,
            ["client_secret"] = options.ClientSecret,
            ["redirect_uri"] = options.RedirectUri,
            ["grant_type"] = "authorization_code"
        });

        try
        {
            using HttpResponseMessage response = await _httpClient.PostAsync(
                GoogleTokenEndpoint,
                payload,
                cancellationToken
            );

            string body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                string apiError = ReadJsonProperty(body, "error_description")
                    ?? ReadJsonProperty(body, "error")
                    ?? "Google authorization code exchange failed.";
                _logger.LogWarning(
                    "Google token exchange failed. status={StatusCode} error={Error}",
                    (int)response.StatusCode,
                    apiError
                );
                return new TokenExchangeResult(false, null, apiError);
            }

            string? idToken = ReadJsonProperty(body, "id_token");
            if (string.IsNullOrWhiteSpace(idToken))
            {
                return new TokenExchangeResult(
                    false,
                    null,
                    "Google sign-in response did not include an ID token."
                );
            }

            return new TokenExchangeResult(true, idToken, null);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Google token exchange request failed.");
            return new TokenExchangeResult(false, null, "Unable to reach Google sign-in services.");
        }
    }

    private async Task<GoogleIdentityResult> ValidateIdentityTokenAsync(
        ResolvedGoogleAuthOptions options,
        string idToken,
        string expectedNonce,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(expectedNonce))
        {
            return new GoogleIdentityResult(
                false,
                null,
                "Google sign-in session expired. Please try again."
            );
        }

        IReadOnlyCollection<SecurityKey> signingKeys = await GetGoogleSigningKeysAsync(cancellationToken);
        var tokenHandler = new JwtSecurityTokenHandler
        {
            MapInboundClaims = false
        };

        string[] audiences = options.AllowedAudiences
            .Append(options.ClientId)
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Select(static value => value.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        string[] issuers = options.AllowedIssuers
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Select(static value => value.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = signingKeys,
            ValidateIssuer = true,
            ValidIssuers = issuers,
            ValidateAudience = true,
            ValidAudiences = audiences,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),
            RequireSignedTokens = true,
            RequireExpirationTime = true
        };

        try
        {
            ClaimsPrincipal principal = tokenHandler.ValidateToken(
                idToken,
                validationParameters,
                out _
            );

            string nonce = ReadClaimValue(principal, "nonce");
            if (!FixedTimeEquals(nonce, expectedNonce))
            {
                return new GoogleIdentityResult(
                    false,
                    null,
                    "Google sign-in validation failed. Please try again."
                );
            }

            string email = ReadClaimValue(principal, "email");
            string emailVerifiedRaw = ReadClaimValue(principal, "email_verified");
            bool emailVerified = bool.TryParse(emailVerifiedRaw, out bool parsedVerified) && parsedVerified;

            if (string.IsNullOrWhiteSpace(email) || !emailVerified)
            {
                return new GoogleIdentityResult(
                    false,
                    null,
                    "Google account email is not verified."
                );
            }

            string subject = ReadClaimValue(principal, "sub");
            if (string.IsNullOrWhiteSpace(subject))
            {
                return new GoogleIdentityResult(
                    false,
                    null,
                    "Google sign-in response is missing account identity."
                );
            }

            string givenName = ReadClaimValue(principal, "given_name");
            string familyName = ReadClaimValue(principal, "family_name");
            string fullName = ReadClaimValue(principal, "name");
            string pictureUrl = ReadClaimValue(principal, "picture");

            if (string.IsNullOrWhiteSpace(givenName))
            {
                givenName = ResolveFirstNameFallback(fullName, email);
            }

            if (string.IsNullOrWhiteSpace(fullName))
            {
                fullName = $"{givenName} {familyName}".Trim();
            }

            var identity = new GoogleIdentityToken(
                subject,
                email.Trim().ToLowerInvariant(),
                givenName,
                familyName,
                fullName,
                string.IsNullOrWhiteSpace(pictureUrl) ? null : pictureUrl.Trim()
            );

            return new GoogleIdentityResult(true, identity, null);
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning(ex, "Google ID token validation failed.");
            return new GoogleIdentityResult(false, null, "Google sign-in token is invalid or expired.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Unexpected error while validating Google ID token.");
            return new GoogleIdentityResult(false, null, "Failed to validate Google sign-in.");
        }
    }

    private async Task<IReadOnlyCollection<SecurityKey>> GetGoogleSigningKeysAsync(
        CancellationToken cancellationToken)
    {
        if (_memoryCache.TryGetValue(
            GoogleJwksCacheKey,
            out IReadOnlyCollection<SecurityKey>? cachedKeys
        ) && cachedKeys is { Count: > 0 })
        {
            return cachedKeys;
        }

        using HttpResponseMessage response = await _httpClient.GetAsync(
            GoogleJwksEndpoint,
            cancellationToken
        );
        response.EnsureSuccessStatusCode();

        string json = await response.Content.ReadAsStringAsync(cancellationToken);
        var webKeySet = new JsonWebKeySet(json);
        IReadOnlyCollection<SecurityKey> signingKeys = webKeySet.GetSigningKeys().ToArray();

        if (signingKeys.Count == 0)
        {
            throw new InvalidOperationException("Google signing keys are unavailable.");
        }

        TimeSpan cacheTtl = response.Headers.CacheControl?.MaxAge ?? TimeSpan.FromHours(1);
        if (cacheTtl <= TimeSpan.Zero || cacheTtl > TimeSpan.FromHours(24))
        {
            cacheTtl = TimeSpan.FromHours(1);
        }

        _memoryCache.Set(GoogleJwksCacheKey, signingKeys, cacheTtl);
        return signingKeys;
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        if (string.IsNullOrEmpty(left) || string.IsNullOrEmpty(right))
        {
            return false;
        }

        byte[] leftBytes = System.Text.Encoding.UTF8.GetBytes(left);
        byte[] rightBytes = System.Text.Encoding.UTF8.GetBytes(right);
        if (leftBytes.Length != rightBytes.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private static string ReadClaimValue(ClaimsPrincipal principal, string claimType)
    {
        return principal.FindFirst(claimType)?.Value ?? string.Empty;
    }

    private static string? ReadJsonProperty(string json, string propertyName)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            if (!document.RootElement.TryGetProperty(propertyName, out JsonElement property))
            {
                return null;
            }

            return property.ValueKind == JsonValueKind.String
                ? property.GetString()
                : property.ToString();
        }
        catch
        {
            return null;
        }
    }

    private static string ResolveFirstNameFallback(string fullName, string email)
    {
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            string firstWord = fullName
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .FirstOrDefault()
                ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(firstWord))
            {
                return firstWord.Trim();
            }
        }

        string localPart = email
            .Split('@', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(localPart))
        {
            return "Google";
        }

        string sanitized = localPart
            .Replace(".", " ", StringComparison.Ordinal)
            .Replace("_", " ", StringComparison.Ordinal)
            .Replace("-", " ", StringComparison.Ordinal)
            .Trim();

        return string.IsNullOrWhiteSpace(sanitized) ? "Google" : sanitized;
    }

    private ResolvedGoogleAuthOptions ResolveOptions()
    {
        var options = new ResolvedGoogleAuthOptions
        {
            Enabled = _configuredOptions.Enabled,
            ClientId = _configuredOptions.ClientId?.Trim() ?? string.Empty,
            ClientSecret = _configuredOptions.ClientSecret?.Trim() ?? string.Empty,
            RedirectUri = _configuredOptions.RedirectUri?.Trim() ?? string.Empty,
            FrontendSuccessUrl = _configuredOptions.FrontendSuccessUrl?.Trim() ?? string.Empty,
            FrontendFailureUrl = _configuredOptions.FrontendFailureUrl?.Trim() ?? string.Empty,
            AllowedAudiences = _configuredOptions.AllowedAudiences ?? [],
            AllowedIssuers = _configuredOptions.AllowedIssuers ?? [],
            Prompt = _configuredOptions.Prompt?.Trim() ?? string.Empty
        };

        string? enabledFromEnv = Environment.GetEnvironmentVariable("GOOGLE_AUTH_ENABLED");
        if (bool.TryParse(enabledFromEnv, out bool parsedEnabled))
        {
            options.Enabled = parsedEnabled;
        }

        options.ClientId = ReadEnvOverride("GOOGLE_AUTH_CLIENT_ID", options.ClientId);
        options.ClientSecret = ReadEnvOverride("GOOGLE_AUTH_CLIENT_SECRET", options.ClientSecret);
        options.RedirectUri = ReadEnvOverride("GOOGLE_AUTH_REDIRECT_URI", options.RedirectUri);
        options.FrontendSuccessUrl = ReadEnvOverride(
            "GOOGLE_AUTH_FRONTEND_SUCCESS_URL",
            options.FrontendSuccessUrl
        );
        options.FrontendFailureUrl = ReadEnvOverride(
            "GOOGLE_AUTH_FRONTEND_FAILURE_URL",
            options.FrontendFailureUrl
        );
        options.Prompt = ReadEnvOverride("GOOGLE_AUTH_PROMPT", options.Prompt);

        string? allowedAudiencesEnv = Environment.GetEnvironmentVariable("GOOGLE_AUTH_ALLOWED_AUDIENCES");
        if (!string.IsNullOrWhiteSpace(allowedAudiencesEnv))
        {
            options.AllowedAudiences = ParseCsv(allowedAudiencesEnv);
        }

        string? allowedIssuersEnv = Environment.GetEnvironmentVariable("GOOGLE_AUTH_ALLOWED_ISSUERS");
        if (!string.IsNullOrWhiteSpace(allowedIssuersEnv))
        {
            options.AllowedIssuers = ParseCsv(allowedIssuersEnv);
        }

        if (!Uri.TryCreate(options.FrontendSuccessUrl, UriKind.Absolute, out _))
        {
            options.FrontendSuccessUrl = "http://localhost:5173/";
        }

        if (!Uri.TryCreate(options.FrontendFailureUrl, UriKind.Absolute, out _))
        {
            options.FrontendFailureUrl = "http://localhost:5173/login";
        }

        return options;
    }

    private static string ReadEnvOverride(string key, string fallback)
    {
        string? fromEnv = Environment.GetEnvironmentVariable(key);
        return string.IsNullOrWhiteSpace(fromEnv) ? fallback : fromEnv.Trim();
    }

    private static string[] ParseCsv(string rawValue)
    {
        return rawValue
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.Ordinal)
            .ToArray();
    }

    private sealed record TokenExchangeResult(bool Success, string? IdToken, string? Error);

    private sealed class ResolvedGoogleAuthOptions
    {
        public bool Enabled { get; set; }
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string RedirectUri { get; set; } = string.Empty;
        public string FrontendSuccessUrl { get; set; } = string.Empty;
        public string FrontendFailureUrl { get; set; } = string.Empty;
        public string[] AllowedAudiences { get; set; } = [];
        public string[] AllowedIssuers { get; set; } = [];
        public string Prompt { get; set; } = string.Empty;
    }
}
