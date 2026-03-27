using TijarahJo.Api.Common.Services;
using TijarahJo.Infrastructure.Queries;
using TijarahJo.Infrastructure.DataAccess;
using Microsoft.Extensions.Caching.Memory;

namespace TijarahJo.Api.Tests;

public sealed class PostsFeedServiceTests
{
    private readonly PostsFeedService _service = new(
        new PostListingQueryService(new DatabaseConnectionString("Data Source=fake;Database=fake;")),
        new MemoryCache(new MemoryCacheOptions())
    );

    [Fact]
    public void NormalizeRequest_UsesDefaults_WhenValuesAreNull()
    {
        var request = _service.NormalizeRequest(null, null);

        Assert.Equal(1, request.Page);
        Assert.Equal(20, request.Limit);
    }

    [Fact]
    public void NormalizeRequest_ClampsPageAndLimitLowerBounds()
    {
        var request = _service.NormalizeRequest(0, -3);

        Assert.Equal(1, request.Page);
        Assert.Equal(20, request.Limit);
    }

    [Fact]
    public void NormalizeRequest_ClampsLimitUpperBound()
    {
        var request = _service.NormalizeRequest(2, 10000);

        Assert.Equal(2, request.Page);
        Assert.Equal(200, request.Limit);
    }

    [Fact]
    public void NormalizeRequest_IgnoresNull()
    {
        var request = _service.NormalizeRequest(3, null);

        Assert.Equal(3, request.Page);
        Assert.Equal(20, request.Limit);
    }

    [Fact]
    public void NormalizeRequest_PreservesExplicitLimit()
    {
        var request = _service.NormalizeRequest(1, 10);

        Assert.Equal(1, request.Page);
        Assert.Equal(10, request.Limit);
    }

    [Fact]
    public void NormalizeRequest_ClampsPage_WhenNegative()
    {
        var request = _service.NormalizeRequest(-999, 25);

        Assert.Equal(1, request.Page);
        Assert.Equal(25, request.Limit);
    }
}
