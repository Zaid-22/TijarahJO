using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Common.Services;

public sealed class TwoFactorService
{

    private static readonly byte[] _challengeHashKey = RandomNumberGenerator.GetBytes(32);

    private readonly TwoFactorOptions _options;
    private readonly byte[] _secretEncryptionKey;
    private readonly byte[] _challengeSigningKey;

    // WARNING: Storing challenges in a static ConcurrentDictionary means that 2FA 
    // flows will fail in a multi-instance deployment unless sticky sessions are 
    // used. For proper horizontal scaling, move this to a distributed cache (e.g., Redis).
    private static readonly ConcurrentDictionary<int, TwoFactorChallengeState> _loginChallenges = new();
    private static readonly ConcurrentDictionary<int, TwoFactorChallengeState> _setupChallenges = new();

    public TwoFactorService(IOptions<TwoFactorOptions> optionsAccessor, JwtOptions jwtOptions)
    {
        _options = optionsAccessor.Value ?? new TwoFactorOptions();

        string secretKeyMaterial = ResolveTwoFactorKeyMaterial(
            _options.SecretEncryptionKey,
            jwtOptions.SigningKey,
            "TwoFactor:SecretEncryptionKey",
            "twofactor-secret"
        );
        string challengeKeyMaterial = ResolveTwoFactorKeyMaterial(
            _options.ChallengeSigningKey,
            jwtOptions.SigningKey,
            "TwoFactor:ChallengeSigningKey",
            "twofactor-challenge"
        );

        _secretEncryptionKey = SHA256.HashData(Encoding.UTF8.GetBytes(secretKeyMaterial));
        _challengeSigningKey = SHA256.HashData(Encoding.UTF8.GetBytes(challengeKeyMaterial));

        _options.Digits = Math.Clamp(_options.Digits, 6, 8);
        _options.LoginChallengeLifetimeSeconds = Math.Clamp(_options.LoginChallengeLifetimeSeconds, 60, 900);
        _options.Issuer = string.IsNullOrWhiteSpace(_options.Issuer) ? "TijarahJo" : _options.Issuer.Trim();
    }

    internal static string ResolveTwoFactorKeyMaterial(
        string? configuredKey,
        string? jwtSigningKey,
        string configurationName,
        string fallbackPurposePrefix)
    {
        if (!string.IsNullOrWhiteSpace(configuredKey))
        {
            return configuredKey.Trim();
        }

        if (IsDevelopmentEnvironment())
        {
            if (string.IsNullOrWhiteSpace(jwtSigningKey))
            {
                throw new InvalidOperationException(
                    $"JWT signing key is required to derive a development fallback for {configurationName}.");
            }

            return $"{fallbackPurposePrefix}::{jwtSigningKey}";
        }

        throw new InvalidOperationException(
            $"{configurationName} must be configured outside development. Do not reuse the JWT signing key for 2FA secrets.");
    }

    private static bool IsDevelopmentEnvironment()
    {
        string? environmentName =
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ??
            Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");

        return string.Equals(environmentName, "Development", StringComparison.OrdinalIgnoreCase);
    }

    public string Issuer => _options.Issuer;

    public string IssueLoginChallengeToken(int userId, DateTimeOffset utcNow)
    {
        var payload = new LoginChallengeTokenPayload
        {
            UserId = userId,
            ExpiresAtUnixSeconds = utcNow.AddSeconds(_options.LoginChallengeLifetimeSeconds).ToUnixTimeSeconds(),
            Nonce = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(16))
        };

        byte[] payloadBytes = JsonSerializer.SerializeToUtf8Bytes(payload);
        byte[] signatureBytes = ComputeChallengeSignature(payloadBytes);

