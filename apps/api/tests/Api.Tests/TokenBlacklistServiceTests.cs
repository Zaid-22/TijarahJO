using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Tests;

public sealed class TokenBlacklistServiceTests
{
    [Fact]
    public async Task AddToBlacklist_Then_IsBlacklisted_ReturnsTrue()
    {
        var service = new FakeTokenBlacklistService();

        await service.AddToBlacklistAsync("jti-001", DateTimeOffset.UtcNow.AddHours(1));

        Assert.True(await service.IsBlacklistedAsync("jti-001"));
    }

    [Fact]
    public async Task IsBlacklisted_WithUnknownJti_ReturnsFalse()
    {
        var service = new FakeTokenBlacklistService();

        Assert.False(await service.IsBlacklistedAsync("unknown-jti"));
    }

    [Fact]
    public async Task IsBlacklisted_WithExpiredToken_ReturnsFalse()
    {
        var service = new FakeTokenBlacklistService();

        await service.AddToBlacklistAsync("jti-expired", DateTimeOffset.UtcNow.AddMinutes(-5));

        Assert.False(await service.IsBlacklistedAsync("jti-expired"));
    }

    [Fact]
    public async Task AddToBlacklist_ThenAdd_SameJti_OverwritesExpiration()
    {
        var service = new FakeTokenBlacklistService();

        await service.AddToBlacklistAsync("jti-dup", DateTimeOffset.UtcNow.AddMinutes(-1));
        Assert.False(await service.IsBlacklistedAsync("jti-dup"));

        await service.AddToBlacklistAsync("jti-dup", DateTimeOffset.UtcNow.AddHours(1));
        Assert.True(await service.IsBlacklistedAsync("jti-dup"));
    }

    /// <summary>
    /// In-memory fake that mirrors the ITokenBlacklistService contract
    /// for fast, database-free unit testing.
    /// </summary>
    private sealed class FakeTokenBlacklistService : ITokenBlacklistService
    {
        private readonly Dictionary<string, DateTimeOffset> _store = [];

        public Task AddToBlacklistAsync(string jti, DateTimeOffset expiration, CancellationToken cancellationToken = default)
        {
            _store[jti] = expiration;
            return Task.CompletedTask;
        }

        public Task<bool> IsBlacklistedAsync(string jti, CancellationToken cancellationToken = default)
        {
            if (_store.TryGetValue(jti, out DateTimeOffset expiresAt))
            {
                return Task.FromResult(expiresAt > DateTimeOffset.UtcNow);
            }

            return Task.FromResult(false);
        }

        public Task InvalidateAllUserSessionsAsync(int userId, CancellationToken cancellationToken = default)
        {
            long invalidationTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            string jti = $"user:{userId}:{invalidationTime}";
            _store[jti] = DateTimeOffset.UtcNow.AddDays(30);
            return Task.CompletedTask;
        }

        public Task<bool> IsUserSessionInvalidatedAsync(int userId, DateTimeOffset tokenIssuedAt, CancellationToken cancellationToken = default)
        {
            string prefix = $"user:{userId}:";
            foreach (var key in _store.Keys)
            {
                if (key.StartsWith(prefix))
                {
                    var parts = key.Split(':');
                    if (parts.Length == 3 && long.TryParse(parts[2], out long invalidationTimeUnix))
                    {
                        var invalidationTime = DateTimeOffset.FromUnixTimeSeconds(invalidationTimeUnix);
                        if (invalidationTime > tokenIssuedAt && _store[key] > DateTimeOffset.UtcNow)
                        {
                            return Task.FromResult(true);
                        }
                    }
                }
            }
            return Task.FromResult(false);
        }
    }
}
