using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Infrastructure.Caching;

public class HybridCacheService(IMemoryCache memoryCache, IDistributedCache distributedCache) : ICacheService
{

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        // 1. Check L1 Memory Cache
        if (memoryCache.TryGetValue(key, out T? memoryValue))
        {
            return memoryValue;
        }

        // 2. Check L2 Distributed Cache (Redis)
        byte[]? distributedValueBytes = await distributedCache.GetAsync(key, cancellationToken);
        if (distributedValueBytes == null)
        {
            return default;
        }

        try
        {
            T? distributedValue = JsonSerializer.Deserialize<T>(distributedValueBytes);

            // Backfill L1 Cache
            if (distributedValue != null)
            {
                var memoryCacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) // Default L1 TTL
                };
                memoryCache.Set(key, distributedValue, memoryCacheOptions);
            }

            return distributedValue;
        }
        catch (JsonException)
        {
            // If deserialization fails, just remove the corrupted item and return default
            await distributedCache.RemoveAsync(key, cancellationToken);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpireTime = null, TimeSpan? unusedExpireTime = null, CancellationToken cancellationToken = default)
    {
        // Set L1
        var memoryCacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = absoluteExpireTime ?? TimeSpan.FromHours(1),
            SlidingExpiration = unusedExpireTime
        };
        memoryCache.Set(key, value, memoryCacheOptions);

        // Set L2
        var distributedCacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = absoluteExpireTime ?? TimeSpan.FromHours(2),
            SlidingExpiration = unusedExpireTime
        };
        byte[] bytes = JsonSerializer.SerializeToUtf8Bytes(value);
        await distributedCache.SetAsync(key, bytes, distributedCacheOptions, cancellationToken);
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        memoryCache.Remove(key);
        await distributedCache.RemoveAsync(key, cancellationToken);
    }
}
