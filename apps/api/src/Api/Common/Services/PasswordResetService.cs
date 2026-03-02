using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Common;
using TijarahJoDBAPI.Common.Configuration;

namespace TijarahJoDBAPI.Common.Services;

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
    Task RequestResetAsync(string? email, CancellationToken cancellationToken = default);

    Task<PasswordResetConfirmationResult> ConfirmResetAsync(
        string? email,
        string? code,
        string? newPassword,
        CancellationToken cancellationToken = default
    );
}

public sealed class PasswordResetService : IPasswordResetService
{
    private const int MinimumPasswordLength = 8;
    private static readonly byte[] _challengeHashKey = RandomNumberGenerator.GetBytes(32);
    private static readonly ConcurrentDictionary<string, PasswordResetChallengeState> _challenges =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly IUserDataAccess _users;
    private readonly IPasswordResetEmailSender _emailSender;
    private readonly PasswordResetOptions _options;
    private readonly ILogger<PasswordResetService> _logger;

    public PasswordResetService(
        IUserDataAccess users,
        IPasswordResetEmailSender emailSender,
        IOptions<PasswordResetOptions> options,
        ILogger<PasswordResetService> logger)
    {
        _users = users;
        _emailSender = emailSender;
        _options = options.Value;
        _logger = logger;
    }

    public async Task RequestResetAsync(string? email, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Password reset request ignored because feature is disabled.");
            return;
        }

        string? normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return;
        }

        PruneExpiredChallenges();

        DateTimeOffset now = DateTimeOffset.UtcNow;
        if (_challenges.TryGetValue(normalizedEmail, out PasswordResetChallengeState? existingChallenge) &&
            existingChallenge.ExpiresAtUtc > now &&
            now - existingChallenge.SentAtUtc < TimeSpan.FromSeconds(GetRequestCooldownSeconds()))
        {
            return;
        }

        UserModel? user = await _users.GetUserByLoginAsync(normalizedEmail, cancellationToken);
        if (user == null ||
            user.UserID == null ||
            user.IsDeleted ||
            user.Status != UserStatusPolicy.Active)
        {
            return;
        }

        string code = GenerateNumericCode(GetCodeLength());
        byte[] codeHash = ComputeCodeHash(normalizedEmail, code);

        var challenge = new PasswordResetChallengeState(
            user.UserID.Value,
            codeHash,
            now.AddMinutes(GetCodeLifetimeMinutes()),
            now,
            0
        );

        _challenges.AddOrUpdate(normalizedEmail, challenge, (_, _) => challenge);

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
            _challenges.TryRemove(normalizedEmail, out _);
            _logger.LogWarning(
                ex,
                "Password reset email failed for {Email}. Challenge was discarded.",
                normalizedEmail
            );
        }
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
        string submittedCode = code?.Trim() ?? string.Empty;
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

        if (submittedPassword.Length < MinimumPasswordLength)
        {
            return Failure(
                PasswordResetConfirmationFailureReason.PasswordPolicyViolation,
                $"Password must be at least {MinimumPasswordLength} characters."
            );
        }

        PruneExpiredChallenges();

        DateTimeOffset now = DateTimeOffset.UtcNow;
        if (!_challenges.TryGetValue(normalizedEmail, out PasswordResetChallengeState? challenge) ||
            challenge.ExpiresAtUtc <= now)
        {
            _challenges.TryRemove(normalizedEmail, out _);
            return Failure(
                PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
                "Invalid or expired verification code."
            );
        }

        int maxAttempts = GetMaxAttempts();
        if (challenge.FailedAttempts >= maxAttempts)
        {
            _challenges.TryRemove(normalizedEmail, out _);
            return Failure(
                PasswordResetConfirmationFailureReason.TooManyAttempts,
                "Too many invalid verification attempts. Please request a new code."
            );
        }

        byte[] expectedHash = challenge.CodeHash;
        byte[] providedHash = ComputeCodeHash(normalizedEmail, submittedCode);
        bool isCodeValid = expectedHash.Length == providedHash.Length &&
                           CryptographicOperations.FixedTimeEquals(expectedHash, providedHash);

        if (!isCodeValid)
        {
            int nextFailedAttempts = challenge.FailedAttempts + 1;
            if (nextFailedAttempts >= maxAttempts)
            {
                _challenges.TryRemove(normalizedEmail, out _);
                return Failure(
                    PasswordResetConfirmationFailureReason.TooManyAttempts,
                    "Too many invalid verification attempts. Please request a new code."
                );
            }

            _challenges[normalizedEmail] = challenge with { FailedAttempts = nextFailedAttempts };
            return Failure(
                PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
                "Invalid or expired verification code."
            );
        }

        UserModel? user = await _users.GetUserByIDAsync(challenge.UserId, cancellationToken);
        if (user == null ||
            user.UserID == null ||
            user.IsDeleted ||
            user.Status != UserStatusPolicy.Active ||
            !string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            _challenges.TryRemove(normalizedEmail, out _);
            return Failure(
                PasswordResetConfirmationFailureReason.UserUnavailable,
                "Unable to reset password for this account."
            );
        }

        user.HashedPassword = PasswordHelper.HashPassword(submittedPassword);
        bool updated = await _users.UpdateUserAsync(user, user.UserID.Value, cancellationToken);
        if (!updated)
        {
            return Failure(
                PasswordResetConfirmationFailureReason.PersistenceFailed,
                "Unable to save the new password. Please try again."
            );
        }

        _challenges.TryRemove(normalizedEmail, out _);
        return new PasswordResetConfirmationResult
        {
            Success = true
        };
    }

    private static string? NormalizeEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email)
            ? null
            : email.Trim().ToLowerInvariant();
    }

    private static byte[] ComputeCodeHash(string normalizedEmail, string code)
    {
        string payload = $"{normalizedEmail}:{code}";
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

    private void PruneExpiredChallenges()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        foreach ((string key, PasswordResetChallengeState value) in _challenges)
        {
            if (value.ExpiresAtUtc <= now)
            {
                _challenges.TryRemove(key, out _);
            }
        }
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
}
