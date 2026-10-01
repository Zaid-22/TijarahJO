using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Common.Services;

public enum PasswordResetConfirmationFailureReason
{
    InvalidRequest,
    InvalidOrExpiredCode,
    TooManyAttempts,
    UserUnavailable,
    PasswordPolicyViolation,
    PersistenceFailed
}

public sealed class PasswordResetConfirmationResult
{
    public bool Success { get; init; }
    public PasswordResetConfirmationFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IPasswordResetService
{
    Task<bool> RequestResetAsync(string? email, CancellationToken cancellationToken = default);

    Task<PasswordResetConfirmationResult> VerifyCodeAsync(
        string? email,
        string? code,
        CancellationToken cancellationToken = default
    );

    Task<PasswordResetConfirmationResult> ConfirmResetAsync(
        string? email,
        string? code,
        string? newPassword,
        CancellationToken cancellationToken = default
    );
}

public sealed class PasswordResetService(
    IUserDataAccess users,
    IVerificationChallengeDataAccess challenges,
    IPasswordResetEmailSender emailSender,
    IOptions<PasswordResetOptions> options,
    ILogger<PasswordResetService> logger,
    ITokenBlacklistService tokenBlacklist,
    JwtOptions jwtOptions) : IPasswordResetService
{
    private const int MaxConcurrencyRetries = 8;
    private readonly IUserDataAccess _users = users;
    private readonly IVerificationChallengeDataAccess _challenges = challenges;
    private readonly IPasswordResetEmailSender _emailSender = emailSender;
    private readonly PasswordResetOptions _options = options.Value;
    private readonly ILogger<PasswordResetService> _logger = logger;
    private readonly ITokenBlacklistService _tokenBlacklist = tokenBlacklist;
    private readonly byte[] _hmacKey = Encoding.UTF8.GetBytes(jwtOptions.SigningKey);

    public async Task<bool> RequestResetAsync(string? email, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Password reset request ignored because feature is disabled.");
            return false;
        }

        string? normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return false;
        }

        UserModel? user = await _users.GetUserByLoginAsync(normalizedEmail, cancellationToken);
        if (user == null ||
            user.UserID == null ||
            user.IsDeleted ||
            user.Status != UserStatusPolicy.Active)
        {
            return false;
        }

        // Guard: if the email transport is not configured, don't store a challenge
        // that can never be delivered — that leads to a confusing 500 when the user
        // tries to verify a code they never received.
        if (!_emailSender.IsTransportConfigured())
        {
            _logger.LogWarning(
                "Password reset requested for {Email} but the email transport is not configured. " +
                "Set PasswordResetEmail.Enabled=true and provide a ResendApiKey.",
                normalizedEmail);
            return false;
        }

        string? stateStr = await _challenges.GetChallengeStateAsync(user.UserID.Value, "PasswordReset", cancellationToken);
        if (!string.IsNullOrEmpty(stateStr))
        {
            try
            {
                var existingChallenge = System.Text.Json.JsonSerializer.Deserialize<PasswordResetChallengeState>(stateStr);
                DateTimeOffset nowDt = DateTimeOffset.UtcNow;
                if (existingChallenge != null && 
                    existingChallenge.ExpiresAtUtc > nowDt && 
                    nowDt - existingChallenge.SentAtUtc < TimeSpan.FromSeconds(GetRequestCooldownSeconds()))
                {
                    return true; // Cooldown active
                }
            }
            catch (System.Text.Json.JsonException) { /* Override corrupt state */ }
        }

        string code = GenerateNumericCode(GetCodeLength());
        byte[] codeHash = ComputeCodeHash(normalizedEmail, code);
        DateTimeOffset now = DateTimeOffset.UtcNow;

        var challenge = new PasswordResetChallengeState(
            user.UserID.Value,
            codeHash,
            now.AddMinutes(GetCodeLifetimeMinutes()),
            now,
            0
        );

        string stateJson = System.Text.Json.JsonSerializer.Serialize(challenge);
        bool stored = await _challenges.TryReplaceChallengeStateAsync(
            user.UserID.Value,
            "PasswordReset",
            stateStr,
            stateJson,
            challenge.ExpiresAtUtc.UtcDateTime,
            cancellationToken
        );
        if (!stored)
        {
            // A concurrent request installed the active challenge and owns delivery.
            return true;
        }

        try
        {
            await _emailSender.SendPasswordResetCodeAsync(
                normalizedEmail,
                user.FirstName,
                code,
                TimeSpan.FromMinutes(GetCodeLifetimeMinutes()),
                cancellationToken
            );
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await _challenges.TryDeleteChallengeStateAsync(
                user.UserID.Value, "PasswordReset", stateJson, cancellationToken);
            _logger.LogWarning(
                ex,
                "Password reset email failed for {Email}. Challenge was discarded.",
                normalizedEmail
            );
            return false;
        }

