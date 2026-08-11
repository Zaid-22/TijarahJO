using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Tests;

public sealed class AccountLockoutConcurrencyTests
{
    [Fact]
    public async Task RecordFailedAttemptAsync_PreservesAllConcurrentAttempts()
    {
        var challenges = new AtomicVerificationChallengeDataAccess();
        var service = new AccountLockoutService(
            Options.Create(new AccountLockoutOptions
            {
                Enabled = true,
                MaxFailedAttempts = 5,
                LockoutDurationMinutes = 15
            }),
            challenges,
            NullLogger<AccountLockoutService>.Instance);

        await Task.WhenAll(
            Enumerable.Range(0, 5)
                .Select(_ => service.RecordFailedAttemptAsync(42)));

        var result = await service.IsLockedOutAsync(42);
        Assert.True(result.IsLockedOut);
        Assert.Equal(5, result.FailedAttempts);
        Assert.True(result.LockedUntilUtc > DateTime.UtcNow);
    }

    [Fact]
    public async Task IsLockedOutAsync_CasExhaustionFailsClosedWithoutOverwritingNewerState()
    {
        var challenges = new AtomicVerificationChallengeDataAccess();
        string expiredState = JsonSerializer.Serialize(new
        {
            FailedAttempts = 5,
            FirstFailedAtUtc = DateTime.UtcNow.AddMinutes(-20),
            LockedUntilUtc = DateTime.UtcNow.AddMinutes(-5)
        });
        await challenges.UpsertChallengeStateAsync(
            42,
            "LoginLockout",
            expiredState,
            DateTime.UtcNow.AddMinutes(-5));
        challenges.RejectConditionalDeletes = true;
        var service = CreateService(challenges);

        AccountLockoutResult result = await service.IsLockedOutAsync(42);

        Assert.True(result.IsLockedOut);
        Assert.Equal(5, result.FailedAttempts);
        Assert.True(result.LockedUntilUtc > DateTime.UtcNow);
        Assert.Equal(8, challenges.TryDeleteCalls);
        Assert.Equal(
            expiredState,
            await challenges.GetChallengeStateAsync(42, "LoginLockout"));
    }

    [Fact]
    public async Task RecordFailedAttemptAsync_CasExhaustionFailsClosedWithoutOverwritingConcurrentState()
    {
        var challenges = new AtomicVerificationChallengeDataAccess();
        string concurrentState = JsonSerializer.Serialize(new
        {
            FailedAttempts = 2,
            FirstFailedAtUtc = DateTime.UtcNow.AddMinutes(-1),
            LockedUntilUtc = (DateTime?)null
        });
        await challenges.UpsertChallengeStateAsync(
            42,
            "LoginLockout",
            concurrentState,
            DateTime.UtcNow.AddHours(1));
        challenges.RejectConditionalReplacements = true;
        var service = CreateService(challenges);

        AccountLockoutResult result = await service.RecordFailedAttemptAsync(42);

        Assert.True(result.IsLockedOut);
        Assert.Equal(5, result.FailedAttempts);
        Assert.True(result.LockedUntilUtc > DateTime.UtcNow);
        Assert.Equal(8, challenges.TryReplaceCalls);
        Assert.Equal(
            concurrentState,
            await challenges.GetChallengeStateAsync(42, "LoginLockout"));
    }

    [Fact]
    public async Task ClearLockoutAsync_DoesNotEraseFailureRecordedAfterSuccessfulCheck()
    {
        var challenges = new AtomicVerificationChallengeDataAccess();
        var service = CreateService(challenges);
        await service.RecordFailedAttemptAsync(42);
        AccountLockoutResult successfulCheck = await service.IsLockedOutAsync(42);
        Assert.NotNull(successfulCheck.StateToken);

        await service.RecordFailedAttemptAsync(42);
        await service.ClearLockoutAsync(42, successfulCheck.StateToken);

        AccountLockoutResult result = await service.IsLockedOutAsync(42);
        Assert.False(result.IsLockedOut);
        Assert.Equal(2, result.FailedAttempts);
    }

