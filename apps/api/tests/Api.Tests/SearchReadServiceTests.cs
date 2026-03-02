using Microsoft.Extensions.Caching.Memory;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.DAL.Queries;

namespace TijarahJoDBAPI.Tests;

public sealed class SearchReadServiceTests
{
    [Fact]
    public async Task SearchAsync_ClampsPageAndLimitBeforeQueryExecution()
    {
        var listingQueries = new FakePostListingQueryService();
        var service = new SearchReadService(
            listingQueries,
            new MemoryCache(new MemoryCacheOptions()));

        await service.SearchAsync(new SearchQueryModel
        {
            Page = -5,
            Limit = 9999
        });

        Assert.NotNull(listingQueries.LastQuery);
        Assert.Equal(1, listingQueries.LastQuery!.Page);
        Assert.Equal(200, listingQueries.LastQuery.Limit);
    }

    private sealed class FakePostListingQueryService : IPostListingQueryService
    {
        public PostListingQuery? LastQuery { get; private set; }

        public Task<PostListingPageResult> QueryAsync(PostListingQuery query, CancellationToken cancellationToken = default)
        {
            LastQuery = query;
            return Task.FromResult(new PostListingPageResult
            {
                Page = query.Page,
                Limit = query.Limit,
                TotalPosts = 0,
                Posts = Array.Empty<PostListingRow>()
            });
        }
    }
}