        return true;
    }

    public async Task<PasswordResetConfirmationResult> VerifyCodeAsync(
        string? email,
        string? code,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return Failure(
                PasswordResetConfirmationFailureReason.InvalidRequest,
                "Password reset is currently unavailable."
            );
        }

        string? normalizedEmail = NormalizeEmail(email);
        string submittedCode = NormalizeSubmittedCode(code);

        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return Failure(
                PasswordResetConfirmationFailureReason.InvalidRequest,
                "Email and verification code are required."
            );
        }

        if (submittedCode.Length != GetCodeLength())
        {
            return Failure(
                PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
                "Invalid or expired verification code."
            );
        }

        CodeValidationResult validation = await ValidateResetCodeAsync(
            normalizedEmail,
            submittedCode,
            consumeOnSuccess: false,
            cancellationToken
        );

        if (!validation.Success)
        {
            return Failure(validation.FailureReason!.Value, validation.Message!);
        }

        return new PasswordResetConfirmationResult { Success = true };
    }

    public async Task<PasswordResetConfirmationResult> ConfirmResetAsync(
        string? email,
        string? code,
        string? newPassword,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return Failure(
                PasswordResetConfirmationFailureReason.InvalidRequest,
                "Password reset is currently unavailable."
            );
        }

        string? normalizedEmail = NormalizeEmail(email);
        string submittedCode = NormalizeSubmittedCode(code);
        string submittedPassword = newPassword?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(normalizedEmail) ||
            string.IsNullOrWhiteSpace(submittedCode) ||
            string.IsNullOrWhiteSpace(submittedPassword))
        {
            return Failure(
                PasswordResetConfirmationFailureReason.InvalidRequest,
                "Email, verification code, and new password are required."
            );
        }

        if (submittedCode.Length != GetCodeLength())
        {
            return Failure(
                PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
                "Invalid or expired verification code."
            );
        }

        var (isPasswordValid, passwordError) = PasswordHelper.IsPasswordPolicyCompliant(submittedPassword);
        if (!isPasswordValid)
        {
            return Failure(
                PasswordResetConfirmationFailureReason.PasswordPolicyViolation,
                passwordError!
            );
        }

        CodeValidationResult validation = await ValidateResetCodeAsync(
            normalizedEmail,
            submittedCode,
            consumeOnSuccess: true,
            cancellationToken
        );

        if (!validation.Success)
        {
            return Failure(validation.FailureReason!.Value, validation.Message!);
        }

        UserModel user = validation.User!;

        user = user with { HashedPassword = PasswordHelper.HashPassword(submittedPassword) };
        bool updated = await _users.UpdateUserFieldsAsync(
            user,
            user.UserID!.Value,
            UserUpdateFields.HashedPassword,
            cancellationToken);
        if (!updated)
        {
            return Failure(
                PasswordResetConfirmationFailureReason.PersistenceFailed,
                "Unable to save the new password. Please try again."
            );
        }

        await _tokenBlacklist.InvalidateAllUserSessionsAsync(user.UserID.Value, cancellationToken);

        return new PasswordResetConfirmationResult
        {
            Success = true
        };
    }

    private async Task<CodeValidationResult> ValidateResetCodeAsync(
        string normalizedEmail,
        string submittedCode,
        bool consumeOnSuccess,
        CancellationToken cancellationToken)
    {
        UserModel? user = await _users.GetUserByLoginAsync(normalizedEmail, cancellationToken);
        if (user == null || user.UserID == null)
        {
            return CodeValidationResult.Failed(
                PasswordResetConfirmationFailureReason.UserUnavailable,
                "Unable to reset password for this account."
            );
        }

        for (int attempt = 0; attempt < MaxConcurrencyRetries; attempt++)
        {
            string? stateStr = await _challenges.GetChallengeStateAsync(
                user.UserID.Value,
                "PasswordReset",
                cancellationToken
            );
            if (string.IsNullOrEmpty(stateStr))
            {
                return CodeValidationResult.Failed(
                    PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
                    "Invalid or expired verification code."
                );
            }

            PasswordResetChallengeState? challenge;
            try
            {
                challenge = System.Text.Json.JsonSerializer.Deserialize<PasswordResetChallengeState>(stateStr);
            }
            catch (System.Text.Json.JsonException)
            {
                if (await _challenges.TryDeleteChallengeStateAsync(
                        user.UserID.Value, "PasswordReset", stateStr, cancellationToken))
                {
                    return CodeValidationResult.Failed(
                        PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
                        "Invalid or expired verification code."
                    );
                }

                continue;
            }

            DateTimeOffset now = DateTimeOffset.UtcNow;
            if (challenge == null || challenge.ExpiresAtUtc <= now)
            {
                if (await _challenges.TryDeleteChallengeStateAsync(
                        user.UserID.Value, "PasswordReset", stateStr, cancellationToken))
                {
                    return CodeValidationResult.Failed(
                        PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
                        "Invalid or expired verification code."
                    );
                }

                continue;
            }

            int maxAttempts = GetMaxAttempts();
            if (challenge.FailedAttempts >= maxAttempts)
            {
                if (await _challenges.TryDeleteChallengeStateAsync(
                        user.UserID.Value, "PasswordReset", stateStr, cancellationToken))
                {
                    return CodeValidationResult.Failed(
                        PasswordResetConfirmationFailureReason.TooManyAttempts,
                        "Too many invalid verification attempts. Please request a new code."
                    );
                }

                continue;
            }

            byte[] expectedHash = challenge.CodeHash;
            byte[] providedHash = ComputeCodeHash(normalizedEmail, submittedCode);

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
                    if (await _challenges.TryDeleteChallengeStateAsync(
                            user.UserID.Value, "PasswordReset", stateStr, cancellationToken))
                    {
                        return CodeValidationResult.Failed(
                            PasswordResetConfirmationFailureReason.TooManyAttempts,
                            "Too many invalid verification attempts. Please request a new code."
                        );
                    }

                    continue;
                }

                var updatedChallenge = challenge with { FailedAttempts = nextFailedAttempts };
                string updatedStateJson = System.Text.Json.JsonSerializer.Serialize(updatedChallenge);
                if (await _challenges.TryReplaceChallengeStateAsync(
                        user.UserID.Value,
                        "PasswordReset",
                        stateStr,
                        updatedStateJson,
                        updatedChallenge.ExpiresAtUtc.UtcDateTime,
                        cancellationToken))
                {
                    return CodeValidationResult.Failed(
                        PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
                        "Invalid or expired verification code."
                    );
                }

                continue;
            }

            if (user.IsDeleted || user.Status != UserStatusPolicy.Active)
            {
                if (await _challenges.TryDeleteChallengeStateAsync(
                        user.UserID.Value, "PasswordReset", stateStr, cancellationToken))
                {
                    return CodeValidationResult.Failed(
                        PasswordResetConfirmationFailureReason.UserUnavailable,
                        "Unable to reset password for this account."
                    );
                }

                continue;
            }

            if (!consumeOnSuccess || await _challenges.TryDeleteChallengeStateAsync(
                    user.UserID.Value, "PasswordReset", stateStr, cancellationToken))
            {
                return CodeValidationResult.Valid(user);
            }
        }

        return CodeValidationResult.Failed(
            PasswordResetConfirmationFailureReason.PersistenceFailed,
            "Unable to verify the code because of concurrent requests. Please try again."
        );
    }

    private static string? NormalizeEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email)
            ? null
            : email.Trim().ToLowerInvariant();
    }

    private static string NormalizeSubmittedCode(string? code)
    {
        return string.Concat((code ?? string.Empty).Where(char.IsDigit));
    }

    private byte[] ComputeCodeHash(string normalizedEmail, string code)
    {
        string payload = $"{normalizedEmail}:{code}";
        using var hmac = new HMACSHA256(_hmacKey);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
    }

    private static string GenerateNumericCode(int digits)
    {
        int safeDigits = Math.Clamp(digits, 4, 8);
        int maxExclusive = (int)Math.Pow(10, safeDigits);
        int value = RandomNumberGenerator.GetInt32(0, maxExclusive);
        return value.ToString($"D{safeDigits}");
    }

    private int GetCodeLength() => Math.Clamp(_options.CodeLength, 4, 8);
    private int GetCodeLifetimeMinutes() => Math.Clamp(_options.CodeLifetimeMinutes, 5, 60);
    private int GetMaxAttempts() => Math.Clamp(_options.MaxAttempts, 1, 10);
    private int GetRequestCooldownSeconds() => Math.Clamp(_options.RequestCooldownSeconds, 0, 600);

    private static PasswordResetConfirmationResult Failure(
        PasswordResetConfirmationFailureReason reason,
        string message)
    {
        return new PasswordResetConfirmationResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }

    private sealed record PasswordResetChallengeState(
        int UserId,
        byte[] CodeHash,
        DateTimeOffset ExpiresAtUtc,
        DateTimeOffset SentAtUtc,
        int FailedAttempts
    );

    private sealed record CodeValidationResult(
        bool Success,
        UserModel? User,
        PasswordResetConfirmationFailureReason? FailureReason,
        string? Message)
    {
        public static CodeValidationResult Valid(UserModel user) =>
            new(true, user, null, null);

        public static CodeValidationResult Failed(
            PasswordResetConfirmationFailureReason reason,
            string message) =>
            new(false, null, reason, message);
    }
}
