using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class SearchQueryHandler : ISearchQueryHandler
{
    private readonly ISearchExecutionService _searchExecutions;

    public SearchQueryHandler(ISearchExecutionService searchExecutions)
    {
        _searchExecutions = searchExecutions;
    }

    public async Task<SearchQueryResult> SearchAsync(SearchRequestQuery request, CancellationToken cancellationToken = default)
    {
        var query = new SearchQueryModel
        {
            Query = request.Query,
            Category = request.Category,
            City = request.City,
            MinPrice = request.MinPrice,
            MaxPrice = request.MaxPrice,
            Status = request.Status,
            SortBy = request.SortBy,
            SortOrder = request.SortOrder,
            Page = request.Page,
            Limit = request.Limit
        };

        SearchExecutionResult executionResult = await _searchExecutions.ExecuteAsync(query, cancellationToken);
        if (executionResult.Success && executionResult.Result != null)
        {
            return new SearchQueryResult
            {
                Success = true,
                Result = executionResult.Result,
                StatusCode = 200
            };
        }

        int statusCode = executionResult.FailureReason == SearchExecutionFailureReason.InvalidRequest
            ? 400
            : 500;

        return new SearchQueryResult
        {
            Success = false,
            Result = null,
            StatusCode = statusCode,
            Message = executionResult.Message ?? "Search request failed."
        };
    }
}
