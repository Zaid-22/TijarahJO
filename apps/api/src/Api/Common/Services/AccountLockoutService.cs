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
            LockoutStateSnapshot snapshot = await GetStateAsync(userId, cancellationToken);
            if (snapshot.IsInvalid)
            {
                if (await _challenges.TryDeleteChallengeStateAsync(
                        userId, ChallengeType, snapshot.StateJson!, cancellationToken))
                {
                    return new AccountLockoutResult(false);
                }

                continue;
            }

            LockoutState? state = snapshot.State;
            if (state == null)
            {
                return new AccountLockoutResult(false);
            }

            if (state.LockedUntilUtc.HasValue && state.LockedUntilUtc.Value > DateTime.UtcNow)
            {
                return new AccountLockoutResult(
                    true,
                    state.FailedAttempts,
                    state.LockedUntilUtc.Value,
                    snapshot.StateJson);
            }

            if (state.LockedUntilUtc.HasValue && state.LockedUntilUtc.Value <= DateTime.UtcNow)
            {
                if (await _challenges.TryDeleteChallengeStateAsync(
                        userId, ChallengeType, snapshot.StateJson!, cancellationToken))
                {
                    return new AccountLockoutResult(false);
                }

                continue;
            }

            return new AccountLockoutResult(
                false,
                state.FailedAttempts,
                StateToken: snapshot.StateJson);
        }

        return FailClosed(userId, "read");
    }

    public async Task<AccountLockoutResult> RecordFailedAttemptAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return new AccountLockoutResult(false);
        }

        for (int attempt = 0; attempt < MaxConcurrencyRetries; attempt++)
        {
            LockoutStateSnapshot snapshot = await GetStateAsync(userId, cancellationToken);
            LockoutState? state = snapshot.State;
            string? expectedStateJson = snapshot.StateJson;
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

                return new AccountLockoutResult(
                    true,
                    state.FailedAttempts,
                    state.LockedUntilUtc.Value,
                    stateJson);
            }

            return new AccountLockoutResult(
                false,
                state.FailedAttempts,
                StateToken: stateJson);
        }

        return FailClosed(userId, "update");
    }

    public async Task ClearLockoutAsync(
        int userId,
        string? expectedStateToken,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled || string.IsNullOrEmpty(expectedStateToken))
        {
            return;
        }

        // Delete only the state observed before credential verification. A failed
        // attempt arriving during authentication replaces it and must survive.
        await _challenges.TryDeleteChallengeStateAsync(
            userId, ChallengeType, expectedStateToken, cancellationToken);
    }

    private async Task<LockoutStateSnapshot> GetStateAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        string? stateJson = await _challenges.GetChallengeStateAsync(userId, ChallengeType, cancellationToken);
        if (string.IsNullOrEmpty(stateJson))
        {
            return new LockoutStateSnapshot(null, null, false);
        }

        try
        {
            LockoutState? state = JsonSerializer.Deserialize<LockoutState>(stateJson);
            if (state is not null)
            {
                return new LockoutStateSnapshot(state, stateJson, false);
            }
        }
        catch (JsonException)
        {
        }

        return new LockoutStateSnapshot(null, stateJson, true);
    }

    private AccountLockoutResult FailClosed(
        int userId,
        string operation)
    {
        DateTime now = DateTime.UtcNow;
        int failedAttempts = Math.Max(1, _options.MaxFailedAttempts);
        DateTime lockedUntilUtc = now.AddMinutes(Math.Max(1, _options.LockoutDurationMinutes));

        _logger.LogWarning(
            "Account-lockout CAS {Operation} exhausted after {RetryCount} attempts. Failing closed. UserId={UserId}, LockedUntil={LockedUntil}",
            operation,
            MaxConcurrencyRetries,
            userId,
            lockedUntilUtc.ToString("yyyy-MM-dd HH:mm:ss") + " UTC");

        // Never force an unconditional write here: doing so could overwrite a
        // newer lockout and shorten its duration. This request is denied while
        // the winning concurrent writer remains authoritative.
        return new AccountLockoutResult(true, failedAttempts, lockedUntilUtc);
    }

    private sealed record LockoutStateSnapshot(
        LockoutState? State,
        string? StateJson,
        bool IsInvalid);

    private sealed class LockoutState
    {
        public int FailedAttempts { get; set; }
        public DateTime FirstFailedAtUtc { get; set; }
        public DateTime? LockedUntilUtc { get; set; }
    }
}
