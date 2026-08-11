using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Application.Abstractions.DataAccess;

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

    private sealed class AtomicVerificationChallengeDataAccess : IVerificationChallengeDataAccess
    {
        private sealed record Challenge(string StateJson, DateTime ExpiresAt);
        private readonly object _gate = new();
        private readonly Dictionary<(int UserId, string Type), Challenge> _states = [];

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