    [Fact]
    public async Task ClearLockoutAsync_DeletesStateObservedBySuccessfulCheck()
    {
        var challenges = new AtomicVerificationChallengeDataAccess();
        var service = CreateService(challenges);
        await service.RecordFailedAttemptAsync(42);
        AccountLockoutResult successfulCheck = await service.IsLockedOutAsync(42);

        await service.ClearLockoutAsync(42, successfulCheck.StateToken);

        AccountLockoutResult result = await service.IsLockedOutAsync(42);
        Assert.False(result.IsLockedOut);
        Assert.Equal(0, result.FailedAttempts);
    }

    private static AccountLockoutService CreateService(
        IVerificationChallengeDataAccess challenges)
        => new(
            Options.Create(new AccountLockoutOptions
            {
                Enabled = true,
                MaxFailedAttempts = 5,
                LockoutDurationMinutes = 15
            }),
            challenges,
            NullLogger<AccountLockoutService>.Instance);

    private sealed class AtomicVerificationChallengeDataAccess : IVerificationChallengeDataAccess
    {
        private sealed record Challenge(string StateJson, DateTime ExpiresAt);
        private readonly object _gate = new();
        private readonly Dictionary<(int UserId, string Type), Challenge> _states = [];
        private int _tryDeleteCalls;
        private int _tryReplaceCalls;

        public bool RejectConditionalDeletes { get; set; }
        public bool RejectConditionalReplacements { get; set; }
        public int TryDeleteCalls => Volatile.Read(ref _tryDeleteCalls);
        public int TryReplaceCalls => Volatile.Read(ref _tryReplaceCalls);

        public async Task<string?> GetChallengeStateAsync(
            int userId,
            string challengeType,
            CancellationToken cancellationToken = default)
        {
            await Task.Yield();
            lock (_gate)
            {
                return _states.TryGetValue((userId, challengeType), out Challenge? challenge)
                    ? challenge.StateJson
                    : null;
            }
        }

        public Task UpsertChallengeStateAsync(
            int userId,
            string challengeType,
            string stateJson,
            DateTime expiresAt,
            CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                _states[(userId, challengeType)] = new Challenge(stateJson, expiresAt);
            }
            return Task.CompletedTask;
        }

        public Task DeleteChallengeStateAsync(
            int userId,
            string challengeType,
            CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                _states.Remove((userId, challengeType));
            }
            return Task.CompletedTask;
        }

        public Task<bool> TryReplaceChallengeStateAsync(
            int userId,
            string challengeType,
            string? expectedStateJson,
            string stateJson,
            DateTime expiresAt,
            CancellationToken cancellationToken = default)
        {
            Interlocked.Increment(ref _tryReplaceCalls);
            if (RejectConditionalReplacements)
            {
                return Task.FromResult(false);
            }

            lock (_gate)
            {
                bool exists = _states.TryGetValue((userId, challengeType), out Challenge? current);
                bool matches = expectedStateJson is null
                    ? !exists
                    : exists && string.Equals(current!.StateJson, expectedStateJson, StringComparison.Ordinal);
                if (!matches)
                {
                    return Task.FromResult(false);
                }

                _states[(userId, challengeType)] = new Challenge(stateJson, expiresAt);
                return Task.FromResult(true);
            }
        }

        public Task<bool> TryDeleteChallengeStateAsync(
            int userId,
            string challengeType,
            string expectedStateJson,
            CancellationToken cancellationToken = default)
        {
            Interlocked.Increment(ref _tryDeleteCalls);
            if (RejectConditionalDeletes)
            {
                return Task.FromResult(false);
            }

            lock (_gate)
            {
                if (!_states.TryGetValue((userId, challengeType), out Challenge? current) ||
                    !string.Equals(current.StateJson, expectedStateJson, StringComparison.Ordinal))
                {
                    return Task.FromResult(false);
                }

                _states.Remove((userId, challengeType));
                return Task.FromResult(true);
            }
        }
    }
}
