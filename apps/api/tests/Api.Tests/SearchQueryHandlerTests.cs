using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;

namespace TijarahJoDBAPI.Tests;

public sealed class SearchQueryHandlerTests
{
    [Fact]
    public async Task SearchAsync_MapsRequestIntoSearchQueryModel()
    {
        var execution = new FakeSearchExecutionService();
        var handler = new SearchQueryHandler(execution);
        var request = new SearchRequestQuery
        {
            Query = "iphone",
            Category = "3",
            City = "Amman",
            MinPrice = 10,
            MaxPrice = 100,
            Status = "ACTIVE",
            SortBy = "price",
            SortOrder = "asc",
            Page = 2,
            Limit = 15
        };

        SearchQueryResult result = await handler.SearchAsync(request);

        Assert.NotNull(execution.LastQuery);
        Assert.Equal("iphone", execution.LastQuery!.Query);
        Assert.Equal("3", execution.LastQuery.Category);
        Assert.Equal("Amman", execution.LastQuery.City);
        Assert.Equal(10, execution.LastQuery.MinPrice);
        Assert.Equal(100, execution.LastQuery.MaxPrice);
        Assert.Equal("ACTIVE", execution.LastQuery.Status);
        Assert.Equal("price", execution.LastQuery.SortBy);
        Assert.Equal("asc", execution.LastQuery.SortOrder);
        Assert.Equal(2, execution.LastQuery.Page);
        Assert.Equal(15, execution.LastQuery.Limit);
        Assert.True(result.Success);
        Assert.NotNull(result.Result);
        Assert.Equal(200, result.StatusCode);
    }

    [Fact]
    public async Task SearchAsync_ReturnsMappedFailureStatus_ForInvalidRequest()
    {
        var expected = new SearchExecutionResult
        {
            Success = false,
            FailureReason = SearchExecutionFailureReason.InvalidRequest,
            Message = "Invalid status filter."
        };
        var execution = new FakeSearchExecutionService { NextResult = expected };
        var handler = new SearchQueryHandler(execution);

        SearchQueryResult result = await handler.SearchAsync(new SearchRequestQuery());

        Assert.False(result.Success);
        Assert.Null(result.Result);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Invalid status filter.", result.Message);
    }

    [Fact]
    public async Task SearchAsync_ReturnsMappedFailureStatus_ForUnexpectedFailure()
    {
        var expected = new SearchExecutionResult
        {
            Success = false,
            FailureReason = SearchExecutionFailureReason.Unexpected,
            Message = "Search request failed."
        };
        var execution = new FakeSearchExecutionService { NextResult = expected };
        var handler = new SearchQueryHandler(execution);

        SearchQueryResult result = await handler.SearchAsync(new SearchRequestQuery());

        Assert.False(result.Success);
        Assert.Null(result.Result);
        Assert.Equal(500, result.StatusCode);
        Assert.Equal("Search request failed.", result.Message);
    }

    private sealed class FakeSearchExecutionService : ISearchExecutionService
    {
        public SearchExecutionResult NextResult { get; set; } = new()
        {
            Success = true,
            Result = new SearchReadResult
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
            }
        };

        public SearchQueryModel? LastQuery { get; private set; }

        public Task<SearchExecutionResult> ExecuteAsync(SearchQueryModel query, CancellationToken cancellationToken = default)
        {
            LastQuery = query;
            return Task.FromResult(NextResult);
        }
    }
}
