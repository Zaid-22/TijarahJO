using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

namespace TijarahJoDBAPI.Common.Services;

public sealed class MemoryTokenBlacklistService : ITokenBlacklistService
{
    private readonly IMemoryCache _cache;

    public MemoryTokenBlacklistService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task AddToBlacklistAsync(string jti, DateTimeOffset expiration, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            return Task.CompletedTask;
        }

        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpiration = expiration
        };

        _cache.Set($"BlacklistedToken:{jti}", true, options);

        return Task.CompletedTask;
    }

    public Task<bool> IsBlacklistedAsync(string jti, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            return Task.FromResult(false);
        }

        bool isBlacklisted = _cache.TryGetValue($"BlacklistedToken:{jti}", out _);
        return Task.FromResult(isBlacklisted);
    }
}
