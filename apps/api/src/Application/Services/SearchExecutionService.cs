using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class SearchExecutionService : ISearchExecutionService
{
    private readonly ISearchReadService _searchReads;

    public SearchExecutionService(ISearchReadService searchReads)
    {
        _searchReads = searchReads;
    }

    public async Task<SearchExecutionResult> ExecuteAsync(SearchQueryModel query, CancellationToken cancellationToken = default)
    {
        if (query.MinPrice.HasValue && query.MinPrice.Value < 0)
        {
            return Failure(SearchExecutionFailureReason.InvalidRequest, "MinPrice must be greater than or equal to 0.");
        }

        if (query.MaxPrice.HasValue && query.MaxPrice.Value < 0)
        {
            return Failure(SearchExecutionFailureReason.InvalidRequest, "MaxPrice must be greater than or equal to 0.");
        }

        if (query.MinPrice.HasValue && query.MaxPrice.HasValue && query.MinPrice.Value > query.MaxPrice.Value)
        {
            return Failure(SearchExecutionFailureReason.InvalidRequest, "MinPrice cannot be greater than MaxPrice.");
        }

        try
        {
            SearchReadResult result = await _searchReads.SearchAsync(query, cancellationToken);
            return new SearchExecutionResult
            {
                Success = true,
                Result = result
            };
        }
        catch (ArgumentException ex)
        {
            return Failure(SearchExecutionFailureReason.InvalidRequest, ex.Message);
        }
        catch (Exception)
        {
            return Failure(SearchExecutionFailureReason.Unexpected, "Search request failed.");
        }
    }

    private static SearchExecutionResult Failure(SearchExecutionFailureReason reason, string message)
    {
        return new SearchExecutionResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
