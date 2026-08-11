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
    private const int MaxConcurrencyRetries = 8;
    private readonly AccountLockoutOptions _options = options.Value;
    private readonly IVerificationChallengeDataAccess _challenges = challenges;
    private readonly ILogger<AccountLockoutService> _logger = logger;

    public async Task<AccountLockoutResult> IsLockedOutAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return new AccountLockoutResult(false);
        }

        for (int attempt = 0; attempt < MaxConcurrencyRetries; attempt++)
        {
            (LockoutState? state, string? stateJson) = await GetStateAsync(userId, cancellationToken);
            if (state == null)
            {
                return new AccountLockoutResult(false);
            }

            if (state.LockedUntilUtc.HasValue && state.LockedUntilUtc.Value > DateTime.UtcNow)
            {
                return new AccountLockoutResult(true, state.FailedAttempts, state.LockedUntilUtc.Value);
            }

            if (state.LockedUntilUtc.HasValue && state.LockedUntilUtc.Value <= DateTime.UtcNow)
            {
                if (await _challenges.TryDeleteChallengeStateAsync(
                        userId, ChallengeType, stateJson!, cancellationToken))
                {
                    return new AccountLockoutResult(false);
                }

                continue;
            }

            return new AccountLockoutResult(false, state.FailedAttempts);
        }

        throw new InvalidOperationException("Unable to read a stable account-lockout state.");
    }

    public async Task<AccountLockoutResult> RecordFailedAttemptAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return new AccountLockoutResult(false);
        }

        for (int attempt = 0; attempt < MaxConcurrencyRetries; attempt++)
        {
            (LockoutState? state, string? expectedStateJson) = await GetStateAsync(userId, cancellationToken);
            DateTime now = DateTime.UtcNow;

            if (state == null || state.LockedUntilUtc.HasValue && state.LockedUntilUtc.Value <= now)
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

            int maxAttempts = Math.Max(1, _options.MaxFailedAttempts);
            if (state.FailedAttempts >= maxAttempts)
            {
                int lockoutMinutes = Math.Max(1, _options.LockoutDurationMinutes);
                state.LockedUntilUtc = now.AddMinutes(lockoutMinutes);
            }

            string stateJson = JsonSerializer.Serialize(state);
            DateTime expiresAt = state.LockedUntilUtc ?? now.AddHours(1);
            bool saved = await _challenges.TryReplaceChallengeStateAsync(
                userId,
                ChallengeType,
                expectedStateJson,
                stateJson,
                expiresAt,
                cancellationToken);
            if (!saved)
            {
                continue;
            }

            if (state.LockedUntilUtc.HasValue)
            {
                _logger.LogWarning(
                    "Account locked out after {FailedAttempts} failed login attempts. UserId={UserId}, LockedUntil={LockedUntil}",
                    state.FailedAttempts,
                    userId,
                    state.LockedUntilUtc.Value.ToString("yyyy-MM-dd HH:mm:ss") + " UTC");

                return new AccountLockoutResult(true, state.FailedAttempts, state.LockedUntilUtc.Value);
            }

            return new AccountLockoutResult(false, state.FailedAttempts);
        }

        throw new InvalidOperationException("Unable to update account-lockout state because of concurrent requests.");
    }

    public async Task ClearLockoutAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return;
        }

        string? stateJson = await _challenges.GetChallengeStateAsync(
            userId, ChallengeType, cancellationToken);
        if (!string.IsNullOrEmpty(stateJson))
        {
            // Do not erase a failed attempt that arrived after authentication
            // succeeded and replaced the state we observed.
            await _challenges.TryDeleteChallengeStateAsync(
                userId, ChallengeType, stateJson, cancellationToken);
        }
    }

    private async Task<(LockoutState? State, string? StateJson)> GetStateAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        string? stateJson = await _challenges.GetChallengeStateAsync(userId, ChallengeType, cancellationToken);
        if (string.IsNullOrEmpty(stateJson))
        {
            return (null, null);
        }

        try
        {
            LockoutState? state = JsonSerializer.Deserialize<LockoutState>(stateJson);
            if (state is not null)
            {
                return (state, stateJson);
            }
        }
        catch (JsonException)
        {
        }

        if (await _challenges.TryDeleteChallengeStateAsync(
                userId, ChallengeType, stateJson, cancellationToken))
        {
            return (null, null);
        }

        throw new InvalidOperationException("Unable to discard an invalid account-lockout state.");
    }

    private sealed class LockoutState
    {
        public int FailedAttempts { get; set; }
        public DateTime FirstFailedAtUtc { get; set; }
        public DateTime? LockedUntilUtc { get; set; }
    }
}
