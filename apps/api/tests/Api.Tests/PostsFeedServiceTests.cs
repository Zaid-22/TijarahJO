using TijarahJoDBAPI.Common.Services;
using TijarahJoDB.DAL.Queries;
using TijarahJoDB_DataAccess;
using Microsoft.Extensions.Caching.Memory;

namespace TijarahJoDBAPI.Tests;

public sealed class PostsFeedServiceTests
{
    private readonly PostsFeedService _service = new(
        new PostListingQueryService(new DatabaseConnectionString("Data Source=fake;Database=fake;")),
        new MemoryCache(new MemoryCacheOptions())
    );

    [Fact]
    public void NormalizeRequest_UsesDefaults_WhenValuesAreNull()
    {
        var request = _service.NormalizeRequest(null, null, null);

        Assert.Equal(1, request.Page);
        Assert.Equal(20, request.Limit);
        Assert.False(request.IncludeDeleted);
    }

    [Fact]
    public void NormalizeRequest_ClampsPageAndLimitLowerBounds()
    {
        var request = _service.NormalizeRequest(0, -3, false);

        Assert.Equal(1, request.Page);
        Assert.Equal(20, request.Limit);
        Assert.False(request.IncludeDeleted);
    }

    [Fact]
    public void NormalizeRequest_ClampsLimitUpperBound()
    {
        var request = _service.NormalizeRequest(2, 10000, false);

        Assert.Equal(2, request.Page);
        Assert.Equal(200, request.Limit);
    }

    [Fact]
    public void NormalizeRequest_IgnoresIncludeDeletedEvenWhenRequested()
    {
        var request = _service.NormalizeRequest(3, 50, true);

        Assert.Equal(3, request.Page);
        Assert.Equal(50, request.Limit);
        Assert.False(request.IncludeDeleted);
    }

    [Fact]
    public void NormalizeRequest_PreservesExplicitFalseForIncludeDeleted()
    {
        var request = _service.NormalizeRequest(1, 10, false);

        Assert.Equal(1, request.Page);
        Assert.Equal(10, request.Limit);
        Assert.False(request.IncludeDeleted);
    }

    [Fact]
    public void NormalizeRequest_ClampsPage_WhenNegative()
    {
        var request = _service.NormalizeRequest(-999, 25, true);

        Assert.Equal(1, request.Page);
        Assert.Equal(25, request.Limit);
        Assert.False(request.IncludeDeleted);
    }
}
