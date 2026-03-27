using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Application.Abstractions.DataAccess;

namespace TijarahJo.Api.Common.Services;

public sealed class TwoFactorService
{
    private readonly TwoFactorOptions _options;
    private readonly byte[] _secretEncryptionKey;
    private readonly byte[] _challengeSigningKey;
    private readonly byte[] _challengeHashKey;
    private readonly IVerificationChallengeDataAccess _challenges;

    public TwoFactorService(
        IOptions<TwoFactorOptions> optionsAccessor, 
        JwtOptions jwtOptions,
        IVerificationChallengeDataAccess challenges)
    {
        _options = optionsAccessor.Value ?? new TwoFactorOptions();
        _challenges = challenges;

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
        _challengeHashKey = Encoding.UTF8.GetBytes(jwtOptions.SigningKey);

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
        
        bool sigLengthMatch = signatureBytes.Length == expectedSignature.Length;
        int maxLen = Math.Max(signatureBytes.Length, expectedSignature.Length);
        byte[] p1 = new byte[maxLen];
        byte[] p2 = new byte[maxLen];
        Array.Copy(signatureBytes, p1, signatureBytes.Length);
        Array.Copy(expectedSignature, p2, expectedSignature.Length);
        
        if (!sigLengthMatch || !CryptographicOperations.FixedTimeEquals(p1, p2))
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

    public async Task<string> GenerateAndStoreLoginCodeAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await GenerateAndStoreCodeAsync(userId, "TwoFactorLogin", cancellationToken);
    }

    public async Task<bool> VerifyLoginCodeAsync(int userId, string? submittedCode, CancellationToken cancellationToken = default)
    {
        return await VerifyAndRemoveCodeAsync(userId, submittedCode, "TwoFactorLogin", cancellationToken);
    }

    public async Task<string> GenerateAndStoreSetupCodeAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await GenerateAndStoreCodeAsync(userId, "TwoFactorSetup", cancellationToken);
    }

    public async Task<bool> VerifySetupCodeAsync(int userId, string? submittedCode, CancellationToken cancellationToken = default)
    {
        return await VerifyAndRemoveCodeAsync(userId, submittedCode, "TwoFactorSetup", cancellationToken);
    }

    public async Task RemoveSetupCacheAsync(int userId, CancellationToken cancellationToken = default)
    {
        await _challenges.DeleteChallengeStateAsync(userId, "TwoFactorSetup", cancellationToken);
    }

    private async Task<string> GenerateAndStoreCodeAsync(int userId, string challengeType, CancellationToken cancellationToken)
    {
        string code = GenerateNumericCode(_options.Digits);
        byte[] hash = ComputeCodeHash(userId, code);
        
        DateTimeOffset now = DateTimeOffset.UtcNow;
        var challenge = new TwoFactorChallengeState(hash, now.AddSeconds(_options.LoginChallengeLifetimeSeconds), 0);
        
        string stateJson = JsonSerializer.Serialize(challenge);
        await _challenges.UpsertChallengeStateAsync(
            userId, 
            challengeType, 
            stateJson, 
            challenge.ExpiresAtUtc.UtcDateTime, 
            cancellationToken);

        return code;
    }

    private async Task<bool> VerifyAndRemoveCodeAsync(int userId, string? submittedCode, string challengeType, CancellationToken cancellationToken)
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        string normalizedCode = string.Concat((submittedCode ?? "").Where(char.IsDigit));

        string? stateStr = await _challenges.GetChallengeStateAsync(userId, challengeType, cancellationToken);
        if (string.IsNullOrEmpty(stateStr))
        {
            return false;
        }

        TwoFactorChallengeState? challenge;
        try
        {
            challenge = JsonSerializer.Deserialize<TwoFactorChallengeState>(stateStr);
        }
        catch (JsonException)
        {
            await _challenges.DeleteChallengeStateAsync(userId, challengeType, cancellationToken);
            return false;
        }

        if (challenge == null || challenge.ExpiresAtUtc <= now)
        {
            await _challenges.DeleteChallengeStateAsync(userId, challengeType, cancellationToken);
            return false;
        }

        int maxAttempts = 5; // allow 5 attempts
        if (challenge.FailedAttempts >= maxAttempts)
        {
            await _challenges.DeleteChallengeStateAsync(userId, challengeType, cancellationToken);
            return false;
        }

        byte[] expectedHash = challenge.CodeHash;
        byte[] providedHash = ComputeCodeHash(userId, normalizedCode);
        
        bool lengthMatch = expectedHash.Length == providedHash.Length;
        int maxLen = Math.Max(expectedHash.Length, providedHash.Length);
        byte[] p1 = new byte[maxLen];
        byte[] p2 = new byte[maxLen];
        Array.Copy(expectedHash, p1, expectedHash.Length);
        Array.Copy(providedHash, p2, providedHash.Length);
        
        bool isCodeValid = lengthMatch && CryptographicOperations.FixedTimeEquals(p1, p2);

        if (!isCodeValid)
        {
            int nextFailedAttempts = challenge.FailedAttempts + 1;
            if (nextFailedAttempts >= maxAttempts)
            {
                await _challenges.DeleteChallengeStateAsync(userId, challengeType, cancellationToken);
            }
            else
            {
                var updatedChallenge = challenge with { FailedAttempts = nextFailedAttempts };
                string updatedStateJson = JsonSerializer.Serialize(updatedChallenge);
                await _challenges.UpsertChallengeStateAsync(userId, challengeType, updatedStateJson, updatedChallenge.ExpiresAtUtc.UtcDateTime, cancellationToken);
            }
            return false;
        }

        await _challenges.DeleteChallengeStateAsync(userId, challengeType, cancellationToken);
        return true;
    }

    private byte[] ComputeCodeHash(int userId, string code)
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
