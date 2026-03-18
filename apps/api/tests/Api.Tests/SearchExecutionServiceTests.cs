using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;

namespace TijarahJo.Api.Tests;

public sealed class SearchExecutionServiceTests
{
    [Fact]
    public async Task ExecuteAsync_ReturnsInvalidRequest_WhenMinPriceGreaterThanMaxPrice()
    {
        var service = new SearchExecutionService(new FakeSearchReadService());

        SearchExecutionResult result = await service.ExecuteAsync(new SearchQueryModel
        {
            MinPrice = 100,
            MaxPrice = 50
        });

        Assert.False(result.Success);
        Assert.Equal(SearchExecutionFailureReason.InvalidRequest, result.FailureReason);
        Assert.Equal("MinPrice cannot be greater than MaxPrice.", result.Message);
    }

    [Fact]
    public async Task ExecuteAsync_ReturnsInvalidRequest_WhenReadServiceThrowsArgumentException()
    {
        var service = new SearchExecutionService(new FakeSearchReadService
        {
            NextException = new ArgumentException("Invalid status filter.")
        });

        SearchExecutionResult result = await service.ExecuteAsync(new SearchQueryModel());

        Assert.False(result.Success);
        Assert.Equal(SearchExecutionFailureReason.InvalidRequest, result.FailureReason);
        Assert.Equal("Invalid status filter.", result.Message);
    }

    [Fact]
    public async Task ExecuteAsync_ReturnsSuccess_WhenReadServiceSucceeds()
    {
        SearchReadResult expected = new SearchReadResult
        {
            Success = true,
            Posts = Array.Empty<SearchPostReadModel>(),
            Pagination = new SearchPaginationReadModel
            {
                CurrentPage = 1,
                TotalPages = 0,
                TotalPosts = 0,
                PostsPerPage = 20
            }
        };

        var service = new SearchExecutionService(new FakeSearchReadService
        {
            NextResult = expected
        });

        SearchExecutionResult result = await service.ExecuteAsync(new SearchQueryModel());

        Assert.True(result.Success);
        Assert.NotNull(result.Result);
        Assert.Same(expected, result.Result);
    }

    private sealed class FakeSearchReadService : ISearchReadService
    {
        public SearchReadResult? NextResult { get; set; }
        public Exception? NextException { get; set; }

        public Task<SearchReadResult> SearchAsync(SearchQueryModel query, CancellationToken cancellationToken = default)
        {
            if (NextException != null)
            {
                throw NextException;
            }

            return Task.FromResult(
                NextResult
                ?? new SearchReadResult
                {
                    Success = true,
                    Posts = Array.Empty<SearchPostReadModel>(),
                    Pagination = new SearchPaginationReadModel
                    {
                        CurrentPage = 1,
                        TotalPages = 0,
                        TotalPosts = 0,
                        PostsPerPage = 20
                    }
                });
        }
    }
}