        return $"{WebEncoders.Base64UrlEncode(payloadBytes)}.{WebEncoders.Base64UrlEncode(signatureBytes)}";
    }

    public bool TryValidateLoginChallengeToken(
        string? token,
        DateTimeOffset utcNow,
        out int userId,
        out string failureMessage)
    {
        userId = 0;
        failureMessage = "Two-factor session is invalid or expired.";

        if (string.IsNullOrWhiteSpace(token))
            return false;

        string[] parts = token.Trim().Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2)
            return false;

        byte[] payloadBytes;
        byte[] signatureBytes;
        try
        {
            payloadBytes = WebEncoders.Base64UrlDecode(parts[0]);
            signatureBytes = WebEncoders.Base64UrlDecode(parts[1]);
        }
        catch (FormatException)
        {
            return false;
        }

        byte[] expectedSignature = ComputeChallengeSignature(payloadBytes);
        if (signatureBytes.Length != expectedSignature.Length ||
            !CryptographicOperations.FixedTimeEquals(signatureBytes, expectedSignature))
        {
            return false;
        }

        LoginChallengeTokenPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<LoginChallengeTokenPayload>(payloadBytes);
        }
        catch (JsonException)
        {
            return false;
        }

        if (payload == null || payload.UserId < 1 || payload.ExpiresAtUnixSeconds <= 0)
            return false;

        if (utcNow.ToUnixTimeSeconds() > payload.ExpiresAtUnixSeconds)
        {
            failureMessage = "Two-factor session has expired. Please sign in again.";
            return false;
        }

        userId = payload.UserId;
        failureMessage = string.Empty;
        return true;
    }

    // -----------------------------------------------------------------------------------------
    // Email 2FA Specific logic
    // -----------------------------------------------------------------------------------------

    public string GenerateAndStoreLoginCode(int userId)
    {
        return GenerateAndStoreCode(userId, _loginChallenges);
    }

    public bool VerifyLoginCode(int userId, string? submittedCode)
    {
        return VerifyAndRemoveCode(userId, submittedCode, _loginChallenges);
    }

    public string GenerateAndStoreSetupCode(int userId)
    {
        return GenerateAndStoreCode(userId, _setupChallenges);
    }

    public bool VerifySetupCode(int userId, string? submittedCode)
    {
        return VerifyAndRemoveCode(userId, submittedCode, _setupChallenges);
    }

    public void RemoveSetupCache(int userId)
    {
        _setupChallenges.TryRemove(userId, out _);
    }

    private string GenerateAndStoreCode(int userId, ConcurrentDictionary<int, TwoFactorChallengeState> cache)
    {
        PruneExpiredChallenges(cache);
        string code = GenerateNumericCode(_options.Digits);
        byte[] hash = ComputeCodeHash(userId, code);
        
        DateTimeOffset now = DateTimeOffset.UtcNow;
        var challenge = new TwoFactorChallengeState(hash, now.AddSeconds(_options.LoginChallengeLifetimeSeconds), 0);
        cache.AddOrUpdate(userId, challenge, (_, _) => challenge);

        return code;
    }

    private static bool VerifyAndRemoveCode(int userId, string? submittedCode, ConcurrentDictionary<int, TwoFactorChallengeState> cache)
    {
        PruneExpiredChallenges(cache);
        
        DateTimeOffset now = DateTimeOffset.UtcNow;
        string normalizedCode = string.Concat((submittedCode ?? "").Where(char.IsDigit));

        if (!cache.TryGetValue(userId, out TwoFactorChallengeState? challenge) || challenge.ExpiresAtUtc <= now)
        {
            cache.TryRemove(userId, out _);
            return false;
        }

        int maxAttempts = 5; // allow 5 attempts
        if (challenge.FailedAttempts >= maxAttempts)
        {
            cache.TryRemove(userId, out _);
            return false;
        }

        byte[] expectedHash = challenge.CodeHash;
        byte[] providedHash = ComputeCodeHash(userId, normalizedCode);
        bool isCodeValid = expectedHash.Length == providedHash.Length &&
                           CryptographicOperations.FixedTimeEquals(expectedHash, providedHash);

        if (!isCodeValid)
        {
            int nextFailedAttempts = challenge.FailedAttempts + 1;
            if (nextFailedAttempts >= maxAttempts)
            {
                cache.TryRemove(userId, out _);
            }
            else
            {
                cache[userId] = challenge with { FailedAttempts = nextFailedAttempts };
            }
            return false;
        }

        cache.TryRemove(userId, out _);
        return true;
    }

    private static byte[] ComputeCodeHash(int userId, string code)
    {
        string payload = $"{userId}:{code}";
        using var hmac = new HMACSHA256(_challengeHashKey);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
    }

    private static string GenerateNumericCode(int digits)
    {
        int safeDigits = Math.Clamp(digits, 4, 8);
        int maxExclusive = (int)Math.Pow(10, safeDigits);
        int value = RandomNumberGenerator.GetInt32(0, maxExclusive);
        return value.ToString($"D{safeDigits}");
    }

    private static void PruneExpiredChallenges(ConcurrentDictionary<int, TwoFactorChallengeState> cache)
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        foreach ((int key, TwoFactorChallengeState value) in cache)
        {
            if (value.ExpiresAtUtc <= now)
            {
                cache.TryRemove(key, out _);
            }
        }
    }

    private byte[] ComputeChallengeSignature(byte[] payloadBytes)
    {
        using var hmac = new HMACSHA256(_challengeSigningKey);
        return hmac.ComputeHash(payloadBytes);
    }

    private sealed class LoginChallengeTokenPayload
    {
        public int UserId { get; set; }
        public long ExpiresAtUnixSeconds { get; set; }
        public string Nonce { get; set; } = string.Empty;
    }

    private sealed record TwoFactorChallengeState(
        byte[] CodeHash,
        DateTimeOffset ExpiresAtUtc,
        int FailedAttempts
    );
}
