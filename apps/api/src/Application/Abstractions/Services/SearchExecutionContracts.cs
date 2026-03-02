namespace TijarahJoDB.Application.Abstractions.Services;

public enum SearchExecutionFailureReason
{
    InvalidRequest,
    Unexpected
}

public sealed class SearchExecutionResult
{
    public bool Success { get; init; }
    public SearchReadResult? Result { get; init; }
    public SearchExecutionFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface ISearchExecutionService
{
    Task<SearchExecutionResult> ExecuteAsync(SearchQueryModel query, CancellationToken cancellationToken = default);
}
