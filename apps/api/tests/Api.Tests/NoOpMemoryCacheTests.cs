using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Api.Common.Services;

namespace TijarahJo.Api.Tests;

public sealed class NoOpMemoryCacheTests
{
    [Fact]
    public void Set_DoesNotStoreEntries()
    {
        IMemoryCache cache = new NoOpMemoryCache();

        cache.Set("key", "value");

        Assert.False(cache.TryGetValue("key", out object? value));
        Assert.Null(value);
    }

    [Fact]
    public void Remove_NoOpDoesNotThrow()
    {
        IMemoryCache cache = new NoOpMemoryCache();

        var exception = Record.Exception(() => cache.Remove("missing"));

        Assert.Null(exception);
    }
}
