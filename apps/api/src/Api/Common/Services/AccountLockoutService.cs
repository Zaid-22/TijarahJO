using System.Text.Json;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Common.Services;

public sealed class AccountLockoutService(
    IOptions<AccountLockoutOptions> options,
    IVerificationChallengeDataAccess challenges,
    ILogger<AccountLockoutService> logger) : IAccountLockoutService
{
    private const string ChallengeType = "LoginLockout";
    private readonly AccountLockoutOptions _options = options.Value;
    private readonly IVerificationChallengeDataAccess _challenges = challenges;
    private readonly ILogger<AccountLockoutService> _logger = logger;

    public async Task<AccountLockoutResult> IsLockedOutAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return new AccountLockoutResult(false);
        }

        LockoutState? state = await GetStateAsync(userId, cancellationToken);
        if (state == null)
        {
            return new AccountLockoutResult(false);
        }

        if (state.LockedUntilUtc.HasValue && state.LockedUntilUtc.Value > DateTime.UtcNow)
        {
            return new AccountLockoutResult(true, state.FailedAttempts, state.LockedUntilUtc.Value);
        }

        // Lockout expired — clear it
        if (state.LockedUntilUtc.HasValue && state.LockedUntilUtc.Value <= DateTime.UtcNow)
        {
            await _challenges.DeleteChallengeStateAsync(userId, ChallengeType, cancellationToken);
            return new AccountLockoutResult(false);
        }

        return new AccountLockoutResult(false, state.FailedAttempts);
    }

    public async Task RecordFailedAttemptAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return;
        }

        LockoutState? state = await GetStateAsync(userId, cancellationToken);
        DateTime now = DateTime.UtcNow;

        if (state == null)
        {
            state = new LockoutState
            {
                FailedAttempts = 1,
                FirstFailedAtUtc = now,
                LockedUntilUtc = null
            };
        }
        else
        {
            // If there was a previous lockout that has expired, start fresh
            if (state.LockedUntilUtc.HasValue && state.LockedUntilUtc.Value <= now)
            {
                state = new LockoutState
                {
                    FailedAttempts = 1,
                    FirstFailedAtUtc = now,
                    LockedUntilUtc = null
                };
            }
            else
            {
                state.FailedAttempts++;
            }
        }

        // Check if we've hit the threshold
        int maxAttempts = Math.Max(1, _options.MaxFailedAttempts);
        if (state.FailedAttempts >= maxAttempts)
        {
            int lockoutMinutes = Math.Max(1, _options.LockoutDurationMinutes);
            state.LockedUntilUtc = now.AddMinutes(lockoutMinutes);

            _logger.LogWarning(
                "Account locked out after {FailedAttempts} failed login attempts. UserId={UserId}, LockedUntil={LockedUntil}",
                state.FailedAttempts,
                userId,
                state.LockedUntilUtc.Value.ToString("yyyy-MM-dd HH:mm:ss") + " UTC"
            );
        }

        string stateJson = JsonSerializer.Serialize(state);
        DateTime expiresAt = state.LockedUntilUtc ?? now.AddHours(1);
        await _challenges.UpsertChallengeStateAsync(userId, ChallengeType, stateJson, expiresAt, cancellationToken);
    }

    public async Task ClearLockoutAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return;
        }

        await _challenges.DeleteChallengeStateAsync(userId, ChallengeType, cancellationToken);
    }

    private async Task<LockoutState?> GetStateAsync(int userId, CancellationToken cancellationToken)
    {
        string? stateJson = await _challenges.GetChallengeStateAsync(userId, ChallengeType, cancellationToken);
        if (string.IsNullOrEmpty(stateJson))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<LockoutState>(stateJson);
        }
        catch (JsonException)
        {
            await _challenges.DeleteChallengeStateAsync(userId, ChallengeType, cancellationToken);
            return null;
        }
    }

    private sealed class LockoutState
    {
        public int FailedAttempts { get; set; }
        public DateTime FirstFailedAtUtc { get; set; }
        public DateTime? LockedUntilUtc { get; set; }
    }
}
